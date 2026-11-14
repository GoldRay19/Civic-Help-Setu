import { useState, useMemo, useSyncExternalStore } from 'react';
import AccessibleModal from '../common/AccessibleModal';
import {
  CheckSquare,
  Square,
  Trash2,
  Plus,
} from 'lucide-react';
import { createChecklistSession } from '../../services/checklistStorage';
import { buildWaterTankerChecklistItems } from '../../services/waterTankerService';
import { useToast } from '../../context/ToastContext';

export default function WaterTankerChecklistModal({
  isOpen,
  onClose,
  authority,
}) {
  const { toast } = useToast();
  const [customInput, setCustomInput] = useState('');

  const checklistId = authority ? `water_tanker_checklist_${authority.id}` : null;
  const initialItems = useMemo(() => buildWaterTankerChecklistItems(authority), [authority]);
  const [items, setItems] = useState(initialItems);

  const session = useMemo(() => {
    return createChecklistSession({ id: checklistId, items });
  }, [checklistId, items]);

  const { checked, status } = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState
  );

  if (!isOpen || !authority) return null;

  const handleToggle = (itemLabel) => {
    session.toggle(itemLabel);
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast?.warning?.('This checklist item already exists.');
      return;
    }
    setItems((prev) => [...prev, trimmed]);
    setCustomInput('');
    toast?.success?.('Task added to your local checklist.');
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to permanently delete and wipe your saved checklist data for this authority?')) {
      session.deleteChecklistData();
      toast?.info?.('Saved checklist data permanently cleared from your device.');
    }
  };

  const completedCount = checked?.length || 0;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delivery Readiness Checklist"
      subtitle={`${authority.name} • Sump & Access Readiness`}
      maxWidth="620px"
      ariaLabel="Water tanker delivery readiness checklist modal"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text, #0f172a)' }}>
              Readiness Progress ({completedCount} of {items.length} completed)
            </span>
            <span style={{ fontWeight: 700, color: 'var(--primary, #2563eb)' }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{ height: '8px', borderRadius: '999px', backgroundColor: 'var(--surface-raised, #e2e8f0)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: progressPercent === 100 ? 'var(--success, #16a34a)' : 'var(--primary, #2563eb)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Tab Sync / Conflict Notice */}
        {status === 'conflict' && (
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger, #ef4444)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span>Another tab saved checklist changes. Choose an action:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => session.reloadLatest()} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Reload Latest</button>
              <button type="button" onClick={() => session.overwrite()} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Overwrite</button>
            </div>
          </div>
        )}

        {/* Checklist items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
          {items.map((item, idx) => {
            const isChecked = checked?.includes(item);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleToggle(item)}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isChecked ? 'rgba(22, 163, 74, 0.3)' : 'var(--border-color, #e2e8f0)'}`,
                  backgroundColor: isChecked ? 'rgba(22, 163, 74, 0.05)' : 'var(--surface, #ffffff)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ marginTop: '0.15rem', color: isChecked ? 'var(--success, #16a34a)' : 'var(--text-tertiary, #94a3b8)' }}>
                  {isChecked ? <CheckSquare size={18} aria-hidden="true" /> : <Square size={18} aria-hidden="true" />}
                </div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: isChecked ? 'var(--text-secondary, #64748b)' : 'var(--text, #0f172a)',
                    textDecoration: isChecked ? 'line-through' : 'none',
                    lineHeight: 1.4,
                  }}
                >
                  {item}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add custom item form */}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add custom task (e.g. Call society guard for tanker gate entry)..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--surface, #ffffff)',
              fontSize: '0.85rem',
            }}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add</span>
          </button>
        </form>

        {/* Footer info & wipe data button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
          <button
            type="button"
            onClick={handleDeleteAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger, #dc2626)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Delete Saved Checklist Data</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}
