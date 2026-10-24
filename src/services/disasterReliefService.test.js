import { describe, it, expect } from 'vitest';
import {
  getReliefShelters,
  getSurvivalChecklist,
  generateEmergencySosSms
} from './disasterReliefService';

describe('disasterReliefService - Offline Shelters & SOS Hub', () => {
  it('retrieves all shelters by default', () => {
    const list = getReliefShelters('ALL');
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.some(s => s.id === 'shelter-delhi-central')).toBe(true);
  });

  it('filters shelters by disaster type FLOOD', () => {
    const floods = getReliefShelters('FLOOD');
    expect(floods.length).toBeGreaterThanOrEqual(2);
    expect(floods.every(s => s.disasterTypes.includes('FLOOD'))).toBe(true);
  });

  it('provides survival checklist items with essentials highlighted', () => {
    const list = getSurvivalChecklist();
    expect(list.length).toBeGreaterThanOrEqual(5);
    expect(list.some(c => c.essential === true && c.item.includes('waterproof'))).toBe(true);
  });

  it('generates well-structured emergency SMS text', () => {
    const msg = generateEmergencySosSms('District Relief Camp', 'Rajesh');
    expect(msg).toContain('EMERGENCY ALERT');
    expect(msg).toContain('District Relief Camp');
    expect(msg).toContain('Rajesh');
  });
});
