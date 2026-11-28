import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TrafficChallanSummaryCard from './TrafficChallanSummaryCard.jsx';
import { OFFICIAL_STATUS_DISCLAIMER } from '../../services/trafficChallanStorage.js';

describe('TrafficChallanSummaryCard Component (#1340)', () => {
  const sampleCase = {
    id: 'challan-case-101',
    ownerName: 'Vikramaditya Rao',
    vehicleNumber: 'KA-01-MJ-4099',
    vehicleClass: 'Motor Car (LMV)',
    challanNumber: 'KA26110998341A',
    challanDate: '2026-02-18',
    challanTime: '14:22:10',
    location: 'Outer Ring Road, Bengaluru',
    allegedOffence: 'Section 183 - Exceeding Speed Limit',
    fineAmount: 2000,
    status: 'VIRTUAL_COURT_CONTESTED',
    alibiDetails: 'Fastag toll verifies vehicle at airport.',
  };

  it('renders vehicle number, challan number, offence, and action buttons', () => {
    const html = renderToStaticMarkup(
      <TrafficChallanSummaryCard caseData={sampleCase} />
    );

    expect(html).toContain('KA-01-MJ-4099');
    expect(html).toContain('KA26110998341A');
    expect(html).toContain('Section 183');
    expect(html).toContain('₹2,000');
    expect(html).toContain('Draft Contest Petition');
  });

  it('renders statutory disclaimer in card footer', () => {
    const html = renderToStaticMarkup(
      <TrafficChallanSummaryCard caseData={sampleCase} />
    );

    expect(html).toContain(OFFICIAL_STATUS_DISCLAIMER.replace('&', '&amp;'));
  });
});
