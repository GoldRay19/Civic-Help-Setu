import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import Footer from './Footer';

/* ── Mocks ── */
const mockAuthState = { user: null, logout: vi.fn() };

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => mockAuthState),
  AuthProvider: ({ children }) => children,
}));

/* ── Helpers ── */
const renderFooter = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    </MemoryRouter>,
  );

const getLinkByHref = (html, href) => {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<a\\b[^>]*href="${escaped}"[^>]*>[\\s\\S]*?<\\/a>`);
  const match = html.match(regex);
  return match ? match[0] : null;
};

/* ── Tests ── */
describe('Footer layout and project identity (#576)', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  /* ── Branding & Disclaimer ── */

  it('displays "Civic Help Setu" as project name, not CivicBridge', () => {
    const html = renderFooter();
    expect(html).toContain('Civic Help Setu');
    expect(html).not.toContain('CivicBridge');
  });

  it('displays the independent-platform disclaimer', () => {
    const html = renderFooter();
    expect(html).toContain('independent');
    expect(html).toContain('non-governmental');
  });

  /* ── Grouped links ── */

  it('renders a footer navigation landmark', () => {
    const html = renderFooter();
    expect(html).toContain('aria-label="Footer navigation"');
  });

  it('has a "Services" group with /services and /civic-works links', () => {
    const html = renderFooter();
    expect(html).toContain('Services');

    const servicesLink = getLinkByHref(html, '/services');
    expect(servicesLink).not.toBeNull();

    const civicWorksLink = getLinkByHref(html, '/civic-works');
    expect(civicWorksLink).not.toBeNull();
  });

  it('has a "Community" group with /open-source and Contributors links', () => {
    const html = renderFooter();
    expect(html).toContain('Community');

    const openSourceLink = getLinkByHref(html, '/open-source');
    expect(openSourceLink).not.toBeNull();

    const contributorsLink = getLinkByHref(html, '/open-source#contributors');
    expect(contributorsLink).not.toBeNull();
  });

  it('has a "Legal" group with /privacy link', () => {
    const html = renderFooter();
    expect(html).toContain('Legal');

    const privacyLink = getLinkByHref(html, '/privacy');
    expect(privacyLink).not.toBeNull();
    expect(privacyLink).toContain('Privacy Policy');
  });

  /* ── No broken or placeholder links ── */

  it('does not contain placeholder "#" links', () => {
    const html = renderFooter();
    // Match href="#" but not href="/open-source#contributors"
    const placeholderPattern = /href="#"(?![\w-])/;
    expect(placeholderPattern.test(html)).toBe(false);
  });

  it('all links use valid internal routes', () => {
    const html = renderFooter();
    const validRoutes = ['/services', '/civic-works', '/open-source', '/open-source#contributors', '/privacy'];
    validRoutes.forEach((route) => {
      expect(getLinkByHref(html, route), `expected link for ${route}`).not.toBeNull();
    });
  });

  /* ── Admin visibility ── */

  it('hides Admin Portal link for unauthenticated users', () => {
    const html = renderFooter();
    expect(getLinkByHref(html, '/admin')).toBeNull();
  });

  it('shows Admin Portal when user has admin permissions', () => {
    mockAuthState.user = { id: 'a1', username: 'Admin', role: 'admin' };
    const html = renderFooter();
    const adminLink = getLinkByHref(html, '/admin');
    expect(adminLink).not.toBeNull();
    expect(adminLink).toContain('Admin Portal');
  });

  /* ── Copyright ── */

  it('displays current year in copyright notice', () => {
    const html = renderFooter();
    const year = new Date().getFullYear().toString();
    expect(html).toContain(year);
  });

  /* ── Accessibility ── */

  it('renders a <footer> landmark with aria-label', () => {
    const html = renderFooter();
    expect(html).toMatch(/<footer[^>]*aria-label="Site Footer"/);
  });

  it('uses flexWrap so links wrap on narrow viewports', () => {
    const html = renderFooter();
    expect(html).toContain('flex-wrap:wrap');
  });
});
