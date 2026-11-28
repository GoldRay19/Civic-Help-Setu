import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FoodSafetyCaseSummaryCard from './FoodSafetyCaseSummaryCard.jsx';
import { OFFICIAL_STATUS_DISCLAIMER } from '../../services/foodSafetyStorage.js';

describe('FoodSafetyCaseSummaryCard Component (#1339)', () => {
  const sampleCase = {
    id: 'fssai-case-101',
    productName: 'Paneer Butter Masala Packaged Meal',
    fboName: 'Royal Spice Cloud Kitchen',
    fboLicenseNumber: '11521038000412',
    batchNumber: 'BATCH-2026-K1',
    purchaseInvoice: 'INV-99214',
    purchaseDate: '2026-02-14',
    injuryTier: 'TEMPORARY_INJURY',
    actualMedicalBills: 6450,
    status: 'FBO_NOTICE_ISSUED',
  };

  it('renders product name, establishment details, and status', () => {
    const html = renderToStaticMarkup(
      <FoodSafetyCaseSummaryCard caseData={sampleCase} />
    );

    expect(html).toContain('Paneer Butter Masala Packaged Meal');
    expect(html).toContain('Royal Spice Cloud Kitchen');
    expect(html).toContain('11521038000412');
    expect(html).toContain('Draft Petition / Notice');
  });

  it('renders statutory disclaimer in case card', () => {
    const html = renderToStaticMarkup(
      <FoodSafetyCaseSummaryCard caseData={sampleCase} />
    );

    expect(html).toContain(OFFICIAL_STATUS_DISCLAIMER.replace('&', '&amp;'));
  });
});
