import { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  Printer,
  Trash2,
  ShieldCheck,
  Save,
} from 'lucide-react';
import {
  readTenderChecklist,
  saveTenderChecklist,
  deleteTenderChecklist,
  calculateReadinessScore,
} from '../../services/tenderChecklistStorage';
import { useToast } from '../../context/ToastContext';

export default function TenderEvidenceChecklistModal({
  tender,
  isOpen,
  onClose,
  onPrintReport,
  initialChecklistState = null,
}) {
  const { toast } = useToast();
  const [checklistData, setChecklistData] = useState(
    () => initialChecklistState || (tender?.id ? readTenderChecklist(tender.id) : null)
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !tender || !checklistData) return null;

  const mandatory = tender.eligibilityCriteria?.mandatory || [];
  const readiness = calculateReadinessScore(tender, checklistData);

  const handleStatusChange = (reqId, newStatus) => {
    setChecklistData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [reqId]: {
          ...(prev.items[reqId] || {}),
          status: newStatus,
        },
      },
    }));
  };

  const handleDocRefChange = (reqId, docRef) => {
    setChecklistData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [reqId]: {
          ...(prev.items[reqId] || {}),
          documentRef: docRef,
        },
      },
    }));
  };

  const handleNotesChange = (reqId, notes) => {
    setChecklistData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [reqId]: {
          ...(prev.items[reqId] || {}),
          notes,
        },
      },
    }));
  };

  const handleMsmeToggle = (key, value) => {
    setChecklistData((prev) => ({
      ...prev,
      msmeStatus: {
        ...prev.msmeStatus,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const result = saveTenderChecklist(tender.id, checklistData, checklistData.rev);
    setIsSaving(false);

    if (result.ok) {
      setChecklistData(result.state);
      toast?.success?.('Readiness checklist saved locally in your browser.');
    } else if (result.reason === 'conflict') {
      toast?.error?.('Checklist was updated in another browser tab. Please reload.');
      setChecklistData(result.state);
    } else {
      toast?.error?.('Failed to save checklist state.');
    }
  };

  const handleDelete = () => {
    const ok = deleteTenderChecklist(tender.id);
    if (ok) {
      const resetState = readTenderChecklist(tender.id);
      setChecklistData(resetState);
      setShowDeleteConfirm(false);
      toast?.success?.('All saved checklist and evidence notes deleted permanently.');
    } else {
      toast?.error?.('Could not delete checklist data.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
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
        className="animate-scale-up"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-main)',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '850px',
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
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <FileCheck2 size={20} color="var(--accent-main)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-main)', textTransform: 'uppercase' }}>
                Vendor Readiness Evidence Checklist (#722)
              </span>
            </div>
            <h2 id="checklist-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {tender.title}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
              Ref: {tender.tenderRefNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close checklist modal"
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

        {/* Readiness Score Banner */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--bg-main)',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
              Participation Readiness Index
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: readiness.score === 100 ? '#10b981' : readiness.score >= 50 ? '#f59e0b' : '#ef4444',
                }}
              >
                {readiness.score}%
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                ({readiness.completedCount} of {readiness.totalMandatory} Mandatory Proofs Prepared)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onPrintReport(tender, checklistData, readiness)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            >
              <Printer size={14} />
              <span>Print Readiness Report</span>
            </button>
          </div>
        </div>

        {/* Scrollable Checklist Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* MSME & Preference Toggles */}
          <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-main)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--accent-main)" />
              Vendor Category &amp; Exemption Declarations
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklistData.msmeStatus.isClaimingMsmeExemption}
                  onChange={(e) => handleMsmeToggle('isClaimingMsmeExemption', e.target.checked)}
                  style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent-main)' }}
                />
                <span>Claiming MSME EMD / Tender Fee Exemption under GFR 170 (UDYAM Certificate)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklistData.msmeStatus.isDpiitStartup}
                  onChange={(e) => handleMsmeToggle('isDpiitStartup', e.target.checked)}
                  style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent-main)' }}
                />
                <span>DPIIT Recognized Startup (Relaxation in prior turnover &amp; experience)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklistData.msmeStatus.isClass1LocalSupplier}
                  onChange={(e) => handleMsmeToggle('isClass1LocalSupplier', e.target.checked)}
                  style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent-main)' }}
                />
                <span>Class-I Local Supplier (Make in India local content ≥ 50%)</span>
              </label>
            </div>
          </div>

          {/* Mandatory Evidence Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Mandatory Evidence Requirements
            </h4>

            {mandatory.map((req) => {
              const item = checklistData.items[req.id] || { status: 'not_started', notes: '', documentRef: '' };

              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid var(--border-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {req.label}
                      </span>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Proof Required:</strong> {req.evidenceRequired}
                      </p>
                    </div>

                    {/* Status Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label htmlFor={`status-${req.id}`} style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Status:
                      </label>
                      <select
                        id={`status-${req.id}`}
                        value={item.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-main)',
                          backgroundColor: 'var(--bg-surface)',
                          color:
                            item.status === 'ready'
                              ? '#10b981'
                              : item.status === 'exempt'
                              ? 'var(--accent-main)'
                              : item.status === 'in_progress'
                              ? '#f59e0b'
                              : 'var(--text-secondary)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready &amp; Verified</option>
                        <option value="exempt">Exempt (MSME/Startup)</option>
                      </select>
                    </div>
                  </div>

                  {/* Document Reference & Notes Input */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label htmlFor={`doc-${req.id}`} style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                        Your File Name / Docket Ref (e.g. GST_Oct2026.pdf)
                      </label>
                      <input
                        id={`doc-${req.id}`}
                        type="text"
                        value={item.documentRef || ''}
                        onChange={(e) => handleDocRefChange(req.id, e.target.value)}
                        placeholder="Reference note only (no files uploaded)"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-main)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label htmlFor={`notes-${req.id}`} style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                        Internal Vendor Preparation Notes
                      </label>
                      <input
                        id={`notes-${req.id}`}
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleNotesChange(req.id, e.target.value)}
                        placeholder="e.g. CA certified with UDIN on 10th Nov"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-main)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy Note */}
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--glass-bg)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-tertiary)', border: '1px solid var(--border-light)' }}>
            🔒 <strong>Vendor Privacy Guarantee:</strong> All checklist entries and notes are stored strictly in your browser&apos;s local storage. Civic Help Setu never transmits or uploads your file references, notes, or business documents.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Trash2 size={14} />
                <span>Delete My Checklist Data</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Confirm permanent wipe?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn btn-sm"
                  style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.85rem' }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving...' : 'Save Checklist State'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
