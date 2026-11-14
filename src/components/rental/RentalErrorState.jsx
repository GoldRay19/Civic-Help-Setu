import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function RentalErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '1rem',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '0.875rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          marginBottom: '1rem',
        }}
      >
        <AlertTriangle size={32} />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Unable to Load Rental Transition Data
      </h3>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
        {message || 'An error occurred while loading verified transition guides. Please retry or check your network connection.'}
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
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <RotateCcw size={16} />
          Retry Loading
        </button>
      )}
    </div>
  );
}

