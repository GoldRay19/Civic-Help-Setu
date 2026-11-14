import { describe, it, expect } from 'vitest';
import {
  filterPdsShops,
  getDistinctStates,
  getDistinctDistricts,
  getDistinctBlocks,
  getPdsShopById,
  getPdsAuditStatus,
  STATUTORY_NFSA_RULES,
} from './pdsShopService';
import { VERIFIED_PDS_SHOPS } from '../data/pdsShops';

describe('pdsShopService (#723)', () => {
  it('extracts distinct states, districts, and blocks with cascading consistency', () => {
    const states = getDistinctStates();
    expect(states).toContain('Delhi');
    expect(states).toContain('Karnataka');
    expect(states).toContain('Maharashtra');

    const districtsInDelhi = getDistinctDistricts(VERIFIED_PDS_SHOPS, 'Delhi');
    expect(districtsInDelhi).toContain('Central Delhi');
    expect(districtsInDelhi).toContain('South Delhi');
    expect(districtsInDelhi).not.toContain('Bengaluru Urban'); // No cross-state leakage

    const blocksInCentralDelhi = getDistinctBlocks(VERIFIED_PDS_SHOPS, 'Delhi', 'Central Delhi');
    expect(blocksInCentralDelhi).toContain('Kotwali');
    expect(blocksInCentralDelhi).not.toContain('Hauz Khas'); // No cross-district leakage
  });

  it('filters shops by jurisdiction levels without cross-district leakage', () => {
    const delhiShops = filterPdsShops(VERIFIED_PDS_SHOPS, { state: 'Delhi' });
    expect(delhiShops.length).toBe(2);
    delhiShops.forEach((s) => expect(s.state).toBe('Delhi'));

    const centralDelhiOnly = filterPdsShops(VERIFIED_PDS_SHOPS, {
      state: 'Delhi',
      district: 'Central Delhi',
    });
    expect(centralDelhiOnly.length).toBe(1);
    expect(centralDelhiOnly[0].id).toBe('delhi-fps-paharganj-101');
  });

  it('filters shops by search keyword across name, FPS ID, dealer, and locality', () => {
    const byId = filterPdsShops(VERIFIED_PDS_SHOPS, { searchQuery: 'DL-FPS-101-CEN' });
    expect(byId.length).toBe(1);
    expect(byId[0].id).toBe('delhi-fps-paharganj-101');

    const byLocality = filterPdsShops(VERIFIED_PDS_SHOPS, { searchQuery: 'Indiranagar' });
    expect(byLocality.length).toBe(1);
    expect(byLocality[0].id).toBe('karnataka-fps-indiranagar-204');
  });

  it('filters shops by ONORC portability support', () => {
    const onorcShops = filterPdsShops(VERIFIED_PDS_SHOPS, { onlyOnorc: true });
    expect(onorcShops.length).toBeGreaterThan(0);
    onorcShops.forEach((s) => expect(s.onorcPortability.enabled).toBe(true));
  });

  it('retrieves shop by ID accurately', () => {
    const shop = getPdsShopById('maharashtra-fps-kurla-315');
    expect(shop).not.toBeNull();
    expect(shop.fpsId).toBe('MH-FPS-315-MUM-SUB');

    const nonExistent = getPdsShopById('invalid-id');
    expect(nonExistent).toBeNull();
  });

  it('calculates audit status and identifies overdue audit records (> 180 days)', () => {
    const recentShop = getPdsShopById('delhi-fps-paharganj-101');
    const recentStatus = getPdsAuditStatus(recentShop);
    expect(recentStatus.isOverdue).toBe(false);
    expect(recentStatus.status).toBe('recent');

    // up-fps-sarojini-nagar-401 was verified in June 2025 (>180 days ago)
    const overdueShop = getPdsShopById('up-fps-sarojini-nagar-401');
    const overdueStatus = getPdsAuditStatus(overdueShop);
    expect(overdueStatus.isOverdue).toBe(true);
    expect(overdueStatus.status).toBe('overdue');
  });

  it('provides statutory NFSA entitlement norms and ONORC rules', () => {
    expect(STATUTORY_NFSA_RULES.aay.quota).toContain('35 kg');
    expect(STATUTORY_NFSA_RULES.phh.quota).toContain('5 kg');
    expect(STATUTORY_NFSA_RULES.onorc.grievanceNumber).toContain('1967');
  });
});

