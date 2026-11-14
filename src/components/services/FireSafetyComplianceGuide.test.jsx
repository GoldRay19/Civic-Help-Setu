import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FireSafetyComplianceGuide from './FireSafetyComplianceGuide';
import { FIRE_NOC_STAGE } from '../../data/fireSafetyComplianceData';

describe('FireSafetyComplianceGuide Component (#719)', () => {
  it('renders the scannable guide header and statutory non-engineering advisory disclaimer', () => {
    const html = renderToStaticMarkup(<FireSafetyComplianceGuide />);

    expect(html).toContain('Fire NOC &amp; Fire-Safety Compliance Preparation Guide');
    expect(html).toContain('NBC 2016 Part 4 &amp; State Fire Safety Compliance');
    expect(html).toContain('Non-Engineering Advisory Notice');
    expect(html).toContain('DOES NOT constitute authoritative fire-engineering advice');
  });

  it('renders jurisdiction selection, occupancy groups, and building dimension inputs', () => {
    const html = renderToStaticMarkup(<FireSafetyComplianceGuide />);

    expect(html).toContain('State &amp; Municipal Territory');
    expect(html).toContain('Building Occupancy Group');
    expect(html).toContain('Total Height (meters)');
    expect(html).toContain('Covered Floor Area (sq.m)');
    expect(html).toContain('Group E: Business / Commercial');
    expect(html).toContain('Delhi (NCT)');
  });

  it('renders verified fire directorate profile in overview tab for Delhi', () => {
    const html = renderToStaticMarkup(
      <FireSafetyComplianceGuide initialTab="overview" initialJurisdictionId="delhi" />
    );

    expect(html).toContain('Delhi Fire Service (DFS)');
    expect(html).toContain('Delhi Fire Service Act, 2007');
    expect(html).toContain('https://dfs.delhigovt.nic.in');
    expect(html).toContain('30 Working Days');
  });

  it('renders explicit unavailable-data state when unlisted jurisdiction is selected', () => {
    const html = renderToStaticMarkup(
      <FireSafetyComplianceGuide initialJurisdictionId="unspecified" />
    );

    expect(html).toContain('Uncatalogued / Unverified Fire Authority');
    expect(html).toContain('Directly contact the local Chief Fire Officer or municipal fire prevention wing');
  });

  it('renders categorized preparation checklist with official rules and legal basis in checklist tab', () => {
    const html = renderToStaticMarkup(
      <FireSafetyComplianceGuide initialTab="checklist" initialStage={FIRE_NOC_STAGE.PROVISIONAL_NOC} />
    );

    expect(html).toContain('Stage 1: Provisional Fire NOC');
    expect(html).toContain('Architectural &amp; Site Layout Plans');
    expect(html).toContain('MANDATORY');
    expect(html).toContain('NBC 2016 Part 4');
    expect(html).toContain('Save Checklist');
    expect(html).toContain('Reopen Saved');
    expect(html).toContain('Reset');
  });

  it('renders final occupancy systems in checklist tab for FINAL_FIRE_CERTIFICATE stage', () => {
    const html = renderToStaticMarkup(
      <FireSafetyComplianceGuide initialTab="checklist" initialStage={FIRE_NOC_STAGE.FINAL_FIRE_CERTIFICATE} />
    );

    expect(html).toContain('Stage 2: Final Fire Safety Certificate');
    expect(html).toContain('Active Fire-Fighting Installations &amp; Commissioning Reports');
    expect(html).toContain('Passive Fire Protection &amp; Compartmentation');
    expect(html).toContain('Main Electric, Standby Diesel, and Jockey Pump');
  });

  it('renders 3-stage lifecycle overview in stages tab', () => {
    const html = renderToStaticMarkup(
      <FireSafetyComplianceGuide initialTab="stages" />
    );

    expect(html).toContain('Stage 1: Provisional Fire NOC');
    expect(html).toContain('Stage 2: Final Fire Safety Certificate');
    expect(html).toContain('Stage 3: Periodic Fire NOC Renewal');
  });

  it('renders inspection and shortfall memo tracking tab', () => {
    const html = renderToStaticMarkup(
      <FireSafetyComplianceGuide initialTab="tracking" />
    );

    expect(html).toContain('Application &amp; Spot Inspection Milestone Tracker');
    expect(html).toContain('Official Submission Reference / Application Token');
    expect(html).toContain('Inspection Shortfalls &amp; Deficiency Memoranda');
    expect(html).toContain('Log Inspection Shortfall');
  });
});

