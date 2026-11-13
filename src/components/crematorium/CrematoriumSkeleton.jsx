export default function CrematoriumSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}
      aria-label="Loading facilities"
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
          <div style={{ height: '1.25rem', width: '40%', backgroundColor: 'var(--border-light)', borderRadius: '4px' }} />
          <div style={{ height: '1.75rem', width: '75%', backgroundColor: 'var(--border-light)', borderRadius: '4px' }} />
          <div style={{ height: '1rem', width: '90%', backgroundColor: 'var(--border-light)', borderRadius: '4px' }} />
          <div style={{ height: '4rem', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '6px' }} />
          <div style={{ height: '2.5rem', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '6px' }} />
        </div>
      ))}
    </div>
  );
}
