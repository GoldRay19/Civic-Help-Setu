export const EXPORT_SCHEMA_VERSION = '1.0.0';

export const EXCLUDED_SENSITIVE_FIELDS_EXPLANATION =
  'Passwords, session tokens, credentials, vault passphrases, document numbers, and vault file contents are excluded.';

export const SUPPORTED_EXPORT_CATEGORIES = [
  { id: 'profile', label: 'Profile' },
  { id: 'saved_services', label: 'Saved services' },
  { id: 'journey_metadata', label: 'Journey metadata' },
  { id: 'checklist_progress', label: 'Checklist progress' },
  { id: 'consent_history', label: 'Consent history' },
];

export const assertAuthenticated = (currentUser) => {
  if (!currentUser || typeof currentUser !== 'object') {
    throw new Error('Authentication required: You must be logged in to export personal data.');
  }
  const userId = currentUser.id || currentUser.userId;
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('Invalid authentication session: User identifier is missing.');
  }
  return userId.trim();
};

export const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const convertToCsv = (rows, headers) => {
  const header = headers.map(({ label }) => escapeCsvValue(label)).join(',');
  if (!Array.isArray(rows) || rows.length === 0) return `${header}\n`;
  return [
    header,
    ...rows.map((row) => headers.map(({ key }) => escapeCsvValue(row?.[key])).join(',')),
  ].join('\n');
};

export const sanitizeRecord = (record) => {
  if (Array.isArray(record)) return record.map(sanitizeRecord);
  if (!record || typeof record !== 'object') return record;
  const forbidden = /(password|token|secret|credential|api.?key|private.?key|binary|base64|file.?data|file.?blob|encrypted.?payload|pin|passphrase|authorization)/i;
  const clean = {};
  for (const [key, value] of Object.entries(record)) {
    if (!forbidden.test(key)) clean[key] = sanitizeRecord(value);
  }
  return clean;
};

const secureFlowOnly = () => {
  throw new Error('Direct browser exports are disabled. Use the authenticated Privacy Centre.');
};

export const collectUserRecords = secureFlowOnly;
export const generateExportPreview = secureFlowOnly;
export const buildCitizenDataExport = (currentUser) => {
  assertAuthenticated(currentUser);
  return secureFlowOnly();
};

export const triggerDownload = (content, filename, mimeType = 'application/json') => {
  if (typeof window === 'undefined' || !window.document) return false;
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
};
