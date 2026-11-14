// Seed dataset of verified Rental Move-In and Move-Out Civic Records (#726).
// Grounded in official state electricity boards, municipal water authorities,
// city gas distribution, police tenant intimation, and statutory address proof guidelines.
// Strictly non-transactional and free of citizen PII and lease deposit disputes.

import { RENTAL_TRANSITION_SCHEMA_VERSION } from './rentalTransitionContract';

export const VERIFIED_RENTAL_TRANSITIONS = [
  // --- MOVE-IN: BESCOM Karnataka ---
  {
    id: 'bescom-move-in-meter-recording',
    title: 'BESCOM Initial Electricity Meter Reading & Consumer Mapping',
    stage: 'move_in',
    category: 'electricity',
    authority: 'Bangalore Electricity Supply Company Limited (BESCOM)',
    jurisdiction: {
      level: 'local',
      states: ['Karnataka'],
      districts: ['Bengaluru Urban'],
      localBody: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    },
    sourceUrl: 'https://bescom.karnataka.gov.in',
    publishedDate: '2026-01-15',
    turnaroundSchedule: {
      workingDays: 3,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'electricity',
      unit: 'kWh',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-mcb', label: 'Main Breaker (MCB) and Earth Leakage Trip (ELCB) Functional', requiredForMoveOut: true },
      { id: 'inv-meter-seal', label: 'Physical Electricity Meter Seal Intact and Tamper-Free', requiredForMoveOut: true },
      { id: 'inv-keys', label: 'Apartment and Electrical Meter Enclosure Key Handover', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Note the 10-digit BESCOM Account ID from the latest electricity bill.',
      'Record the cumulative active energy reading (kWh) shown on the digital meter LCD on occupancy day.',
      'Verify that all dues prior to the possession date have been cleared by the owner through the BESCOM Mithra portal or sub-division counter.',
      'Download the latest zero-arrears receipt or Form-6 confirmation for occupancy records.',
    ],
    editorialNotes: [
      'Take a clear, dated photograph of the meter display showing the cumulative reading and meter serial number on day one.',
      'Keep the previous tenant or owner settlement receipt saved in your local checklist until your first cycle bill is generated.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Utility Operations',
      sourceUrl: 'https://bescom.karnataka.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-OUT: BESCOM Karnataka ---
  {
    id: 'bescom-move-out-final-clearance',
    title: 'BESCOM Final Electricity Meter Reading & Bill Clearance',
    stage: 'move_out',
    category: 'electricity',
    authority: 'Bangalore Electricity Supply Company Limited (BESCOM)',
    jurisdiction: {
      level: 'local',
      states: ['Karnataka'],
      districts: ['Bengaluru Urban'],
      localBody: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    },
    sourceUrl: 'https://bescom.karnataka.gov.in',
    publishedDate: '2026-01-15',
    turnaroundSchedule: {
      workingDays: 2,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'electricity',
      unit: 'kWh',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-mcb', label: 'Main Breaker and Sub-circuit Switches Returned in Working Order', requiredForMoveOut: true },
      { id: 'inv-meter-seal', label: 'Meter Glass and Terminal Cover Inspected for Tampering', requiredForMoveOut: true },
      { id: 'inv-keys', label: 'All Meter Box and Main Door Keys Returned to Landlord/Agent', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Record the final cumulative electricity meter reading (kWh) in the presence of the landlord or designated representative on vacate date.',
      'Generate an on-demand intermediate bill via the BESCOM Mithra app or visit the local Sub-Division office.',
      'Pay the proportionate pro-rata consumption bill from the previous billing cycle up to the physical handover hour.',
      'Obtain an electronic payment receipt citing the final meter reading unit number.',
    ],
    editorialNotes: [
      'Request the landlord or representative sign the mutual meter reading slip or acknowledge the dated photograph via digital message.',
      'Civic Help Setu does not arbitrate security deposit returns; ensure the final electricity paid receipt is shared directly with the landlord for billing closure.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Utility Operations',
      sourceUrl: 'https://bescom.karnataka.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-IN: BWSSB Bengaluru Water ---
  {
    id: 'bwssb-move-in-water-reading',
    title: 'BWSSB Water Meter Reading & Consumer Record Check',
    stage: 'move_in',
    category: 'water',
    authority: 'Bangalore Water Supply and Sewerage Board (BWSSB)',
    jurisdiction: {
      level: 'local',
      states: ['Karnataka'],
      districts: ['Bengaluru Urban'],
      localBody: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    },
    sourceUrl: 'https://bwssb.karnataka.gov.in',
    publishedDate: '2026-01-10',
    turnaroundSchedule: {
      workingDays: null,
      isUnavailable: true,
      unavailableReason: 'BWSSB does not provide automated individual tenant meter re-registration; readings are recorded for mutual civic handover.',
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'water',
      unit: 'kL',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-water-meter', label: 'Individual In-line Water Sub-meter Dial Visible and Functional', requiredForMoveOut: true },
      { id: 'inv-inflow-valve', label: 'Main Overhead / Inflow Ball Valve Operable Without Leaks', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Ascertain the 8-digit BWSSB Consumer Number (RR Number) linked to the property.',
      'Record the baseline mechanical or AMR water meter reading in kilolitres (kL) on physical possession.',
      'Check the BWSSB water bill history to ensure borewell cess and sanitary charges are cleared up to date.',
    ],
    editorialNotes: [
      'If the building uses an internal apartment sub-meter, verify with the resident welfare association (RWA) regarding the water billing formula.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Utility Operations',
      sourceUrl: 'https://bwssb.karnataka.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-OUT: BWSSB Bengaluru Water ---
  {
    id: 'bwssb-move-out-water-settlement',
    title: 'BWSSB Water Final Meter Reading & Handover Clearance',
    stage: 'move_out',
    category: 'water',
    authority: 'Bangalore Water Supply and Sewerage Board (BWSSB)',
    jurisdiction: {
      level: 'local',
      states: ['Karnataka'],
      districts: ['Bengaluru Urban'],
      localBody: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    },
    sourceUrl: 'https://bwssb.karnataka.gov.in',
    publishedDate: '2026-01-10',
    turnaroundSchedule: {
      workingDays: null,
      isUnavailable: true,
      unavailableReason: 'Final water settlements are computed using the latest BWSSB tariff schedule and confirmed through mutual handover certificate.',
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'water',
      unit: 'kL',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-water-meter', label: 'Water Sub-meter Glass Free of Condensation and Damage', requiredForMoveOut: true },
      { id: 'inv-taps-fixtures', label: 'All Water Taps and Flush Cistern Valves Checked for Continuous Overflow', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Capture final dial numbers on the water sub-meter prior to key return.',
      'Calculate pro-rata consumption from last billed month based on current BWSSB domestic slab rates.',
      'Settle any outstanding society or municipal water consumption arrears.',
    ],
    editorialNotes: [
      'Mutual written confirmation of the final water reading avoids retroactive utility estimation disputes.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Utility Operations',
      sourceUrl: 'https://bwssb.karnataka.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-IN: BSES Delhi Electricity ---
  {
    id: 'bses-delhi-move-in-meter',
    title: 'BSES Rajdhani/Yamuna Initial Electricity Meter Reading',
    stage: 'move_in',
    category: 'electricity',
    authority: 'BSES Delhi / Delhi Electricity Regulatory Commission (DERC)',
    jurisdiction: {
      level: 'state',
      states: ['Delhi'],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://www.bsesdelhi.com',
    publishedDate: '2026-01-20',
    turnaroundSchedule: {
      workingDays: 2,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'electricity',
      unit: 'kWh',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-ca-number', label: '9-Digit Contract Account (CA) Number Verified on BSES Portal', requiredForMoveOut: true },
      { id: 'inv-smart-meter', label: 'Smart Meter Optical Communication Port and Display Clear', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Verify the CA Number against the active meter serial number stamped on the discom plate.',
      'Confirm the initial reading across KWH (Active Energy) and KVAH displays.',
      'Confirm zero electricity arrears under DERC Supply Code Regulation 17 before signing the lease possession certificate.',
    ],
    editorialNotes: [
      'In Delhi, power subsidy status is linked to the CA number. Verify whether the property currently receives the domestic subsidy benefit.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Utility Operations',
      sourceUrl: 'https://www.bsesdelhi.com',
      status: 'verified',
    },
  },

  // --- MOVE-OUT: BSES Delhi Electricity ---
  {
    id: 'bses-delhi-move-out-meter',
    title: 'BSES Delhi Final Meter Reading & Final Consumption Bill Settlement',
    stage: 'move_out',
    category: 'electricity',
    authority: 'BSES Delhi / Delhi Electricity Regulatory Commission (DERC)',
    jurisdiction: {
      level: 'state',
      states: ['Delhi'],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://www.bsesdelhi.com',
    publishedDate: '2026-01-20',
    turnaroundSchedule: {
      workingDays: 3,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'electricity',
      unit: 'kWh',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-ca-number', label: 'CA Account Cleared of Disconnection Notice Warnings', requiredForMoveOut: true },
      { id: 'inv-meter-inspection', label: 'Meter Security Seal and Neutral Wire Intact', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Take final cumulative unit reading on the date of vacation.',
      'Generate an on-demand billing request via WhatsApp service or BSES Consumer Care (19123 / 19122).',
      'Pay the final bill online and keep the formal PDF receipt for your civic records archive.',
    ],
    editorialNotes: [
      'Ensure the final receipt explicitly notes the "Paid up to reading: [units]" to prevent subsequent billing confusion.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Utility Operations',
      sourceUrl: 'https://www.bsesdelhi.com',
      status: 'verified',
    },
  },

  // --- MOVE-IN: UIDAI Aadhaar Address Proof via Registered Rent Agreement ---
  {
    id: 'uidai-rent-agreement-address-update',
    title: 'UIDAI Aadhaar Address Update Using Registered Rent Agreement',
    stage: 'move_in',
    category: 'address_evidence',
    authority: 'Unique Identification Authority of India (UIDAI)',
    jurisdiction: {
      level: 'national',
      states: [],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://myaadhaar.uidai.gov.in',
    publishedDate: '2026-01-01',
    turnaroundSchedule: {
      workingDays: 15,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: false,
      meterType: null,
      unit: null,
      requiresJointConfirmation: false,
    },
    handoverInventory: [
      { id: 'inv-registered-agreement', label: 'Registered Tenancy Agreement Copy with Sub-Registrar Seal', requiredForMoveOut: false },
      { id: 'inv-mobile-link', label: 'Aadhaar Mobile Number Active for OTP Authentication', requiredForMoveOut: false },
    ],
    officialInstructions: [
      'Ensure the rental agreement is registered with the state sub-registrar department (notarized agreements on non-judicial stamp paper without registration seals are rejected by UIDAI).',
      'Log in to the myAadhaar portal using Aadhaar number and OTP.',
      'Select "Update Address Online", enter the new residential coordinates and PIN code.',
      'Upload the full registered rent agreement containing tenant name, landlord name, and property address.',
      'Pay the statutory ₹50 administrative portal fee and save the Service Request Number (SRN) for tracking.',
    ],
    editorialNotes: [
      'Updating your Aadhaar address early unlocks subsequent updates for bank accounts, driving licences, and voter IDs in your new constituency.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Citizen Identity Team',
      sourceUrl: 'https://myaadhaar.uidai.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-OUT: National Voter Service Portal (ECI) Form 8 Address Shift ---
  {
    id: 'eci-voter-shift-form-8',
    title: 'Election Commission of India (ECI) Voter Constituency Shifting (Form 8)',
    stage: 'move_out',
    category: 'address_evidence',
    authority: 'Election Commission of India (ECI)',
    jurisdiction: {
      level: 'national',
      states: [],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://voters.eci.gov.in',
    publishedDate: '2026-01-05',
    turnaroundSchedule: {
      workingDays: 30,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: false,
      meterType: null,
      unit: null,
      requiresJointConfirmation: false,
    },
    handoverInventory: [
      { id: 'inv-epic-number', label: 'Existing Voter ID Card (EPIC) Number Available', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Log in to the ECI Voter Services Portal (voters.eci.gov.in).',
      'Fill Form 8 for "Shifting of Residence" from old assembly constituency to new constituency.',
      'Attach newly acquired proof of residence (utility bill, updated bank passbook, or registered agreement at new address).',
      'Submit Form 8 and obtain 14-character reference acknowledgment number for Electoral Registration Officer (ERO) tracking.',
    ],
    editorialNotes: [
      'Voter registration shift ensures your name is lawfully removed from the electoral roll of the vacated rental premises and added to the new polling station.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Electoral Team',
      sourceUrl: 'https://voters.eci.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-IN: Jurisdictional Police Tenant Verification (Delhi Police) ---
  {
    id: 'delhi-police-tenant-verification',
    title: 'Delhi Police Citizen Portal Tenant Intimation Registration',
    stage: 'move_in',
    category: 'police_intimation',
    authority: 'Delhi Police',
    jurisdiction: {
      level: 'state',
      states: ['Delhi'],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://delhipolice.gov.in',
    publishedDate: '2026-01-10',
    turnaroundSchedule: {
      workingDays: null,
      isUnavailable: true,
      unavailableReason: 'Tenant intimation is a statutory declaration; acknowledgement is issued instantly upon digital submission with no discretionary waiting period.',
    },
    meterReadingConfig: {
      isApplicable: false,
      meterType: null,
      unit: null,
      requiresJointConfirmation: false,
    },
    handoverInventory: [
      { id: 'inv-tenant-id-copy', label: 'Government Photo ID Proof Verified by Landlord', requiredForMoveOut: false },
      { id: 'inv-police-ack', label: 'Digital Submission Acknowledgement Receipt Stored in Local File', requiredForMoveOut: false },
    ],
    officialInstructions: [
      'Landlord or tenant logs into Delhi Police Citizen Services portal under "Tenant Verification".',
      'Fill property address, tenant details, occupation, permanent address, and contact coordinates.',
      'Upload tenant photo and identity proof.',
      'Generate and print the statutory PDF acknowledgment receipt for police records.',
    ],
    editorialNotes: [
      'Filing tenant intimation is a statutory mandate under local administrative orders and protects both parties against civic non-compliance.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Safety Operations',
      sourceUrl: 'https://delhipolice.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-OUT: Maharashtra Police Tenant Departure Intimation ---
  {
    id: 'maharashtra-police-tenant-departure',
    title: 'Maharashtra Police Citizen Portal Tenant Departure Notification',
    stage: 'move_out',
    category: 'police_intimation',
    authority: 'Maharashtra State Police / Mumbai Police',
    jurisdiction: {
      level: 'state',
      states: ['Maharashtra'],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://citizen.mahapolice.gov.in',
    publishedDate: '2026-01-12',
    turnaroundSchedule: {
      workingDays: null,
      isUnavailable: true,
      unavailableReason: 'Intimation of tenancy cessation is recorded immediately on the portal database without manual SLA queues.',
    },
    meterReadingConfig: {
      isApplicable: false,
      meterType: null,
      unit: null,
      requiresJointConfirmation: false,
    },
    handoverInventory: [
      { id: 'inv-intimation-receipt', label: 'Original Tenant Intimation Application Number Available', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Access the Maharashtra Police Citizen portal tenant services module.',
      'Enter the original tenant intimation reference number.',
      'Mark tenancy status as "Terminated / Vacated" along with the effective vacate date.',
      'Save the digital cessation confirmation for records.',
    ],
    editorialNotes: [
      'Notifying tenant departure releases the outgoing tenant from future administrative accountability linked to the address.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Public Safety Operations',
      sourceUrl: 'https://citizen.mahapolice.gov.in',
      status: 'verified',
    },
  },

  // --- MOVE-IN: Piped Natural Gas (Indraprastha Gas Limited / IGL) ---
  {
    id: 'igl-png-move-in-meter',
    title: 'Indraprastha Gas Limited (IGL) Domestic PNG Meter Reading & Handover',
    stage: 'move_in',
    category: 'piped_gas',
    authority: 'Indraprastha Gas Limited (IGL) / Petroleum and Natural Gas Regulatory Board (PNGRB)',
    jurisdiction: {
      level: 'state',
      states: ['Delhi'],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://www.iglonline.net',
    publishedDate: '2026-01-18',
    turnaroundSchedule: {
      workingDays: 5,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'gas',
      unit: 'SCM',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-gas-isolation-valve', label: 'Gas Main Isolation Control Valve Operable and Leak-Tested', requiredForMoveOut: true },
      { id: 'inv-gas-meter-index', label: 'PNG Diaphragm Meter Index Counter Readable Without Obstruction', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Locate the domestic PNG diaphragm gas meter and note the Business Partner (BP) number on the meter card.',
      'Record the cumulative Standard Cubic Metres (SCM) reading shown on the black-and-red counter rollers.',
      'Verify that all past gas consumption invoices are marked paid on the IGL Connect portal.',
      'Submit self-reading update via IGL customer portal or mobile application if meter reading billing window is open.',
    ],
    editorialNotes: [
      'Always confirm that the copper piping and appliance control valve are turned off when premises are unoccupied.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Energy Operations',
      sourceUrl: 'https://www.iglonline.net',
      status: 'verified',
    },
  },

  // --- MOVE-OUT: Piped Natural Gas (IGL Delhi) ---
  {
    id: 'igl-png-move-out-meter',
    title: 'Indraprastha Gas Limited (IGL) Final PNG Reading & Account Handover',
    stage: 'move_out',
    category: 'piped_gas',
    authority: 'Indraprastha Gas Limited (IGL) / Petroleum and Natural Gas Regulatory Board (PNGRB)',
    jurisdiction: {
      level: 'state',
      states: ['Delhi'],
      districts: [],
      localBody: '',
    },
    sourceUrl: 'https://www.iglonline.net',
    publishedDate: '2026-01-18',
    turnaroundSchedule: {
      workingDays: 3,
      isUnavailable: false,
    },
    meterReadingConfig: {
      isApplicable: true,
      meterType: 'gas',
      unit: 'SCM',
      requiresJointConfirmation: true,
    },
    handoverInventory: [
      { id: 'inv-gas-valve-closed', label: 'Gas Appliance Valve Turned to Closed Position Prior to Exit', requiredForMoveOut: true },
      { id: 'inv-meter-card', label: 'Physical Yellow Meter Record Card Placed at Meter Location', requiredForMoveOut: true },
    ],
    officialInstructions: [
      'Read final SCM index numbers on the vacate date with landlord or property manager present.',
      'Request intermediate clearance bill through the IGL helpline (1800 102 5109) or IGL Connect app.',
      'Clear outstanding balance online and download final transaction receipt.',
    ],
    editorialNotes: [
      'Retain the final PNG payment receipt citing the BP number and closing reading as proof of civic utility clearance.',
    ],
    auditMetadata: {
      effectiveDate: '2026-01-01',
      lastVerified: '2026-02-14',
      verifiedBy: 'Civic Help Setu Energy Operations',
      sourceUrl: 'https://www.iglonline.net',
      status: 'verified',
    },
  },
];

export const RENTAL_TRANSITION_DIRECTORY_DATA = {
  schemaVersion: RENTAL_TRANSITION_SCHEMA_VERSION,
  transitions: VERIFIED_RENTAL_TRANSITIONS,
};
