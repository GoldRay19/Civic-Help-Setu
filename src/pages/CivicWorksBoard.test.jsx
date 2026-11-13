import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CivicWorksBoard from './CivicWorksBoard';
import { ensureCivicWorksSeedData } from '../services/civicWorksBoardService';
import { setCurrentActor } from '../services/accessControl';

const mockAuthState = {
  user: null,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  }),
}));

const createMemoryStorage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};

describe('CivicWorksBoard UI rendering & privacy verification (#649)', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    ensureCivicWorksSeedData(storage);
    vi.stubGlobal('localStorage', storage);
    mockAuthState.user = null;
    setCurrentActor(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setCurrentActor(null);
  });

  const renderPage = () =>
    renderToStaticMarkup(
      <MemoryRouter>
        <CivicWorksBoard />
      </MemoryRouter>
    );

  it('renders ward-grouped accountability board with coarse location grids and citizen/official distinction', () => {
    const html = renderPage();

    expect(html).toContain('Ward Public Works &amp; Asset Follow-Up Board');
    expect(html).toContain('Ward 14 - Indiranagar East');
    expect(html).toContain('Ward 7 - Shivajinagar Central');
    expect(html).toContain('Ward 22 - Koramangala South');
    expect(html).toContain('Coarse Grid: geo_12.97_77.64');
    expect(html).toContain('Citizen Report (Awaiting Official Acknowledgement)');
    expect(html).toContain('Work Reported — Independent Verification Pending');
    expect(html).toContain('Independently Confirmed (With Evidence)');
    expect(html).toContain('View Duplicate Cluster');
  });

  it('shows Moderator Review Queue toggle only to signed-in admins', () => {
    mockAuthState.user = { id: 'u1', role: 'citizen', username: 'CitizenA' };
    setCurrentActor(mockAuthState.user);
    expect(renderPage()).not.toContain('Moderator Review Queue');

    mockAuthState.user = { id: 'a1', role: 'admin', username: 'ModeratorA' };
    setCurrentActor(mockAuthState.user);
    expect(renderPage()).toContain('Moderator Review Queue');
  });
});
