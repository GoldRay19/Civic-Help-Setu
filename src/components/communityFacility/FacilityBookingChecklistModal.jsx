import { useState, useMemo, useSyncExternalStore } from 'react';
import AccessibleModal from '../common/AccessibleModal';
import {
  CheckSquare,
  Square,
  Trash2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { createChecklistSession } from '../../services/checklistStorage';
import { buildFacilityChecklistItems } from '../../services/communityFacilityService';
import { useToast } from '../../context/ToastContext';

export default function FacilityBookingChecklistModal({
  isOpen,
  onClose,
  facility,
}) {
  const { toast } = useToast();
  const [customInput, setCustomInput] = useState('');

  const checklistId = facility ? `community_facility_checklist_${facility.id}` : null;
  const initialItems = useMemo(() => buildFacilityChecklistItems(facility), [facility]);
  const [items, setItems] = useState(initialItems);

  const session = useMemo(() => {
    return createChecklistSession({ id: checklistId, items });
  }, [checklistId, items]);

  const { checked } = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState
  );

  if (!isOpen || !facility) return null;

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
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete and wipe your saved checklist data for this facility?')) {
      session.deleteChecklistData();
      toast?.info?.('Checklist data cleared.');
    }
  };

  const doneCount = items.filter((item) => checked.includes(item)).length;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Facility Booking Preparation Checklist"
      subtitle={`Preparation guide for ${facility.name}`}
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Privacy Note */}
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-light)',
            padding: '0.6rem 0.75rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--success, #16a34a)', flexShrink: 0 }} />
          <span>
            Checklist progress is saved exclusively to your browser. No personal data is transmitted or stored on any server.
          </span>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            <span>Readiness Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {doneCount} of {items.length} completed
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--bg-main)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%`,
                backgroundColor: 'var(--accent-main)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Checklist Items List */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '340px',
            overflowY: 'auto',
          }}
        >
          {items.map((item, idx) => {
            const isDone = checked.includes(item);
            return (
              <li
                key={idx}
                onClick={() => handleToggle(item)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isDone ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)',
                  border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background-color 0.1s ease',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '2px', color: isDone ? 'var(--success, #16a34a)' : 'var(--text-tertiary)' }}>
                  {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    lineHeight: 1.4,
                  }}
                >
                  {item}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Add Custom Item Form */}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add custom task or municipal counter reminder..."
            aria-label="Add custom checklist task"
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.6rem 1rem',
              backgroundColor: 'var(--accent-main)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Plus size={15} /> Add
          </button>
        </form>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
          <button
            type="button"
            onClick={handleDeleteAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger, #dc2626)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: 0,
            }}
          >
            <Trash2 size={14} /> Clear My Checklist Data
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-main)',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}

