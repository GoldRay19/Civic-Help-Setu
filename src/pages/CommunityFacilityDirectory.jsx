import { useState, useMemo } from 'react';
import StandardPageHeader from '../components/common/StandardPageHeader';
import FacilityCard from '../components/communityFacility/FacilityCard';
import FacilityDetailModal from '../components/communityFacility/FacilityDetailModal';
import FacilityBookingChecklistModal from '../components/communityFacility/FacilityBookingChecklistModal';
import FacilityCorrectionModal from '../components/communityFacility/FacilityCorrectionModal';
import FacilityFilters from '../components/communityFacility/FacilityFilters';
import FacilityEmptyState from '../components/communityFacility/FacilityEmptyState';
import FacilitySkeleton from '../components/communityFacility/FacilitySkeleton';
import FacilityErrorState from '../components/communityFacility/FacilityErrorState';
import { VERIFIED_COMMUNITY_FACILITIES } from '../data/communityFacilities';
import { filterCommunityFacilities } from '../services/communityFacilityService';
import { Building2, AlertCircle } from 'lucide-react';

const INITIAL_FILTERS = {
  state: '',
  district: '',
  facilityType: 'all',
  minCapacity: 0,
  onlyWheelchair: false,
  onlyParking: false,
  searchQuery: '',
};

export default function CommunityFacilityDirectory() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedFacilityForDetails, setSelectedFacilityForDetails] = useState(null);
  const [selectedFacilityForChecklist, setSelectedFacilityForChecklist] = useState(null);
  const [selectedFacilityForCorrection, setSelectedFacilityForCorrection] = useState(null);
  const [isLoading] = useState(false);

  const { filteredFacilities, loadError } = useMemo(() => {
    try {
      return {
        filteredFacilities: filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, filters),
        loadError: null,
      };
    } catch (err) {
      return {
        filteredFacilities: [],
        loadError: err,
      };
    }
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="section" style={{ padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <StandardPageHeader
          eyebrow="Municipal Civic Facilities"
          eyebrowIcon={<Building2 size={15} style={{ color: 'var(--accent-main)' }} />}
          title="Community Facility Booking & Permit Directory"
          subtitle="Verified municipal directory providing statutory tariffs, refundable deposits, event permit clearances (Police/Fire/Sound NOC), and booking preparation checklists."
          badgeText="Verified Government Data"
          badgeType="accent"
        />

        {/* Ethical Compass & Live Slots Disclaimer Banner */}
        <div
          role="note"
          aria-label="Important information regarding facility status"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Notice on Live Booking Availability:</strong>{' '}
            Civic Help Setu does not track live calendar vacancies or provide direct reservation booking. All records link to official municipal counters and published government portals. Ensure all statutory event permits (Police Sound NOC, Fire Safety, and Food Safety) are obtained before locking dates.
          </div>
        </div>

        {/* Search & Filters */}
        <FacilityFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
        />

        {/* Directory Content Area */}
        <main id="facility-directory-list" aria-live="polite">
          {isLoading && <FacilitySkeleton />}

          {!isLoading && loadError && (
            <FacilityErrorState error={loadError} onRetry={handleResetFilters} />
          )}

          {!isLoading && !loadError && filteredFacilities.length === 0 && (
            <FacilityEmptyState onReset={handleResetFilters} />
          )}

          {!isLoading && !loadError && filteredFacilities.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {filteredFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  onOpenDetails={setSelectedFacilityForDetails}
                  onOpenChecklist={setSelectedFacilityForChecklist}
                  onOpenCorrection={setSelectedFacilityForCorrection}
                />
              ))}
            </div>
          )}
        </main>

        {/* Modals */}
        <FacilityDetailModal
          isOpen={Boolean(selectedFacilityForDetails)}
          onClose={() => setSelectedFacilityForDetails(null)}
          facility={selectedFacilityForDetails}
          onOpenChecklist={(facility) => {
            setSelectedFacilityForDetails(null);
            setSelectedFacilityForChecklist(facility);
          }}
        />

        <FacilityBookingChecklistModal
          isOpen={Boolean(selectedFacilityForChecklist)}
          onClose={() => setSelectedFacilityForChecklist(null)}
          facility={selectedFacilityForChecklist}
        />

        <FacilityCorrectionModal
          isOpen={Boolean(selectedFacilityForCorrection)}
          onClose={() => setSelectedFacilityForCorrection(null)}
          facility={selectedFacilityForCorrection}
        />
      </div>
    </div>
  );
}

