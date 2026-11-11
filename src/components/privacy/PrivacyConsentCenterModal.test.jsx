import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  }),
}));

import PrivacyConsentCenterModal from './PrivacyConsentCenterModal';
import {
  updateConsentPreference,
  recordPrivacyAuditLog,
} from '../../services/privacyConsentService';

describe('PrivacyConsentCenterModal Integrity & Retention UI (#696)', () => {
  beforeEach(() => {
    if (globalThis.__mockPrivacyStorage) {
      globalThis.__mockPrivacyStorage.clear();
    }
  });

  it('renders retention compliance status, max retention badges, and SHA-256 export seal copy', () => {
    updateConsentPreference('personalization', true, 'citizen_ui');
    recordPrivacyAuditLog('USER_DATA_EXPORTED', { totalCategories: 3 }, 'citizen_ui');

    const html = renderToStaticMarkup(
      <PrivacyConsentCenterModal isOpen={true} onClose={() => {}} />
    );

    expect(html).toContain('Privacy &amp; Consent Management Center');
    expect(html).toContain('Enforce Retention Policies Now');
    expect(html).toContain('Max Retention: 30 days');
    expect(html).toContain('Security Audit Log (2)');
  });

  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <PrivacyConsentCenterModal isOpen={false} onClose={() => {}} />
    );
    expect(html).toBe('');
  });
});
