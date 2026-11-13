import { describe, expect, it, vi } from 'vitest';
import { createPrivacyExportHandler, EXPORT_LINK_TTL_MS } from './privacyExports.js';

const SESSION = 'sess_token_abcdefghijklmnop';
const FRESH = { userId: 'user_alice', fva: [30, null] };
const bearer = (userId = 'user_alice') => ({
  authorization: `Bearer ${userId === 'user_alice' ? SESSION : `session_${userId}_abcdefghijklmnop`}`,
  'x-real-ip': '203.0.113.10',
});

const exportBody = (overrides = {}) => ({
  action: 'create',
  categories: ['profile', 'saved_services'],
  data: {
    savedServices: [
      { serviceId: 'pan-card', notes: 'owner data', sessionToken: 'do-not-export' },
    ],
  },
  ...overrides,
});

const createHarness = (options = {}) => {
  let time = 1_000_000;
  const records = new Map();
  const audit = [];
  let nextToken = 0;
  const deps = {
    verifySession: vi.fn(async (token) => (token === SESSION ? FRESH : {
      userId: token.replace(/^session_/, '').replace(/_abcdefghijklmnop$/, ''),
      fva: [30, null],
    })),
    getProfile: vi.fn(async (userId) => ({ name: `Account ${userId}`, email: `${userId}@example.test` })),
    createExport: vi.fn(async (hash, record) => records.set(hash, structuredClone(record))),
    consumeExport: vi.fn(async (hash, userId, now) => {
      const record = records.get(hash);
      if (!record || record.userId !== userId) return { status: 'not_found' };
      if (record.usedAt) return { status: 'used' };
      if (record.expiresAt <= now) return { status: 'expired' };
      record.usedAt = now;
      const payload = record.payload;
      record.payload = null;
      return { status: 'ok', payload, metadata: record.metadata };
    }),
    writeAudit: vi.fn(async (entry) => audit.push(structuredClone(entry))),
    deleteExport: vi.fn(async (hash) => records.delete(hash)),
    now: () => time,
    createToken: () => `download-token-${String(++nextToken).padStart(36, '0')}`,
    hashToken: async (value) => value,
    ...options,
  };
  const handle = createPrivacyExportHandler(deps);
  return {
    deps,
    records,
    audit,
    handle,
    setTime: (value) => { time = value; },
    create: (body = exportBody(), headers = bearer()) =>
      handle({ method: 'POST', headers, body }),
    download: (created, headers = bearer()) => handle({
      method: 'GET',
      headers: { ...headers, 'x-privacy-export-token': created.downloadToken },
    }),
  };
};

describe('createPrivacyExportHandler', () => {
  it('requires an authenticated account and recent factor verification', async () => {
    const harness = createHarness({
      verifySession: vi.fn(async () => ({ userId: 'user_alice', fva: [301, null] })),
    });
    expect((await harness.create(exportBody(), {})).status).toBe(401);
    expect((await harness.create()).status).toBe(428);
    expect(harness.deps.createExport).not.toHaveBeenCalled();
  });

  it('requires a valid recent authentication age claim', async () => {
    for (const fva of [undefined, [], [-1, null], [null, null], [301, null], [0, 301]]) {
      const harness = createHarness({
        verifySession: vi.fn(async () => ({ userId: 'user_alice', fva })),
      });
      expect((await harness.create()).status).toBe(428);
    }
    const singleFactor = createHarness({
      verifySession: vi.fn(async () => ({ userId: 'user_alice', fva: [30, -1] })),
    });
    expect((await singleFactor.create()).status).toBe(201);
  });

  it('pins the export identity to the verified session, not a caller-supplied user id', async () => {
    const harness = createHarness();
    const result = await harness.create(exportBody({ userId: 'user_victim' }));
    expect(result.status).toBe(201);
    const stored = [...harness.records.values()][0];
    expect(stored.userId).toBe('user_alice');
    expect(stored.payload.user.id).toBe('user_alice');
    expect(harness.deps.getProfile).toHaveBeenCalledWith('user_alice');
  });

  it('redacts secret-like fields and logs metadata only', async () => {
    const harness = createHarness();
    const result = await harness.create(exportBody({
      data: {
        savedServices: [{
          serviceId: 'pan-card',
          notes: 'private note',
          authToken: 'secret-token',
          nested: { password: 'secret-password', status: 'saved' },
        }],
      },
    }));
    expect(result.status).toBe(201);
    const serialized = JSON.stringify([...harness.records.values()][0].payload);
    expect(serialized).toContain('private note');
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('secret-password');
    expect(serialized).not.toContain('nested');
    expect(JSON.stringify(harness.audit)).not.toContain('private note');
    expect(JSON.stringify(harness.audit)).not.toContain('pan-card');
    expect(harness.audit[0]).toMatchObject({
      userId: 'user_alice',
      action: 'export_link_issued',
      categories: ['profile', 'saved_services'],
      recordCount: 2,
    });
  });

  it('requires separate explicit consent and authorization for vault metadata', async () => {
    const harness = createHarness();
    const data = { savedServices: [], vaultDocumentMetadata: [{ type: 'ID', fileBlob: 'base64' }] };
    expect((await harness.create(exportBody({ data }))).body.error).toBe('vault_consent_required');
    expect((await harness.create(exportBody({ data, vaultConsent: true }))).body.error).toBe('vault_authorization_required');
    const result = await harness.create(exportBody({
      data,
      vaultConsent: true,
      vaultAuthorization: true,
    }));
    expect(result.status).toBe(201);
    const payload = [...harness.records.values()][0].payload;
    expect(payload.meta.vaultMetadataIncluded).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('base64');
  });

  it('rejects categories or data outside the selected export scope', async () => {
    const harness = createHarness();
    expect((await harness.create(exportBody({ categories: ['admin'], data: {} }))).status).toBe(400);
    expect((await harness.create(exportBody({
      categories: ['profile'],
      data: { savedServices: [{ serviceId: 'not-selected' }] },
    }))).body.error).toBe('unselected_data');
    expect(harness.deps.createExport).not.toHaveBeenCalled();
  });

  it('returns a short-lived link and allows only the matching account to consume it once', async () => {
    const harness = createHarness();
    const created = await harness.create();
    const { downloadUrl, downloadToken, expiresAt, singleUse } = created.body;
    expect(created.status).toBe(201);
    expect(singleUse).toBe(true);
    expect(new Date(expiresAt).getTime() - harness.deps.now()).toBe(EXPORT_LINK_TTL_MS);
    expect(downloadUrl).toBe('/api/privacy-exports');
    expect(downloadToken).toBeTruthy();
    expect((await harness.download(created.body, bearer('user_bob'))).status).toBe(404);
    expect((await harness.download(created.body)).status).toBe(200);
    expect((await harness.download(created.body)).status).toBe(410);
    expect([...harness.records.values()][0].payload).toBeNull();
  });

  it('rejects expired links and malformed tokens', async () => {
    const harness = createHarness();
    const created = await harness.create();
    harness.setTime(harness.deps.now() + EXPORT_LINK_TTL_MS);
    const expired = await harness.handle({
      method: 'GET',
      headers: { ...bearer(), 'x-privacy-export-token': created.body.downloadToken },
    });
    expect(expired.status).toBe(410);
    expect((await harness.handle({
      method: 'GET',
      headers: { ...bearer(), 'x-privacy-export-token': 'bad' },
    })).status).toBe(404);
  });

  it('does not return a link if metadata audit logging fails', async () => {
    const harness = createHarness({
      writeAudit: vi.fn(async () => { throw new Error('audit storage unavailable'); }),
    });
    expect((await harness.create()).status).toBe(503);
    expect(harness.records.size).toBe(0);
  });

  it('does not cache responses and rejects unsupported methods', async () => {
    const harness = createHarness();
    const result = await harness.handle({ method: 'DELETE', headers: {} });
    expect(result.status).toBe(405);
    expect(result.headers['Cache-Control']).toBe('no-store');
  });
});
