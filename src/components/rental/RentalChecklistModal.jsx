import { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckSquare,
  Square,
  Activity,
  Camera,
  Trash2,
  Printer,
  Save,
} from 'lucide-react';
import {
  readRentalChecklist,
  saveRentalChecklist,
  recordMeterReading,
  updateInventoryItem,
  deleteRentalChecklist,
  calculateTransitionReadiness,
} from '../../services/rentalChecklistStorage';
import { useToast } from '../../context/ToastContext';

export default function RentalChecklistModal({
  transition,
  isOpen,
  onClose,
  onOpenPrintReport,
  onStateChange,
}) {
  const { toast } = useToast();
  const modalRef = useRef(null);

  const [state, setState] = useState(() => readRentalChecklist(transition?.id));
  const latestReading = state?.meterReadings?.length > 0
    ? state.meterReadings[state.meterReadings.length - 1]
    : null;

  const [meterValue, setMeterValue] = useState(() => latestReading?.readingValue || '');
  const [meterDate, setMeterDate] = useState(() => latestReading?.readingDate || new Date().toISOString().slice(0, 10));
  const [meterConfirmed, setMeterConfirmed] = useState(() => latestReading?.jointConfirmed || false);
  const [meterNotes, setMeterNotes] = useState(() => latestReading?.notes || '');
  const [notes, setNotes] = useState(() => state?.notes || '');
  const [photoRefInputs, setPhotoRefInputs] = useState(() => {
    const initialPhotos = {};
    Object.entries(state?.inventoryStatus || {}).forEach(([itemId, val]) => {
      if (val.photoReference) initialPhotos[itemId] = val.photoReference;
    });
    return initialPhotos;
  });

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

  const readiness = calculateTransitionReadiness(transition, state);
  const meter = transition.meterReadingConfig;

  const handleToggleInstruction = (idx) => {
    const key = `inst-${idx}`;
    const nextCompleted = {
      ...state.completedInstructions,
      [key]: !state.completedInstructions[key],
    };
    const nextState = { ...state, completedInstructions: nextCompleted };
    const res = saveRentalChecklist(transition.id, nextState, state.rev);
    if (res.success) {
      setState(res.data);
      onStateChange?.(res.data);
    } else {
      toast?.error?.('Failed to save checklist state: conflict detected.');
    }
  };

  const handleSaveMeterReading = (e) => {
    e.preventDefault();
    if (!meterValue.trim()) {
      toast?.error?.('Please enter a meter reading value.');
      return;
    }

    const readingData = {
      id: `reading-${transition.category}-${Date.now()}`,
      meterType: meter.meterType || 'electricity',
      readingValue: meterValue.trim(),
      unit: meter.unit || 'units',
      readingDate: meterDate,
      jointConfirmed: meterConfirmed,
      notes: meterNotes.trim(),
    };

    const res = recordMeterReading(transition.id, readingData);
    if (res.success) {
      setState(res.data);
      onStateChange?.(res.data);
      toast?.success?.('Dated meter reading recorded successfully in local checklist.');
    } else {
      toast?.error?.('Failed to record meter reading.');
    }
  };

  const handleToggleInventory = (itemId) => {
    const currentChecked = Boolean(state.inventoryStatus[itemId]?.checked);
    const photoRef = photoRefInputs[itemId] || null;
    const res = updateInventoryItem(transition.id, itemId, !currentChecked, photoRef);
    if (res.success) {
      setState(res.data);
      onStateChange?.(res.data);
    }
  };

  const handleSavePhotoRef = (itemId) => {
    const currentChecked = Boolean(state.inventoryStatus[itemId]?.checked);
    const photoRef = photoRefInputs[itemId] || null;
    const res = updateInventoryItem(transition.id, itemId, currentChecked, photoRef);
    if (res.success) {
      setState(res.data);
      onStateChange?.(res.data);
      toast?.success?.('Local photo reference recorded.');
    }
  };

  const handleSaveNotes = () => {
    const res = saveRentalChecklist(transition.id, { ...state, notes }, state.rev);
    if (res.success) {
      setState(res.data);
      onStateChange?.(res.data);
      toast?.success?.('Handover notes saved.');
    }
  };

  const handleDeleteData = () => {
    if (window.confirm('Permanently delete all saved checklist data, meter readings, and notes for this transition?')) {
      deleteRentalChecklist(transition.id);
      const resetState = readRentalChecklist(transition.id);
      setState(resetState);
      setMeterValue('');
      setNotes('');
      setPhotoRefInputs({});
      onStateChange?.(resetState);
      toast?.success?.('Transition checklist data cleared.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-checklist-modal-title"
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
          maxWidth: '850px',
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
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-main)' }}>
              Interactive Civic Transition Checklist
            </span>
            <h3
              id="rental-checklist-modal-title"
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0.2rem 0 0 0',
              }}
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
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Readiness Progress Header */}
        <div style={{ padding: '0.85rem 1.5rem', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Checklist Completion:</span>
            <span style={{ fontWeight: 700, color: readiness.score === 100 ? '#16a34a' : 'var(--text-primary)' }}>
              {readiness.score}% ({readiness.completedCount} of {readiness.totalItems} requirements complete)
            </span>
          </div>
          <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${readiness.score}%`,
                backgroundColor: readiness.score === 100 ? '#16a34a' : 'var(--accent-main)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
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
          {/* Privacy Note */}
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong>Local Browser Storage:</strong> Your readings, inventory checks, and private photo references stay strictly in your browser. No personal data leaves your device.
          </div>

          {/* Meter Reading Form if applicable */}
          {meter?.isApplicable && (
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Activity size={18} color="var(--accent-main)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Record Dated {meter.meterType?.toUpperCase()} Meter Reading
                </h4>
              </div>

              <form onSubmit={handleSaveMeterReading} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label htmlFor="meter-val-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Cumulative Reading ({meter.unit}) *
                    </label>
                    <input
                      id="meter-val-input"
                      type="text"
                      placeholder={`e.g. 15420.5`}
                      value={meterValue}
                      onChange={(e) => setMeterValue(e.target.value)}
                      className="input"
                      style={{ width: '100%', padding: '0.5rem' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="meter-date-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Date of Reading *
                    </label>
                    <input
                      id="meter-date-input"
                      type="date"
                      value={meterDate}
                      onChange={(e) => setMeterDate(e.target.value)}
                      className="input"
                      style={{ width: '100%', padding: '0.5rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="meter-notes-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Meter Serial No. / Sub-division Notes
                  </label>
                  <input
                    id="meter-notes-input"
                    type="text"
                    placeholder="e.g. Meter Serial 2024-BES-912, noted with landlord"
                    value={meterNotes}
                    onChange={(e) => setMeterNotes(e.target.value)}
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={meterConfirmed}
                      onChange={(e) => setMeterConfirmed(e.target.checked)}
                    />
                    <span>Mutually verified / acknowledged with landlord or tenant</span>
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Save size={14} />
                    <span>Save Meter Reading</span>
                  </button>
                </div>
              </form>

              {state.meterReadings.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Recorded Reading:</strong> {state.meterReadings[state.meterReadings.length - 1].readingValue} {meter.unit} on {state.meterReadings[state.meterReadings.length - 1].readingDate}
                  {state.meterReadings[state.meterReadings.length - 1].jointConfirmed && ' (Mutual confirmation certified)'}
                </div>
              )}
            </div>
          )}

          {/* Official Instructions Checklist */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>
              Official Instructions Step-by-Step
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {transition.officialInstructions.map((inst, idx) => {
                const key = `inst-${idx}`;
                const isChecked = Boolean(state.completedInstructions[key]);

                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleInstruction(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-main)',
                      border: isChecked ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ marginTop: '0.1rem', color: isChecked ? '#16a34a' : 'var(--text-tertiary)' }}>
                      {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        lineHeight: 1.45,
                        color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                      }}
                    >
                      {inst}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Handover Inventory & Optional Photo References */}
          {Array.isArray(transition.handoverInventory) && transition.handoverInventory.length > 0 && (
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                Handover Inventory &amp; Private Photo References
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Track fixtures, keys, and meters. Optional photo filenames link local files on your machine without storing files online.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {transition.handoverInventory.map((item) => {
                  const isChecked = Boolean(state.inventoryStatus[item.id]?.checked);
                  const currentPhotoRef = photoRefInputs[item.id] || '';

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div
                        onClick={() => handleToggleInventory(item.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      >
                        <div style={{ color: isChecked ? '#16a34a' : 'var(--text-tertiary)' }}>
                          {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.label}
                        </span>
                        {item.requiredForMoveOut && (
                          <span style={{ fontSize: '0.7rem', color: '#ca8a04', backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            Required Handover
                          </span>
                        )}
                      </div>

                      {/* Photo Reference Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', paddingLeft: '1.75rem' }}>
                        <Camera size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                        <input
                          type="text"
                          placeholder="e.g. meter_closeup_20260214.jpg (private local reference)"
                          value={currentPhotoRef}
                          onChange={(e) => setPhotoRefInputs({ ...photoRefInputs, [item.id]: e.target.value })}
                          className="input"
                          style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePhotoRef(item.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          Save Ref
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Textarea */}
          <div>
            <label htmlFor="rental-notes-area" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Handover Remarks &amp; Mutual Notes
            </label>
            <textarea
              id="rental-notes-area"
              rows={3}
              placeholder="Record any notes regarding sub-division receipts, deposit return references, or key handover timings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea"
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Save size={14} />
                <span>Save Remarks</span>
              </button>
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
          <button
            type="button"
            onClick={handleDeleteData}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem',
            }}
          >
            <Trash2 size={15} />
            <span>Delete My Checklist Data</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onOpenPrintReport?.(transition, state, readiness)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Printer size={15} />
              <span>Print Handover Summary</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary btn-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
