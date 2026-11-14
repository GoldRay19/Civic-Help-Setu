export default function WaterTankerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading municipal water authorities"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '1.5rem',
        width: '100%',
      }}
    >
      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          style={{
            borderRadius: '1rem',
            border: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--surface, #ffffff)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '60%', height: '1.5rem', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '0.375rem' }} />
            <div style={{ width: '25%', height: '1.25rem', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '999px' }} />
          </div>
          <div style={{ width: '80%', height: '1rem', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '0.25rem' }} />
          <div style={{ width: '100%', height: '4rem', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '0.5rem' }} />
          <div style={{ width: '40%', height: '1rem', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '0.25rem' }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <div style={{ flex: 1, height: '2.25rem', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '0.5rem' }} />
            <div style={{ flex: 1, height: '2.25rem', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '0.5rem' }} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading water authorities and official tanker schedules...</span>
    </div>
  );
}

