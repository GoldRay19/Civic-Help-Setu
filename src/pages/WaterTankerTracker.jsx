import { useState, useMemo } from 'react';
import StandardPageHeader from '../components/common/StandardPageHeader';
import WaterTankerFilters from '../components/waterTanker/WaterTankerFilters';
import WaterTankerAuthorityCard from '../components/waterTanker/WaterTankerAuthorityCard';
import WaterTankerRequestModal from '../components/waterTanker/WaterTankerRequestModal';
import WaterTankerChecklistModal from '../components/waterTanker/WaterTankerChecklistModal';
import WaterTankerEscalationModal from '../components/waterTanker/WaterTankerEscalationModal';
import WaterTankerReportModal from '../components/waterTanker/WaterTankerReportModal';
import WaterTankerEmptyState from '../components/waterTanker/WaterTankerEmptyState';
import WaterTankerSkeleton from '../components/waterTanker/WaterTankerSkeleton';
import WaterTankerErrorState from '../components/waterTanker/WaterTankerErrorState';
import { VERIFIED_WATER_TANKER_AUTHORITIES } from '../data/waterTankerAuthorities';
import {
  filterWaterAuthorities,
  getAvailableCities,
  getAvailableWards,
} from '../services/waterTankerService';
import { Droplets, ShieldCheck } from 'lucide-react';

const INITIAL_FILTERS = {
  city: 'All',
  ward: 'All',
  supplyType: 'all',
  search: '',
};

export default function WaterTankerTracker() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedAuthorityForRequest, setSelectedAuthorityForRequest] = useState(null);
  const [selectedAuthorityForChecklist, setSelectedAuthorityForChecklist] = useState(null);
  const [selectedAuthorityForEscalation, setSelectedAuthorityForEscalation] = useState(null);
  const [selectedAuthorityForReport, setSelectedAuthorityForReport] = useState(null);
  const [isLoading] = useState(false);

  const cities = useMemo(() => getAvailableCities(VERIFIED_WATER_TANKER_AUTHORITIES), []);
  const wards = useMemo(
    () => getAvailableWards(VERIFIED_WATER_TANKER_AUTHORITIES, filters.city),
    [filters.city]
  );

  const { filteredAuthorities, loadError } = useMemo(() => {
    try {
      return {
        filteredAuthorities: filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, filters),
        loadError: null,
      };
    } catch (err) {
      return {
        filteredAuthorities: [],
        loadError: err,
      };
    }
  }, [filters]);

  const handleCityChange = (city) => {
    setFilters((prev) => ({
      ...prev,
      city,
      ward: 'All', // Reset ward on city switch
    }));
  };

  const handleWardChange = (ward) => {
    setFilters((prev) => ({ ...prev, ward }));
  };

  const handleSupplyTypeChange = (supplyType) => {
    setFilters((prev) => ({ ...prev, supplyType }));
  };

  const handleSearchChange = (search) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="section" style={{ padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <StandardPageHeader
          eyebrow="Civic Water Supply & Logistics"
          eyebrowIcon={<Droplets size={16} style={{ color: 'var(--primary, #2563eb)' }} />}
          title="Municipal Water-Tanker Request & Delivery Tracker"
          subtitle="Identify responsible municipal water authorities, official booking channels, statutory rate caps, delivery prep checklists, and non-delivery escalation summaries."
          badgeText="Verified Government Data"
          badgeType="accent"
        />

        {/* Anti-Hallucination & Privacy Compass Banner */}
        <div
          role="note"
          aria-label="Important information regarding water tanker data policies"
          style={{
            backgroundColor: 'var(--surface-raised, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <ShieldCheck size={20} style={{ color: 'var(--primary, #2563eb)', flexShrink: 0, marginTop: '0.15rem' }} aria-hidden="true" />
          <div style={{ fontSize: '0.875rem', color: 'var(--text, #0f172a)', lineHeight: 1.5 }}>
            <strong>Anti-Hallucination &amp; Privacy Safeguards:</strong> Live vehicle GPS tracking and speculative queue estimations are strictly prohibited without authenticated municipal telemetry. Citizens are provided official, dated government portals, helplines, and depot walk-in desks. All personal requests are stored strictly on your device, and residential street numbers are masked in shared previews and escalation letters.
          </div>
        </div>

        {/* Filter Controls */}
        <WaterTankerFilters
          cities={cities}
          wards={wards}
          selectedCity={filters.city}
          onCityChange={handleCityChange}
          selectedWard={filters.ward}
          onWardChange={handleWardChange}
          selectedSupplyType={filters.supplyType}
          onSupplyTypeChange={handleSupplyTypeChange}
          searchQuery={filters.search}
          onSearchChange={handleSearchChange}
          onResetFilters={handleResetFilters}
          resultCount={filteredAuthorities.length}
        />

        {/* View States */}
        {loadError ? (
          <WaterTankerErrorState error={loadError} onRetry={handleResetFilters} />
        ) : isLoading ? (
          <WaterTankerSkeleton />
        ) : filteredAuthorities.length === 0 ? (
          <WaterTankerEmptyState onResetFilters={handleResetFilters} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredAuthorities.map((authority) => (
              <WaterTankerAuthorityCard
                key={authority.id}
                authority={authority}
                onLogRequest={(auth) => setSelectedAuthorityForRequest(auth)}
                onOpenChecklist={(auth) => setSelectedAuthorityForChecklist(auth)}
                onOpenEscalation={(auth) => setSelectedAuthorityForEscalation(auth)}
                onOpenReport={(auth) => setSelectedAuthorityForReport(auth)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <WaterTankerRequestModal
          isOpen={Boolean(selectedAuthorityForRequest)}
          onClose={() => setSelectedAuthorityForRequest(null)}
          authority={selectedAuthorityForRequest}
        />

        <WaterTankerChecklistModal
          isOpen={Boolean(selectedAuthorityForChecklist)}
          onClose={() => setSelectedAuthorityForChecklist(null)}
          authority={selectedAuthorityForChecklist}
        />

        <WaterTankerEscalationModal
          isOpen={Boolean(selectedAuthorityForEscalation)}
          onClose={() => setSelectedAuthorityForEscalation(null)}
          authority={selectedAuthorityForEscalation}
        />

        <WaterTankerReportModal
          isOpen={Boolean(selectedAuthorityForReport)}
          onClose={() => setSelectedAuthorityForReport(null)}
          authority={selectedAuthorityForReport}
        />
      </div>
    </div>
  );
}
