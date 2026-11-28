import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ServicePrintPacketModal from './ServicePrintPacketModal';

describe('ServicePrintPacketModal', () => {
  const mockService = {
    title: 'Income Certificate',
    category: 'Revenue & Social Welfare',
    processingTime: '15 Days',
    documents: ['Aadhaar Card', 'Ration Card', 'Salary Slip'],
  };

  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <ServicePrintPacketModal isOpen={false} onClose={() => {}} service={mockService} />
    );
    expect(html).toBe('');
  });

  it('renders service details, checklist table and CSC slip when open', () => {
    const html = renderToStaticMarkup(
      <ServicePrintPacketModal isOpen={true} onClose={() => {}} service={mockService} />
    );
    expect(html).toContain('Physical Application Packet Checklist');
    expect(html).toContain('Income Certificate');
    expect(html).toContain('Aadhaar Card');
    expect(html).toContain('Ration Card');
    expect(html).toContain('Salary Slip');
    expect(html).toContain('CSC / Tehsil Submission Acknowledgement Slip');
    expect(html).toContain('Photograph Specs');
    expect(html).toContain('Print Checklist Packet');
  });

  it('prints the published eligibility, steps, fees, sources, warnings and verification date', () => {
    const html = renderToStaticMarkup(
      <ServicePrintPacketModal
        isOpen={true}
        onClose={() => {}}
        service={{
          ...mockService,
          eligibility: ['Resident of the district'],
          steps: [{ title: 'Apply', description: 'Submit the form' }],
          fees: 'Free within 21 days',
          officialSources: [{ name: 'Portal', url: 'https://example.gov.in/apply' }],
          warnings: ['Check the counter timings'],
          lastVerified: '2026-11-05',
        }}
      />
    );
    for (const text of [
      'Resident of the district',
      'Submit the form',
      'Free within 21 days',
      'Portal: https://example.gov.in/apply',
      'Check the counter timings',
      '2026-11-05',
    ]) {
      expect(html).toContain(text);
    }
  });

  it('says what is not listed instead of inventing documents or timelines', () => {
    const html = renderToStaticMarkup(
      <ServicePrintPacketModal isOpen={true} onClose={() => {}} service={{ title: 'General Service' }} />
    );
    expect(html).toContain('Physical Application Packet Checklist');
    expect(html).toContain('Not listed in this guide. Confirm with the official source.');
    expect(html).toContain('Last verified: not recorded');
    expect(html).not.toContain('Aadhaar');
    expect(html).not.toContain('15-21 Days');
  });
});
