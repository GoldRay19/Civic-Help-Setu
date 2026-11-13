import { createRateLimiter, clientKey } from './abuseGuard.js';
import { bearerToken } from './firebaseToken.js';

export const EXPORT_LINK_TTL_MS = 5 * 60 * 1000;
export const MAX_EXPORT_BYTES = 900 * 1024;
export const RECENT_AUTH_MAX_AGE_SECONDS = 5 * 60;

const CATEGORY_DATA_KEYS = {
  profile: 'profile',
  saved_services: 'savedServices',
  journey_metadata: 'journeyMetadata',
  checklist_progress: 'checklistProgress',
  consent_history: 'consentHistory',
};
const ALLOWED_CATEGORIES = new Set(Object.keys(CATEGORY_DATA_KEYS));
const ALLOWED_DATA_KEYS = new Set(Object.values(CATEGORY_DATA_KEYS).filter((key) => key !== 'profile'));
const SENSITIVE_KEY = /(password|token|secret|credential|api.?key|private.?key|binary|base64|file.?data|file.?blob|encrypted.?payload|pin|passphrase|authorization)/i;
const DATA_FIELDS = {
  savedServices: ['serviceId', 'name', 'folder', 'priority', 'notes', 'savedAt', 'targetDate', 'status'],
  journeyMetadata: ['id', 'journeyId', 'title', 'createdAt', 'updatedAt', 'expiresAt', 'revoked', 'taskCount', 'completedTaskCount'],
  checklistProgress: ['checklistId', 'checked', 'rev', 'updatedAt'],
  consentHistory: ['timestamp', 'action', 'categoryId', 'granted'],
  vaultDocumentMetadata: ['type', 'category', 'issuer', 'issueDate', 'expiryDate', 'verified', 'lastModified'],
};
const utf8Bytes = (value) => new TextEncoder().encode(value).length;
const TEXT_LIMITS = {
  serviceId: 200, name: 300, folder: 100, priority: 40, notes: 4000, savedAt: 50, targetDate: 50, status: 80,
  id: 200, journeyId: 200, title: 300, createdAt: 50, updatedAt: 50, expiresAt: 50,
  checklistId: 200, timestamp: 50, action: 60, categoryId: 100,
  type: 200, category: 100, issuer: 300, issueDate: 50, expiryDate: 50, lastModified: 50,
};
const BOOLEAN_FIELDS = new Set(['revoked', 'granted', 'verified']);
const INTEGER_FIELDS = new Set(['taskCount', 'completedTaskCount', 'rev']);

const json = (status, body, extra = {}) => ({
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  body,
});

const tooMany = (seconds) => json(429, { error: 'rate_limited', retryAfterSeconds: seconds }, { 'Retry-After': String(seconds) });
const getHeader = (headers, wanted) => {
  const key = Object.keys(headers).find((name) => name.toLowerCase() === wanted);
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value[0] : value;
};

const isRecent = (fva) =>
  Array.isArray(fva) &&
  typeof fva[0] === 'number' &&
  fva[0] >= 0 &&
  fva[0] <= RECENT_AUTH_MAX_AGE_SECONDS &&
  fva.slice(1).every((age) => age === null || age === -1 || (
    typeof age === 'number' && age >= 0 && age <= RECENT_AUTH_MAX_AGE_SECONDS
  ));

const scrub = (value, depth = 0) => {
  if (depth > 20) throw new TypeError('Export nesting is too deep.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));
  if (typeof value !== 'object') return null;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, item]) => [key, scrub(item, depth + 1)])
  );
};

const projectRecords = (value, fields, categoryKey) => {
  if (!Array.isArray(value) || value.length > 10_000) throw new TypeError('Invalid export category data.');
  return value.map((record) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new TypeError('Invalid export record.');
    }
    if (categoryKey === 'consentHistory' && record.action !== 'CONSENT_PREFERENCE_UPDATED') {
      throw new TypeError('Invalid consent history record.');
    }
    const projected = {};
    for (const field of fields) {
      if (!Object.prototype.hasOwnProperty.call(record, field)) continue;
      const fieldValue = record[field];
      if (field === 'checked') {
        if (Array.isArray(fieldValue)) {
          projected.checked = fieldValue
            .filter((item) => typeof item === 'string')
            .slice(0, 1000)
            .map((item) => item.slice(0, 500));
        }
      } else if (BOOLEAN_FIELDS.has(field) && typeof fieldValue === 'boolean') {
        projected[field] = fieldValue;
      } else if (INTEGER_FIELDS.has(field) && Number.isInteger(fieldValue) && fieldValue >= 0) {
        projected[field] = fieldValue;
      } else if (typeof fieldValue === 'string') {
        projected[field] = fieldValue.slice(0, TEXT_LIMITS[field] ?? 500);
      } else if (fieldValue === null) {
        projected[field] = null;
      }
    }
    return projected;
  });
};

const countRecords = (data) =>
  Object.values(data).reduce((total, value) => total + (Array.isArray(value) ? value.length : value ? 1 : 0), 0);

function validateCreateBody(body, userId) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || body.action !== 'create') {
    return { error: 'invalid_request' };
  }
  const { categories, data, vaultConsent, vaultAuthorization } = body;
  if (
    !Array.isArray(categories) ||
    categories.length === 0 ||
    categories.some((category) => typeof category !== 'string' || !ALLOWED_CATEGORIES.has(category)) ||
    new Set(categories).size !== categories.length
  ) {
    return { error: 'invalid_categories' };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'invalid_data' };
  if (vaultConsent !== undefined && typeof vaultConsent !== 'boolean') return { error: 'invalid_vault_consent' };
  if (!vaultConsent && (data.vaultDocumentMetadata !== undefined || vaultAuthorization === true)) {
    return { error: 'vault_consent_required' };
  }
  const allowedDataKeys = new Set(ALLOWED_DATA_KEYS);
  if (vaultConsent) allowedDataKeys.add('vaultDocumentMetadata');
  if (Object.keys(data).some((key) => !allowedDataKeys.has(key))) return { error: 'invalid_data' };

  const selectedDataKeys = new Set(
    categories.filter((category) => category !== 'profile').map((category) => CATEGORY_DATA_KEYS[category])
  );
  if (Object.keys(data).some((key) => !selectedDataKeys.has(key) && !(vaultConsent && key === 'vaultDocumentMetadata'))) {
    return { error: 'unselected_data' };
  }
  if (vaultConsent && vaultAuthorization !== true) return { error: 'vault_authorization_required' };

  const safeData = {};
  for (const key of selectedDataKeys) {
    try {
      safeData[key] = projectRecords(data[key] ?? [], DATA_FIELDS[key], key);
    } catch {
      return { error: 'invalid_data' };
    }
  }
  if (vaultConsent) {
    try {
      safeData.vaultDocumentMetadata = projectRecords(
        data.vaultDocumentMetadata ?? [],
        DATA_FIELDS.vaultDocumentMetadata,
        'vaultDocumentMetadata'
      );
    } catch {
      return { error: 'invalid_vault_data' };
    }
  }

  const createdAt = new Date();
  const payload = {
    exportVersion: '1.0.0',
    generatedAt: createdAt.toISOString(),
    user: { id: userId },
    meta: {
      platform: 'Civic Help Setu',
      categories,
      recordCount: countRecords(safeData),
      vaultMetadataIncluded: Boolean(vaultConsent),
      security: {
        secretsExcluded: true,
        vaultBinariesExcluded: true,
      },
    },
    data: safeData,
  };
  const bytes = utf8Bytes(JSON.stringify(payload));
  if (bytes > MAX_EXPORT_BYTES) return { error: 'export_too_large' };
  return { payload, categories, recordCount: payload.meta.recordCount, bytes, createdAt };
}

export function createPrivacyExportHandler({
  verifySession,
  getProfile,
  createExport,
  consumeExport,
  writeAudit,
  deleteExport = async () => {},
  now = Date.now,
  createToken,
  hashToken,
  ipLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 }),
  userLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 }),
}) {
  for (const [name, fn] of Object.entries({
    verifySession,
    getProfile,
    createExport,
    consumeExport,
    writeAudit,
    createToken,
    hashToken,
  })) {
    if (typeof fn !== 'function') throw new TypeError(`createPrivacyExportHandler needs ${name}`);
  }

  return async function handle({ method, headers = {}, body }) {
    if (method !== 'POST' && method !== 'GET') {
      return json(405, { error: 'method_not_allowed' }, { Allow: 'GET, POST' });
    }

    const address = clientKey(headers);
    if (address) {
      const verdict = ipLimiter.take(address);
      if (!verdict.allowed) return tooMany(verdict.retryAfterSeconds);
    }

    const token = bearerToken(headers);
    if (!token) return json(401, { error: 'missing_token' });

    let claims;
    try {
      claims = await verifySession(token);
    } catch {
      return json(401, { error: 'invalid_token' });
    }
    const userId = claims?.userId;
    if (typeof userId !== 'string' || !userId || userId.length > 128) {
      return json(401, { error: 'invalid_token' });
    }
    const userVerdict = userLimiter.take(userId);
    if (!userVerdict.allowed) return tooMany(userVerdict.retryAfterSeconds);

    if (!isRecent(claims.fva)) {
      return json(428, { error: 'recent_authentication_required' });
    }

    if (method === 'POST') {
      const validated = validateCreateBody(body, userId);
      if (validated.error) {
        const status = validated.error === 'export_too_large' ? 413 : 400;
        return json(status, { error: validated.error });
      }

      let profile;
      if (validated.categories.includes('profile')) {
        try {
          profile = await getProfile(userId);
        } catch {
          return json(502, { error: 'profile_lookup_failed' });
        }
        const safeProfile = scrub(profile ?? {});
        if (!safeProfile || typeof safeProfile !== 'object' || Array.isArray(safeProfile)) {
          return json(502, { error: 'profile_lookup_failed' });
        }
        validated.payload.data.profile = Object.fromEntries(
          ['name', 'email', 'phone', 'city', 'state', 'occupation', 'bio']
            .filter((field) => typeof safeProfile[field] === 'string')
            .map((field) => [field, safeProfile[field].slice(0, field === 'bio' ? 2000 : 300)])
        );
        validated.recordCount += 1;
        validated.payload.meta.recordCount = validated.recordCount;
        validated.bytes = utf8Bytes(JSON.stringify(validated.payload));
        if (validated.bytes > MAX_EXPORT_BYTES) return json(413, { error: 'export_too_large' });
      }

      let downloadToken;
      let tokenHash;
      let stored = false;
      try {
        downloadToken = createToken();
        tokenHash = await hashToken(downloadToken);
        const expiresAt = now() + EXPORT_LINK_TTL_MS;
        const metadata = {
          categories: validated.categories,
          recordCount: validated.recordCount,
          bytes: validated.bytes,
          vaultMetadataIncluded: Boolean(body.vaultConsent),
        };
        await createExport(tokenHash, {
          userId,
          payload: validated.payload,
          metadata,
          createdAt: now(),
          expiresAt,
        });
        stored = true;
        await writeAudit({ userId, action: 'export_link_issued', ...metadata, at: now() });
        return json(201, {
          downloadUrl: '/api/privacy-exports',
          downloadToken,
          expiresAt: new Date(expiresAt).toISOString(),
          singleUse: true,
        });
      } catch {
        if (stored && tokenHash) {
          try {
            await deleteExport(tokenHash);
          } catch {
            // The request still fails closed; no export link is returned.
          }
        }
        return json(503, { error: 'export_unavailable' });
      }
    }

    const rawDownloadToken = getHeader(headers, 'x-privacy-export-token');
    const downloadToken = typeof rawDownloadToken === 'string' ? rawDownloadToken : '';
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(downloadToken)) {
      return json(404, { error: 'download_not_found' });
    }

    try {
      const tokenHash = await hashToken(downloadToken);
      const result = await consumeExport(tokenHash, userId, now());
      if (result.status !== 'ok') {
        return json(result.status === 'expired' || result.status === 'used' ? 410 : 404, {
          error: result.status === 'expired' ? 'download_expired' : 'download_not_found',
        });
      }

      const serialized = JSON.stringify(result.payload, null, 2);
      await writeAudit({
        userId,
        action: 'export_downloaded',
        ...result.metadata,
        at: now(),
      });
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="civic-help-setu-export.json"',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
        body: serialized,
      };
    } catch {
      return json(503, { error: 'download_unavailable' });
    }
  };
}
