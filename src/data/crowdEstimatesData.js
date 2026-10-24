/**
 * Civic office rush hour footfall patterns, counter capacities,
 * and statistical wait times by hour and day of week.
 */
export const OFFICE_CROWD_PATTERNS = {
  // Hourly rush multiplier from 9 AM to 5 PM (09:00 - 17:00)
  // Index corresponds to hour (9: 9am, 10: 10am, ... 16: 4pm)
  HOURLY_RUSH_FACTORS: {
    9: { level: 'LOW', multiplier: 0.5, waitMinutes: 10, label: 'Opening - Minimal Queue' },
    10: { level: 'MODERATE', multiplier: 0.9, waitMinutes: 20, label: 'Steady Influx' },
    11: { level: 'HIGH', multiplier: 1.5, waitMinutes: 45, label: 'Peak Rush Hour' },
    12: { level: 'HIGH', multiplier: 1.6, waitMinutes: 50, label: 'Heavy Queue' },
    13: { level: 'CLOSED_LUNCH', multiplier: 0.2, waitMinutes: 0, label: 'Lunch Break (1:30 - 2:30 PM)' },
    14: { level: 'MODERATE', multiplier: 1.0, waitMinutes: 25, label: 'Post-Lunch Counters Resume' },
    15: { level: 'MODERATE', multiplier: 1.1, waitMinutes: 30, label: 'Afternoon Processing' },
    16: { level: 'LOW', multiplier: 0.6, waitMinutes: 15, label: 'Counter Closing Hours' }
  },

  // Day of week modifier (0: Sun, 1: Mon, ... 6: Sat)
  DAY_MODIFIERS: {
    0: { active: false, multiplier: 0, name: 'Sunday (Closed)' },
    1: { active: true, multiplier: 1.4, name: 'Monday (Heavy Post-Weekend Rush)' },
    2: { active: true, multiplier: 1.0, name: 'Tuesday (Normal Flow)' },
    3: { active: true, multiplier: 0.8, name: 'Wednesday (Optimal / Lowest Rush)' },
    4: { active: true, multiplier: 0.9, name: 'Thursday (Normal Flow)' },
    5: { active: true, multiplier: 1.2, name: 'Friday (Pre-Weekend Rush)' },
    6: { active: true, multiplier: 1.5, name: 'Saturday (Half Day / Heavy Footfall)' }
  }
};
