import { describe, it, expect } from 'vitest';
import { predictOfficeCrowd, getHourlyForecast } from './officeCrowdForecaster';

describe('officeCrowdForecaster - Footfall & Rush Estimation', () => {
  it('detects CLOSED status on Sunday', () => {
    // 2026-06-07 is Sunday
    const sunday = new Date('2026-06-07T11:00:00');
    const pred = predictOfficeCrowd({}, sunday);
    expect(pred.status).toBe('CLOSED');
    expect(pred.waitMinutes).toBe(0);
    expect(pred.badgeText).toBe('Office Closed');
  });

  it('detects PEAK rush on Monday at 11 AM', () => {
    // 2026-06-01 is Monday
    const mondayPeak = new Date('2026-06-01T11:00:00');
    const pred = predictOfficeCrowd({}, mondayPeak);
    expect(pred.status).toBe('OPEN');
    expect(pred.level).toBe('HIGH');
    expect(pred.waitMinutes).toBeGreaterThanOrEqual(45);
    expect(pred.recommendation).toContain('Heavy footfall');
  });

  it('detects LUNCH break status around 1:45 PM', () => {
    // 2026-06-03 is Wednesday
    const wedLunch = new Date('2026-06-03T13:45:00');
    const pred = predictOfficeCrowd({}, wedLunch);
    expect(pred.status).toBe('LUNCH_BREAK');
    expect(pred.badgeText).toContain('Lunch Break');
  });

  it('generates 8 hours of footfall forecast array', () => {
    const list = getHourlyForecast(new Date('2026-06-03T10:00:00'));
    expect(list.length).toBe(8);
    expect(list[0].hour).toBe(9);
    expect(list[7].hour).toBe(16);
  });
});
