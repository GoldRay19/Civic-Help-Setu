import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import TenderReadinessWorkspace from './TenderReadinessWorkspace';
import TenderDetailModal from '../components/tender/TenderDetailModal';
import TenderEvidenceChecklistModal from '../components/tender/TenderEvidenceChecklistModal';
import TenderPrintReportModal from '../components/tender/TenderPrintReportModal';
import TenderEmptyState from '../components/tender/TenderEmptyState';
import TenderErrorState from '../components/tender/TenderErrorState';
import TenderSkeleton from '../components/tender/TenderSkeleton';
import { ToastProvider } from '../context/ToastContext';
import { VERIFIED_GOVERNMENT_TENDERS } from '../data/tenders';
import { filterTenders } from '../services/tenderService';

describe('TenderReadinessWorkspace & Components (#722)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
  });

  const renderWorkspace = () => {
    return renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <TenderReadinessWorkspace />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders workspace title, non-transactional banner, and verified tender cards', () => {
    const html = renderWorkspace();

    expect(html).toContain('Tender Participation Readiness Workspace');
    expect(html).toContain('Non-Transactional Readiness Guardrail:');
    expect(html).toContain('Dates are extracted');
    expect(html).toContain('Supply and Installation of Solar Hybrid Inverters');
    expect(html).toContain('Ministry of New and Renewable Energy');
    expect(html).toContain('GEM/2026/B/581902');
  });

  it('filters by jurisdiction and state without cross-state leakage (#722 req 15)', () => {
    const national = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { jurisdictionLevel: 'national' });
    expect(national.length).toBeGreaterThan(0);
    expect(national.every((t) => t.jurisdiction.level === 'national')).toBe(true);

    const karnataka = filterTenders(VERIFIED_GOVERNMENT_TENDERS, {
      jurisdictionLevel: 'state',
      state: 'Karnataka',
    });
    expect(karnataka.length).toBeGreaterThan(0);
    expect(karnataka.every((t) => t.jurisdiction.states.includes('Karnataka'))).toBe(true);

    const maharashtra = filterTenders(VERIFIED_GOVERNMENT_TENDERS, {
      state: 'Maharashtra',
    });
    expect(maharashtra.length).toBeGreaterThan(0);
    expect(maharashtra.some((t) => t.id === 'mahatenders-pwd-2026-1189')).toBe(true);

    // Verify distinct sets
    const karnatakaIds = new Set(karnataka.map((t) => t.id));
    maharashtra.forEach((t) => {
      if (t.jurisdiction.level !== 'national') {
        expect(karnatakaIds.has(t.id)).toBe(false);
      }
    });
  });

  it('renders TenderDetailModal with mandatory eligibility strictly separated from preferences (#722 req 3)', () => {
    const tender = VERIFIED_GOVERNMENT_TENDERS[0];
    const html = renderToStaticMarkup(
      <TenderDetailModal
        tender={tender}
        isOpen={true}
        onClose={() => {}}
        onOpenChecklist={() => {}}
        onOpenCorrection={() => {}}
        initialTab="eligibility"
      />
    );

    expect(html).toContain('GEM/2026/B/581902');
    expect(html).toContain('Dates &amp; Financials');
    expect(html).toContain('Eligibility &amp; Preferences');
    expect(html).toContain('Official Instructions vs Civic Notes');
    expect(html).toContain('Audit Provenance');
    expect(html).toContain('Mandatory Statutory Eligibility');
    expect(html).toContain('Evaluative Purchase Preferences &amp; MSME Quotas');
    expect(html).toContain('Valid GSTIN Registration');
    expect(html).toContain('DPIIT Order No. P-45021/2/2017-PP');
  });

  it('displays explicit unavailable-data state when notice omits dates or estimates (#722 req 7)', () => {
    // mahatenders-pwd-2026-1189 has unavailable closing date and undisclosed value
    const advanceTender = VERIFIED_GOVERNMENT_TENDERS.find((t) => t.id === 'mahatenders-pwd-2026-1189');
    const html = renderToStaticMarkup(
      <TenderDetailModal
        tender={advanceTender}
        isOpen={true}
        onClose={() => {}}
        onOpenChecklist={() => {}}
        onOpenCorrection={() => {}}
      />
    );

    expect(html).toContain('Date to be announced in forthcoming corrigendum');
    expect(html).toContain('Not Disclosed');
  });

  it('renders TenderEvidenceChecklistModal with score, exemption toggles, and deletion (#722 req 5, 10)', () => {
    const tender = VERIFIED_GOVERNMENT_TENDERS[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <TenderEvidenceChecklistModal
          tender={tender}
          isOpen={true}
          onClose={() => {}}
          onPrintReport={() => {}}
        />
      </ToastProvider>
    );

    expect(html).toContain('Vendor Readiness Evidence Checklist (#722)');
    expect(html).toContain('Participation Readiness Index');
    expect(html).toContain('Vendor Category &amp; Exemption Declarations');
    expect(html).toContain('Claiming MSME EMD / Tender Fee Exemption under GFR 170');
    expect(html).toContain('Valid GSTIN Registration');
    expect(html).toContain('Print Readiness Report');
    expect(html).toContain('Delete My Checklist Data');
    expect(html).toContain('Vendor Privacy Guarantee:');
  });

  it('renders TenderPrintReportModal with non-bidding disclaimer (#722 req 5)', () => {
    const tender = VERIFIED_GOVERNMENT_TENDERS[0];
    const html = renderToStaticMarkup(
      <TenderPrintReportModal
        tender={tender}
        checklistState={{ items: {}, msmeStatus: { isClaimingMsmeExemption: true } }}
        readiness={{ score: 75, completedCount: 3, totalMandatory: 4 }}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(html).toContain('CIVIC HELP SETU — TENDER READINESS DOSSIER');
    expect(html).toContain('DISCLAIMER: This document is generated for vendor self-preparation and internal audit only');
    expect(html).toContain('Readiness Score');
    expect(html).toContain('75%');
    expect(html).toContain('GEM/2026/B/581902');
  });

  it('renders empty, error, and loading states cleanly (#722 req 13)', () => {
    const emptyHtml = renderToStaticMarkup(<TenderEmptyState onReset={() => {}} />);
    expect(emptyHtml).toContain('No Official Tenders Found for Selected Criteria');

    const errorHtml = renderToStaticMarkup(<TenderErrorState message="Network failure" onRetry={() => {}} />);
    expect(errorHtml).toContain('Unable to Load Government Tender Data');
    expect(errorHtml).toContain('Network failure');

    const skeletonHtml = renderToStaticMarkup(<TenderSkeleton />);
    expect(skeletonHtml).toContain('aria-busy="true"');
  });
});
