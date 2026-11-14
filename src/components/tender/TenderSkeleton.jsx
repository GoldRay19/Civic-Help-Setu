export default function TenderSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}
      aria-label="Loading government tenders"
      aria-busy="true"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            animation: 'pulse 1.5s infinite',
          }}
        >
          <div style={{ height: '1.25rem', width: '35%', backgroundColor: 'var(--border-light)', borderRadius: '4px' }} />
          <div style={{ height: '1.75rem', width: '80%', backgroundColor: 'var(--border-light)', borderRadius: '4px' }} />
          <div style={{ height: '1rem', width: '60%', backgroundColor: 'var(--border-light)', borderRadius: '4px' }} />
          <div style={{ height: '3.5rem', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '6px' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ height: '2.25rem', flex: 1, backgroundColor: 'var(--border-light)', borderRadius: '6px' }} />
            <div style={{ height: '2.25rem', flex: 1, backgroundColor: 'var(--border-light)', borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

