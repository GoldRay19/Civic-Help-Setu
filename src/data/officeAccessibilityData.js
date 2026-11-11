/**
 * Public-Service Office Accessibility & Needs Dataset (#144)
 *
 * Provides verified accessibility facility audits, source verification dates,
 * and pre-visit confirmation questions for Indian public facilitation offices.
 */

export const ACCESSIBILITY_FEATURE_CATALOG = [
  {
    id: 'step_free_access',
    title: 'Step-Free Entrance & Ramp',
    description: 'Graded wheelchair ramp with dual handrails at the public entrance.',
    confirmationQuestion: 'Is the wheelchair ramp currently unobstructed and open for citizen access today?',
    category: 'mobility',
  },
  {
    id: 'elevators',
    title: 'Accessible Elevator / Lift',
    description: 'Elevator accommodating wheelchairs with braille and auditory announcements.',
    confirmationQuestion: 'Are all office counters on the ground floor, or is the elevator in operational condition?',
    category: 'mobility',
  },
  {
    id: 'accessible_counters',
    title: 'Priority / Accessible Counter',
    description: 'Dedicated low-height counter or priority token lane for PwD and senior citizens.',
    confirmationQuestion: 'Which specific counter number is assigned for priority facilitation of PwD or elderly citizens?',
    category: 'service',
  },
  {
    id: 'accessible_washrooms',
    title: 'Accessible Restroom / Toilet',
    description: 'Wheelchair-accessible unisex restroom with grab bars and wide door swing.',
    confirmationQuestion: 'Is an accessible washroom unlocked and available within the citizen facilitation block?',
    category: 'facility',
  },
  {
    id: 'tactile_paving',
    title: 'Tactile Guidance Flooring',
    description: 'Tactile surface path from the main gate to the enquiry desk for visually impaired visitors.',
    confirmationQuestion: 'Are guiding volunteers or tactile signages available at the reception desk?',
    category: 'sensory',
  },
  {
    id: 'assistive_listening',
    title: 'Assistive Listening Support',
    description: 'Assistive listening devices or communication support at the office.',
    confirmationQuestion: 'Is assistive listening support available at the office?',
    category: 'communication',
  },
  {
    id: 'sign_language_support',
    title: 'Sign-Language Support',
    description: 'Sign-language interpretation arranged for the visit.',
    confirmationQuestion: 'Can sign-language interpretation be arranged for the visit?',
    category: 'communication',
  },
  {
    id: 'accessible_formats',
    title: 'Accessible Formats',
    description: 'Forms or instructions in a requested accessible format, such as large print, Braille, or digital text.',
    confirmationQuestion: 'Can the required forms or instructions be provided in an accessible format?',
    category: 'communication',
  },
  {
    id: 'accompanying_helper',
    title: 'Accompanying Helper',
    description: 'Permission for an accompanying helper to assist during the visit.',
    confirmationQuestion: 'May an accompanying helper assist during the visit?',
    category: 'service',
  },
  {
    id: 'companion_seating',
    title: 'Priority Seating & Rest Area',
    description: 'Designated shaded seating for waiting citizens and accompanying caregivers.',
    confirmationQuestion: 'Is indoor priority seating available near the biometric or verification counters?',
    category: 'facility',
  },
  {
    id: 'accessible_parking',
    title: 'Designated PwD Parking Bay',
    description: 'Reserved vehicle parking slot within 30 meters of the main entrance ramp.',
    confirmationQuestion: 'Can an accessible vehicle with a disabled passenger drop off directly at the ramp entrance?',
    category: 'mobility',
  },
];

export const OFFICE_ACCESSIBILITY_RECORDS = [
  // Add records only when each facility claim has a direct source and verification date.
];
