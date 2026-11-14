export default function FacilitySkeleton() {
  return (
    <div
      aria-label="Loading facilities"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ height: '20px', width: '90px', borderRadius: '999px', backgroundColor: 'var(--border-light)' }} />
            <div style={{ height: '20px', width: '130px', borderRadius: '999px', backgroundColor: 'var(--border-light)' }} />
          </div>
          <div style={{ height: '24px', width: '75%', borderRadius: '4px', backgroundColor: 'var(--border-light)' }} />
          <div style={{ height: '16px', width: '90%', borderRadius: '4px', backgroundColor: 'var(--border-light)' }} />
          <div style={{ height: '60px', width: '100%', borderRadius: '0.5rem', backgroundColor: 'var(--border-light)' }} />
          <div style={{ height: '36px', width: '100%', borderRadius: '0.5rem', backgroundColor: 'var(--border-light)', marginTop: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

