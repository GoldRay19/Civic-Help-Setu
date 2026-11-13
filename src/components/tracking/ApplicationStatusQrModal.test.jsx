import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ApplicationStatusQrModal from './ApplicationStatusQrModal';
import { createOrRotateStatusToken } from '../../services/applicationStatusQrService';

describe('ApplicationStatusQrModal Component (#458, #739)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const mockApp = {
    id: 'APP-1234',
    serviceName: 'Water Connection Sanction',
    status: 'Inspection Scheduled',
  };

  it('renders modal with QR code, service title, security assurance, passcode input, and view cap selector', () => {
    const html = renderToStaticMarkup(
      <ApplicationStatusQrModal
        isOpen={true}
        onClose={() => {}}
        application={mockApp}
      />
    );

    expect(html).toContain('Application QR Status Pass');
    expect(html).toContain('Water Connection Sanction');
    expect(html).toContain('Opaque token protection:');
    expect(html).toContain('Rotate Token');
    expect(html).toContain('Deactivate Pass');
    expect(html).toContain('Optional Passcode (PIN)');
    expect(html).toContain('Maximum View Cap');
    expect(html).toContain('Single-Use (Burn After Read)');
  });

  it('renders SHA-256 seal, passcode badge, and view limit badge for active protected pass (#739)', () => {
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => {
        store[k] = String(v);
      },
      removeItem: (k) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });

    const activeRecord = createOrRotateStatusToken(mockApp.id, mockApp, {
      accessPin: '4321',
      burnAfterRead: true,
    });

    const html = renderToStaticMarkup(
      <ApplicationStatusQrModal
        isOpen={true}
        onClose={() => {}}
        application={mockApp}
        initialRecord={activeRecord}
      />
    );

    expect(html).toContain('SHA-256 Sealed');
    expect(html).toContain('Passcode Protected');
    expect(html).toContain('1 of 1 views left');
  });

  it('does not render when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <ApplicationStatusQrModal
        isOpen={false}
        onClose={() => {}}
        application={mockApp}
      />
    );

    expect(html).toBe('');
  });
});
