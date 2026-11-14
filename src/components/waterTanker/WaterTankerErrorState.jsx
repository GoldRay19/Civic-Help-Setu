import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function WaterTankerErrorState({ error, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        borderRadius: '1rem',
        border: '1px solid var(--danger-border, #fca5a5)',
        backgroundColor: 'var(--danger-bg, #fef2f2)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '999px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger, #dc2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle size={28} aria-hidden="true" />
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--danger-text, #991b1b)' }}>
          Unable to Load Water Authority Records
        </h3>
        <p style={{ maxWidth: '520px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--danger-text, #991b1b)', opacity: 0.9, lineHeight: 1.5 }}>
          {error?.message || 'An unexpected error occurred while parsing official water board circulars. Your local request records remain safe in your browser.'}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
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
          <RotateCcw size={16} aria-hidden="true" />
          <span>Reload Authority Directory</span>
        </button>
      )}
    </div>
  );
}

