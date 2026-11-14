import { Store, RotateCcw } from 'lucide-react';

export default function PdsEmptyState({ onReset }) {
  return (
    <div
      role="status"
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '1rem',
        border: '1px dashed var(--border-main)',
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          margin: '0 auto 1rem',
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-main, #0284c7)',
        }}
      >
        <Store size={28} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        No Official Fair Price Shops Found
      </h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
        No verified Fair Price Shop records matched your selected state, district, block, or locality keyword.
        Civic Help Setu does not guess or interpolate unverified shop locations.
      </p>
      {onReset && (
        <button
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--accent-main, #0284c7)',
            color: '#ffffff',
            fontWeight: 500,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} /> Reset Filters
        </button>
      )}
    </div>
  );
}

