import { Search, RotateCcw, Filter } from 'lucide-react';
import {
  getDistinctStates,
  getDistinctDistricts,
  getDistinctBlocks,
} from '../../services/pdsShopService';

export default function PdsShopFilters({
  shops,
  filters,
  onChange,
  onReset,
  totalResults,
}) {
  const states = getDistinctStates(shops);
  const districts = getDistinctDistricts(shops, filters.state);
  const blocks = getDistinctBlocks(shops, filters.state, filters.district);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    onChange({
      ...filters,
      state: newState,
      district: '', // Reset lower cascades
      block: '',
    });
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    onChange({
      ...filters,
      district: newDistrict,
      block: '', // Reset lower cascade
    });
  };

  const handleBlockChange = (e) => {
    onChange({
      ...filters,
      block: e.target.value,
    });
  };

  const handleSearchChange = (e) => {
    onChange({
      ...filters,
      searchQuery: e.target.value,
    });
  };

  const handleOnorcToggle = (e) => {
    onChange({
      ...filters,
      onlyOnorc: e.target.checked,
    });
  };

  return (
    <section
      aria-label="Filter Fair Price Shops"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
        padding: '1.25rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} style={{ color: 'var(--accent-main, #0284c7)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Locality &amp; Jurisdiction Filter
          </h2>
        </div>
        <div
          role="status"
          aria-live="polite"
          style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
        >
          Found <strong>{totalResults}</strong> official {totalResults === 1 ? 'shop' : 'shops'}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* State Selection */}
        <div>
          <label
            htmlFor="pds-state-select"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            State / UT
          </label>
          <select
            id="pds-state-select"
            value={filters.state || ''}
            onChange={handleStateChange}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-input, var(--bg-surface))',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          >
            <option value="">All States / UTs</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* District Selection */}
        <div>
          <label
            htmlFor="pds-district-select"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            District
          </label>
          <select
            id="pds-district-select"
            value={filters.district || ''}
            onChange={handleDistrictChange}
            disabled={!filters.state}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-input, var(--bg-surface))',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              opacity: filters.state ? 1 : 0.6,
            }}
          >
            <option value="">{filters.state ? 'All Districts' : 'Select State First'}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Block / Sub-Division Selection */}
        <div>
          <label
            htmlFor="pds-block-select"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            Block / Tehsil / Taluk
          </label>
          <select
            id="pds-block-select"
            value={filters.block || ''}
            onChange={handleBlockChange}
            disabled={!filters.district}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-input, var(--bg-surface))',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              opacity: filters.district ? 1 : 0.6,
            }}
          >
            <option value="">{filters.district ? 'All Blocks / Wards' : 'Select District First'}</option>
            {blocks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Locality / FPS ID Keyword Search */}
        <div>
          <label
            htmlFor="pds-search-input"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
          >
            Locality / FPS ID / Dealer
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="pds-search-input"
              type="text"
              placeholder="e.g. Paharganj, 101, Indiranagar"
              value={filters.searchQuery || ''}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-input, var(--bg-surface))',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Checkbox Toggles & Reset Button */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light, #e2e8f0)',
        }}
      >
        <label
          htmlFor="pds-onorc-toggle"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <input
            id="pds-onorc-toggle"
            type="checkbox"
            checked={Boolean(filters.onlyOnorc)}
            onChange={handleOnorcToggle}
            style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
          />
          Show only ONORC Portability Enabled Shops (Interstate / e-POS biometric)
        </label>

        <button
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-main)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} /> Clear All
        </button>
      </div>
    </section>
  );
}

