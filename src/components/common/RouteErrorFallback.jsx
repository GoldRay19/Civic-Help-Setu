import { AlertTriangle } from 'lucide-react';

/**
 * Router-level errorElement. If a page throws while rendering, show this instead of React
 * Router's default "Unexpected Application Error!" screen.
 *
 * It renders outside the app providers (the error replaces them), so it uses plain English
 * text and plain links, and the home link does a full page load to start from a clean state.
 */
const RouteErrorFallback = () => (
  <div className="section flex-center" style={{ minHeight: '85vh', textAlign: 'center' }}>
    <div
      className="glass-panel"
      role="alert"
      style={{ padding: '2.5rem', maxWidth: '440px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
    >
      <AlertTriangle size={36} color="var(--accent-main)" aria-hidden="true" />
      <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Something went wrong</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
        This page ran into a problem and could not be shown. Try reloading, or head back to the home page.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/" className="btn btn-primary">Go to home</a>
        <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    </div>
  </div>
);

export default RouteErrorFallback;
