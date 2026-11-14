import { useEffect, useRef } from 'react';
import {
  X,
  Building2,
  ExternalLink,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { safeHttpUrl } from '../../utils/safeContent';
import {
  TRANSITION_CATEGORY_LABELS,
  WORKFLOW_STAGE_LABELS,
} from '../../data/rentalTransitionContract';

export default function RentalDetailModal({
  transition,
  isOpen,
  onClose,
  onOpenChecklist,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transition) return null;

  const officialUrl = safeHttpUrl(transition.sourceUrl);
  const audit = transition.auditMetadata || {};
  const meter = transition.meterReadingConfig;
  const isMoveIn = transition.stage === 'move_in';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-detail-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-main)',
          borderRadius: '1.25rem',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  backgroundColor: isMoveIn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: isMoveIn ? '#16a34a' : '#ca8a04',
                }}
              >
                {WORKFLOW_STAGE_LABELS[transition.stage] || transition.stage}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(14, 165, 233, 0.12)',
                  color: 'var(--accent-main)',
                }}
              >
                {TRANSITION_CATEGORY_LABELS[transition.category] || transition.category}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-main)',
                }}
              >
                {transition.jurisdiction?.level?.toUpperCase()}
              </span>
            </div>

            <h3
              id="rental-detail-modal-title"
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {transition.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              <Building2 size={15} style={{ flexShrink: 0 }} />
              <span>{transition.authority}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Neutral Civic Disclaimer */}
          <div
            role="note"
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
            }}
          >
            <strong>Neutral Civic Transition Notice:</strong> This checklist focuses strictly on public-service utility accounts, dated meter readings, and statutory address updates. Civic Help Setu does not arbitrate contractual security deposit disputes or private landlord-tenant monetary deductions.
          </div>

          {/* Turnaround / SLA Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Turnaround Time &amp; Statutory Processing SLA
            </h4>
            {transition.turnaroundSchedule?.isUnavailable ? (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <HelpCircle size={18} color="#ca8a04" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Explicit Unavailable State:</strong> {transition.turnaroundSchedule.unavailableReason}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <Clock size={16} color="var(--accent-main)" />
                <span>Standard Turnaround: <strong>{transition.turnaroundSchedule?.workingDays} working days</strong> from application submission.</span>
              </div>
            )}
          </div>

          {/* Meter Reading Config */}
          {meter?.isApplicable && (
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <Activity size={16} color="var(--accent-main)" />
                Dated Meter Reading Requirements
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                This transition requires capturing the cumulative {meter.meterType} reading in <strong>{meter.unit}</strong>.
                {meter.requiresJointConfirmation && ' Mutual acknowledgment between outgoing and incoming occupants (or property manager) is recommended to certify the baseline.'}
              </p>
            </div>
          )}

          {/* Verbatim Official Instructions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <FileText size={18} color="var(--accent-main)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Verbatim Official Instructions (From Governing Authority)
              </h4>
            </div>

            <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {transition.officialInstructions.map((inst, idx) => (
                <li key={idx}>
                  <span>{inst}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Editorial Civic Guidance Notes */}
          {Array.isArray(transition.editorialNotes) && transition.editorialNotes.length > 0 && (
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--accent-main)', color: '#ffffff' }}>
                  Editorial Tip
                </span>
                <h5 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Civic Help Setu Advisory Recommendations
                </h5>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {transition.editorialNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Provenance & Audit Metadata */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.75rem', border: '1px solid var(--border-light)', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-tertiary)' }}>Effective Date</span>
              <span style={{ color: 'var(--text-primary)' }}>{audit.effectiveDate}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-tertiary)' }}>Last Audited Date</span>
              <span style={{ color: 'var(--text-primary)' }}>{audit.lastVerified}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-tertiary)' }}>Audited By</span>
              <span style={{ color: 'var(--text-primary)' }}>{audit.verifiedBy}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-tertiary)' }}>Official Source Link</span>
              {officialUrl ? (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-main)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  Verify Portal
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span>No link</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-main)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Visit Authority Portal</span>
              <ExternalLink size={14} />
            </a>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChecklist(transition);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CheckCircle2 size={16} />
              <span>Open Transition Checklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
