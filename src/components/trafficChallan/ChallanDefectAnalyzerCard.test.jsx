import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChallanDefectAnalyzerCard from './ChallanDefectAnalyzerCard.jsx';

describe('ChallanDefectAnalyzerCard Component (#1340)', () => {
  it('renders defect options, severity badges, and analysis bar', () => {
    const html = renderToStaticMarkup(
      <ChallanDefectAnalyzerCard
        selectedDefects={['uncalibrated_camera', 'delayed_notice']}
        fineAmount={2000}
      />
    );

    expect(html).toContain('Challan Evidentiary Defects &amp; Grounds of Contest Analyzer');
    expect(html).toContain('Speed Camera Lacks Annual Legal Metrology Calibration Certificate');
    expect(html).toContain('FATAL');
    expect(html).toContain('Virtual Court');
    expect(html).toContain('₹2,000');
  });

  it('renders moderate contest strength when only non-fatal defect selected', () => {
    const html = renderToStaticMarkup(
      <ChallanDefectAnalyzerCard
        selectedDefects={['obscured_signage']}
        fineAmount={1000}
      />
    );

    expect(html).toContain('MODERATE CONTEST');
    expect(html).toContain('Traffic Police Nodal Grievance Portal');
  });
});
