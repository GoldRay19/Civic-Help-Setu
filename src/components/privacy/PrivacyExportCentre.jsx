import { useMemo, useState } from 'react';
import { Download, LockKeyhole, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  buildPrivacyExportData,
  getExportableVaultMetadata,
  getPrivacyExportPreview,
  PRIVACY_EXPORT_CATEGORIES,
  PRIVACY_EXPORT_VERSION,
} from '../../services/privacyExportService';
import {
  isVaultAtRestEncrypted,
  unlockAtRestVault,
} from '../../services/vaultStorage';

const errorMessage = (code) => ({
  recent_authentication_required: 'For your security, sign out and sign back in before creating an export.',
  export_unavailable: 'A secure export link could not be created. Please try again.',
  download_expired: 'The download link expired. Create a new export to continue.',
  download_not_found: 'This download link is invalid or has already been used.',
  download_unavailable: 'The secure download could not be completed. Create a new export to continue.',
  not_configured: 'Secure exports are not configured on this server yet.',
}[code] || 'The secure export request failed. Please try again.');

const cardStyle = {
  padding: '1rem',
  border: '1px solid var(--border-light)',
  borderRadius: '0.75rem',
  background: 'var(--glass-bg)',
};

const PrivacyExportCentre = () => {
  const { user, getSessionToken } = useAuth();
  const [selected, setSelected] = useState(() => new Set(PRIVACY_EXPORT_CATEGORIES.map(({ id }) => id)));
  const [vaultRequest, setVaultRequest] = useState({ ownerId: null, selected: false, authorized: false, documents: [] });
  const [vaultPassphraseState, setVaultPassphraseState] = useState({ ownerId: null, value: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [vaultEncrypted] = useState(() => isVaultAtRestEncrypted());

  const isAccountSession = Boolean(user?.isClerk && getSessionToken);
  const selectedIds = useMemo(() => [...selected], [selected]);
  const preview = useMemo(() => {
    if (!user?.id) return null;
    try {
      return getPrivacyExportPreview(user);
    } catch {
      return null;
    }
  }, [user]);
  const vaultRequestForAccount = vaultRequest.ownerId === user?.id ? vaultRequest : null;
  const vaultSelected = Boolean(vaultRequestForAccount?.selected);
  const vaultAuthorized = Boolean(vaultRequestForAccount?.authorized);
  const vaultDocuments = vaultRequestForAccount?.documents || [];
  const vaultPassphrase = vaultPassphraseState.ownerId === user?.id ? vaultPassphraseState.value : '';

  const toggleCategory = (categoryId) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const authorizeVault = async () => {
    setError('');
    setNotice('');
    if (!vaultEncrypted) {
      setError('Vault export is available only when at-rest encryption is enabled.');
      return;
    }
    if (!vaultPassphrase) {
      setError('Enter your vault passphrase to authorize this separate export.');
      return;
    }
    setBusy(true);
    try {
      const documents = await unlockAtRestVault(vaultPassphrase);
      setVaultRequest({
        ownerId: user.id,
        selected: true,
        authorized: true,
        documents: getExportableVaultMetadata(documents, user.id),
      });
      setVaultPassphraseState({ ownerId: user.id, value: '' });
      setNotice('Vault unlocked. Only document metadata can be included; file contents and document numbers remain excluded.');
    } catch {
      setVaultRequest({ ownerId: user.id, selected: true, authorized: false, documents: [] });
      setError('The vault could not be unlocked. Check the passphrase and try again.');
    } finally {
      setBusy(false);
    }
  };

  const readError = async (response) => {
    try {
      return errorMessage((await response.json()).error || '');
    } catch {
      return errorMessage('');
    }
  };

  const downloadExport = async () => {
    setError('');
    setNotice('');
    if (!isAccountSession) {
      setError('A verified Clerk account is required for secure exports.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Select at least one data category to export.');
      return;
    }
    if (vaultSelected && !vaultAuthorized) {
      setError('Unlock the encrypted vault and confirm its separate export authorization first.');
      return;
    }

    setBusy(true);
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) throw new Error('missing_session_token');
      const body = {
        action: 'create',
        categories: selectedIds,
        data: buildPrivacyExportData(user.id, selectedIds, {
          vaultDocuments: vaultSelected ? vaultDocuments : [],
          vaultConsent: vaultSelected,
          vaultAuthorized,
        }),
        vaultConsent: vaultSelected,
        vaultAuthorization: vaultSelected && vaultAuthorized,
      };
      const createResponse = await fetch('/api/privacy-exports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!createResponse.ok) {
        setError(await readError(createResponse));
        return;
      }

      const { downloadUrl, downloadToken } = await createResponse.json();
      const downloadResponse = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'X-Privacy-Export-Token': downloadToken,
        },
      });
      if (!downloadResponse.ok) {
        setError(await readError(downloadResponse));
        return;
      }
      const exportBlob = await downloadResponse.blob();
      const objectUrl = URL.createObjectURL(exportBlob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `civic-help-setu-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setNotice('Your versioned JSON export was downloaded. Its secure link has been consumed and cannot be reused.');
    } catch {
      setError('The secure export could not be completed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="privacy-centre" aria-labelledby="privacy-export-title" style={{ ...cardStyle, margin: '2rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <ShieldCheck size={23} color="var(--accent-main)" aria-hidden="true" />
        <div>
          <h2 id="privacy-export-title" style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
            Privacy Centre: secure data export
          </h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Preview your account-owned data, choose categories, and create a versioned JSON export. Export links expire in five minutes and work once for your signed-in account.
          </p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <LockKeyhole size={17} color="var(--accent-main)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Recent sign-in is required. Passwords, tokens, vault passphrases, document numbers and vault file contents are never exported. Older browser records without an account owner are excluded rather than attributed to the current account.
        </p>
      </div>

      {!isAccountSession && (
        <div role="status" style={{ ...cardStyle, marginBottom: '1rem' }}>
          Secure exports require a signed-in Clerk account. <Link to="/login?redirectTo=%2Fprivacy">Sign in</Link> to continue.
        </div>
      )}
      {user?.id && !preview && (
        <div role="alert" style={{ marginTop: '1rem', color: '#ef4444' }}>
          Your account-owned export preview could not be loaded from this browser.
        </div>
      )}

      {preview && (
        <>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: '0 0 0.75rem' }}>
            Schema version {PRIVACY_EXPORT_VERSION} · {preview.totalRecords} previewable records · No profile identifiers are sent from the browser; the server resolves the authenticated profile.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {preview.categories.map((category) => (
              <article key={category.id} style={cardStyle}>
                <label style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selected.has(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    aria-label={`Include ${category.title}`}
                    disabled={!isAccountSession || busy}
                  />
                  <span style={{ flex: 1 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{category.title}</strong>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                      {category.description}
                    </span>
                  </span>
                  <span aria-label={`${category.count} records`} style={{ fontWeight: 700, color: 'var(--accent-main)' }}>
                    {category.count}
                  </span>
                </label>
                <details style={{ marginTop: '0.75rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--accent-main)', fontSize: '0.8rem' }}>Preview records</summary>
                  {category.preview.length ? (
                    <pre style={{ maxHeight: '160px', overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {JSON.stringify(category.preview, null, 2)}
                    </pre>
                  ) : (
                    <p style={{ marginBottom: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                      No account-owned records in this category.
                    </p>
                  )}
                </details>
              </article>
            ))}
          </div>

          <div style={{ ...cardStyle, marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: vaultEncrypted ? 'pointer' : 'not-allowed' }}>
              <input
                type="checkbox"
                checked={vaultSelected}
                disabled={!vaultEncrypted || !isAccountSession || busy}
                onChange={(event) => {
                  setVaultRequest({
                    ownerId: user?.id,
                    selected: event.target.checked,
                    authorized: false,
                    documents: [],
                  });
                  setError('');
                }}
              />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Separately consent to vault metadata</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                  {vaultEncrypted
                    ? 'Optional and off by default. You must unlock your encrypted vault again. Only document type, category, issuer, dates and verification status are eligible.'
                    : 'Unavailable until at-rest vault encryption is enabled. Vault documents remain excluded.'}
                </span>
              </span>
            </label>
            {vaultSelected && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={vaultPassphrase}
                  onChange={(event) => setVaultPassphraseState({ ownerId: user?.id, value: event.target.value })}
                  aria-label="Vault passphrase"
                  placeholder="Re-enter vault passphrase"
                  disabled={vaultAuthorized || busy}
                />
                <button type="button" className="btn btn-secondary" onClick={authorizeVault} disabled={busy || vaultAuthorized}>
                  {vaultAuthorized ? 'Vault authorized' : 'Unlock to authorize'}
                </button>
                {vaultAuthorized && <span role="status">{vaultDocuments.length} metadata records eligible</span>}
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div role="alert" style={{ marginTop: '1rem', color: '#ef4444', display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <AlertCircle size={16} aria-hidden="true" /> {error}
        </div>
      )}
      {notice && (
        <div role="status" style={{ marginTop: '1rem', color: '#10b981', display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <CheckCircle2 size={16} aria-hidden="true" /> {notice}
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={downloadExport}
        disabled={!isAccountSession || busy || selected.size === 0 || (vaultSelected && !vaultAuthorized)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}
      >
        <Download size={17} aria-hidden="true" />
        {busy ? 'Preparing secure export…' : 'Create secure JSON export'}
      </button>
    </section>
  );
};

export default PrivacyExportCentre;
