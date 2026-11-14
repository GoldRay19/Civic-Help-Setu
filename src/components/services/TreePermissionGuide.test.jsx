import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TreePermissionGuide from './TreePermissionGuide';
import {
  TREE_OPERATION_TYPE,
  OPERATION_METADATA,
  listSupportedJurisdictions,
  getProtectedSpeciesDirectory,
} from '../../services/treeProtectionService';

describe('TreePermissionGuide Component (#717)', () => {
  it('renders guide header, title, and civic description', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide />);

    expect(html).toContain('Tree-Pruning Permission &amp; Urban Tree Protection Guide');
    expect(html).toContain('Official local-authority statutory guidance');
    expect(html).toContain('Select Municipal / Forest Jurisdiction:');
    expect(html).toContain('Select Intended Tree Action:');
  });

  it('renders onBack button when callback is provided', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide onBack={() => {}} />);
    expect(html).toContain('Back');
  });

  it('renders verified statutory source badge and official external government portal link for Delhi', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide initialJurisdiction="DELHI_NCT" />);

    expect(html).toContain('Verified Statutory Source:');
    expect(html).toContain('Department of Forests and Wildlife, GNCTD / Tree Officer');
    expect(html).toContain('Official Government Portal');
    expect(html).toContain('https://forest.delhigovt.nic.in/tree-felling-permission');
  });

  it('renders explicit UNAVAILABLE_OR_UNVERIFIED alert banner for unverified jurisdictions without guessing', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide initialJurisdiction="UNLISTED_REGIONAL" />);

    expect(html).toContain('UNVERIFIED / UNAVAILABLE DATA STATE:');
    expect(html).toContain('unverified in this registry');
    expect(html).toContain('Do not assume or prune without confirmation');
    expect(html).toContain('Enter City / District / State:');
  });

  it('renders accessible navigation tabs with correct ARIA attributes', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide />);

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Tree Permission Sections"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('id="tab-guide"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-controls="panel-guide"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('id="panel-guide"');
  });

  it('renders all 5 core operation classifications in the action selector', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide />);

    expect(html).toContain('Tree Pruning &amp; Branch Trimming');
    expect(html).toContain(OPERATION_METADATA[TREE_OPERATION_TYPE.TRANSPLANTATION].title);
    expect(html).toContain('Tree Felling &amp; Removal');
    expect(html).toContain(OPERATION_METADATA[TREE_OPERATION_TYPE.EMERGENCY_HAZARD].title);
    expect(html).toContain(OPERATION_METADATA[TREE_OPERATION_TYPE.ILLEGAL_FELLING_REPORT].title);
  });

  it('renders distinct statutory notice vs editorial guidance sections', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide initialJurisdiction="DELHI_NCT" />);

    expect(html).toContain('Statutory Law vs Editorial Advice:');
    expect(html).toContain('Statutory Notice:');
    expect(html).toContain('Editorial Practice Note:');
    expect(html).toContain('Editorial Advice:');
  });

  it('renders sourced competent tree officer parameters, public objection window, and compensatory ratio', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide initialJurisdiction="KARNATAKA_BENGALURU" />);

    expect(html).toContain('Competent Tree Officer &amp; Procedural Framework');
    expect(html).toContain('BBMP Forest Cell / Karnataka Forest Department');
    expect(html).toContain('Karnataka Preservation of Trees Act, 1976');
    expect(html).toContain('1:10 compensatory saplings');
    expect(html).toContain('Public Objection Notice Window');
  });

  it('renders supported jurisdictions in dropdown selector', () => {
    const html = renderToStaticMarkup(<TreePermissionGuide />);
    const list = listSupportedJurisdictions();

    list.forEach((j) => {
      expect(html).toContain(j.jurisdictionKey);
      expect(html).toContain(j.city);
    });
  });
});
