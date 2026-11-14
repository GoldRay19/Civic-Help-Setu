import { SearchX, RotateCcw } from 'lucide-react';

export default function TenderEmptyState({ onReset }) {
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
        No Official Tenders Found for Selected Criteria
      </h3>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
        Civic Help Setu indexes strictly verified government notices from official e-procurement portals. We do not interpolate or assume unverified tenders.
      </p>

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
            gap: '0.5rem',
          }}
        >
          <RotateCcw size={16} />
          Reset Search &amp; Filters
        </button>
      )}
    </div>
  );
}

