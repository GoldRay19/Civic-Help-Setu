import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AdulterationPenaltyCalculatorCard from './AdulterationPenaltyCalculatorCard.jsx';

describe('AdulterationPenaltyCalculatorCard Component (#1339)', () => {
  it('renders violation checklist and statutory penalties', () => {
    const html = renderToStaticMarkup(
      <AdulterationPenaltyCalculatorCard
        selectedViolations={['substandard', 'extraneous_matter']}
        injuryTier="NONE"
      />
    );

    expect(html).toContain('Adulteration Statutory Penalty &amp; Section 65 Compensation Calculator');
    expect(html).toContain('Section 51');
    expect(html).toContain('Section 54');
    expect(html).toContain('Max Statutory Penalties');
  });

  it('renders Section 65 consumer compensation and interim relief for injury', () => {
    const html = renderToStaticMarkup(
      <AdulterationPenaltyCalculatorCard
        selectedViolations={['unsafe_food']}
        injuryTier="TEMPORARY_INJURY"
        actualMedicalBills={15000}
        daysHospitalized={2}
        lostWages={5000}
      />
    );

    expect(html).toContain('Section 65 Consumer Compensation');
    expect(html).toContain('₹1,20,000'); // 100k base + 15k med + 5k wages
    expect(html).toContain('Includes mandatory interim relief');
    expect(html).toContain('Special Food Court');
  });
});
