import { Search, X, Filter } from 'lucide-react';

export default function WaterTankerFilters({
  cities = ['All'],
  wards = ['All'],
  selectedCity = 'All',
  onCityChange,
  selectedWard = 'All',
  onWardChange,
  selectedSupplyType = 'all',
  onSupplyTypeChange,
  searchQuery = '',
  onSearchChange,
  onResetFilters,
  resultCount = 0,
}) {
  const isFiltered = selectedCity !== 'All' || selectedWard !== 'All' || selectedSupplyType !== 'all' || Boolean(searchQuery.trim());

  return (
    <div
      style={{
        borderRadius: '1rem',
        border: '1px solid var(--border-color, #e2e8f0)',
        backgroundColor: 'var(--surface, #ffffff)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} style={{ color: 'var(--primary, #2563eb)' }} aria-hidden="true" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text, #0f172a)' }}>
            Filter Municipal Water Authorities
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              backgroundColor: 'var(--surface-raised, #f1f5f9)',
              color: 'var(--text-secondary, #64748b)',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              fontWeight: 500,
            }}
          >
            {resultCount} {resultCount === 1 ? 'Authority' : 'Authorities'} Found
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary, #2563eb)',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
            }}
          >
            <X size={14} aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.875rem',
        }}
      >
        {/* Search Input */}
        <div>
          <label
            htmlFor="tanker-search"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}
          >
            Search Authority or Keyword
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary, #94a3b8)',
              }}
              aria-hidden="true"
            />
            <input
              id="tanker-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="e.g. DJB, BWSSB, Karol Bagh..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--surface, #ffffff)',
                color: 'var(--text, #0f172a)',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* City Selector */}
        <div>
          <label
            htmlFor="tanker-city-select"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}
          >
            City / Metropolitan Area
          </label>
          <select
            id="tanker-city-select"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--surface, #ffffff)',
              color: 'var(--text, #0f172a)',
              fontSize: '0.875rem',
            }}
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city === 'All' ? 'All Metropolitan Cities' : city}
              </option>
            ))}
          </select>
        </div>

        {/* Ward Selector */}
        <div>
          <label
            htmlFor="tanker-ward-select"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}
          >
            Ward / Supply Locality
          </label>
          <select
            id="tanker-ward-select"
            value={selectedWard}
            onChange={(e) => onWardChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--surface, #ffffff)',
              color: 'var(--text, #0f172a)',
              fontSize: '0.875rem',
            }}
          >
            {wards.map((ward) => (
              <option key={ward} value={ward}>
                {ward === 'All' ? 'All Wards / Localities' : ward}
              </option>
            ))}
          </select>
        </div>

        {/* Supply Type */}
        <div>
          <label
            htmlFor="tanker-supply-type"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}
          >
            Supply Quota Type
          </label>
          <select
            id="tanker-supply-type"
            value={selectedSupplyType}
            onChange={(e) => onSupplyTypeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--surface, #ffffff)',
              color: 'var(--text, #0f172a)',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Quotas (Free & Paid)</option>
            <option value="free">Free Emergency / Rationed Quota</option>
            <option value="paid">Statutory Tariff Paid Booking</option>
          </select>
        </div>
      </div>
    </div>
  );
}

