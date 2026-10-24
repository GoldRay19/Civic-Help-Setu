import { describe, it, expect } from 'vitest';
import {
  getAvailableFormTemplates,
  populateFormTemplate,
  generatePrintableHtml
} from './civicFormTemplateEngine';

describe('civicFormTemplateEngine - Template Retrieval and Interpolation', () => {
  it('retrieves all available templates by default', () => {
    const list = getAvailableFormTemplates('all');
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.some(t => t.id === 'rti-section-6')).toBe(true);
  });

  it('populates RTI form variables accurately', () => {
    const values = {
      applicantName: 'Ramesh Sharma',
      guardianName: 'Late B. K. Sharma',
      address: 'House 42, Civil Lines, Jaipur',
      pincode: '302006',
      contactNumber: '9876543210',
      publicAuthority: 'Municipal Corporation Jaipur Heritage',
      particulars: '1. Certified copy of road repair expenditure sanction from April 2025 to March 2026.'
    };

    const res = populateFormTemplate('rti-section-6', values);
    expect(res.filledContent).toContain('Ramesh Sharma');
    expect(res.filledContent).toContain('Municipal Corporation Jaipur Heritage');
    expect(res.filledContent).toContain('Certified copy of road repair');
    expect(res.filledContent).not.toContain('{{applicantName}}');
  });

  it('falls back to default placeholder labels for missing optional fields', () => {
    const res = populateFormTemplate('income-declaration-affidavit', {
      applicantName: 'Sunita Devi'
    });
    expect(res.filledContent).toContain('Sunita Devi');
    expect(res.filledContent).toContain("[Father's / Husband's Name]");
  });

  it('generates well-formed printable HTML markup', () => {
    const filled = {
      title: 'Standard RTI Application',
      act: 'Right to Information Act, 2005',
      filledContent: 'This is test content.'
    };
    const html = generatePrintableHtml(filled);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Standard RTI Application');
    expect(html).toContain('This is test content.');
  });
});
