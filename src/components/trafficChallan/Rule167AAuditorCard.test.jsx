import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Rule167AAuditorCard from './Rule167AAuditorCard.jsx';

describe('Rule167AAuditorCard Component (#1340)', () => {
  it('renders standard header, criteria titles, and mandatory tags', () => {
    const html = renderToStaticMarkup(
      <Rule167AAuditorCard checks={{}} daysToService={0} />
    );

    expect(html).toContain('Rule 167A Electronic Monitoring Compliance Auditor');
    expect(html).toContain('High-Resolution Legible Registration Plate');
    expect(html).toContain('Annual Calibration Certificate');
    expect(html).toContain('Mandatory');
    expect(html).toContain('Statutory 15-Day Service Rule');
  });

  it('renders fatal defect banner when mandatory criteria fail', () => {
    const html = renderToStaticMarkup(
      <Rule167AAuditorCard
        checks={{
          clear_number_plate: false,
          annual_calibration: false,
        }}
        daysToService={20}
      />
    );

    expect(html).toContain('Evidentiary Inadmissibility');
    expect(html).toContain('Delayed &gt; 15 Days');
  });

  it('displays 100% score and compliant status when all criteria pass within 15 days', () => {
    const allChecks = {
      clear_number_plate: true,
      vehicle_characteristics: true,
      lane_demarcation: true,
      exact_gps_location: true,
      precise_timestamp: true,
      annual_calibration: true,
    };

    const html = renderToStaticMarkup(
      <Rule167AAuditorCard checks={allChecks} daysToService={4} />
    );

    expect(html).toContain('100%');
    expect(html).toContain('Statutorily Compliant Evidence');
  });
});
