import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FoodSafetyDrafterModal from './FoodSafetyDrafterModal.jsx';

describe('FoodSafetyDrafterModal Component (#1339)', () => {
  const sampleCase = {
    id: 'fssai-case-101',
    productName: 'Paneer Butter Masala Packaged Meal',
    fboName: 'Royal Spice Cloud Kitchen',
    fboAddress: 'Baner, Pune',
    fboLicenseNumber: '11521038000412',
    batchNumber: 'BATCH-2026-K1',
    purchaseInvoice: 'INV-99214',
    purchaseDate: '2026-02-14',
    injuryTier: 'TEMPORARY_INJURY',
    actualMedicalBills: 6450,
    selectedViolations: ['extraneous_matter', 'unsafe_food'],
    complainantName: 'Meera Deshmukh',
    complainantContact: 'meera@example.com',
    complainantAddress: 'Baner, Pune',
  };

  it('renders modal header, tab buttons, and draft editor', () => {
    const html = renderToStaticMarkup(
      <FoodSafetyDrafterModal caseData={sampleCase} onClose={() => {}} />
    );

    expect(html).toContain('FSSAI Statutory Redressal &amp; Legal Drafter');
    expect(html).toContain('ADM / DO Formal Petition (Sec 68)');
    expect(html).toContain('15-Day Pre-Litigation FBO Notice');
    expect(html).toContain('Meera Deshmukh');
    expect(html).toContain('Royal Spice Cloud Kitchen');
  });

  it('includes statutory notice and disclaimer in footer', () => {
    const html = renderToStaticMarkup(
      <FoodSafetyDrafterModal caseData={sampleCase} onClose={() => {}} />
    );

    expect(html).toContain('Statutory Notice: This draft is generated for citizen legal organization');
  });
});
