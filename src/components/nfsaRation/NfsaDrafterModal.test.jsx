import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NfsaDrafterModal from './NfsaDrafterModal';

describe('NfsaDrafterModal', () => {
  it('returns null when closed', () => {
    const html = renderToStaticMarkup(<NfsaDrafterModal isOpen={false} onClose={vi.fn()} />);
    expect(html).toBe('');
  });

  it('renders modal tabs and generated petition content when open', () => {
    const html = renderToStaticMarkup(
      <NfsaDrafterModal
        isOpen={true}
        onClose={vi.fn()}
        initialCase={{
          beneficiaryName: 'Rameshwar Lal',
          maskedRationCard: 'RC-UP123456',
          deficitKg: 15,
          fsaAmount: 340
        }}
      />
    );

    expect(html).toContain('NFSA 2013 Statutory Grievance Drafter');
    expect(html).toContain('Section 15 DGRO Petition (ADM / SDO)');
    expect(html).toContain('Section 16 State Food Commission Appeal');
    expect(html).toContain('BEFORE THE DISTRICT GRIEVANCE REDRESSAL OFFICER');
    expect(html).toContain('Rameshwar Lal');
  });
});
