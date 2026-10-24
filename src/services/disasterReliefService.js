import { EMERGENCY_RELIEF_CENTERS, EMERGENCY_SURVIVAL_CHECKLIST } from '../data/emergencyReliefData';

const CACHE_KEY = 'civicbridge_cached_shelters';

/**
 * Retrieves relief shelters, ensuring offline availability via localStorage
 */
export function getReliefShelters(filterType = 'ALL') {
  let shelters = EMERGENCY_RELIEF_CENTERS;

  // Sync to localStorage for offline readiness if in browser environment
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(shelters));
    } catch (err) {
      // ignore
    }
  }

  if (!filterType || filterType === 'ALL') {
    return shelters;
  }

  return shelters.filter(s => s.disasterTypes.includes(filterType.toUpperCase()));
}

/**
 * Returns survival kit checklist
 */
export function getSurvivalChecklist() {
  return EMERGENCY_SURVIVAL_CHECKLIST;
}

/**
 * Formats a quick SMS message to send to emergency contacts with citizen location and status
 */
export function generateEmergencySosSms(shelterName, citizenName = 'Family Member') {
  return `EMERGENCY ALERT: I (${citizenName}) have arrived safely at the relief shelter: ${shelterName}. All basic civic supplies available. Please contact district helpline 1070/112 if you need assistance.`;
}
