import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NfsaCaseSummaryCard from './NfsaCaseSummaryCard';

describe('NfsaCaseSummaryCard', () => {
  it('renders empty state when no cases exist', () => {
    const html = renderToStaticMarkup(
      <NfsaCaseSummaryCard cases={[]} onSelectCaseForDraft={vi.fn()} onDeleteCase={vi.fn()} />
    );
    expect(html).toContain('No ration grievances recorded in vault yet');
    expect(html).toContain('NFSA Ration Dispute Vault (0)');
    expect(html).toContain('Statutory Notice &amp; Advisory');
  });

  it('renders case items and action buttons', () => {
    const cases = [
      {
        id: 'CASE-001',
        title: 'Biometric Rejection at FPS 142',
        beneficiaryName: 'Rameshwar Lal',
        maskedRationCard: 'RC-12****34',
        deficitKg: 20,
        fsaAmount: 450,
        integritySeal: 'NFSA-1234567890ABCDEF',
        selectedViolations: ['Refusal of biometric fallback']
      }
    ];

    const html = renderToStaticMarkup(
      <NfsaCaseSummaryCard cases={cases} onSelectCaseForDraft={vi.fn()} onDeleteCase={vi.fn()} />
    );
    expect(html).toContain('Biometric Rejection at FPS 142');
    expect(html).toContain('Rameshwar Lal');
    expect(html).toContain('Deficit: 20 kg');
    expect(html).toContain('FSA Due: ₹450');
    expect(html).toContain('Draft Petition');
  });
});
