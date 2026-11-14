import { Search, RotateCcw } from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../../data/jurisdictions';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../data/communityFacilityContract';

export default function FacilityFilters({
  filters,
  onChange,
  onReset,
}) {
  const handleTextChange = (key, val) => {
    onChange({ ...filters, [key]: val });
  };

  const handleToggle = (key) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <section
      aria-label="Filter community facilities"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
        padding: '1.25rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Top Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
          }}
        />
        <input
          type="search"
          value={filters.searchQuery || ''}
          onChange={(e) => handleTextChange('searchQuery', e.target.value)}
          placeholder="Search by facility name, municipal authority, or area (e.g. Town Hall, BBMP, Dadar, Shivaji)..."
          aria-label="Search community facilities"
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.75rem',
            borderRadius: '0.6rem',
            border: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Primary Selectors Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <label htmlFor="facility-filter-state" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            State / UT
          </label>
          <select
            id="facility-filter-state"
            value={filters.state || ''}
            onChange={(e) => handleTextChange('state', e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All States & UTs</option>
            {INDIAN_STATES_AND_UTS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="facility-filter-district" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            District
          </label>
          <input
            id="facility-filter-district"
            type="text"
            value={filters.district || ''}
            onChange={(e) => handleTextChange('district', e.target.value)}
            placeholder="e.g. New Delhi, Pune..."
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label htmlFor="facility-filter-type" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Facility Type
          </label>
          <select
            id="facility-filter-type"
            value={filters.facilityType || 'all'}
            onChange={(e) => handleTextChange('facilityType', e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="all">All Facility Types</option>
            {FACILITY_TYPES.map((typeKey) => (
              <option key={typeKey} value={typeKey}>
                {FACILITY_TYPE_LABELS[typeKey] || typeKey}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="facility-filter-capacity" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Min Capacity
          </label>
          <select
            id="facility-filter-capacity"
            value={filters.minCapacity || 0}
            onChange={(e) => handleTextChange('minCapacity', Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value={0}>Any Capacity</option>
            <option value={200}>200+ attendees</option>
            <option value={500}>500+ attendees</option>
            <option value={1000}>1,000+ attendees</option>
            <option value={3000}>3,000+ attendees</option>
          </select>
        </div>
      </div>

      {/* Checkboxes & Reset */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.onlyWheelchair || false}
              onChange={() => handleToggle('onlyWheelchair')}
              style={{ accentColor: 'var(--accent-main)' }}
            />
            <span>♿ Wheelchair Accessible</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.onlyParking || false}
              onChange={() => handleToggle('onlyParking')}
              style={{ accentColor: 'var(--accent-main)' }}
            />
            <span>🚗 Parking Lot Available</span>
          </label>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '0.4rem',
            }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>
    </section>
  );
}
