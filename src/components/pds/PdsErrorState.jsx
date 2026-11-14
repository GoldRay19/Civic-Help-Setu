import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function PdsErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: '1rem',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          margin: '0 auto 1rem',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
        }}
      >
        <AlertTriangle size={28} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Unable to Load Official PDS Records
      </h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
        {message || 'An error occurred while communicating with the civic data service. Please retry.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: '0.5rem',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontWeight: 500,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} /> Retry Sourced Load
        </button>
      )}
    </div>
  );
}

