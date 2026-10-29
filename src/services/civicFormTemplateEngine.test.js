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

  it('escapes user-typed text in the printable HTML', () => {
    const html = generatePrintableHtml({
      title: 'RTI <script>alert(1)</script>',
      act: 'Act & "Rules"',
      filledContent: 'Flat <b>12</b> & Co <img src=x onerror="window.__pwned=1"> costs < Rs 50,000'
    });
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>12</b>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Flat &lt;b&gt;12&lt;/b&gt; &amp; Co');
    expect(html).toContain('&lt;img src=x onerror=&quot;window.__pwned=1&quot;&gt;');
    expect(html).toContain('costs &lt; Rs 50,000');
    expect(html).toContain('<h2>RTI &lt;script&gt;alert(1)&lt;/script&gt;</h2>');
    expect(html).toContain('Act &amp; &quot;Rules&quot;');
  });

  it('inserts values containing $ replacement patterns exactly as typed', () => {
    const res = populateFormTemplate('rti-section-6', {
      applicantName: "Cost $& and $' and $$ and $1",
      publicAuthority: 'PWD'
    });
    expect(res.filledContent).toContain("Cost $& and $' and $$ and $1");
    expect(res.filledContent).not.toContain('{{applicantName}}');
  });
});
