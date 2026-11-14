export default function PdsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Fair Price Shop records"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.25rem',
        marginTop: '1.5rem',
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '1rem',
            padding: '1.5rem',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '40%',
                height: '1rem',
                backgroundColor: 'var(--border-light, #cbd5e1)',
                borderRadius: '0.25rem',
                marginBottom: '1rem',
                opacity: 0.6,
              }}
            />
            <div
              style={{
                width: '80%',
                height: '1.5rem',
                backgroundColor: 'var(--border-light, #cbd5e1)',
                borderRadius: '0.35rem',
                marginBottom: '0.75rem',
                opacity: 0.8,
              }}
            />
            <div
              style={{
                width: '60%',
                height: '0.9rem',
                backgroundColor: 'var(--border-light, #cbd5e1)',
                borderRadius: '0.25rem',
                marginBottom: '1rem',
                opacity: 0.5,
              }}
            />
          </div>
          <div
            style={{
              width: '100%',
              height: '2.25rem',
              backgroundColor: 'var(--border-light, #cbd5e1)',
              borderRadius: '0.5rem',
              opacity: 0.5,
            }}
          />
        </div>
      ))}
    </div>
  );
}

