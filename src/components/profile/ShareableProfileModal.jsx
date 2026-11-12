import { useState } from 'react';
import {
  Share2,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import {
  createShareableProfile,
  revokeSharedProfile,
  getActiveShareForUser,
  getShareSecuritySummary,
  SHARE_EXPIRY_OPTIONS,
  SHARE_VIEW_PRESETS,
  MIN_PASSCODE_LENGTH,
} from '../../services/shareableProfileService';

function ShareableProfileModalBody({ onClose, currentUser, profileData }) {
  const userId = currentUser?.id || currentUser?.username || 'current-user';
  const [activeShare, setActiveShare] = useState(() => getActiveShareForUser(userId));
  const [expiry, setExpiry] = useState(() => activeShare?.expiryOption || SHARE_EXPIRY_OPTIONS.DAYS_7);
  const [accessPin, setAccessPin] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState(
    () =>
      activeShare?.visibility || {
        showFullName: true,
        showLocation: true,
        showCategory: true,
        showOccupation: false,
        showSavedServices: true,
        showApplicationMilestones: true,
        showReadinessScore: true,
      }
  );

  const handleCreateShare = () => {
    setFormError('');
    const trimmedPin = accessPin.trim();
    if (trimmedPin && trimmedPin.length < MIN_PASSCODE_LENGTH) {
      setFormError(`Passcode must be at least ${MIN_PASSCODE_LENGTH} characters (or leave blank).`);
      return;
    }

    try {
      if (activeShare?.token) {
        revokeSharedProfile(activeShare.token);
      }
      const parsedMaxViews = maxViews ? Number(maxViews) : null;
      const newShare = createShareableProfile(userId, profileData, {
        expiry,
        visibility,
        accessPin: trimmedPin || undefined,
        maxViews: parsedMaxViews,
      });
      setActiveShare(newShare);
      setAccessPin('');
    } catch (err) {
      setFormError(err.message || 'Unable to create share link.');
    }
  };

  const handleRevokeShare = () => {
    if (activeShare?.token) {
      revokeSharedProfile(activeShare.token);
      setActiveShare(null);
    }
  };

  const toggleVisibility = (key) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = activeShare ? `${origin}/shared-profile/${activeShare.token}` : '';
  const securitySummary = activeShare ? getShareSecuritySummary(activeShare) : null;

  const handleCopy = () => {
    if (!shareUrl || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem',
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '0.75rem',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Share2 className="w-5 h-5 text-indigo-500" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Privacy-Controlled Profile Sharing
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Shareable Profile Modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Security explanation banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#059669',
            fontSize: '0.825rem',
            marginBottom: '1.25rem',
          }}
        >
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>
            Private documents, identity numbers, and contact details are permanently excluded from all shared views, and free-text fields are scrubbed before SHA-256 sealing.
          </span>
        </div>

        {/* Active share view */}
        {activeShare ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Active Read-Only Share Link
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '0.375rem',
                    background: copied ? '#10b981' : 'var(--accent-main)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>
                  {activeShare.expiresAt
                    ? `Expires: ${new Date(activeShare.expiresAt).toLocaleDateString()}`
                    : 'No expiry set'}
                </span>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--accent-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  Preview Shared View <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Cryptographic integrity, PIN & quota status pills */}
              {securitySummary && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    marginTop: '0.85rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '99px',
                      background: securitySummary.integrityVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: securitySummary.integrityVerified ? '#059669' : '#dc2626',
                    }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {securitySummary.integrityVerified
                      ? `SHA-256 Sealed (${securitySummary.integrityFingerprint || 'verified'})`
                      : 'Integrity Warning'}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '99px',
                      background: securitySummary.pinProtected ? 'rgba(79, 70, 229, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                      color: securitySummary.pinProtected ? '#4f46e5' : 'var(--text-secondary)',
                    }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {securitySummary.pinProtected ? 'Passcode Protected' : 'Open Token Access'}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '99px',
                      background: 'rgba(14, 165, 233, 0.12)',
                      color: '#0284c7',
                    }}
                  >
                    {securitySummary.maxViews
                      ? `${securitySummary.viewsRemaining} of ${securitySummary.maxViews} views left`
                      : `${securitySummary.accessCount} view(s) • Unlimited`}
                  </span>
                </div>
              )}

              {securitySummary && securitySummary.accessLog.length > 0 && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <strong>Recent Link Activity:</strong>{' '}
                  {securitySummary.accessLog
                    .slice(-3)
                    .reverse()
                    .map((entry) => `${entry.outcome} (${new Date(entry.timestamp).toLocaleTimeString()})`)
                    .join(' · ')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleRevokeShare}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.45rem',
                  border: '1px solid #ef4444',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Trash2 className="w-4 h-4" />
                Revoke Access Immediately
              </button>

              <button
                type="button"
                onClick={handleCreateShare}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.45rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Link
              </button>
            </div>
          </div>
        ) : (
          /* Create New Share Flow */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                Select Section Visibility
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { key: 'showFullName', label: 'Full Name' },
                  { key: 'showLocation', label: 'State & District Location' },
                  { key: 'showCategory', label: 'Social Category' },
                  { key: 'showOccupation', label: 'Occupation' },
                  { key: 'showSavedServices', label: 'Saved Services Portfolio' },
                  { key: 'showApplicationMilestones', label: 'Active Application Progress' },
                  { key: 'showReadinessScore', label: 'Calculated Readiness Score' },
                ].map(({ key, label }) => {
                  const isVisible = visibility[key];
                  return (
                    <div
                      key={key}
                      onClick={() => toggleVisibility(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '0.45rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary, rgba(0,0,0,0.01))',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: isVisible ? '#10b981' : 'var(--text-secondary)',
                        }}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label
                  htmlFor="share-expiry-select"
                  style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}
                >
                  Link Expiry Window
                </label>
                <select
                  id="share-expiry-select"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.4rem',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value={SHARE_EXPIRY_OPTIONS.HOURS_24}>24 Hours</option>
                  <option value={SHARE_EXPIRY_OPTIONS.DAYS_7}>7 Days (Recommended)</option>
                  <option value={SHARE_EXPIRY_OPTIONS.DAYS_30}>30 Days</option>
                  <option value={SHARE_EXPIRY_OPTIONS.NEVER}>No Expiration</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="share-max-views-select"
                  style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}
                >
                  Maximum View Cap
                </label>
                <select
                  id="share-max-views-select"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.4rem',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">Unlimited Views</option>
                  <option value={String(SHARE_VIEW_PRESETS.SINGLE_USE)}>Single-Use (Burn After Read)</option>
                  <option value={String(SHARE_VIEW_PRESETS.FIVE_VIEWS)}>5 Views Max</option>
                  <option value={String(SHARE_VIEW_PRESETS.TEN_VIEWS)}>10 Views Max</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="share-access-pin"
                style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}
              >
                Optional Viewer Passcode (Salted SHA-256 Gate)
              </label>
              <input
                id="share-access-pin"
                type="password"
                value={accessPin}
                onChange={(e) => {
                  setAccessPin(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Optional 4+ char PIN (locks after 5 wrong tries)"
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.4rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {formError && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.4rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '0.45rem',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateShare}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.45rem',
                  background: 'var(--accent-main)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Share2 className="w-4 h-4" />
                Generate Privacy-Safe Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShareableProfileModal({
  isOpen,
  onClose,
  currentUser,
  profileData,
}) {
  if (!isOpen) return null;
  return (
    <ShareableProfileModalBody
      onClose={onClose}
      currentUser={currentUser}
      profileData={profileData}
    />
  );
}
