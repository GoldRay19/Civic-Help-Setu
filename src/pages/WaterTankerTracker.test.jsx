import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import WaterTankerTracker from './WaterTankerTracker';
import WaterTankerAuthorityCard from '../components/waterTanker/WaterTankerAuthorityCard';
import WaterTankerRequestModal from '../components/waterTanker/WaterTankerRequestModal';
import WaterTankerEscalationModal from '../components/waterTanker/WaterTankerEscalationModal';
import WaterTankerChecklistModal from '../components/waterTanker/WaterTankerChecklistModal';
import WaterTankerEmptyState from '../components/waterTanker/WaterTankerEmptyState';
import WaterTankerErrorState from '../components/waterTanker/WaterTankerErrorState';
import { ToastProvider } from '../context/ToastContext';
import { VERIFIED_WATER_TANKER_AUTHORITIES } from '../data/waterTankerAuthorities';
import { filterWaterAuthorities } from '../services/waterTankerService';

describe('WaterTankerTracker & Components (#724)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    });
  });

  const renderTracker = () => {
    return renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <WaterTankerTracker />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders tracker page header, anti-hallucination safeguards, and verified authority cards', () => {
    const html = renderTracker();

    expect(html).toContain('Municipal Water-Tanker Request &amp; Delivery Tracker');
    expect(html).toContain('Verified Government Data');
    expect(html).toContain('Anti-Hallucination &amp; Privacy Safeguards');
    expect(html).toContain('Delhi Jal Board');
    expect(html).toContain('Bangalore Water Supply and Sewerage Board');
  });

  it('isolates jurisdictions when filtering without cross-city leakage', () => {
    const delhi = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { city: 'Delhi' });
    expect(delhi.length).toBeGreaterThanOrEqual(1);
    delhi.forEach((a) => expect(a.city).toBe('Delhi'));

    const bengaluru = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { city: 'Bengaluru' });
    expect(bengaluru.length).toBeGreaterThanOrEqual(1);
    bengaluru.forEach((a) => expect(a.city).toBe('Bengaluru'));

    // Check disjoint sets
    const delhiIds = new Set(delhi.map((d) => d.id));
    bengaluru.forEach((b) => {
      expect(delhiIds.has(b.id)).toBe(false);
    });
  });

  it('renders authority card with official booking channels, rates, and verification status', () => {
    const sampleAuth = VERIFIED_WATER_TANKER_AUTHORITIES[0];
    const html = renderToStaticMarkup(
      <WaterTankerAuthorityCard
        authority={sampleAuth}
        onLogRequest={() => {}}
        onOpenChecklist={() => {}}
        onOpenEscalation={() => {}}
        onOpenReport={() => {}}
      />
    );

    expect(html).toContain('Delhi Jal Board (DJB) - Central Division');
    expect(html).toContain('DJB');
    expect(html).toContain('Statutory Tariff &amp; Rates');
    expect(html).toContain('Official Request Channels');
    expect(html).toContain('Log / Track Request');
    expect(html).toContain('Prep Checklist');
    expect(html).toContain('Non-Delivery Escalation');
  });

  it('renders empty and error states cleanly', () => {
    const emptyHtml = renderToStaticMarkup(
      <WaterTankerEmptyState onResetFilters={() => {}} />
    );
    expect(emptyHtml).toContain('No Municipal Water Authorities Match Your Filters');
    expect(emptyHtml).toContain('Reset All Filters');

    const errorHtml = renderToStaticMarkup(
      <WaterTankerErrorState error={new Error('Data feed connection timeout')} onRetry={() => {}} />
    );
    expect(errorHtml).toContain('Unable to Load Water Authority Records');
    expect(errorHtml).toContain('Data feed connection timeout');
  });

  it('renders request logging modal with zero-PII protected banner', () => {
    const sampleAuth = VERIFIED_WATER_TANKER_AUTHORITIES[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <WaterTankerRequestModal
          isOpen={true}
          onClose={() => {}}
          authority={sampleAuth}
        />
      </ToastProvider>
    );

    expect(html).toContain('Personal Water-Tanker Request Log');
    expect(html).toContain('Local Privacy Protected');
    expect(html).toContain('Exact house and flat numbers are masked');
    expect(html).toContain('Log New Request');
  });

  it('renders escalation modal with tiered grievance matrix and printable letter preview', () => {
    const sampleAuth = VERIFIED_WATER_TANKER_AUTHORITIES[0];
    const html = renderToStaticMarkup(
      <WaterTankerEscalationModal
        isOpen={true}
        onClose={() => {}}
        authority={sampleAuth}
      />
    );

    expect(html).toContain('Non-Delivery Escalation &amp; Representation');
    expect(html).toContain('Statutory Escalation Protocol');
    expect(html).toContain('Tier 1');
    expect(html).toContain('Print Follow-up Letter');
    expect(html).toContain('Zero-PII Compliant');
  });

  it('renders delivery checklist modal with progress indicator', () => {
    const sampleAuth = VERIFIED_WATER_TANKER_AUTHORITIES[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <WaterTankerChecklistModal
          isOpen={true}
          onClose={() => {}}
          authority={sampleAuth}
        />
      </ToastProvider>
    );

    expect(html).toContain('Delivery Readiness Checklist');
    expect(html).toContain('Readiness Progress');
    expect(html).toContain('Underground sump');
    expect(html).toContain('Delete Saved Checklist Data');
  });
});

