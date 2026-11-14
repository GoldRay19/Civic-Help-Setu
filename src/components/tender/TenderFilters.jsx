import { Search, RotateCcw, Filter, Building2, MapPin, Tag } from 'lucide-react';
import { TENDER_CATEGORIES, TENDER_CATEGORY_LABELS } from '../../data/tenderContract';
import { INDIAN_STATES_AND_UTS } from '../../data/jurisdictions';

export default function TenderFilters({
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
            Search &amp; Tender Readiness Filters
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            ({totalCount} {totalCount === 1 ? 'notice' : 'notices'})
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Search query */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="tender-search" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Search Keyword / Tender NIT Ref / Scope
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              id="tender-search"
              type="text"
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              placeholder="e.g. GEM/2026/B, Solar Inverters, BBMP, PWD Water..."
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* Jurisdiction Level */}
        <div>
          <label htmlFor="tender-jurisdiction-level" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Jurisdiction Level
          </label>
          <select
            id="tender-jurisdiction-level"
            value={filters.jurisdictionLevel || 'all'}
            onChange={(e) => handleJurisdictionChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Jurisdictions</option>
            <option value="national">National (Central Govt / CPWD / GeM)</option>
            <option value="state">State (State e-Procurement)</option>
            <option value="district">District</option>
            <option value="local">Local Body / Municipal Corporation</option>
          </select>
        </div>

        {/* State Filter (if not national) */}
        {filters.jurisdictionLevel !== 'national' && (
          <div>
            <label htmlFor="tender-state" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              State / Union Territory
            </label>
            <select
              id="tender-state"
              value={filters.state || ''}
              onChange={(e) => updateFilter('state', e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All States &amp; UTs</option>
              {INDIAN_STATES_AND_UTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category */}
        <div>
          <label htmlFor="tender-category" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <Tag size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Procurement Category
          </label>
          <select
            id="tender-category"
            value={filters.category || 'all'}
            onChange={(e) => updateFilter('category', e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Categories</option>
            {TENDER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {TENDER_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Authority */}
        {authorities.length > 0 && (
          <div>
            <label htmlFor="tender-authority" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              <Building2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Procuring Authority
            </label>
            <select
              id="tender-authority"
              value={filters.authority || ''}
              onChange={(e) => updateFilter('authority', e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Procuring Bodies</option>
              {authorities.map((auth) => (
                <option key={auth} value={auth}>
                  {auth}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Urgency / Closing status */}
        <div>
          <label htmlFor="tender-urgency" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Closing Status
          </label>
          <select
            id="tender-urgency"
            value={filters.closingFilter || 'all'}
            onChange={(e) => updateFilter('closingFilter', e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Notices</option>
            <option value="active">Active Tenders</option>
            <option value="closing_soon">Closing Soon (≤ 7 Days)</option>
            <option value="unavailable">Date to be Announced in Corrigendum</option>
          </select>
        </div>
      </div>

      {/* MSME Exemption Checkbox */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-main)', display: 'flex', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(filters.onlyMsmeExempt)}
            onChange={(e) => updateFilter('onlyMsmeExempt', e.target.checked)}
            style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: 'var(--accent-main)' }}
          />
          <span>Show only tenders with confirmed MSME Fee / EMD Exemptions (GFR Rule 170 / State Policies)</span>
        </label>
      </div>
    </div>
  );
}
