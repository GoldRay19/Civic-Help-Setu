import { useState, useEffect, useCallback } from 'react';
import { X, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function TenderCorrectionModal({
  tender,
  isOpen,
  onClose,
}) {
  const { toast } = useToast();
  const [correctionType, setCorrectionType] = useState('corrigendum_update');
  const [proposedDetails, setProposedDetails] = useState('');
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');
  const [contributorRole, setContributorRole] = useState('small_vendor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = useCallback(() => {
    setCorrectionType('corrigendum_update');
    setProposedDetails('');
    setOfficialSourceUrl('');
    setContributorRole('small_vendor');
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

  if (!isOpen || !tender) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (proposedDetails.trim().length < 10) {
      setErrorMsg('Please describe the correction with at least 10 characters.');
      return;
    }

    if (!officialSourceUrl.startsWith('https://')) {
      setErrorMsg('Official source URL must begin with https:// and point to a government or municipal portal.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tender-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId: tender.id,
          tenderRefNumber: tender.tenderRefNumber,
          correctionType,
          proposedDetails: proposedDetails.trim(),
          officialSourceUrl: officialSourceUrl.trim(),
          contributorRole,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setSubmissionResult(data);
        toast?.success?.('Correction submitted for admin verification.');
      } else {
        setErrorMsg(data.details?.join(' ') || data.error || 'Failed to submit correction.');
      }
    } catch {
      setErrorMsg('Network error submitting correction. Please check connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="animate-scale-up"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-main)',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
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
          }}
        >
          <div>
            <h3 id="correction-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Report Notice Update or Corrigendum
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              {tender.tenderRefNumber} — {tender.authority}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '0.35rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {submissionResult ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1rem' }}>
                <CheckCircle2 size={40} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                Submission Received for Admin Verification
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                {submissionResult.message}
              </p>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-main)', display: 'inline-block', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                Verification Seal: <strong>{submissionResult.verificationSeal}</strong>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Privacy Warning */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Strict Privacy &amp; Non-Bidding Policy:</strong> Do NOT submit personal Aadhaar, PAN, phone numbers, or proprietary bid quotes. Only official government portal notices and corrigenda are reviewed.
                </span>
              </div>

              {errorMsg && (
                <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.825rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  {errorMsg}
                </div>
              )}

              {/* Correction Type */}
              <div>
                <label htmlFor="correction-type" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Update Type
                </label>
                <select
                  id="correction-type"
                  value={correctionType}
                  onChange={(e) => setCorrectionType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-main)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="corrigendum_update">Corrigendum / Addendum Published</option>
                  <option value="date_correction">Submission Deadline / Pre-Bid Date Extension</option>
                  <option value="fee_or_emd_update">EMD / Fee Waiver Exemption Update</option>
                  <option value="eligibility_correction">Eligibility Criteria Clarification</option>
                </select>
              </div>

              {/* Proposed Details */}
              <div>
                <label htmlFor="proposed-details" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Details of the Corrigendum or Correction
                </label>
                <textarea
                  id="proposed-details"
                  rows={4}
                  value={proposedDetails}
                  onChange={(e) => setProposedDetails(e.target.value)}
                  placeholder="e.g. Corrigendum 2 published on GeM portal extending submission deadline to 15th December 2026."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-main)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Official Source URL */}
              <div>
                <label htmlFor="official-source-url" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Official Government / Portal URL (HTTPS required)
                </label>
                <input
                  id="official-source-url"
                  type="url"
                  value={officialSourceUrl}
                  onChange={(e) => setOfficialSourceUrl(e.target.value)}
                  placeholder="https://gem.gov.in/... or https://kppp.karnataka.gov.in/..."
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-main)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Contributor Role */}
              <div>
                <label htmlFor="contributor-role" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Your Role
                </label>
                <select
                  id="contributor-role"
                  value={contributorRole}
                  onChange={(e) => setContributorRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-main)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="small_vendor">Small Vendor / Prospective Bidder</option>
                  <option value="msme_entrepreneur">MSME Entrepreneur</option>
                  <option value="procurement_analyst">Procurement Auditor / Analyst</option>
                  <option value="citizen">Civic Tech Volunteer</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Notice Update'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
