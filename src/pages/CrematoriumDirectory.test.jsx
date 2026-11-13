import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CrematoriumDirectory from './CrematoriumDirectory';
import CrematoriumCard from '../components/crematorium/CrematoriumCard';
import CrematoriumDetailModal from '../components/crematorium/CrematoriumDetailModal';
import BereavementChecklistModal from '../components/crematorium/BereavementChecklistModal';
import CrematoriumEmptyState from '../components/crematorium/CrematoriumEmptyState';
import CrematoriumErrorState from '../components/crematorium/CrematoriumErrorState';
import { ToastProvider } from '../context/ToastContext';
import { VERIFIED_CREMATORIUM_FACILITIES } from '../data/crematoriumFacilities';
import { filterCrematoriumFacilities } from '../services/crematoriumService';

describe('CrematoriumDirectory & Components (#728)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
  });

  const renderDirectory = () => {
    return renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <CrematoriumDirectory />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders directory heading, ethical compass banner, and verified facility cards', () => {
    const html = renderDirectory();

    expect(html).toContain('Public Crematoriums &amp; Burial Grounds');
    expect(html).toContain('Verified Government Data');
    expect(html).toContain('Live slot availability is not tracked');
    expect(html).toContain('Nigambodh Ghat Crematorium Complex');
    expect(html).toContain('Municipal Corporation of Delhi (MCD)');
  });

  it('isolates jurisdictions when filtering without cross-state leakage', () => {
    const delhiFacilities = filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, {
      state: 'Delhi',
    });
    expect(delhiFacilities.length).toBeGreaterThan(0);
    delhiFacilities.forEach((f) => expect(f.state).toBe('Delhi'));

    const karnatakaFacilities = filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, {
      state: 'Karnataka',
    });
    expect(karnatakaFacilities.length).toBeGreaterThan(0);
    karnatakaFacilities.forEach((f) => expect(f.state).toBe('Karnataka'));

    // Verify disjoint sets
    const delhiIds = new Set(delhiFacilities.map((f) => f.id));
    karnatakaFacilities.forEach((f) => {
      expect(delhiIds.has(f.id)).toBe(false);
    });
  });

  it('renders CrematoriumDetailModal with official procedures, statutory charges, and provenance', () => {
    const facility = VERIFIED_CREMATORIUM_FACILITIES[0];
    const html = renderToStaticMarkup(
      <CrematoriumDetailModal
        isOpen={true}
        onClose={() => {}}
        facility={facility}
        onOpenChecklist={() => {}}
      />
    );

    expect(html).toContain(facility.name);
    expect(html).toContain('Official Admission &amp; Booking Procedures');
    expect(html).toContain('Statutory Municipal Charges');
    expect(html).toContain('Doctor / Hospital Death Certificate (Form 4/4A)');
    expect(html).toContain('Official Source &amp; Audit Provenance:');
    expect(html).toContain('Live Availability Disclaimer:');
  });

  it('renders BereavementChecklistModal with privacy notice and checklist items', () => {
    const facility = VERIFIED_CREMATORIUM_FACILITIES[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <BereavementChecklistModal
          isOpen={true}
          onClose={() => {}}
          facility={facility}
        />
      </ToastProvider>
    );

    expect(html).toContain('Last Rites &amp; Documentation Checklist');
    expect(html).toContain('Checklist progress is kept strictly private in your local browser');
    expect(html).toContain('Hospital / Doctor Medical Certificate of Cause of Death (Form 4/4A)');
    expect(html).toContain('Delete Saved Checklist');
  });

  it('renders CrematoriumEmptyState with fail-closed non-speculative message', () => {
    const html = renderToStaticMarkup(
      <CrematoriumEmptyState onReset={() => {}} onSuggest={() => {}} />
    );

    expect(html).toContain('No Verified Facilities Found in Selected Filters');
    expect(html).toContain('We do not extrapolate or guess facilities when official data is absent');
    expect(html).toContain('Reset Search &amp; Filters');
  });

  it('renders CrematoriumErrorState with accessible alert role and retry button', () => {
    const html = renderToStaticMarkup(
      <CrematoriumErrorState error={new Error('Failed to fetch municipal registry')} onRetry={() => {}} />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('Unable to Load Verified Facility Directory');
    expect(html).toContain('Failed to fetch municipal registry');
    expect(html).toContain('Retry');
  });

  it('renders stale-data warning badge when a facility record audit is overdue (>180 days)', () => {
    const staleFacility = {
      ...VERIFIED_CREMATORIUM_FACILITIES[0],
      auditMetadata: {
        ...VERIFIED_CREMATORIUM_FACILITIES[0].auditMetadata,
        lastVerified: '2023-01-01', // definitely overdue
      },
    };

    const html = renderToStaticMarkup(
      <ToastProvider>
        <CrematoriumCard
          facility={staleFacility}
          onOpenDetails={() => {}}
          onOpenChecklist={() => {}}
          onOpenCorrection={() => {}}
        />
      </ToastProvider>
    );

    expect(html).toContain('Audit Overdue (Stale Record)');
  });
});
