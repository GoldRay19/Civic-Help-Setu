import { Droplets, RefreshCw } from 'lucide-react';

export default function WaterTankerEmptyState({ onResetFilters }) {
  return (
    <div
      role="region"
      aria-label="No matching water authorities found"
      style={{
        borderRadius: '1rem',
        border: '1px dashed var(--border-color, #cbd5e1)',
        backgroundColor: 'var(--surface-raised, #f8fafc)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '999px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: 'var(--primary, #2563eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Droplets size={28} aria-hidden="true" />
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--text, #0f172a)' }}>
          No Municipal Water Authorities Match Your Filters
        </h3>
        <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.5 }}>
          We could not find an authority matching your selected city, ward, or keyword. Try widening your filters or clearing search terms to explore regional supply authorities.
        </p>
      </div>

      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}

