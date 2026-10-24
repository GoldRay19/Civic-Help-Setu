/**
 * Master data for civic emergency relief shelters, NDRF/SDRF nodal centers,
 * and disaster preparedness kits across Indian urban and rural clusters.
 */
export const EMERGENCY_RELIEF_CENTERS = [
  {
    id: 'shelter-delhi-central',
    name: 'District Disaster Management Center & Emergency Relief Camp',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'Near Old Secretariat, Civil Lines, North Delhi',
    contact: '011-23831077',
    altContact: '1077',
    capacity: 650,
    suppliesAvailable: ['Purified Water Tankers', 'First Aid Station', 'Food Ration Packets', 'Emergency Generator'],
    disasterTypes: ['FLOOD', 'HEATWAVE', 'CIVIL_DEFENCE'],
    lat: 28.675,
    lng: 77.228
  },
  {
    id: 'shelter-mumbai-flood',
    name: 'BMC Disaster Control Room & Flood Evacuation Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Municipal Head Office, Mahapalika Marg, Fort, Mumbai',
    contact: '022-22694725',
    altContact: '1916',
    capacity: 1200,
    suppliesAvailable: ['Inflatable Boats', 'Dry Ration Kits', 'Medical Dispensary', 'High-Output Water Pumps'],
    disasterTypes: ['FLOOD', 'CYCLONE'],
    lat: 18.940,
    lng: 72.835
  },
  {
    id: 'shelter-bengaluru-east',
    name: 'BBMP Zonal Disaster Management Shelter',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Mahadevapura Zonal Office, Outer Ring Road, Bengaluru',
    contact: '080-22221188',
    altContact: '1533',
    capacity: 450,
    suppliesAvailable: ['Drinking Water Tankers', 'Blankets', 'Emergency Power Supply'],
    disasterTypes: ['FLOOD', 'CIVIL_DEFENCE'],
    lat: 12.986,
    lng: 77.697
  },
  {
    id: 'shelter-jaipur-heatwave',
    name: 'SDRF Emergency Water & Heatwave Relief Depot',
    city: 'Jaipur',
    state: 'Rajasthan',
    address: 'SDRF Battalion HQ, Jagatpura, Jaipur',
    contact: '0141-2751500',
    altContact: '1070',
    capacity: 500,
    suppliesAvailable: ['ORS & Dehydration Kits', 'Air-cooled Tents', 'Mobile Medical Van'],
    disasterTypes: ['HEATWAVE', 'CIVIL_DEFENCE'],
    lat: 26.828,
    lng: 75.864
  }
];

export const EMERGENCY_SURVIVAL_CHECKLIST = [
  { id: 'c1', item: 'Copies of Aadhaar, Voter ID, and Ration Card in waterproof zip pouch', essential: true },
  { id: 'c2', item: '3-day supply of non-perishable dry food (chana, biscuits, dry fruits)', essential: true },
  { id: 'c3', item: '3 liters of potable drinking water per family member', essential: true },
  { id: 'c4', item: 'First aid box: Paracetamol, ORS packets, antiseptic ointment, bandages', essential: true },
  { id: 'c5', item: 'LED torch / flashlight with extra batteries and charged power bank', essential: true },
  { id: 'c6', item: 'Whistle to signal rescue teams in zero visibility', essential: false },
  { id: 'c7', item: 'Essential prescription medicines for senior citizens or chronic patients', essential: true }
];
