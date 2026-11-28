import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Schedule4AuditorCard from './Schedule4AuditorCard.jsx';

describe('Schedule4AuditorCard Component (#1339)', () => {
  it('renders standard header and criteria titles', () => {
    const html = renderToStaticMarkup(
      <Schedule4AuditorCard checks={{}} />
    );

    expect(html).toContain('FSSAI Schedule 4 Sanitary &amp; Hygiene Auditor');
    expect(html).toContain('Potable Water Testing');
    expect(html).toContain('Cold-Chain Monitoring');
    expect(html).toContain('Mandatory');
  });

  it('displays compliance score and critical risk badge on failure', () => {
    const html = renderToStaticMarkup(
      <Schedule4AuditorCard
        checks={{
          potable_water: false,
          cold_chain: false,
          medical_fitness: true,
        }}
      />
    );

    expect(html).toContain('CRITICAL_RISK');
    expect(html).toContain('Critical Non-Compliance Detected');
  });

  it('displays A+ badge when all checks are passed', () => {
    const allChecks = {
      potable_water: true,
      cold_chain: true,
      medical_fitness: true,
      pest_control: true,
      cross_contamination: true,
      oil_quality: true,
      waste_disposal: true,
      traceability: true,
    };

    const html = renderToStaticMarkup(
      <Schedule4AuditorCard checks={allChecks} />
    );

    expect(html).toContain('100%');
    expect(html).toContain('A+');
  });
});
