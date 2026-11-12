import { getCurrentActor } from './accessControl';

export const PRIVACY_EXPORT_VERSION = '1.0.0';

export const PRIVACY_EXPORT_CATEGORIES = [
  {
    id: 'profile',
    title: 'Profile',
    description: 'Name, verified email and optional profile details supplied to Civic Help Setu.',
  },
  {
    id: 'saved_services',
    title: 'Saved services',
    description: 'Saved service identifiers, folders, notes, priority and save dates.',
  },
  {
    id: 'journey_metadata',
    title: 'Journey metadata',
    description: 'Owned journey and handoff names, service identifiers and progress metadata; never share tokens.',
  },
  {
    id: 'checklist_progress',
    title: 'Checklist progress',
    description: 'Owned checklist identifiers, checked item labels, revision and last update time.',
  },
  {
    id: 'consent_history',
    title: 'Consent history',
    description: 'Consent preference changes recorded for this account, without unrelated audit events.',
  },
];

const CATEGORY_IDS = new Set(PRIVACY_EXPORT_CATEGORIES.map(({ id }) => id));
const SENSITIVE_KEY = /(password|token|secret|credential|api.?key|private.?key|binary|base64|file.?data|file.?blob|encrypted.?payload|pin|passphrase|authorization)/i;
const DEFAULT_EXCLUDED = ['civicbridge_vault_docs', 'civicbridge_vault_pin'];

const parseStored = (storage, key, fallback) => {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const owns = (record, userId) =>
  record &&
  typeof record === 'object' &&
  (record.ownerUserId === userId || record.userId === userId || record.actorId === userId);

const assertCurrentOwner = (userId) => {
  if (!userId || getCurrentActor()?.id !== userId) {
    throw new Error('Export data is only available to its signed-in account owner.');
  }
};

const cleanObject = (value) => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cleanObject);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, child]) => [key, cleanObject(child)])
  );
};

const projectSavedService = (record) => ({
  serviceId: record.serviceId ?? record.id ?? null,
  name: record.name ?? null,
  folder: record.folder ?? record.category ?? null,
  priority: record.priority ?? null,
  notes: record.notes ?? null,
  savedAt: record.savedAt ?? null,
  targetDate: record.targetDate ?? null,
  status: record.status ?? null,
});

const projectJourney = (record) => ({
  id: record.id ?? null,
  journeyId: record.journeyId ?? record.serviceId ?? null,
  title: record.title ?? record.serviceName ?? null,
  createdAt: record.createdAt ?? null,
  updatedAt: record.updatedAt ?? null,
  expiresAt: record.expiresAt ?? null,
  revoked: Boolean(record.revoked),
  taskCount: Array.isArray(record.tasks) ? record.tasks.length : null,
  completedTaskCount: Array.isArray(record.tasks)
    ? record.tasks.filter((task) => task?.completed).length
    : null,
});

const projectChecklist = (record) => ({
  checked: Array.isArray(record.checked) ? record.checked.filter((item) => typeof item === 'string') : [],
  rev: Number.isInteger(record.rev) ? record.rev : 0,
  updatedAt: record.updatedAt ?? null,
});

const projectConsent = (record) => ({
  timestamp: record.timestamp ?? record.createdAt ?? null,
  action: record.action,
  categoryId: record.metadata?.categoryId ?? record.category ?? null,
  granted: typeof record.metadata?.granted === 'boolean' ? record.metadata.granted : null,
});

const readLocalCategories = (userId, storage) => {
  const savedRecords = [
    ...(Array.isArray(parseStored(storage, 'civicbridge_saved_rich', []))
      ? parseStored(storage, 'civicbridge_saved_rich', [])
      : []),
    ...(Array.isArray(parseStored(storage, 'civicbridge_saved', []))
      ? parseStored(storage, 'civicbridge_saved', [])
      : []),
  ];
  const savedServices = savedRecords.filter((record) => owns(record, userId)).map(projectSavedService);

  const handoffs = parseStored(storage, 'civicbridge_journey_handoffs_v1', []);
  const lifeJourneys = parseStored(storage, 'civic_life_event_journeys', []);
  const journeys = [
    ...(Array.isArray(handoffs) ? handoffs : []),
    ...(Array.isArray(lifeJourneys)
      ? lifeJourneys
      : Object.entries(lifeJourneys || {}).map(([journeyId, record]) => ({ journeyId, ...record }))),
  ]
    .filter((record) => owns(record, userId))
    .map(projectJourney);

  const checklistStore = parseStored(storage, 'civicbridge_checklists', {});
  const checklistProgress = Object.entries(
    checklistStore && typeof checklistStore === 'object' && !Array.isArray(checklistStore)
      ? checklistStore
      : {}
  )
    .filter(([, record]) => owns(record, userId))
    .map(([checklistId, record]) => ({ checklistId, ...projectChecklist(record) }));

  const legacyChecklists = parseStored(storage, 'civicbridge_checklist', []);
  if (Array.isArray(legacyChecklists)) {
    checklistProgress.push(
      ...legacyChecklists
        .filter((record) => owns(record, userId))
        .map((record) => ({
          checklistId: record.id ?? record.checklistId ?? null,
          checked: Array.isArray(record.checked)
            ? record.checked.filter((item) => typeof item === 'string')
            : [],
          rev: Number.isInteger(record.rev) ? record.rev : 0,
          updatedAt: record.updatedAt ?? null,
        }))
    );
  }

  const audit = parseStored(storage, 'civicbridge_privacy_audit_log', []);
  const consentHistory = (Array.isArray(audit) ? audit : [])
    .filter((record) => owns(record, userId) && record.action === 'CONSENT_PREFERENCE_UPDATED')
    .map(projectConsent);

  return { savedServices, journeyMetadata: journeys, checklistProgress, consentHistory };
};

const safeProfilePreview = (user) => {
  const metadata = user?.raw?.unsafeMetadata || {};
  const profile = {
    name: user?.fullName || user?.username || null,
    email: user?.email || null,
    phone: metadata.phone || null,
    city: metadata.city || null,
    state: metadata.state || null,
    occupation: metadata.occupation || null,
    bio: metadata.bio || null,
  };
  return Object.fromEntries(Object.entries(profile).filter(([, value]) => value !== null && value !== ''));
};

export function getPrivacyExportPreview(user, storage = globalThis.localStorage) {
  const userId = typeof user?.id === 'string' ? user.id.trim() : '';
  if (!userId) throw new Error('Sign in with an account to preview your export.');
  assertCurrentOwner(userId);

  const local = readLocalCategories(userId, storage);
  const profile = safeProfilePreview(user);
  const counts = {
    profile: Object.keys(profile).length ? 1 : 0,
    saved_services: local.savedServices.length,
    journey_metadata: local.journeyMetadata.length,
    checklist_progress: local.checklistProgress.length,
    consent_history: local.consentHistory.length,
  };

  const examples = {
    profile: profile.name ? [{ name: profile.name, email: profile.email }] : [],
    saved_services: local.savedServices,
    journey_metadata: local.journeyMetadata,
    checklist_progress: local.checklistProgress,
    consent_history: local.consentHistory,
  };

  return {
    version: PRIVACY_EXPORT_VERSION,
    totalRecords: Object.values(counts).reduce((total, count) => total + count, 0),
    categories: PRIVACY_EXPORT_CATEGORIES.map((category) => ({
      ...category,
      count: counts[category.id],
      preview: examples[category.id].slice(0, 3).map(cleanObject),
    })),
    security: {
      recentAuthenticationRequired: true,
      vaultExcludedByDefault: true,
      excludedStores: DEFAULT_EXCLUDED,
      legacyUnownedRecordsExcluded: true,
    },
  };
}

export function buildPrivacyExportData(userId, selectedCategories, {
  storage = globalThis.localStorage,
  vaultDocuments = [],
  vaultConsent = false,
  vaultAuthorized = false,
} = {}) {
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('A signed-in account is required.');
  assertCurrentOwner(userId);
  if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) {
    throw new Error('Select at least one export category.');
  }
  if (selectedCategories.some((id) => !CATEGORY_IDS.has(id))) {
    throw new Error('The export contains an unsupported category.');
  }
  if (vaultConsent && !vaultAuthorized) throw new Error('Separate vault authorization is required.');
  if (!vaultConsent && vaultDocuments.length) throw new Error('Separate vault consent is required.');

  const local = readLocalCategories(userId, storage);
  const data = {};
  const mapping = {
    saved_services: 'savedServices',
    journey_metadata: 'journeyMetadata',
    checklist_progress: 'checklistProgress',
    consent_history: 'consentHistory',
  };
  for (const category of selectedCategories) {
    if (category !== 'profile') data[mapping[category]] = cleanObject(local[mapping[category]]);
  }

  if (vaultConsent) {
    data.vaultDocumentMetadata = vaultDocuments.map((document) => ({
      type: document.type ?? document.name ?? null,
      category: document.category ?? null,
      issuer: document.issuer ?? null,
      issueDate: document.issueDate ?? null,
      expiryDate: document.expiryDate ?? null,
      verified: Boolean(document.verified),
      lastModified: document.lastModified ?? document.createdAt ?? null,
    }));
  }

  return cleanObject(data);
}

export function getExportableVaultMetadata(documents, userId) {
  if (!Array.isArray(documents)) return [];
  if (typeof userId !== 'string' || !userId.trim() || getCurrentActor()?.id !== userId) {
    throw new Error('Vault export is only available to its signed-in account owner.');
  }
  return documents
    .filter((document) => owns(document, userId))
    .map((document) => ({
    type: document.type ?? document.name ?? null,
    category: document.category ?? null,
    issuer: document.issuer ?? null,
    issueDate: document.issueDate ?? null,
    expiryDate: document.expiryDate ?? null,
    verified: Boolean(document.verified),
    lastModified: document.lastModified ?? document.createdAt ?? null,
    }));
}

export const PRIVACY_EXPORT_FORBIDDEN_KEYS = SENSITIVE_KEY;
