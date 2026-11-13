import { beforeEach, describe, expect, it } from 'vitest';
import {
  getExportableVaultMetadata,
  getPrivacyExportPreview,
  buildPrivacyExportData,
} from './privacyExportService';
import { setCurrentActor } from './accessControl';

const makeStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
  };
};

describe('privacyExportService', () => {
  let storage;
  const user = { id: 'alice', fullName: 'Asha Citizen', email: 'asha@example.test', raw: { unsafeMetadata: { city: 'Pune' } } };

  beforeEach(() => {
    storage = makeStorage();
    setCurrentActor(user);
  });

  it('previews the five versioned categories and excludes unowned or other-account local records', () => {
    storage.setItem('civicbridge_saved_rich', JSON.stringify([
      { serviceId: 'income-certificate', ownerUserId: 'alice', notes: 'my note' },
      { serviceId: 'ration-card', ownerUserId: 'bob' },
      { serviceId: 'pan-card', notes: 'unowned legacy note' },
    ]));
    storage.setItem('civicbridge_checklists', JSON.stringify({
      'alice-checklist': { ownerUserId: 'alice', checked: ['Photo'], rev: 2 },
      'bob-checklist': { ownerUserId: 'bob', checked: ['Secret task'], rev: 1 },
      'legacy-checklist': { checked: ['Unknown owner'], rev: 1 },
    }));
    storage.setItem('civicbridge_journey_handoffs_v1', JSON.stringify([
      { ownerUserId: 'alice', id: 'journey-1', token: 'private-link', serviceName: 'Certificate', tasks: [{ completed: true }] },
      { ownerUserId: 'bob', id: 'journey-2', serviceName: 'Other' },
    ]));
    storage.setItem('civicbridge_privacy_audit_log', JSON.stringify([
      { actorId: 'alice', action: 'CONSENT_PREFERENCE_UPDATED', timestamp: '2026-01-01', metadata: { categoryId: 'analytics', granted: true } },
      { actorId: 'bob', action: 'CONSENT_PREFERENCE_UPDATED', metadata: { categoryId: 'analytics', granted: false } },
      { actorId: 'alice', action: 'ACCOUNT_DATA_PERMANENTLY_PURGED' },
    ]));

    const preview = getPrivacyExportPreview(user, storage);
    expect(preview.version).toBe('1.0.0');
    expect(preview.categories.map(({ id }) => id)).toEqual([
      'profile',
      'saved_services',
      'journey_metadata',
      'checklist_progress',
      'consent_history',
    ]);
    expect(preview.categories.map(({ count }) => count)).toEqual([1, 1, 1, 1, 1]);
    expect(JSON.stringify(preview)).not.toContain('private-link');
    expect(JSON.stringify(preview)).not.toContain('Unknown owner');
    expect(JSON.stringify(preview)).not.toContain('unowned legacy note');
    expect(preview.security.legacyUnownedRecordsExcluded).toBe(true);
  });

  it('collects only requested categories for the current authenticated owner and redacts secret-like fields', () => {
    storage.setItem('civicbridge_saved_rich', JSON.stringify([
      { serviceId: 'pan-card', ownerUserId: 'alice', notes: 'owned', accessToken: 'secret' },
      { serviceId: 'passport', ownerUserId: 'bob', notes: 'other account' },
    ]));
    const data = buildPrivacyExportData('alice', ['saved_services'], { storage });
    expect(data.savedServices).toEqual([
      expect.objectContaining({ serviceId: 'pan-card', notes: 'owned' }),
    ]);
    expect(JSON.stringify(data)).not.toContain('secret');
    expect(JSON.stringify(data)).not.toContain('other account');
    expect(data.journeyMetadata).toBeUndefined();
  });

  it('rejects ID substitution, missing authentication and unsupported categories', () => {
    expect(() => buildPrivacyExportData('bob', ['saved_services'], { storage })).toThrow(/account owner/);
    expect(() => buildPrivacyExportData('alice', ['admin'], { storage })).toThrow(/unsupported category/);
    setCurrentActor(null);
    expect(() => getPrivacyExportPreview(user, storage)).toThrow(/account owner/);
  });

  it('keeps vault metadata out of the default categories and emits no numbers or file contents', () => {
    const vaultDocuments = [{
      type: 'Identity document',
      number: '123456789',
      documentNumber: '123456789',
      fileBlob: 'base64-secret',
      category: 'Identity',
      issuer: 'Issuer',
      issueDate: '2021-01-01',
      verified: true,
    }];
    expect(() => buildPrivacyExportData('alice', ['saved_services'], { storage, vaultDocuments }))
      .toThrow(/vault consent/);
    const authorizedData = buildPrivacyExportData('alice', ['saved_services'], {
      storage,
      vaultConsent: true,
      vaultAuthorized: true,
      vaultDocuments: [{
        type: vaultDocuments[0].type,
        category: vaultDocuments[0].category,
        issuer: vaultDocuments[0].issuer,
        issueDate: vaultDocuments[0].issueDate,
        verified: vaultDocuments[0].verified,
      }],
    });
    expect(authorizedData.vaultDocumentMetadata[0]).toEqual({
      type: 'Identity document',
      category: 'Identity',
      issuer: 'Issuer',
      issueDate: '2021-01-01',
      expiryDate: null,
      verified: true,
      lastModified: null,
    });
    expect(JSON.stringify(authorizedData)).not.toContain('123456789');
    expect(JSON.stringify(authorizedData)).not.toContain('base64-secret');
  });

  it('only makes vault metadata eligible for the matching account owner', () => {
    const metadata = getExportableVaultMetadata([
      { ownerUserId: 'alice', type: 'Passport', number: 'XXXX 1234' },
      { ownerUserId: 'bob', type: 'Other document' },
      { type: 'Unattributed legacy document' },
    ], 'alice');
    expect(metadata).toEqual([expect.objectContaining({ type: 'Passport' })]);
    expect(JSON.stringify(metadata)).not.toContain('1234');
    expect(() => getExportableVaultMetadata([{ ownerUserId: 'alice', type: 'Passport' }], 'bob'))
      .toThrow(/account owner/);
  });
});
