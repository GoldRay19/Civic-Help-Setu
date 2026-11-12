import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ShareableProfileModal from './ShareableProfileModal';
import { createShareableProfile } from '../../services/shareableProfileService';

describe('ShareableProfileModal Component (#455)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockUser = { id: 'u101', username: 'testuser' };
  const mockProfile = {
    fullName: 'Ramesh Patel',
    state: 'Gujarat',
    district: 'Ahmedabad',
    category: 'OBC',
  };

  it('renders modal with privacy assurances, view cap selector, passcode input, and field visibility options', () => {
    const html = renderToStaticMarkup(
      <ShareableProfileModal
        isOpen={true}
        onClose={() => {}}
        currentUser={mockUser}
        profileData={mockProfile}
      />
    );

    expect(html).toContain('Privacy-Controlled Profile Sharing');
    expect(html).toContain('Private documents, identity numbers, and contact details are permanently excluded');
    expect(html).toContain('Full Name');
    expect(html).toContain('State &amp; District Location');
    expect(html).toContain('Maximum View Cap');
    expect(html).toContain('Single-Use (Burn After Read)');
    expect(html).toContain('Optional Viewer Passcode');
    expect(html).toContain('Generate Privacy-Safe Link');
  });

  it('renders SHA-256 seal, passcode badge, and remaining views for an active share (#734)', () => {
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

    createShareableProfile('u101', mockProfile, {
      accessPin: '5678',
      burnAfterRead: true,
    });

    const html = renderToStaticMarkup(
      <ShareableProfileModal
        isOpen={true}
        onClose={() => {}}
        currentUser={mockUser}
        profileData={mockProfile}
      />
    );

    expect(html).toContain('Active Read-Only Share Link');
    expect(html).toContain('SHA-256 Sealed');
    expect(html).toContain('Passcode Protected');
    expect(html).toContain('1 of 1 views left');
  });

  it('does not render when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <ShareableProfileModal
        isOpen={false}
        onClose={() => {}}
        currentUser={mockUser}
        profileData={mockProfile}
      />
    );

    expect(html).toBe('');
  });
});
