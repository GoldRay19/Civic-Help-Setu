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
import { buildBereavementChecklistItems } from '../../services/crematoriumService';
import { useToast } from '../../context/ToastContext';

export default function BereavementChecklistModal({
  isOpen,
  onClose,
  facility,
}) {
  const { toast } = useToast();
  const [customInput, setCustomInput] = useState('');

  const checklistId = facility ? `crematorium_checklist_${facility.id}` : null;
  const initialItems = useMemo(() => buildBereavementChecklistItems(facility), [facility]);
  const [items, setItems] = useState(initialItems);

  const session = useMemo(() => {
    return createChecklistSession({ id: checklistId, items });
  }, [checklistId, items]);

  const { checked, status } = useSyncExternalStore(
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
      title="Last Rites & Documentation Checklist"
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
          <span>Checklist progress is kept strictly private in your local browser and is never uploaded.</span>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {doneCount} of {items.length} items completed
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : ''}
          </span>
        </div>

        {/* Checklist Items */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item) => {
            const isDone = checked.includes(item);
            return (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: isDone ? 'rgba(22, 163, 74, 0.05)' : 'var(--bg-main)',
                  border: `1px solid ${isDone ? 'rgba(22, 163, 74, 0.2)' : 'var(--border-light)'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease',
                }}
                onClick={() => handleToggle(item)}
              >
                <div style={{ marginTop: '2px', color: isDone ? 'var(--success, #16a34a)' : 'var(--text-tertiary)' }}>
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

        {/* Add Custom Item */}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add custom task (e.g. Call local priest / hearse van)..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 0.85rem',
              backgroundColor: 'var(--accent-main)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Plus size={16} /> Add
          </button>
        </form>

        {/* Footer Actions: Delete checklist / Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
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
            <Trash2 size={14} /> Delete Saved Checklist
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-main)',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
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
