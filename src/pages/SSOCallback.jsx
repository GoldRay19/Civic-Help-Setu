import { useEffect, useState } from 'react';
import { AuthenticateWithRedirectCallback, ClerkFailed, ClerkLoaded } from '@clerk/clerk-react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthFallbackBanner from '../components/AuthFallbackBanner';
import { useAuth } from '../context/AuthContext';
import { buildAuthPath, sanitizeRedirectPath } from '../utils/authRedirect';
import { classifyAuthFailure, failureForKind, AUTH_FAILURE_KINDS } from '../utils/authFailure';

// How long to wait for Clerk to finish the callback before offering a way out.
const CALLBACK_SLOW_MS = 20000;

const ClerkSSOCallback = () => {
  const [searchParams] = useSearchParams();
  const signInRedirect = sanitizeRedirectPath(searchParams.get('sign_in_force_redirect_url')) || '/';
  const signUpRedirect = sanitizeRedirectPath(searchParams.get('sign_up_force_redirect_url')) || '/';
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), CALLBACK_SLOW_MS);
    return () => clearTimeout(timer);
  }, []);

  // Back to the sign-in page with the original destination kept
  const retryFromLogin = () => navigate(buildAuthPath('/login', signInRedirect), { replace: true });
  return (
    <div className="section flex-center" style={{ minHeight: '85vh', textAlign: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem 2.5rem', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={36} color="var(--accent-main)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>Authenticating with Google</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Connecting your Google profile with Clerk to secure your civic session...
        </p>
        <Loader2 size={32} className="animate-spin" color="var(--accent-main)" style={{ marginTop: '0.5rem' }} />
        <ClerkFailed>
          <AuthFallbackBanner
            failure={classifyAuthFailure({ code: 'failed_to_load_clerk_js' })}
            onRetry={() => window.location.reload()}
          />
        </ClerkFailed>
        {/* Clerk loaded but the callback is still not done: offer a way out. */}
        {timedOut && (
          <ClerkLoaded>
            <AuthFallbackBanner
              failure={failureForKind(AUTH_FAILURE_KINDS.SERVICE_UNAVAILABLE)}
              onRetry={retryFromLogin}
            />
          </ClerkLoaded>
        )}
        <div style={{ marginTop: '0.5rem', opacity: 0, height: 0, overflow: 'hidden' }}>
          <AuthenticateWithRedirectCallback
            signInForceRedirectUrl={signInRedirect}
            signUpForceRedirectUrl={signUpRedirect}
          />
        </div>
      </div>
    </div>
  );
};

// Without a Clerk key main.jsx does not mount ClerkProvider, and ClerkFailed, ClerkLoaded and
// AuthenticateWithRedirectCallback throw outside of it. There is no OAuth callback to finish in
// that case (a stale or bookmarked link), so send the user to /login, which has the demo sign-in.
const SSOCallback = () => {
  const { isClerkConfigured } = useAuth();
  const [searchParams] = useSearchParams();

  if (!isClerkConfigured) {
    const redirectTo = sanitizeRedirectPath(searchParams.get('sign_in_force_redirect_url'));
    return <Navigate to={buildAuthPath('/login', redirectTo)} replace />;
  }
  return <ClerkSSOCallback />;
};

export default SSOCallback;
