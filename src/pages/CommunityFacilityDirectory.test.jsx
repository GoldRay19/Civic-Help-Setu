import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CommunityFacilityDirectory from './CommunityFacilityDirectory';
import FacilityCard from '../components/communityFacility/FacilityCard';
import FacilityDetailModal from '../components/communityFacility/FacilityDetailModal';
import FacilityBookingChecklistModal from '../components/communityFacility/FacilityBookingChecklistModal';
import FacilityEmptyState from '../components/communityFacility/FacilityEmptyState';
import FacilityErrorState from '../components/communityFacility/FacilityErrorState';
import { ToastProvider } from '../context/ToastContext';
import { VERIFIED_COMMUNITY_FACILITIES } from '../data/communityFacilities';
import { filterCommunityFacilities } from '../services/communityFacilityService';
import { createChecklistSession, readChecklist } from '../services/checklistStorage';

describe('CommunityFacilityDirectory & Components (#716)', () => {
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
          <CommunityFacilityDirectory />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders directory heading, live-slot disclaimer banner, and verified facility cards', () => {
    const html = renderDirectory();

    expect(html).toContain('Community Facility Booking &amp; Permit Directory');
    expect(html).toContain('Verified Government Data');
    expect(html).toContain('Notice on Live Booking Availability');
    expect(html).toContain('Dr. S.P. Mukherjee Civic Centre Auditorium');
    expect(html).toContain('Municipal Corporation of Delhi (MCD)');
  });

  it('isolates jurisdictions when filtering without cross-state leakage', () => {
    const delhiFacilities = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
      state: 'Delhi',
    });
    expect(delhiFacilities.length).toBeGreaterThan(0);
    delhiFacilities.forEach((f) => expect(f.state).toBe('Delhi'));

    const karnatakaFacilities = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
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

  it('renders FacilityDetailModal with permitted uses, tariffs, security deposits, cancellations, and permits', () => {
    const facility = VERIFIED_COMMUNITY_FACILITIES[0];
    const html = renderToStaticMarkup(
      <FacilityDetailModal
        isOpen={true}
        onClose={() => {}}
        facility={facility}
        onOpenChecklist={() => {}}
      />
    );

    expect(html).toContain(facility.name);
    expect(html).toContain('Permitted &amp; Prohibited Activities');
    expect(html).toContain('Statutory Rental Tariffs');
    expect(html).toContain('Refundable Security Deposit');
    expect(html).toContain('Cancellation &amp; Refund Schedule');
    expect(html).toContain('Delhi Police Special Branch Permission');
    expect(html).toContain('Official Municipal Source &amp; Audit Provenance:');
  });

  it('renders FacilityBookingChecklistModal with client-side privacy notice and items', () => {
    const facility = VERIFIED_COMMUNITY_FACILITIES[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <FacilityBookingChecklistModal
          isOpen={true}
          onClose={() => {}}
          facility={facility}
        />
      </ToastProvider>
    );

    expect(html).toContain('Facility Booking Preparation Checklist');
    expect(html).toContain('Checklist progress is saved exclusively to your browser');
    expect(html).toContain('Clear My Checklist Data');
  });

  it('displays explicit unavailable-data state when cancellation or deposit is unpublished', () => {
    const unverifiedFacility = VERIFIED_COMMUNITY_FACILITIES.find(
      (f) => f.id === 'ghaziabad-gda-madhuban-bapudham-open-ground'
    );
    expect(unverifiedFacility.cancellationPolicy.isAvailable).toBe(false);

    const html = renderToStaticMarkup(
      <FacilityDetailModal
        isOpen={true}
        onClose={() => {}}
        facility={unverifiedFacility}
        onOpenChecklist={() => {}}
      />
    );

    expect(html).toContain('Official cancellation schedule is unpublished for this facility');
  });

  it('ensures all jurisdiction claims link to a dated official government source', () => {
    VERIFIED_COMMUNITY_FACILITIES.forEach((facility) => {
      expect(facility.auditMetadata).toBeDefined();
      expect(facility.auditMetadata.sourceUrl).toMatch(/^https:\/\//);
      expect(facility.auditMetadata.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(facility.auditMetadata.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(facility.auditMetadata.verifiedBy.length).toBeGreaterThan(0);
    });
  });

  it('allows users to save, reopen, edit, and delete checklist progress in storage', () => {
    let store = {};
    const memoryStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; },
    };

    const id = 'community_facility_checklist_test';
    const items = ['Task 1', 'Task 2', 'Task 3'];

    const session = createChecklistSession({
      id,
      items,
      storage: memoryStorage,
      schedule: (fn) => fn(),
    });
    expect(session.getState().checked).toEqual([]);

    // Toggle Task 1
    session.toggle('Task 1');
    expect(session.getState().checked).toContain('Task 1');

    // Reopen in another session
    const reopened = createChecklistSession({
      id,
      items,
      storage: memoryStorage,
      schedule: (fn) => fn(),
    });
    expect(reopened.getState().checked).toContain('Task 1');

    // Wipe/delete data
    reopened.deleteChecklistData();
    expect(reopened.getState().checked).toEqual([]);

    const afterDelete = readChecklist(id, memoryStorage);
    expect(afterDelete.checked).toEqual([]);
  });

  it('renders FacilityEmptyState and FacilityErrorState with accessible roles', () => {
    const emptyHtml = renderToStaticMarkup(<FacilityEmptyState onReset={() => {}} />);
    expect(emptyHtml).toContain('role="status"');
    expect(emptyHtml).toContain('No Verified Public Facilities Found');

    const errorHtml = renderToStaticMarkup(<FacilityErrorState error={new Error('Network failure')} onRetry={() => {}} />);
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain('Network failure');
  });
});

