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
import { buildPdsChecklistItems } from '../../services/pdsShopService';
import { useToast } from '../../context/ToastContext';

export default function PdsChecklistModal({
  isOpen,
  onClose,
  shop,
}) {
  const { toast } = useToast();
  const [customInput, setCustomInput] = useState('');

  const checklistId = shop ? `pds_checklist_${shop.id}` : null;
  const initialItems = useMemo(() => buildPdsChecklistItems(shop), [shop]);
  const [items, setItems] = useState(initialItems);

  const session = useMemo(() => {
    return createChecklistSession({ id: checklistId, items });
  }, [checklistId, items]);

  const { checked, status } = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState
  );

  if (!isOpen || !shop) return null;

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
    if (window.confirm('Are you sure you want to permanently delete and wipe your saved checklist data for this shop?')) {
      session.deleteChecklistData();
      toast?.info?.('Saved checklist data permanently cleared from your device.');
    }
  };

  const completedCount = checked.length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ration Lifting &amp; Portability Checklist"
      subtitle={`${shop.name} (${shop.fpsId})`}
      maxWidth="600px"
      ariaLabel={`Checklist for ${shop.name}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Privacy Note */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          <span>
            <strong>Client Privacy Guarantee:</strong> Your checklist progress is stored exclusively in your browser&apos;s localStorage. No personal data is transmitted or shared.
          </span>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Preparedness: {completedCount} of {totalCount} items completed
            </span>
            <span style={{ color: 'var(--accent-main, #0284c7)', fontWeight: 700 }}>
              {progressPercent}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--border-light, #e2e8f0)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: progressPercent === 100 ? '#10b981' : 'var(--accent-main, #0284c7)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div
          role="group"
          aria-label="Checklist items"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '280px',
            overflowY: 'auto',
            paddingRight: '0.25rem',
          }}
        >
          {items.map((item, idx) => {
            const isChecked = checked.includes(item);
            return (
              <div
                key={idx}
                onClick={() => handleToggle(item)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleToggle(item);
                  }
                }}
                tabIndex={0}
                role="checkbox"
                aria-checked={isChecked}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-secondary, #f8fafc)',
                  border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light, #e2e8f0)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background-color 0.1s ease',
                }}
              >
                <div style={{ color: isChecked ? '#10b981' : 'var(--text-secondary)', marginTop: '0.1rem', flexShrink: 0 }}>
                  {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: isChecked ? 'line-through' : 'none',
                    lineHeight: 1.4,
                  }}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        {/* Add Custom Item */}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Add personal note (e.g. Check bag before leaving)"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-input, var(--bg-surface))',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-main)',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Plus size={15} /> Add
          </button>
        </form>

        {/* Footer with Sync Status & Delete Data Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-main)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Status: {status === 'saved' ? 'Saved locally' : status === 'saving' ? 'Saving...' : 'Ready'}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDeleteAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              aria-label="Delete and wipe all saved checklist data"
            >
              <Trash2 size={13} /> Delete Saved Data
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--accent-main, #0284c7)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </AccessibleModal>
  );
}

