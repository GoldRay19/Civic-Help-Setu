import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import FairPriceShopBoard from './FairPriceShopBoard';
import PdsShopDetailModal from '../components/pds/PdsShopDetailModal';
import PdsChecklistModal from '../components/pds/PdsChecklistModal';
import PdsObservationModal from '../components/pds/PdsObservationModal';
import PdsEmptyState from '../components/pds/PdsEmptyState';
import PdsErrorState from '../components/pds/PdsErrorState';
import { ToastProvider } from '../context/ToastContext';
import { VERIFIED_PDS_SHOPS } from '../data/pdsShops';
import { filterPdsShops } from '../services/pdsShopService';

describe('FairPriceShopBoard & Components (#723)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
  });

  const renderBoard = () => {
    return renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <FairPriceShopBoard />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders directory heading, ethical compass banner, and verified shop cards', () => {
    const html = renderBoard();

    expect(html).toContain('Fair Price Shop Service Information Board');
    expect(html).toContain('Official Govt. Sourced');
    expect(html).toContain('does not claim live grain stock balances');
    expect(html).toContain('Fair Price Shop No. 101 - Paharganj');
    expect(html).toContain('DL-FPS-101-CEN');
    expect(html).toContain('ONORC Active');
  });

  it('isolates jurisdictions when filtering without cross-state or cross-district leakage', () => {
    const delhiShops = filterPdsShops(VERIFIED_PDS_SHOPS, { state: 'Delhi' });
    expect(delhiShops.length).toBeGreaterThan(0);
    delhiShops.forEach((s) => expect(s.state).toBe('Delhi'));

    const karnatakaShops = filterPdsShops(VERIFIED_PDS_SHOPS, { state: 'Karnataka' });
    expect(karnatakaShops.length).toBeGreaterThan(0);
    karnatakaShops.forEach((s) => expect(s.state).toBe('Karnataka'));

    // Check disjoint IDs
    const delhiIds = new Set(delhiShops.map((s) => s.id));
    karnatakaShops.forEach((s) => {
      expect(delhiIds.has(s.id)).toBe(false);
    });
  });

  it('renders PdsShopDetailModal with official timings, statutory NFSA quotas, ONORC rules, and provenance', () => {
    const shop = VERIFIED_PDS_SHOPS[0];
    const html = renderToStaticMarkup(
      <PdsShopDetailModal
        isOpen={true}
        onClose={() => {}}
        shop={shop}
        onOpenChecklist={() => {}}
        onOpenObservation={() => {}}
      />
    );

    expect(html).toContain(shop.name);
    expect(html).toContain('Official PDS Information Policy:');
    expect(html).toContain('Live grain stock levels are');
    expect(html).toContain('Official Operating Schedule');
    expect(html).toContain('Statutory NFSA Entitlements');
    expect(html).toContain('Antyodaya Anna Yojana (AAY)');
    expect(html).toContain('Priority Households (PHH)');
    expect(html).toContain('One Nation One Ration Card (ONORC) Portability');
    expect(html).toContain('National PDS Helpline:');
    expect(html).toContain('1967');
    expect(html).toContain('Prerequisite Documents &amp; Verification Status');
    expect(html).toContain('Nominee / Proxy Authorization Form');
    expect(html).toContain('Conditional Requirement');
    expect(html).toContain('Local Ward Residence / Domicile Certificate');
    expect(html).toContain('Not Verified by Circular');
    expect(html).toContain('annavitran.nic.in');
  });

  it('renders PdsChecklistModal with privacy notice, checklist tasks, and delete action', () => {
    const shop = VERIFIED_PDS_SHOPS[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PdsChecklistModal
          isOpen={true}
          onClose={() => {}}
          shop={shop}
        />
      </ToastProvider>
    );

    expect(html).toContain('Ration Lifting &amp; Portability Checklist');
    expect(html).toContain('Client Privacy Guarantee:');
    expect(html).toContain('Carry original physical Ration Card or Mera Ration digital QR card');
    expect(html).toContain('Demand and collect printed e-POS transaction receipt with quota breakdown');
    expect(html).toContain('Delete Saved Data');
  });

  it('renders PdsObservationModal with zero PII warning and observation categories', () => {
    const shop = VERIFIED_PDS_SHOPS[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PdsObservationModal
          isOpen={true}
          onClose={() => {}}
          shop={shop}
        />
      </ToastProvider>
    );

    expect(html).toContain('Report Dated Citizen Observation');
    expect(html).toContain('Zero PII Protection:');
    expect(html).toContain('Ration Card number');
    expect(html).toContain('Aadhaar');
    expect(html).toContain('Shop Closure / Operating Hours Deviation');
    expect(html).toContain('Submit Observation');
  });

  it('renders PdsEmptyState with fail-closed non-speculative message and reset action', () => {
    const html = renderToStaticMarkup(<PdsEmptyState onReset={() => {}} />);
    expect(html).toContain('No Official Fair Price Shops Found');
    expect(html).toContain('Civic Help Setu does not guess or interpolate unverified shop locations');
    expect(html).toContain('Reset Filters');
  });

  it('renders PdsErrorState with accessible alert role and retry action', () => {
    const html = renderToStaticMarkup(<PdsErrorState message="Sourced service down" onRetry={() => {}} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Unable to Load Official PDS Records');
    expect(html).toContain('Sourced service down');
    expect(html).toContain('Retry Sourced Load');
  });

  it('renders stale-data warning badge when a shop audit is overdue (> 180 days)', () => {
    const html = renderBoard();
    expect(html).toContain('Audit overdue (&gt; 180 days)');
  });
});
