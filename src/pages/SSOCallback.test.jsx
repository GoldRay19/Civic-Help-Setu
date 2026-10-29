import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isClerkConfigured: false })),
}));

import SSOCallback from './SSOCallback';

const render = (url) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <SSOCallback />
    </MemoryRouter>
  );

describe('SSOCallback without a Clerk key', () => {
  // ClerkFailed, ClerkLoaded and AuthenticateWithRedirectCallback throw when there is no
  // ClerkProvider, so rendering the page at all used to crash the route.
  it('renders without throwing and shows no Clerk callback UI', () => {
    expect(() => render('/sso-callback')).not.toThrow();
    expect(render('/sso-callback')).not.toContain('Authenticating with Google');
  });

  it('also does not throw on the sign-up callback path', () => {
    expect(() => render('/signup/sso-callback?sign_up_force_redirect_url=%2Fsaved')).not.toThrow();
  });
});
