import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PublicApplicationStatusView from './PublicApplicationStatusView';
import * as qrService from '../services/applicationStatusQrService';

describe('PublicApplicationStatusView Component (#458, #739)', () => {
  it('renders read-only milestone status without private personal identifiers and displays SHA-256 seal', () => {
    vi.spyOn(qrService, 'resolvePublicStatusByToken').mockReturnValue({
      status: 'ACTIVE',
      application: {
        serviceName: 'Senior Citizen Pension Grant',
        department: 'Social Welfare Department',
        stage: 'Document Verification',
        submissionDate: '2026-10-12',
        expectedResolution: '15 business days',
        milestones: [
          { label: 'Application Submitted', status: 'COMPLETED' },
          { label: 'Aadhaar e-KYC Verification', status: 'IN_PROGRESS' },
        ],
      },
      expiresAt: Date.now() + 864000000,
      readOnly: true,
      integrityDigest: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PublicApplicationStatusView initialToken="token-abc-123" />
      </MemoryRouter>
    );

    expect(html).toContain('Senior Citizen Pension Grant');
    expect(html).toContain('Privacy-Safe Status View');
    expect(html).toContain('Document Verification');
    expect(html).toContain('Aadhaar e-KYC Verification');
    expect(html).toContain('Social Welfare Department');
    expect(html).toContain('SHA-256: 1234567890');

    // Confirm sensitive fields do not render
    expect(html).not.toContain('Aadhaar Number');
    expect(html).not.toContain('Phone');
  });

  it('renders deactivated message for revoked tokens', () => {
    vi.spyOn(qrService, 'resolvePublicStatusByToken').mockReturnValue({
      status: 'REVOKED',
      error: 'This lookup QR code has been rotated or deactivated',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PublicApplicationStatusView initialToken="revoked-token" />
      </MemoryRouter>
    );

    expect(html).toContain('QR Status Pass Deactivated');
    expect(html).toContain('rotated or deactivated');
  });

  it('renders passcode prompt, lockout, view-limit, and tamper-detection states (#739)', () => {
    vi.spyOn(qrService, 'resolvePublicStatusByToken').mockReturnValue({
      status: 'PIN_REQUIRED',
      remainingAttempts: 5,
    });
    const pinHtml = renderToStaticMarkup(
      <MemoryRouter>
        <PublicApplicationStatusView initialToken="pin-token" />
      </MemoryRouter>
    );
    expect(pinHtml).toContain('Passcode Required to View Application Status');
    expect(pinHtml).toContain('Enter viewer passcode');

    vi.spyOn(qrService, 'resolvePublicStatusByToken').mockReturnValue({
      status: 'LOCKED',
      error: 'Too many incorrect passcode attempts.',
    });
    const lockedHtml = renderToStaticMarkup(
      <MemoryRouter>
        <PublicApplicationStatusView initialToken="locked-token" />
      </MemoryRouter>
    );
    expect(lockedHtml).toContain('QR Status Pass Temporarily Locked');

    vi.spyOn(qrService, 'resolvePublicStatusByToken').mockReturnValue({
      status: 'VIEW_LIMIT_REACHED',
      error: 'View limit consumed.',
    });
    const limitHtml = renderToStaticMarkup(
      <MemoryRouter>
        <PublicApplicationStatusView initialToken="limit-token" />
      </MemoryRouter>
    );
    expect(limitHtml).toContain('Maximum View Limit Reached');

    vi.spyOn(qrService, 'resolvePublicStatusByToken').mockReturnValue({
      status: 'TAMPERED',
      error: 'SHA-256 seal mismatch.',
    });
    const tamperedHtml = renderToStaticMarkup(
      <MemoryRouter>
        <PublicApplicationStatusView initialToken="tamper-token" />
      </MemoryRouter>
    );
    expect(tamperedHtml).toContain('Snapshot Integrity Verification Failed');
  });

  it('displays single-use exhaustion notice on final active view (#739)', () => {
    vi.spyOn(qrService, 'resolvePublicStatusByToken').mockReturnValue({
      status: 'ACTIVE',
      application: {
        serviceName: 'Water Connection Sanction',
        department: 'Jal Board',
        stage: 'Sanctioned',
        milestones: [],
      },
      expiresAt: null,
      viewsRemaining: 0,
      consumedOnThisView: true,
      integrityDigest: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PublicApplicationStatusView initialToken="active-exhausted-token" />
      </MemoryRouter>
    );
    expect(html).toContain('Final view consumed — pass closed');
  });
});
