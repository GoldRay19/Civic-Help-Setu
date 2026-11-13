import { Search, RotateCcw } from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../../data/jurisdictions';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../data/crematoriumContract';

export default function CrematoriumFilters({
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
      aria-label="Filter crematorium and burial facilities"
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
          placeholder="Search by facility name, municipal authority, or area (e.g. Nigambodh Ghat, BBMP, Saket)..."
          aria-label="Search facilities"
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <label htmlFor="filter-state" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            State / UT
          </label>
          <select
            id="filter-state"
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
            <option value="">All States / UTs</option>
            {INDIAN_STATES_AND_UTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-district" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            District
          </label>
          <input
            id="filter-district"
            type="text"
            value={filters.district || ''}
            onChange={(e) => handleTextChange('district', e.target.value)}
            placeholder="e.g. Central Delhi, Pune, Bengaluru Urban"
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
          <label htmlFor="filter-type" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Facility Type
          </label>
          <select
            id="filter-type"
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
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {FACILITY_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feature Checkboxes & Reset */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(filters.onlyWheelchair)}
              onChange={() => handleToggle('onlyWheelchair')}
            />
            Wheelchair Ramp
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(filters.onlyColdStorage)}
              onChange={() => handleToggle('onlyColdStorage')}
            />
            Mortuary Cold Storage
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(filters.onlyOutOfHours)}
              onChange={() => handleToggle('onlyOutOfHours')}
            />
            Out-of-Hours / Night Intake
          </label>
        </div>

        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: 0,
          }}
        >
          <RotateCcw size={14} /> Reset Filters
        </button>
      </div>
    </section>
  );
}
