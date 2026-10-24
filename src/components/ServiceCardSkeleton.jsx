// Placeholder shaped like ServiceCard so the grid does not jump when real cards arrive.
export const ServiceCardSkeleton = () => (
  <div className="card skeleton-card" aria-hidden="true">
    <div className="skeleton-row" style={{ marginBottom: '1.25rem' }}>
      <span className="skeleton skeleton-pill" style={{ width: '5rem' }} />
      <span className="skeleton skeleton-pill" style={{ width: '3.5rem' }} />
    </div>
    <span className="skeleton skeleton-line" style={{ width: '75%', height: '1.4rem', marginBottom: '0.75rem' }} />
    <span className="skeleton skeleton-line" style={{ width: '100%' }} />
    <span className="skeleton skeleton-line" style={{ width: '90%' }} />
    <span className="skeleton skeleton-line" style={{ width: '60%', marginBottom: '1.5rem' }} />
    <div className="skeleton-row skeleton-footer">
      <span className="skeleton skeleton-line" style={{ width: '35%', marginBottom: 0 }} />
      <span className="skeleton skeleton-line" style={{ width: '28%', marginBottom: 0 }} />
    </div>
  </div>
);

export const ServiceCardSkeletonGrid = ({ count = 6, label = 'Loading services' }) => (
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">{label}...</span>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.75rem',
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default ServiceCardSkeleton;
