import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Download,
  Trash2,
  Lock,
  X,
  Info,
} from 'lucide-react';
import {
  CONSENT_CATEGORIES,
  getConsentPreferences,
  updateConsentPreference,
  purgeAllUserData,
  getPrivacyAuditLogs,
} from '../../services/privacyConsentService.js';
import { useToast } from '../../context/ToastContext';

/**
 * PrivacyConsentCenterModal Component (#80)
 * Comprehensive privacy dashboard for managing consent preferences,
 * viewing audit history, navigating to secure exports, and executing account purges.
 */
const PrivacyConsentCenterModal = ({ isOpen, onClose }) => {
  const { toast } = useToast?.() || {};
  const navigate = useNavigate();
  const { user } = useAuth();

  const [preferences, setPreferences] = useState(() => getConsentPreferences());
  const [auditLogs, setAuditLogs] = useState(() => getPrivacyAuditLogs());
  const [activeTab, setActiveTab] = useState('consents'); // 'consents' | 'export_delete' | 'audit'
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmPurgeText, setConfirmPurgeText] = useState('');

  // Handle consent toggle
  const handleToggleConsent = (categoryId, currentValue, mandatory) => {
    if (mandatory) return;

    try {
      updateConsentPreference(categoryId, !currentValue, user?.id || 'anonymous');
      setPreferences(getConsentPreferences());
      setAuditLogs(getPrivacyAuditLogs());
      toast?.success?.(
        `${CONSENT_CATEGORIES[categoryId]?.title}: Consent ${!currentValue ? 'granted' : 'revoked'}.`
      );
    } catch (err) {
      toast?.error?.(err.message);
    }
  };

  // Handle full account deletion
  const handleExecutePurge = () => {
    if (confirmPurgeText.trim().toLowerCase() !== 'delete my data') {
      toast?.error?.('Please type "DELETE MY DATA" exactly to confirm.');
      return;
    }

    try {
      purgeAllUserData(user?.id || 'anonymous', { preserveAuditTrail: true });
      setIsDeleting(false);
      setConfirmPurgeText('');
      setPreferences(getConsentPreferences());
      setAuditLogs(getPrivacyAuditLogs());
      toast?.info?.('All your local records, vault items, and applications have been permanently purged.');
      onClose();
    } catch (err) {
      toast?.error?.(`Purge failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="privacy-modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="privacy-modal-container"
        style={{
          background: 'var(--bg-main, #0a0a0a)',
          color: 'var(--text-primary, #ffffff)',
          border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
          borderRadius: '1.25rem',
          maxWidth: '860px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.6rem',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-main, #38bdf8)',
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                Privacy & Consent Management Center
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                Granular consent enforcement, auditable controls, and DPDP-compliant data operations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Privacy Center"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '0 1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('consents')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'consents' ? 'var(--accent-main, #38bdf8)' : 'transparent'}`,
              color: activeTab === 'consents' ? 'var(--accent-main, #38bdf8)' : 'var(--text-secondary, #94a3b8)',
              fontWeight: activeTab === 'consents' ? '700' : '500',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Consent Preferences
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export_delete')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'export_delete' ? 'var(--accent-main, #38bdf8)' : 'transparent'}`,
              color: activeTab === 'export_delete' ? 'var(--accent-main, #38bdf8)' : 'var(--text-secondary, #94a3b8)',
              fontWeight: activeTab === 'export_delete' ? '700' : '500',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Data Export & Account Purge
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'audit' ? 'var(--accent-main, #38bdf8)' : 'transparent'}`,
              color: activeTab === 'audit' ? 'var(--accent-main, #38bdf8)' : 'var(--text-secondary, #94a3b8)',
              fontWeight: activeTab === 'audit' ? '700' : '500',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Security Audit Log ({auditLogs.length})
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* TAB 1: Consents */}
          {activeTab === 'consents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-main, #38bdf8)',
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Civic-Help-Setu enforces strict data minimization. Optional processing features require explicit opt-in and can be revoked at any time.
                </span>
              </div>

              {Object.values(CONSENT_CATEGORIES).map((category) => {
                const isGranted = !!preferences[category.id];

                return (
                  <div
                    key={category.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>
                          {category.title}
                        </h4>
                        {category.mandatory && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '0.25rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'var(--text-secondary, #94a3b8)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <Lock size={10} /> Mandatory
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>
                          &bull; Max Retention: {category.retentionDays} days
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: '1.4' }}>
                        {category.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={category.mandatory}
                      onClick={() => handleToggleConsent(category.id, isGranted, category.mandatory)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.5rem',
                        border: isGranted
                          ? '1px solid #4ade80'
                          : '1px solid rgba(255, 255, 255, 0.2)',
                        background: isGranted ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                        color: isGranted ? '#4ade80' : 'var(--text-secondary, #94a3b8)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: category.mandatory ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {category.mandatory ? 'Enforced' : isGranted ? 'Granted (Opt-In)' : 'Revoked (Opt-Out)'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Export & Delete */}
          {activeTab === 'export_delete' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Data Export Section */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.875rem',
                  border: '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Download size={18} color="var(--accent-main, #38bdf8)" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                    Create a Secure Personal Data Export
                  </h3>
                </div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: '1.5' }}>
                  Preview account-owned categories in the Privacy Centre. Recent authentication is required; the secure download link is account-bound, short-lived and single-use.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/privacy#privacy-centre');
                  }}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                  }}
                >
                  <Download size={15} />
                  <span>Open Privacy Centre</span>
                </button>
              </div>

              {/* Danger Zone: Account Purge */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.875rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Trash2 size={18} color="#f87171" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#f87171' }}>
                    Danger Zone: Irreversible Account Data Purge
                  </h3>
                </div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: '1.5' }}>
                  Permanently deletes all records across the digital vault, active application trackers, saved guides, offline cache, and conversational memory on this browser. This action cannot be reversed.
                </p>

                {!isDeleting ? (
                  <button
                    type="button"
                    onClick={() => setIsDeleting(true)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      padding: '0.55rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Initiate Full Account Purge</span>
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#fca5a5', fontWeight: '600' }}>
                      To confirm deletion, type <strong>DELETE MY DATA</strong> below:
                    </p>
                    <input
                      type="text"
                      placeholder="DELETE MY DATA"
                      value={confirmPurgeText}
                      onChange={(e) => setConfirmPurgeText(e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        width: '100%',
                        maxWidth: '300px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleExecutePurge}
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Confirm & Delete Everything
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDeleting(false);
                          setConfirmPurgeText('');
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Audit Log */}
          {activeTab === 'audit' && (
            <div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.825rem', color: 'var(--text-secondary, #94a3b8)' }}>
                Immutable security event log tracking authorization checks and consent changes. Credentials and document contents are strictly redacted.
              </p>

              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>
                  No security events recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {auditLogs.slice(0, 25).map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '700', color: 'var(--accent-main, #38bdf8)' }}>
                            {log.action}
                          </span>
                          <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem' }}>
                            Actor: {log.actorId}
                          </span>
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div style={{ color: 'var(--text-secondary, #cbd5e1)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>

                      <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentCenterModal;
