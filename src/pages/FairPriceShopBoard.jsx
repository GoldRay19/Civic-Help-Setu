import { useState, useMemo } from 'react';
import StandardPageHeader from '../components/common/StandardPageHeader';
import PdsShopCard from '../components/pds/PdsShopCard';
import PdsShopDetailModal from '../components/pds/PdsShopDetailModal';
import PdsChecklistModal from '../components/pds/PdsChecklistModal';
import PdsObservationModal from '../components/pds/PdsObservationModal';
import PdsShopFilters from '../components/pds/PdsShopFilters';
import PdsEmptyState from '../components/pds/PdsEmptyState';
import PdsSkeleton from '../components/pds/PdsSkeleton';
import PdsErrorState from '../components/pds/PdsErrorState';
import { VERIFIED_PDS_SHOPS } from '../data/pdsShops';
import { filterPdsShops } from '../services/pdsShopService';
import { Store, AlertCircle, Layers, ShieldCheck, PhoneCall } from 'lucide-react';

const INITIAL_FILTERS = {
  state: '',
  district: '',
  block: '',
  onlyOnorc: false,
  searchQuery: '',
};

export default function FairPriceShopBoard() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedShopForDetails, setSelectedShopForDetails] = useState(null);
  const [selectedShopForChecklist, setSelectedShopForChecklist] = useState(null);
  const [selectedShopForObservation, setSelectedShopForObservation] = useState(null);
  const [isLoading] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  const { filteredShops, loadError } = useMemo(() => {
    if (simulateError) {
      return { filteredShops: [], loadError: new Error('Failed to load official PDS shop records from central directory.') };
    }
    try {
      return {
        filteredShops: filterPdsShops(VERIFIED_PDS_SHOPS, filters),
        loadError: null,
      };
    } catch (err) {
      return {
        filteredShops: [],
        loadError: err,
      };
    }
  }, [filters, simulateError]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSimulateError(false);
  };

  return (
    <div className="section" style={{ padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <StandardPageHeader
          eyebrow="Public Distribution System (PDS)"
          eyebrowIcon={<Store size={15} style={{ color: 'var(--accent-main, #0284c7)' }} />}
          title="Fair Price Shop Service Information Board"
          subtitle="Locality-aware information board providing verified Fair Price Shop records, published operating hours, statutory NFSA entitlements, and One Nation One Ration Card (ONORC) portability guidance."
          badgeText="Official Govt. Sourced"
          badgeType="accent"
        />

        {/* Anti-Hallucination & Citizen Privacy Banner */}
        <div
          role="note"
          aria-label="Important information regarding PDS data and grain stock"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
          }}
        >
          <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Notice for Ration Card Holders:</strong>{' '}
            Civic Help Setu strictly <strong>does not claim live grain stock balances</strong> without an authorized real-time state feed. All shop timings, dealer contacts, and allocation rules are grounded in published Food &amp; Civil Supplies records. Card numbers and personal data are never exposed or requested.
          </div>
        </div>

        {/* Quick Statutory Reference Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <Layers size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                ONORC Portability
              </strong>
              Lifting foodgrains across any Fair Price Shop in India using Aadhaar biometric authentication on e-POS devices.
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <ShieldCheck size={20} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                Entitlement Rights
              </strong>
              AAY: 35 kg foodgrains/family. PHH: 5 kg/beneficiary. Always verify zero calibration on digital scale and collect printed slip.
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <PhoneCall size={20} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                Statutory Helpline
              </strong>
              Dial toll-free <strong>1967</strong> (National PDS) or <strong>14445</strong> (ONORC Portability) to lodge complaints against service refusal.
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <PdsShopFilters
          shops={VERIFIED_PDS_SHOPS}
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          totalResults={filteredShops.length}
        />

        {/* Results Section */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Official Fair Price Shops ({filteredShops.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing verified public distribution shops
          </span>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <PdsSkeleton />
        ) : loadError ? (
          <PdsErrorState message={loadError.message} onRetry={() => setSimulateError(false)} />
        ) : filteredShops.length === 0 ? (
          <PdsEmptyState onReset={handleResetFilters} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {filteredShops.map((shop) => (
              <PdsShopCard
                key={shop.id}
                shop={shop}
                onOpenDetails={setSelectedShopForDetails}
                onOpenChecklist={setSelectedShopForChecklist}
                onOpenObservation={setSelectedShopForObservation}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <PdsShopDetailModal
          isOpen={Boolean(selectedShopForDetails)}
          onClose={() => setSelectedShopForDetails(null)}
          shop={selectedShopForDetails}
          onOpenChecklist={setSelectedShopForChecklist}
          onOpenObservation={setSelectedShopForObservation}
        />

        <PdsChecklistModal
          isOpen={Boolean(selectedShopForChecklist)}
          onClose={() => setSelectedShopForChecklist(null)}
          shop={selectedShopForChecklist}
        />

        <PdsObservationModal
          isOpen={Boolean(selectedShopForObservation)}
          onClose={() => setSelectedShopForObservation(null)}
          shop={selectedShopForObservation}
        />
      </div>
    </div>
  );
}
