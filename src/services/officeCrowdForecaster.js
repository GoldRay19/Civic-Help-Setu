import { OFFICE_CROWD_PATTERNS } from '../data/crowdEstimatesData';

/**
 * Calculates crowd density and estimated counter wait time for a given office and time
 */
export function predictOfficeCrowd(office = {}, targetDate = new Date()) {
  const date = new Date(targetDate);
  const dayOfWeek = date.getDay();
  const hour = date.getHours();

  const dayInfo = OFFICE_CROWD_PATTERNS.DAY_MODIFIERS[dayOfWeek] || { active: false, multiplier: 0, name: 'Closed' };

  // If Sunday or outside working hours (9 AM - 5 PM)
  if (!dayInfo.active || hour < 9 || hour >= 17) {
    return {
      status: 'CLOSED',
      level: 'NONE',
      waitMinutes: 0,
      badgeText: 'Office Closed',
      badgeColor: '#64748b',
      recommendation: 'Plan your visit between 9:30 AM - 11:00 AM on Wednesday or Thursday for shortest lines.',
      activeDayName: dayInfo.name,
      currentHour: hour
    };
  }

  // Lunch break check (13:30 to 14:15)
  const minutes = date.getMinutes();
  if (hour === 13 && minutes >= 30) {
    return {
      status: 'LUNCH_BREAK',
      level: 'PAUSED',
      waitMinutes: 0,
      badgeText: 'Counter Lunch Break (Resume 2:15 PM)',
      badgeColor: '#d97706',
      recommendation: 'Counters will reopen shortly at 2:15 PM. Token counter resumes soon.',
      activeDayName: dayInfo.name,
      currentHour: hour
    };
  }

  const hourData = OFFICE_CROWD_PATTERNS.HOURLY_RUSH_FACTORS[hour] || {
    level: 'MODERATE',
    multiplier: 1.0,
    waitMinutes: 25,
    label: 'Normal Flow'
  };

  const calculatedWait = Math.round(hourData.waitMinutes * dayInfo.multiplier);
  let badgeColor = '#16a34a';
  if (hourData.level === 'HIGH' || calculatedWait > 35) {
    badgeColor = '#dc2626';
  } else if (hourData.level === 'MODERATE' || calculatedWait > 20) {
    badgeColor = '#d97706';
  }

  return {
    status: 'OPEN',
    level: hourData.level,
    waitMinutes: calculatedWait,
    badgeText: `${hourData.level} Rush (~${calculatedWait} min wait)`,
    badgeColor,
    label: hourData.label,
    activeDayName: dayInfo.name,
    currentHour: hour,
    recommendation:
      calculatedWait > 30
        ? 'Heavy footfall right now. If not urgent, visit before 10:30 AM or after 3:30 PM to save 30+ minutes.'
        : 'Good time to visit. Minimal queue at application verification desks.'
  };
}

/**
 * Generates an hourly footfall forecast table for display in the heatmap widget
 */
export function getHourlyForecast(targetDate = new Date()) {
  const date = new Date(targetDate);
  const dayOfWeek = date.getDay();
  const dayInfo = OFFICE_CROWD_PATTERNS.DAY_MODIFIERS[dayOfWeek] || { active: true, multiplier: 1.0 };

  const hours = [9, 10, 11, 12, 13, 14, 15, 16];
  return hours.map(h => {
    const raw = OFFICE_CROWD_PATTERNS.HOURLY_RUSH_FACTORS[h];
    const wait = Math.round(raw.waitMinutes * (dayInfo.active ? dayInfo.multiplier : 1.0));
    return {
      hour: h,
      timeLabel: h > 12 ? `${h - 12} PM` : `${h} AM`,
      level: raw.level,
      waitMinutes: wait,
      label: raw.label
    };
  });
}
