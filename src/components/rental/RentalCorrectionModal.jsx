import { useState, useEffect, useCallback } from 'react';
import { X, Send, ShieldAlert, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function RentalCorrectionModal({
  transition,
  isOpen,
  onClose,
}) {
  const { toast } = useToast();
  const [proposedDetails, setProposedDetails] = useState('');
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = useCallback(() => {
    setProposedDetails('');
    setOfficialSourceUrl('');
    setSubmissionResult(null);
    setErrorMsg('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen || !transition) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (proposedDetails.trim().length < 10) {
      setErrorMsg('Please describe the correction with at least 10 characters.');
      return;
    }

    if (!officialSourceUrl.startsWith('https://')) {
      setErrorMsg('Official source URL must begin with https:// and point to a government or utility board portal.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rental-checklist-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transitionId: transition.id,
          proposedDetails: proposedDetails.trim(),
          officialSourceUrl: officialSourceUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details?.join(' ') || data.error || 'Submission failed');
      }

      setSubmissionResult(data);
      toast?.success?.('Correction submitted for administrator verification.');
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-correction-modal-title"
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
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-main)',
          borderRadius: '1.25rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          <div>
            <h3
              id="rental-correction-modal-title"
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Suggest Transition Correction or Report Portal Update
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              For {transition.title}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.4rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {submissionResult ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Correction Submitted for Verification
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Your correction has been queued for administrator moderation. All submissions are tested against official government gazettes and utility portals before going live.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={16} color="var(--accent-main)" />
                <span>Verification Seal: {submissionResult.seal}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                role="note"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: '0.5rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                }}
              >
                <ShieldAlert size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  <strong>Zero-PII Policy:</strong> Do not include Aadhaar, PAN, phone numbers, or private deposit dispute claims. Only submit statutory utility meter updates and official portal URLs.
                </span>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#dc2626',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div>
                <label
                  htmlFor="proposed-details"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}
                >
                  Describe the Correction or Updated Rule *
                </label>
                <textarea
                  id="proposed-details"
                  rows={4}
                  required
                  placeholder="e.g. BESCOM has updated their meter transfer procedure to mandate Form-6 online submission..."
                  value={proposedDetails}
                  onChange={(e) => setProposedDetails(e.target.value)}
                  className="textarea"
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label
                  htmlFor="official-source-url"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}
                >
                  Official Government / Utility Portal URL (HTTPS only) *
                </label>
                <input
                  id="official-source-url"
                  type="url"
                  required
                  placeholder="https://..."
                  value={officialSourceUrl}
                  onChange={(e) => setOfficialSourceUrl(e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-outline btn-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

