import { describe, it, expect } from 'vitest';
import {
  filterCommunityFacilities,
  getCommunityFacilityById,
  getFacilityFreshness,
  formatCommunityFacilityInstructions,
  buildFacilityChecklistItems,
} from './communityFacilityService';
import { VERIFIED_COMMUNITY_FACILITIES } from '../data/communityFacilities';

describe('communityFacilityService', () => {
  it('returns all facilities with default filters', () => {
    const results = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {});
    expect(results.length).toBe(VERIFIED_COMMUNITY_FACILITIES.length);
  });

  it('filters by state and district', () => {
    const delhiResults = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
      state: 'Delhi',
    });
    expect(delhiResults.length).toBeGreaterThan(0);
    expect(delhiResults.every((f) => f.state.toLowerCase() === 'delhi')).toBe(true);

    const puneResults = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
      district: 'Pune',
    });
    expect(puneResults.length).toBeGreaterThan(0);
    expect(puneResults.every((f) => f.district.toLowerCase() === 'pune')).toBe(true);
  });

  it('filters by facility type', () => {
    const auditoriums = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
      facilityType: 'municipal_auditorium',
    });
    expect(auditoriums.length).toBeGreaterThan(0);
    expect(auditoriums.every((f) => f.facilityType === 'municipal_auditorium')).toBe(true);
  });

  it('filters by minimum capacity', () => {
    const largeVenues = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
      minCapacity: 2000,
    });
    expect(largeVenues.length).toBeGreaterThan(0);
    expect(largeVenues.every((f) => f.capacity.total >= 2000)).toBe(true);
  });

  it('filters by wheelchair accessibility and parking', () => {
    const accessible = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
      onlyWheelchair: true,
      onlyParking: true,
    });
    expect(accessible.every((f) => f.accessibility.wheelchairAccessible && f.accessibility.parkingAvailable)).toBe(true);
  });

  it('filters by search query matching name or address', () => {
    const results = filterCommunityFacilities(VERIFIED_COMMUNITY_FACILITIES, {
      searchQuery: 'Shivaji Park',
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('mumbai-mcgm-shivaji-park-sports-ground');
  });

  it('retrieves single facility by ID', () => {
    const facility = getCommunityFacilityById('delhi-mcd-civic-centre-auditorium');
    expect(facility).toBeDefined();
    expect(facility.name).toContain('Civic Centre Auditorium');

    const nonExistent = getCommunityFacilityById('non-existent-id');
    expect(nonExistent).toBeNull();
  });

  it('correctly calculates data freshness status', () => {
    const recentFacility = VERIFIED_COMMUNITY_FACILITIES.find(
      (f) => f.id === 'delhi-mcd-civic-centre-auditorium'
    );
    const freshness = getFacilityFreshness(recentFacility);
    expect(['recent', 'standard', 'overdue']).toContain(freshness.status);

    const staleFacility = VERIFIED_COMMUNITY_FACILITIES.find(
      (f) => f.id === 'ghaziabad-gda-madhuban-bapudham-open-ground'
    );
    const staleFreshness = getFacilityFreshness(staleFacility);
    expect(staleFreshness.status).toBe('overdue');
  });

  it('formats official booking instructions with mandatory disclaimers', () => {
    const facility = VERIFIED_COMMUNITY_FACILITIES[0];
    const text = formatCommunityFacilityInstructions(facility);
    expect(text).toContain(facility.name);
    expect(text).toContain(facility.managingAuthority);
    expect(text).toContain('Live slot availability is NOT tracked or implied');
    expect(text).toContain('Tariffs, Security Deposit & Cancellation');
  });

  it('builds comprehensive preparation checklist items', () => {
    const facility = VERIFIED_COMMUNITY_FACILITIES[0];
    const items = buildFacilityChecklistItems(facility);
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items.some((i) => i.includes('Photo ID'))).toBe(true);
    expect(items.some((i) => i.includes('lead time'))).toBe(true);
    expect(items.some((i) => i.includes('security deposit'))).toBe(true);
  });
});

