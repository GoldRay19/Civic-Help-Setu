import { useState, useMemo } from 'react';
import StandardPageHeader from '../components/common/StandardPageHeader';
import TenderCard from '../components/tender/TenderCard';
import TenderDetailModal from '../components/tender/TenderDetailModal';
import TenderEvidenceChecklistModal from '../components/tender/TenderEvidenceChecklistModal';
import TenderPrintReportModal from '../components/tender/TenderPrintReportModal';
import TenderCorrectionModal from '../components/tender/TenderCorrectionModal';
import TenderFilters from '../components/tender/TenderFilters';
import TenderEmptyState from '../components/tender/TenderEmptyState';
import TenderSkeleton from '../components/tender/TenderSkeleton';
import TenderErrorState from '../components/tender/TenderErrorState';
import { VERIFIED_GOVERNMENT_TENDERS } from '../data/tenders';
import {
  filterTenders,
  getUniqueAuthorities,
} from '../services/tenderService';
import { readTenderChecklist } from '../services/tenderChecklistStorage';
import { Briefcase, ShieldCheck } from 'lucide-react';

const INITIAL_FILTERS = {
  jurisdictionLevel: 'all',
  state: '',
  district: '',
  category: 'all',
  authority: '',
  onlyMsmeExempt: false,
  searchQuery: '',
  closingFilter: 'all',
};

export default function TenderReadinessWorkspace() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedTenderForDetails, setSelectedTenderForDetails] = useState(null);
  const [selectedTenderForChecklist, setSelectedTenderForChecklist] = useState(null);
  const [selectedTenderForCorrection, setSelectedTenderForCorrection] = useState(null);
  const [selectedPrintReportData, setSelectedPrintReportData] = useState(null);
  const [isLoading] = useState(false);

  const authorities = useMemo(() => getUniqueAuthorities(VERIFIED_GOVERNMENT_TENDERS), []);

  const { filteredTenders, loadError } = useMemo(() => {
    try {
      return {
        filteredTenders: filterTenders(VERIFIED_GOVERNMENT_TENDERS, filters),
        loadError: null,
      };
    } catch (err) {
      return {
        filteredTenders: [],
        loadError: err,
      };
    }
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleOpenPrintReport = (tender, checklistData, readiness) => {
    setSelectedPrintReportData({
      tender,
      checklistState: checklistData,
      readiness,
    });
  };

  return (
    <div className="section" style={{ padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '1150px', margin: '0 auto' }}>
        {/* Header */}
        <StandardPageHeader
          eyebrow="Government Public Procurement"
          eyebrowIcon={<Briefcase size={15} style={{ color: 'var(--accent-main)' }} />}
          title="Tender Participation Readiness Workspace"
          subtitle="Helping small suppliers, MSMEs, and startups inspect mandatory eligibility, verify EMD exemptions under GFR Rule 170, track corrigenda, and prepare evidence before bidding."
          badgeText="Verified Government Notices (#722)"
          badgeType="accent"
        />

        {/* Ethical / Non-transactional banner */}
        <div
          role="note"
          aria-label="Important information regarding tender readiness workspace"
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
              Non-Transactional Readiness Guardrail:
            </strong>{' '}
            Civic Help Setu organizes public procurement notices and statutory eligibility conditions without submitting bids or collecting bidding fees.
            Dates are extracted <em>only when clearly stated in the official notice</em>; unverified gaps are flagged explicitly rather than guessed.
            Your evidence checklists remain strictly in your local browser storage.
          </div>
        </div>

        {/* Filters */}
        <TenderFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          authorities={authorities}
          totalCount={filteredTenders.length}
        />

        {/* Workspace Body */}
        {isLoading ? (
          <TenderSkeleton />
        ) : loadError ? (
          <TenderErrorState message={loadError?.message} onRetry={handleResetFilters} />
        ) : filteredTenders.length === 0 ? (
          <TenderEmptyState onReset={handleResetFilters} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredTenders.map((tender) => {
              const checklist = readTenderChecklist(tender.id);

              return (
                <TenderCard
                  key={tender.id}
                  tender={tender}
                  checklistState={checklist}
                  onInspect={(t) => setSelectedTenderForDetails(t)}
                  onOpenChecklist={(t) => setSelectedTenderForChecklist(t)}
                  onOpenCorrection={(t) => setSelectedTenderForCorrection(t)}
                />
              );
            })}
          </div>
        )}

        {/* Modal Dialogs */}
        {selectedTenderForDetails && (
          <TenderDetailModal
            tender={selectedTenderForDetails}
            isOpen={Boolean(selectedTenderForDetails)}
            onClose={() => setSelectedTenderForDetails(null)}
            onOpenChecklist={(t) => setSelectedTenderForChecklist(t)}
            onOpenCorrection={(t) => setSelectedTenderForCorrection(t)}
          />
        )}

        {selectedTenderForChecklist && (
          <TenderEvidenceChecklistModal
            key={selectedTenderForChecklist.id}
            tender={selectedTenderForChecklist}
            isOpen={Boolean(selectedTenderForChecklist)}
            onClose={() => setSelectedTenderForChecklist(null)}
            onPrintReport={handleOpenPrintReport}
          />
        )}

        {selectedPrintReportData && (
          <TenderPrintReportModal
            tender={selectedPrintReportData.tender}
            checklistState={selectedPrintReportData.checklistState}
            readiness={selectedPrintReportData.readiness}
            isOpen={Boolean(selectedPrintReportData)}
            onClose={() => setSelectedPrintReportData(null)}
          />
        )}

        {selectedTenderForCorrection && (
          <TenderCorrectionModal
            tender={selectedTenderForCorrection}
            isOpen={Boolean(selectedTenderForCorrection)}
            onClose={() => setSelectedTenderForCorrection(null)}
          />
        )}
      </div>
    </div>
  );
}
