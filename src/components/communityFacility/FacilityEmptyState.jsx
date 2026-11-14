import { SearchX, RotateCcw } from 'lucide-react';

export default function FacilityEmptyState({ onReset }) {
  return (
    <div
      role="status"
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px dashed var(--border-main)',
        borderRadius: '1rem',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-tertiary)',
          marginBottom: '1rem',
        }}
      >
        <SearchX size={36} />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        No Verified Public Facilities Found in Selected Filters
      </h3>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
        Civic Help Setu strictly displays public facilities verified against dated municipal gazettes and official circulars. Gaps are displayed as unverified rather than filled with assumptions.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: 'var(--accent-main)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RotateCcw size={15} /> Reset Search & Filters
          </button>
        )}
      </div>
    </div>
  );
}

