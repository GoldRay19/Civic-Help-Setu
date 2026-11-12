import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import SharedProfileView from './SharedProfileView';
import * as service from '../services/shareableProfileService';

describe('SharedProfileView Component (#455)', () => {
  it('renders read-only shared profile with security banner and verified citizen details', () => {
    vi.spyOn(service, 'getPublicSharedProfile').mockReturnValue({
      status: 'ACTIVE',
      profile: {
        fullName: 'Amina Begum',
        location: 'Kolkata, West Bengal',
        occupation: 'Craft Worker',
        readinessScore: 88,
        savedServices: [{ id: 's1', title: 'Artisan Credit Card' }],
        applicationMilestones: [{ serviceName: 'Artisan Credit Card', stage: 'Under Review' }],
      },
      createdAt: Date.now() - 3600000,
      expiresAt: Date.now() + 86400000,
      readOnly: true,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SharedProfileView initialToken="mock-token-123" />
      </MemoryRouter>
    );

    expect(html).toContain('Amina Begum');
    expect(html).toContain('Privacy-Controlled Shared View');
    expect(html).toContain('Kolkata, West Bengal');
    expect(html).toContain('88%');
    expect(html).toContain('Artisan Credit Card');
    expect(html).toContain('Under Review');
  });

  it('renders revoked notice when profile has been revoked', () => {
    vi.spyOn(service, 'getPublicSharedProfile').mockReturnValue({
      status: 'REVOKED',
      error: 'Revoked by owner',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SharedProfileView initialToken="mock-token-123" />
      </MemoryRouter>
    );

    expect(html).toContain('Shared Profile Link Revoked');
    expect(html).toContain('owner of this citizen profile has revoked public access');
  });

  it('renders passcode prompt, lockout, view-limit, and tamper-detection states (#734)', () => {
    vi.spyOn(service, 'getPublicSharedProfile').mockReturnValue({
      status: 'PIN_REQUIRED',
      remainingAttempts: 5,
    });
    const pinHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SharedProfileView initialToken="pin-token" />
      </MemoryRouter>
    );
    expect(pinHtml).toContain('Passcode Required to View Shared Profile');
    expect(pinHtml).toContain('Enter share passcode');

    vi.spyOn(service, 'getPublicSharedProfile').mockReturnValue({
      status: 'LOCKED',
      error: 'Too many incorrect passcode attempts.',
    });
    const lockedHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SharedProfileView initialToken="locked-token" />
      </MemoryRouter>
    );
    expect(lockedHtml).toContain('Shared Profile Access Temporarily Locked');

    vi.spyOn(service, 'getPublicSharedProfile').mockReturnValue({
      status: 'VIEW_LIMIT_REACHED',
      error: 'View quota consumed.',
    });
    const limitHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SharedProfileView initialToken="limit-token" />
      </MemoryRouter>
    );
    expect(limitHtml).toContain('Maximum View Limit Reached');

    vi.spyOn(service, 'getPublicSharedProfile').mockReturnValue({
      status: 'TAMPERED',
      error: 'SHA-256 seal mismatch.',
    });
    const tamperedHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SharedProfileView initialToken="tamper-token" />
      </MemoryRouter>
    );
    expect(tamperedHtml).toContain('Snapshot Integrity Verification Failed');
  });

  it('displays SHA-256 digest badge and single-use exhaustion notice on final active view (#734)', () => {
    vi.spyOn(service, 'getPublicSharedProfile').mockReturnValue({
      status: 'ACTIVE',
      profile: {
        fullName: 'Amina Begum',
        savedServices: [],
        applicationMilestones: [],
      },
      createdAt: Date.now(),
      expiresAt: null,
      viewsRemaining: 0,
      consumedOnThisView: true,
      integrityDigest: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SharedProfileView initialToken="active-sealed-token" />
      </MemoryRouter>
    );
    expect(html).toContain('SHA-256: abcdef1234');
    expect(html).toContain('Final view consumed');
  });
});
