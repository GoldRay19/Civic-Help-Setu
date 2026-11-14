import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { WORKFLOW_STAGE_LABELS, TRANSITION_CATEGORY_LABELS } from '../../data/rentalTransitionContract';
import { minimizeForExternal } from '../../utils/dataMinimization';

export default function RentalPrintSummaryModal({
  transition,
  checklistState,
  readiness,
  isOpen,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !transition) return null;

  const handlePrint = () => {
    window.print();
  };

  const meter = transition.meterReadingConfig;
  const readings = checklistState?.meterReadings || [];
  const inventoryStatus = checklistState?.inventoryStatus || {};
  const instructions = transition.officialInstructions || [];
  const completed = checklistState?.completedInstructions || {};
  const sanitizedNotes = minimizeForExternal(checklistState?.notes || '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-print-report-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
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
        className="printable-rental-report"
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '92vh',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '2px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
              Civic Help Setu &bull; Transition Handover Summary
            </span>
            <h3
              id="rental-print-report-title"
              style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0 0', color: '#0f172a' }}
            >
              {transition.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.4rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content for Printing */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          {/* Metadata Block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.85rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div>
              <strong>Workflow Stage:</strong> {WORKFLOW_STAGE_LABELS[transition.stage]}
            </div>
            <div>
              <strong>Domain:</strong> {TRANSITION_CATEGORY_LABELS[transition.category]}
            </div>
            <div>
              <strong>Authority:</strong> {transition.authority}
            </div>
            <div>
              <strong>Jurisdiction:</strong> {transition.jurisdiction?.level?.toUpperCase()} ({transition.jurisdiction?.states?.join(', ') || 'All India'})
            </div>
          </div>

          {/* Meter Readings */}
          {meter?.isApplicable && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
                Utility Meter Readings ({meter.meterType?.toUpperCase()})
              </h4>
              {readings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {readings.map((r, i) => (
                    <div key={i} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.4rem', backgroundColor: '#ffffff' }}>
                      <div>
                        <strong>Reading:</strong> {r.readingValue} {r.unit} &bull; <strong>Date:</strong> {r.readingDate}
                      </div>
                      {r.jointConfirmed && (
                        <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                          &check; Mutually confirmed between parties
                        </div>
                      )}
                      {r.notes && <div style={{ fontSize: '0.8rem', color: '#475569' }}>Notes: {r.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>No meter reading recorded.</p>
              )}
            </div>
          )}

          {/* Official Instructions Progress */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
              Statutory Instruction Checklist ({readiness?.score || 0}% Complete)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {instructions.map((inst, idx) => {
                const isChecked = Boolean(completed[`inst-${idx}`]);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: isChecked ? '#16a34a' : '#94a3b8' }}>
                      {isChecked ? '[\u2713]' : '[ ]'}
                    </span>
                    <span style={{ color: isChecked ? '#0f172a' : '#64748b' }}>{inst}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Handover Inventory */}
          {Array.isArray(transition.handoverInventory) && transition.handoverInventory.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
                Handover Inventory Status
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {transition.handoverInventory.map((item) => {
                  const isChecked = Boolean(inventoryStatus[item.id]?.checked);
                  const photoRef = inventoryStatus[item.id]?.photoReference;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: isChecked ? '#16a34a' : '#94a3b8' }}>
                        {isChecked ? '[\u2713]' : '[ ]'}
                      </span>
                      <span>
                        {item.label}
                        {photoRef && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> (Photo: {photoRef})</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Handover Remarks */}
          {sanitizedNotes && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: '#0f172a' }}>
                Remarks &amp; Mutual Notes
              </h4>
              <p style={{ margin: 0, color: '#334155', whiteSpace: 'pre-wrap' }}>{sanitizedNotes}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: '0.5rem', padding: '0.65rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.78rem', color: '#64748b' }}>
            Report generated via Civic Help Setu for civic transition documentation. Not an arbitration instrument for private deposit or contractual dispute claims.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
