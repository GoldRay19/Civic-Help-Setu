import { useState, useMemo } from 'react';
import StandardPageHeader from '../components/common/StandardPageHeader';
import RentalTransitionCard from '../components/rental/RentalTransitionCard';
import RentalDetailModal from '../components/rental/RentalDetailModal';
import RentalChecklistModal from '../components/rental/RentalChecklistModal';
import RentalCorrectionModal from '../components/rental/RentalCorrectionModal';
import RentalPrintSummaryModal from '../components/rental/RentalPrintSummaryModal';
import RentalFilters from '../components/rental/RentalFilters';
import RentalEmptyState from '../components/rental/RentalEmptyState';
import RentalSkeleton from '../components/rental/RentalSkeleton';
import RentalErrorState from '../components/rental/RentalErrorState';
import { VERIFIED_RENTAL_TRANSITIONS } from '../data/rentalTransitions';
import {
  filterRentalTransitions,
  getUniqueAuthorities,
} from '../services/rentalTransitionService';
import { readRentalChecklist } from '../services/rentalChecklistStorage';
import { KeyRound, ShieldCheck } from 'lucide-react';

const INITIAL_FILTERS = {
  stage: 'all',
  category: 'all',
  jurisdictionLevel: 'all',
  state: '',
  district: '',
  authority: '',
  onlyMeterApplicable: false,
  searchQuery: '',
};

export default function RentalTransitionWorkspace() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedForDetails, setSelectedForDetails] = useState(null);
  const [selectedForChecklist, setSelectedForChecklist] = useState(null);
  const [selectedForCorrection, setSelectedForCorrection] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [checklistVersion, setChecklistVersion] = useState(0);
  const [isLoading] = useState(false);

  const authorities = useMemo(() => getUniqueAuthorities(VERIFIED_RENTAL_TRANSITIONS), []);

  const { filteredTransitions, loadError } = useMemo(() => {
    try {
      return {
        filteredTransitions: filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, filters),
        loadError: null,
      };
    } catch (err) {
      return {
        filteredTransitions: [],
        loadError: err,
      };
    }
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleOpenPrintReport = (transition, checklistState, readiness) => {
    setSelectedForPrint({
      transition,
      checklistState,
      readiness,
    });
  };

  const handleChecklistStateChange = () => {
    setChecklistVersion((v) => v + 1);
  };

  return (
    <div className="section" style={{ padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '1150px', margin: '0 auto' }}>
        {/* Page Header */}
        <StandardPageHeader
          eyebrow="Civic Records &amp; Public Utilities"
          eyebrowIcon={<KeyRound size={15} style={{ color: 'var(--accent-main)' }} />}
          title="Rental Move-In &amp; Move-Out Civic Records Checklist"
          subtitle="Helping tenants and landlords systematically record dated utility meter readings, map municipal consumer IDs, verify address proof, and intimate civic authorities during occupancy changes."
          badgeText="Verified Civic Workflows"
          badgeType="accent"
        />

        {/* Scope Boundary & Ethical Guardrail Banner */}
        <div
          role="note"
          aria-label="Important information regarding rental civic transition checklist"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              Neutral Civic Transition Scope:
            </strong>{' '}
            Civic Help Setu organizes public-service account transfers, dated meter reading baselines, and statutory address updates.
            We <em>do not arbitrate contractual security deposit disputes, lease monetary deductions, or damages claims</em>.
            Your meter readings and private photo notes remain strictly inside your browser's local storage.
          </div>
        </div>

        {/* Filters */}
        <RentalFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          authorities={authorities}
          totalCount={filteredTransitions.length}
        />

        {/* Workspace Body */}
        {isLoading ? (
          <RentalSkeleton />
        ) : loadError ? (
          <RentalErrorState message={loadError?.message} onRetry={handleResetFilters} />
        ) : filteredTransitions.length === 0 ? (
          <RentalEmptyState onReset={handleResetFilters} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredTransitions.map((transition) => {
              const checklist = readRentalChecklist(transition.id);

              return (
                <RentalTransitionCard
                  key={`${transition.id}-${checklistVersion}`}
                  transition={transition}
                  checklistState={checklist}
                  onInspect={(t) => setSelectedForDetails(t)}
                  onOpenChecklist={(t) => setSelectedForChecklist(t)}
                  onOpenCorrection={(t) => setSelectedForCorrection(t)}
                />
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedForDetails && (
          <RentalDetailModal
            transition={selectedForDetails}
            isOpen={Boolean(selectedForDetails)}
            onClose={() => setSelectedForDetails(null)}
            onOpenChecklist={(t) => setSelectedForChecklist(t)}
          />
        )}

        {/* Checklist Modal */}
        {selectedForChecklist && (
          <RentalChecklistModal
            key={selectedForChecklist.id}
            transition={selectedForChecklist}
            isOpen={Boolean(selectedForChecklist)}
            onClose={() => setSelectedForChecklist(null)}
            onOpenPrintReport={handleOpenPrintReport}
            onStateChange={handleChecklistStateChange}
          />
        )}

        {/* Correction Modal */}
        {selectedForCorrection && (
          <RentalCorrectionModal
            transition={selectedForCorrection}
            isOpen={Boolean(selectedForCorrection)}
            onClose={() => setSelectedForCorrection(null)}
          />
        )}

        {/* Printable Summary Report Modal */}
        {selectedForPrint && (
          <RentalPrintSummaryModal
            transition={selectedForPrint.transition}
            checklistState={selectedForPrint.checklistState}
            readiness={selectedForPrint.readiness}
            isOpen={Boolean(selectedForPrint)}
            onClose={() => setSelectedForPrint(null)}
          />
        )}
      </div>
    </div>
  );
}
