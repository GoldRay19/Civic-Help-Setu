import { useState, useMemo } from 'react';
import StandardPageHeader from '../components/common/StandardPageHeader';
import CrematoriumCard from '../components/crematorium/CrematoriumCard';
import CrematoriumDetailModal from '../components/crematorium/CrematoriumDetailModal';
import BereavementChecklistModal from '../components/crematorium/BereavementChecklistModal';
import CrematoriumCorrectionModal from '../components/crematorium/CrematoriumCorrectionModal';
import CrematoriumFilters from '../components/crematorium/CrematoriumFilters';
import CrematoriumEmptyState from '../components/crematorium/CrematoriumEmptyState';
import CrematoriumSkeleton from '../components/crematorium/CrematoriumSkeleton';
import CrematoriumErrorState from '../components/crematorium/CrematoriumErrorState';
import { VERIFIED_CREMATORIUM_FACILITIES } from '../data/crematoriumFacilities';
import { filterCrematoriumFacilities } from '../services/crematoriumService';
import { HeartHandshake, AlertCircle } from 'lucide-react';

const INITIAL_FILTERS = {
  state: '',
  district: '',
  facilityType: 'all',
  onlyWheelchair: false,
  onlyColdStorage: false,
  onlyOutOfHours: false,
  searchQuery: '',
};

export default function CrematoriumDirectory() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedFacilityForDetails, setSelectedFacilityForDetails] = useState(null);
  const [selectedFacilityForChecklist, setSelectedFacilityForChecklist] = useState(null);
  const [selectedFacilityForCorrection, setSelectedFacilityForCorrection] = useState(null);
  const [isLoading] = useState(false);

  const { filteredFacilities, loadError } = useMemo(() => {
    try {
      return {
        filteredFacilities: filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, filters),
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
          eyebrow="Civic Public Facility Directory"
          eyebrowIcon={<HeartHandshake size={15} style={{ color: 'var(--accent-main)' }} />}
          title="Public Crematoriums & Burial Grounds"
          subtitle="Respectful, verified municipal directory providing statutory booking steps, published charges, required documents, and official contacts under time pressure."
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
            <strong style={{ color: 'var(--text-primary)' }}>Notice for Citizens & Bereaved Families:</strong>{' '}
            Civic Help Setu does not track live slot availability or real-time furnace status. All entries are grounded strictly in published municipal gazettes and official circulars. For urgent night admissions or immediate slot coordination, please call the official facility caretaker or municipal helpline listed on each facility card.
          </div>
        </div>

        {/* Filter Toolbar */}
        <CrematoriumFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
        />

        {/* Facility Results Section */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Verified Facilities ({filteredFacilities.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Showing verified public municipal facilities
          </span>
        </div>

        {isLoading ? (
          <CrematoriumSkeleton />
        ) : loadError ? (
          <CrematoriumErrorState error={loadError} onRetry={handleResetFilters} />
        ) : filteredFacilities.length === 0 ? (
          <CrematoriumEmptyState
            onReset={handleResetFilters}
            onSuggest={() => setSelectedFacilityForCorrection({ id: 'unlisted-facility', name: 'Unlisted Facility' })}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredFacilities.map((facility) => (
              <CrematoriumCard
                key={facility.id}
                facility={facility}
                onOpenDetails={setSelectedFacilityForDetails}
                onOpenChecklist={setSelectedFacilityForChecklist}
                onOpenCorrection={setSelectedFacilityForCorrection}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <CrematoriumDetailModal
          isOpen={Boolean(selectedFacilityForDetails)}
          onClose={() => setSelectedFacilityForDetails(null)}
          facility={selectedFacilityForDetails}
          onOpenChecklist={(f) => {
            setSelectedFacilityForDetails(null);
            setSelectedFacilityForChecklist(f);
          }}
        />

        <BereavementChecklistModal
          isOpen={Boolean(selectedFacilityForChecklist)}
          onClose={() => setSelectedFacilityForChecklist(null)}
          facility={selectedFacilityForChecklist}
        />

        <CrematoriumCorrectionModal
          isOpen={Boolean(selectedFacilityForCorrection)}
          onClose={() => setSelectedFacilityForCorrection(null)}
          facility={selectedFacilityForCorrection}
        />
      </div>
    </div>
  );
}
