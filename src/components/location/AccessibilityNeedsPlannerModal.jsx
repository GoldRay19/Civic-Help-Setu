import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Save,
  Phone,
  Accessibility,
  Building,
  CheckSquare,
  Square,
  AlertTriangle,
  Printer,
  Trash2,
} from 'lucide-react';
import { CIVIC_OFFICES } from '../../data/locationOffices.js';
import {
  getOfficeAccessibilityProfile,
  buildPersonalVisitChecklist,
  savePersonalVisitPlan,
  loadPersonalVisitPlan,
  deletePersonalVisitPlan,
  exportVisitPlanSummary,
} from '../../services/accessibilityPlannerService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { safeHttpUrl } from '../../utils/safeContent';
import './AccessibilityNeedsPlannerModal.css';

const AccessibilityNeedsPlannerModal = ({ isOpen, onClose, initialOfficeId = null }) => {
  const { toast } = useToast();
  const [selectedOfficeId, setSelectedOfficeId] = useState(
    initialOfficeId || CIVIC_OFFICES[0]?.id || 'delhi-south-collectorate'
  );

  const [neededFeatureIds, setNeededFeatureIds] = useState([]);
  const [confirmedQuestionIds, setConfirmedQuestionIds] = useState([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);

  // On open or initialOfficeId change
  useEffect(() => {
    if (initialOfficeId) {
      setSelectedOfficeId(initialOfficeId);
    }
  }, [initialOfficeId]);

  // Load saved plan for selected office
  useEffect(() => {
    if (!selectedOfficeId) return;
    const saved = loadPersonalVisitPlan(selectedOfficeId);
    setNeededFeatureIds(Array.isArray(saved?.neededFeatureIds) ? saved.neededFeatureIds : []);
    setConfirmedQuestionIds(Array.isArray(saved?.confirmedQuestionIds) ? saved.confirmedQuestionIds : []);
    setConsentGiven(Boolean(saved));
    setHasSavedPlan(Boolean(saved));
  }, [selectedOfficeId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const profile = useMemo(() => {
    return getOfficeAccessibilityProfile(selectedOfficeId);
  }, [selectedOfficeId]);

  const visitChecklist = useMemo(() => {
    const cl = buildPersonalVisitChecklist(selectedOfficeId, neededFeatureIds);
    return {
      ...cl,
      questionsToConfirm: cl.questionsToConfirm.map((q) => ({
        ...q,
        confirmed: confirmedQuestionIds.includes(q.featureId),
      })),
    };
  }, [selectedOfficeId, neededFeatureIds, confirmedQuestionIds]);
  const printableNote = useMemo(() => exportVisitPlanSummary(visitChecklist), [visitChecklist]);

  if (!isOpen) return null;

  const handleToggleNeed = (featureId) => {
    setNeededFeatureIds((current) =>
      current.includes(featureId)
        ? current.filter((id) => id !== featureId)
        : [...current, featureId]
    );
  };

  const handleToggleQuestionConfirmed = (featureId) => {
    setConfirmedQuestionIds((current) =>
      current.includes(featureId)
        ? current.filter((id) => id !== featureId)
        : [...current, featureId]
    );
  };

  const handleConsentChange = (event) => {
    const granted = event.target.checked;
    if (!granted && hasSavedPlan) {
      if (!deletePersonalVisitPlan(selectedOfficeId)) {
        toast.error('Could not remove the saved plan while withdrawing consent.');
        return;
      }
      setNeededFeatureIds([]);
      setConfirmedQuestionIds([]);
      setHasSavedPlan(false);
    }
    setConsentGiven(granted);
  };

  const handleSavePlan = () => {
    const ok = savePersonalVisitPlan(selectedOfficeId, {
      neededFeatureIds,
      confirmedQuestionIds,
      officeName: profile.office?.name,
    }, undefined, consentGiven);
    if (ok) {
      setHasSavedPlan(true);
      toast.success('Accessibility visit plan saved locally.');
    } else {
      toast.error(consentGiven ? 'Failed to save visit plan.' : 'Give consent to save this plan on this device.');
    }
  };

  const handleDeletePlan = () => {
    if (deletePersonalVisitPlan(selectedOfficeId)) {
      setNeededFeatureIds([]);
      setConfirmedQuestionIds([]);
      setConsentGiven(false);
      setHasSavedPlan(false);
      toast.success('Saved visit plan deleted from this device.');
    } else {
      toast.error('Could not delete the saved visit plan.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-planner-title"
      className="accessibility-planner-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card accessibility-planner-dialog"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card, #131b2e)',
          border: '1px solid var(--border-main)',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--glass-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
              }}
            >
              <Accessibility size={22} />
            </div>
            <div>
              <h2
                id="accessibility-planner-title"
                style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}
              >
                Public-Service Accessibility Needs Planner
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Choose practical visit requests, check what is verified, and prepare a private note without sharing a diagnosis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close accessibility planner"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.35rem',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', flex: 1 }}>
          {/* Office Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="accessibility-office-select"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}
            >
              <Building size={16} color="var(--accent-main)" />
              <span>Select Public Service Office:</span>
            </label>
            <select
              id="accessibility-office-select"
              className="input-field"
              value={selectedOfficeId}
              onChange={(e) => setSelectedOfficeId(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
            >
              {CIVIC_OFFICES.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name} ({office.city}, {office.state})
                </option>
              ))}
            </select>
          </div>

          {/* Audit Verification & Stale Warning Banners */}
          {profile.auditWarning && (
            <div
              style={{
                padding: '0.85rem 1rem',
                background: profile.isStale ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${profile.isStale ? 'rgba(234, 179, 8, 0.35)' : 'rgba(239, 68, 68, 0.25)'}`,
                borderRadius: '0.75rem',
                fontSize: '0.82rem',
                color: profile.isStale ? '#eab308' : '#ef4444',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>{profile.isStale ? 'Stale Audit Record Warning:' : 'Unverified Office Facility Notice:'}</strong>
                <div style={{ marginTop: '0.2rem', color: 'var(--text-secondary)' }}>{profile.auditWarning}</div>
              </div>
            </div>
          )}

          {/* Known Audit Metadata Bar */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--glass-bg)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.82rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Facility Audit Date: </span>
              <strong>{profile.lastAuditedDate ? profile.lastAuditedDate : 'Not Officially Audited'}</strong>
              {profile.auditedBy && (
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  by {profile.auditedBy}
                </span>
              )}
            </div>

            {profile.officialSource && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={15} color="var(--success)" />
                <span style={{ color: 'var(--text-tertiary)' }}>Source:</span>
                <a
                  href={safeHttpUrl(profile.officialSource.url) || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-main)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                >
                  {profile.officialSource.name}
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* Section: Known Accessibility Features */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Known Facility Accommodations (Verified vs Unverified)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Click checkbox to add to your personal visit confirmation list
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {profile.features.map((feature) => {
                const isNeeded = neededFeatureIds.includes(feature.id);
                const isVerifiedAvailable = feature.status === 'verified_available';
                const isVerifiedUnavailable = feature.status === 'verified_unavailable';
                const isNotVerified = feature.status === 'not_verified';

                return (
                  <label
                    key={feature.id}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '0.75rem',
                      background: isNeeded ? 'rgba(56, 189, 248, 0.08)' : 'var(--glass-bg)',
                      border: `1px solid ${isNeeded ? 'var(--accent-main)' : 'var(--border-light)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease',
                      color: 'inherit',
                      textAlign: 'left',
                      font: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={isNeeded}
                          onChange={() => handleToggleNeed(feature.id)}
                          aria-label={`Add ${feature.title} to the visit request`}
                        />
                        <span style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {feature.title}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '99px',
                          background: isVerifiedAvailable
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isVerifiedUnavailable
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(255, 255, 255, 0.08)',
                          color: isVerifiedAvailable
                            ? 'var(--success)'
                            : isVerifiedUnavailable
                            ? '#ef4444'
                            : 'var(--text-tertiary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {feature.statusLabel}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {feature.notes}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      Source:{' '}
                      {feature.source?.url && safeHttpUrl(feature.source.url) ? (
                        <a
                          href={safeHttpUrl(feature.source.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          style={{ color: 'var(--accent-main)' }}
                        >
                          {feature.source.name || feature.source.url}
                        </a>
                      ) : (
                        'Not verified'
                      )}
                      {' · Verification date: '}
                      {feature.verificationDate || 'Not verified'}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: Personal Visit Checklist & Direct Confirmation */}
          <div
            style={{
              background: 'var(--glass-bg)',
              borderRadius: '0.85rem',
              border: '1px solid var(--border-light)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Personal Pre-Visit Confirmation Checklist ({visitChecklist.questionsToConfirm.filter((q) => q.confirmed).length} of {visitChecklist.questionsToConfirm.length} confirmed)
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Call the office or check their portal to confirm unverified accommodations before travelling.
                </p>
              </div>

              {/* Direct Office Contact Button */}
              {visitChecklist.officialContacts.phone && (
                <a
                  href={`tel:${visitChecklist.officialContacts.phone.replace(/[^0-9+]/g, '')}`}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                  }}
                >
                  <Phone size={14} color="var(--success)" />
                  <span>Call Office ({visitChecklist.officialContacts.phone})</span>
                </a>
              )}
            </div>

            {/* Questions to confirm list */}
            {visitChecklist.questionsToConfirm.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Select one or more accommodation needs above to generate your pre-visit confirmation questions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem' }}>
                {visitChecklist.questionsToConfirm.map((q) => (
                  <div
                    key={q.featureId}
                    onClick={() => handleToggleQuestionConfirmed(q.featureId)}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0.6rem',
                      background: q.confirmed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${q.confirmed ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-light)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {q.confirmed ? (
                        <CheckSquare size={16} color="var(--success)" />
                      ) : (
                        <Square size={16} color="var(--text-tertiary)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.85rem', color: q.confirmed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {q.title}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: q.urgency === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: q.urgency === 'critical' ? '#ef4444' : '#eab308',
                            fontWeight: '700',
                          }}
                        >
                          {q.statusLabel}
                        </span>
                      </div>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Question to ask: </strong>"{q.question}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--glass-bg)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', flex: '1 1 300px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={handleConsentChange}
                aria-label="Consent to save my selected visit preferences on this device"
              />
              <span>
                I agree to save my selected preferences on this device. They are not sent to analytics
                or included in public profiles. This optional planner does not ask for a diagnosis.
              </span>
            </label>
            {hasSavedPlan && (
              <span role="status" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                A plan for this office is saved on this device.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                padding: '0.5rem 0.95rem',
              }}
            >
              <Printer size={15} />
              <span>Print Request Note</span>
            </button>

            {hasSavedPlan && (
              <button
                type="button"
                onClick={handleDeletePlan}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.95rem' }}
              >
                <Trash2 size={15} />
                <span>Delete Plan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSavePlan}
              className="btn btn-primary"
              disabled={!consentGiven}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                padding: '0.5rem 1.1rem',
              }}
            >
              <Save size={15} />
              <span>{hasSavedPlan ? 'Update Visit Plan' : 'Save Visit Plan'}</span>
            </button>
          </div>
        </div>
        <section className="accessibility-print-note" aria-hidden="true">
          <pre>{printableNote}</pre>
        </section>
      </div>
    </div>
  );
};

export default AccessibilityNeedsPlannerModal;
