import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TrafficChallanDrafterModal from './TrafficChallanDrafterModal.jsx';

describe('TrafficChallanDrafterModal Component (#1340)', () => {
  const sampleCase = {
    id: 'challan-case-101',
    ownerName: 'Vikramaditya Rao',
    ownerContact: 'vikram@example.com / 9845012345',
    ownerAddress: 'Indiranagar, Bengaluru',
    vehicleNumber: 'KA-01-MJ-4099',
    vehicleClass: 'Motor Car (LMV)',
    challanNumber: 'KA26110998341A',
    challanDate: '2026-02-18',
    challanTime: '14:22:10',
    fineAmount: 2000,
    allegedOffence: 'Section 183 - Excessive Speed',
    location: 'Outer Ring Road, Bengaluru',
    selectedDefects: ['uncalibrated_camera'],
    alibiDetails: 'Vehicle was parked at Airport.',
  };

  it('renders modal header, tab buttons, and draft editor', () => {
    const html = renderToStaticMarkup(
      <TrafficChallanDrafterModal caseData={sampleCase} onClose={() => {}} />
    );

    expect(html).toContain('Traffic Challan Section 208 Dispute &amp; Petition Drafter');
    expect(html).toContain('Virtual Court Contest Petition (Sec 208)');
    expect(html).toContain('Traffic Police Nodal Grievance');
    expect(html).toContain('Vikramaditya Rao');
    expect(html).toContain('KA-01-MJ-4099');
  });

  it('renders statutory notice and disclaimer in footer', () => {
    const html = renderToStaticMarkup(
      <TrafficChallanDrafterModal caseData={sampleCase} onClose={() => {}} />
    );

    expect(html).toContain('Statutory Notice: This draft is generated locally for citizen legal advocacy');
  });
});
