import { Search, RotateCcw, Filter, Building2, MapPin, Tag, Activity } from 'lucide-react';
import {
  WORKFLOW_STAGES,
  WORKFLOW_STAGE_LABELS,
  TRANSITION_CATEGORIES,
  TRANSITION_CATEGORY_LABELS,
} from '../../data/rentalTransitionContract';
import { INDIAN_STATES_AND_UTS, JURISDICTION_LEVELS, JURISDICTION_LEVEL_LABELS } from '../../data/jurisdictions';

export default function RentalFilters({
  filters,
  onChange,
  onReset,
  authorities = [],
  totalCount = 0,
}) {
  const updateFilter = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleJurisdictionChange = (level) => {
    onChange({
      ...filters,
      jurisdictionLevel: level,
      state: level === 'national' ? '' : filters.state,
    });
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--accent-main)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Search &amp; Rental Transition Filters
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            ({totalCount} {totalCount === 1 ? 'guide' : 'guides'})
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
        >
          <RotateCcw size={14} />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Stage Toggle (Move-In vs Move-Out) */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          Occupancy Workflow Stage
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => updateFilter('stage', 'all')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: filters.stage === 'all' ? '2px solid var(--accent-main)' : '1px solid var(--border-main)',
              backgroundColor: filters.stage === 'all' ? 'rgba(var(--accent-rgb, 14, 165, 233), 0.12)' : 'var(--bg-main)',
              color: filters.stage === 'all' ? 'var(--accent-main)' : 'var(--text-primary)',
            }}
          >
            All Workflows
          </button>
          {WORKFLOW_STAGES.map((stg) => (
            <button
              key={stg}
              type="button"
              onClick={() => updateFilter('stage', stg)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: filters.stage === stg ? '2px solid var(--accent-main)' : '1px solid var(--border-main)',
                backgroundColor: filters.stage === stg ? 'rgba(var(--accent-rgb, 14, 165, 233), 0.12)' : 'var(--bg-main)',
                color: filters.stage === stg ? 'var(--accent-main)' : 'var(--text-primary)',
              }}
            >
              {WORKFLOW_STAGE_LABELS[stg]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Search Query */}
        <div>
          <label
            htmlFor="rental-search-input"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            <Search size={14} />
            <span>Keyword or Authority Search</span>
          </label>
          <input
            id="rental-search-input"
            type="text"
            placeholder="e.g. BESCOM, water meter, Aadhaar..."
            value={filters.searchQuery || ''}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="input"
            style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          />
        </div>

        {/* Utility Category */}
        <div>
          <label
            htmlFor="rental-category-select"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            <Tag size={14} />
            <span>Utility / Civic Domain</span>
          </label>
          <select
            id="rental-category-select"
            value={filters.category || 'all'}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="select"
            style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="all">All Domains &amp; Utilities</option>
            {TRANSITION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {TRANSITION_CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </div>

        {/* Jurisdiction Level */}
        <div>
          <label
            htmlFor="rental-jurisdiction-level-select"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            <Building2 size={14} />
            <span>Administrative Level</span>
          </label>
          <select
            id="rental-jurisdiction-level-select"
            value={filters.jurisdictionLevel || 'all'}
            onChange={(e) => handleJurisdictionChange(e.target.value)}
            className="select"
            style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="all">All Levels (National &amp; Local)</option>
            {JURISDICTION_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {JURISDICTION_LEVEL_LABELS[lvl] || lvl}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter */}
        <div>
          <label
            htmlFor="rental-state-select"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            <MapPin size={14} />
            <span>State / Union Territory</span>
          </label>
          <select
            id="rental-state-select"
            value={filters.state || ''}
            onChange={(e) => updateFilter('state', e.target.value)}
            disabled={filters.jurisdictionLevel === 'national'}
            className="select"
            style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="">All States &amp; UTs</option>
            {INDIAN_STATES_AND_UTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Authority Filter */}
        {authorities.length > 0 && (
          <div>
            <label
              htmlFor="rental-authority-select"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
            >
              <Building2 size={14} />
              <span>Managing Authority</span>
            </label>
            <select
              id="rental-authority-select"
              value={filters.authority || ''}
              onChange={(e) => updateFilter('authority', e.target.value)}
              className="select"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="">All Authorities</option>
              {authorities.map((auth) => (
                <option key={auth} value={auth}>
                  {auth}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Checkbox Options */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={Boolean(filters.onlyMeterApplicable)}
            onChange={(e) => updateFilter('onlyMeterApplicable', e.target.checked)}
          />
          <Activity size={14} color="var(--accent-main)" />
          <span>Only show transitions requiring <strong>Meter Readings</strong> (Electricity / Water / Gas)</span>
        </label>
      </div>
    </div>
  );
}
