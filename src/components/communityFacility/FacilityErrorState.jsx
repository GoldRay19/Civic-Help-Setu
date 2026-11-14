import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function FacilityErrorState({ error, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '1rem',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger, #dc2626)',
          marginBottom: '1rem',
        }}
      >
        <AlertTriangle size={36} />
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Unable to Load Verified Facility Directory
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
        {error?.message || 'A network error occurred while retrieving municipal records. Please verify your connection.'}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '0.6rem 1.25rem',
            backgroundColor: 'var(--accent-main)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <RotateCcw size={15} /> Retry
        </button>
      )}
    </div>
  );
}

