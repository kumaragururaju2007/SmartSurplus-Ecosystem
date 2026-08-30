const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\data\\mockData.js';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add MOCK_TALUKA_POOLS and MOCK_BYPRODUCTS
const additionalData = `
export const MOCK_TALUKA_POOLS = [
  {
    id: 'POOL-NSK-NIPHAD-01',
    taluka: 'Niphad',
    district: 'Nashik',
    cropId: 'onion',
    cropName: 'Nashik Red Onion (Garva Grade A)',
    combinedQuantity: 185, // Quintals (18.5 MT)
    status: 'ACTIVE_BIDDING', // 'ACTIVE_BIDDING' | 'LOCKED_IN_ESCROW'
    individualModalRate: 2480,
    currentWinningBid: 2745,
    bulkPremiumPerQtl: 265,
    totalEscrowLocked: 507825,
    participatingFarmers: [
      { id: 'F-01', name: 'Raghunath', village: 'Niphad', quantity: 15, avatar: '👨‍🌾', isCurrentUser: true },
      { id: 'F-02', name: 'Sandeep', village: 'Pimpalgaon Baswant', quantity: 45, avatar: '👨‍🌾' },
      { id: 'F-03', name: 'Vitthal', village: 'Dindori Border', quantity: 50, avatar: '👨‍🌾' },
      { id: 'F-04', name: 'Balasaheb', village: 'Chandwad Link', quantity: 40, avatar: '👨‍🌾' },
      { id: 'F-05', name: 'Ramesh', village: 'Ozar Mandi', quantity: 35, avatar: '👨‍🌾' },
    ],
    bids: [
      { id: 'BID-01', buyerName: 'Sahyadri Agro Exports', buyerType: 'FPO Export Consortium', bidPrice: 2580, time: '3 mins ago', avatar: '🏢' },
      { id: 'BID-02', buyerName: 'BigBasket Direct Farm Sourcing', buyerType: 'National Retail Chain', bidPrice: 2640, time: '2 mins ago', avatar: '🛒' },
      { id: 'BID-03', buyerName: 'Reliance Fresh Western Hub', buyerType: 'Institutional Corporate Buyer', bidPrice: 2710, time: '45 secs ago', avatar: '🏬' },
      { id: 'BID-04', buyerName: 'Zomato Hyperpure Logistics', buyerType: 'HORECA Supply Major', bidPrice: 2745, time: 'Just now', avatar: '⚡', isWinning: true },
    ],
    mandiPickupHub: 'MSWC Niphad Aggregation Bay #2',
    escrowGuarantee: '100% Pre-funded by Winning Buyer in AgriConnect Escrow Pool',
  },
  {
    id: 'POOL-LTR-AUSA-02',
    taluka: 'Ausa',
    district: 'Latur',
    cropId: 'soybean',
    cropName: 'Latur Yellow Soybean (JS-335 Clean)',
    combinedQuantity: 240, // Quintals (24 MT)
    status: 'ACTIVE_BIDDING',
    individualModalRate: 4780,
    currentWinningBid: 5040,
    bulkPremiumPerQtl: 260,
    totalEscrowLocked: 1209600,
    participatingFarmers: [
      { id: 'F-06', name: 'Balaji', village: 'Ausa', quantity: 30, avatar: '👨‍🌾', isCurrentUser: true },
      { id: 'F-07', name: 'Kisanrao', village: 'Renapur', quantity: 60, avatar: '👨‍🌾' },
      { id: 'F-08', name: 'Maruti', village: 'Shirur Anantpal', quantity: 75, avatar: '👨‍🌾' },
      { id: 'F-09', name: 'Govind', village: 'Nilanga', quantity: 75, avatar: '👨‍🌾' },
    ],
    bids: [
      { id: 'BID-05', buyerName: 'Kirti Solvents Latur', buyerType: 'Oil Crushing Mill', bidPrice: 4890, time: '5 mins ago', avatar: '🏭' },
      { id: 'BID-06', buyerName: 'Adani Wilmar Crushing Terminal', buyerType: 'Agri Processing Major', bidPrice: 5040, time: '1 min ago', avatar: '🏢', isWinning: true },
    ],
    mandiPickupHub: 'Latur Grain Silo Terminal',
    escrowGuarantee: '100% Pre-funded in State Escrow Pool',
  }
];

export const MOCK_BYPRODUCTS = [
  {
    id: 'BYP-PUN-101',
    name: 'Shredded Paddy / Wheat Straw (Baled)',
    marathiName: 'गव्हाचा / भाताचा पेंढा (गाठी)',
    category: 'Straw & Fodder',
    sourceCrop: 'Wheat & Paddy',
    quantity: 45,
    unit: 'Tonnes (450 Bales)',
    pricePerUnit: 1850,
    unitName: 'Tonne',
    district: 'Pune',
    location: 'Shirur, Pune District',
    moisturePercent: 9.5,
    densityType: 'High Density Hydraulic Baled',
    buyerTargetTags: ['Cattle Feed Producer', 'Mushroom Cultivator', 'Biomass Plant'],
    primaryBuyerTag: 'Cattle Feed Producer',
    farmer: {
      name: 'Dattatray V. Shinde',
      village: 'Shirur',
      district: 'Pune',
      trustTier: 'GOVT_VERIFIED',
      trustScore: 97,
    },
    co2SavedTonnes: 67.5,
    burnPreventionBadge: '100% Stubble-Burn Averted',
    description: 'Clean golden wheat straw, zero plastic contaminants, dust-sieved and baled. Ideal for dairy cattle fodder and button mushroom compost base.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    availableImmediate: true,
  },
  {
    id: 'BYP-NSK-202',
    name: 'Dry Onion Tops & Dehydrated Stalk Residue',
    marathiName: 'वाळलेली कांद्याची पात आणि देठ',
    category: 'Stalks & Bio-matter',
    sourceCrop: 'Red Onion',
    quantity: 30,
    unit: 'Tonnes',
    pricePerUnit: 1200,
    unitName: 'Tonne',
    district: 'Nashik',
    location: 'Lasalgaon, Nashik',
    moisturePercent: 12.0,
    densityType: 'Sun-dried Loose Bulk & Bagged',
    buyerTargetTags: ['Biomass Plant', 'Bio-fertilizer & Compost', 'Cattle Feed Producer'],
    primaryBuyerTag: 'Biomass Plant',
    farmer: {
      name: 'Raghunath Kisan Patil',
      village: 'Niphad',
      district: 'Nashik',
      trustTier: 'GOVT_VERIFIED',
      trustScore: 98,
    },
    co2SavedTonnes: 45.0,
    burnPreventionBadge: 'Clean Biofuel Grade',
    description: 'Residual onion stalks from Garva harvest. High calorific value (3,400 kcal/kg) for biomass pelletization and boiler briquettes.',
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
    availableImmediate: true,
  },
  {
    id: 'BYP-LTR-303',
    name: 'Soybean Husk & Pod Shell Byproduct',
    marathiName: 'सोयाबीन भुसा आणि टरफले',
    category: 'Husk & Pods',
    sourceCrop: 'Yellow Soybean',
    quantity: 60,
    unit: 'Tonnes',
    pricePerUnit: 2400,
    unitName: 'Tonne',
    district: 'Latur',
    location: 'Renapur, Latur',
    moisturePercent: 8.5,
    densityType: 'Sieved Fine Flakes in Gunny Bags',
    buyerTargetTags: ['Cattle Feed Producer', 'Mushroom Cultivator'],
    primaryBuyerTag: 'Cattle Feed Producer',
    farmer: {
      name: 'Pandurang S. More',
      village: 'Renapur',
      district: 'Latur',
      trustTier: 'GOVT_VERIFIED',
      trustScore: 99,
    },
    co2SavedTonnes: 90.0,
    burnPreventionBadge: 'High-Protein Cattle Feed',
    description: 'Clean soybean pod chaff from mechanical thresher. 12.5% crude protein, excellent palatable dry fodder supplement for dairy cows.',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format&fit=crop&q=80',
    availableImmediate: true,
  },
  {
    id: 'BYP-AKL-404',
    name: 'Shredded Cotton Stalks & Bio-Residue',
    marathiName: 'कापूस पराटी बारीक भुसा',
    category: 'Stalks & Bio-waste',
    sourceCrop: 'Long Staple Cotton',
    quantity: 80,
    unit: 'Tonnes',
    pricePerUnit: 1450,
    unitName: 'Tonne',
    district: 'Akola',
    location: 'Murtizapur, Akola',
    moisturePercent: 10.2,
    densityType: 'Chipper Shredded (2-4 cm pieces)',
    buyerTargetTags: ['Biomass Plant', 'Packaging Manufacturer', 'Bio-fertilizer & Compost'],
    primaryBuyerTag: 'Packaging Manufacturer',
    farmer: {
      name: 'Gajanan P. Deshmukh',
      village: 'Murtizapur',
      district: 'Akola',
      trustTier: 'KYC_VERIFIED',
      trustScore: 91,
    },
    co2SavedTonnes: 120.0,
    burnPreventionBadge: 'Circular Pulp Grade',
    description: 'Post-picking cotton stalk mulch. Clean cellulosic fiber suitable for eco-friendly molded pulp packaging, particle board, and thermal power plant briquettes.',
    image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=600&auto=format&fit=crop&q=80',
    availableImmediate: true,
  },
  {
    id: 'BYP-KOL-505',
    name: 'Depithed Sugarcane Bagasse & Dry Trash',
    marathiName: 'उसाचे पाचट आणि बगॅस',
    category: 'Bagasse & Pulp',
    sourceCrop: 'Sugarcane',
    quantity: 120,
    unit: 'Tonnes',
    pricePerUnit: 1650,
    unitName: 'Tonne',
    district: 'Kolhapur',
    location: 'Kagal, Kolhapur',
    moisturePercent: 14.5,
    densityType: 'Baled Dry Fiber',
    buyerTargetTags: ['Packaging Manufacturer', 'Biomass Plant', 'Mushroom Cultivator'],
    primaryBuyerTag: 'Packaging Manufacturer',
    farmer: {
      name: 'Ananda R. Patil',
      village: 'Kagal',
      district: 'Kolhapur',
      trustTier: 'GOVT_VERIFIED',
      trustScore: 96,
    },
    co2SavedTonnes: 180.0,
    burnPreventionBadge: 'Plastic Alternative Pulp',
    description: 'High cellulose bagasse fiber. Extensively used in biodegradable food container packaging and biomass co-generation boilers.',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    availableImmediate: true,
  },
  {
    id: 'BYP-SOL-606',
    name: 'Cold-Pressed Mustard & Groundnut De-Oiled Cake',
    marathiName: 'शेंगदाणा आणि मोहरीची पेंड',
    category: 'Oilseed Cake',
    sourceCrop: 'Oilseeds',
    quantity: 25,
    unit: 'Tonnes',
    pricePerUnit: 3200,
    unitName: 'Tonne',
    district: 'Solapur',
    location: 'Pandharpur, Solapur',
    moisturePercent: 7.8,
    densityType: 'Compressed Flakes in 50kg Bags',
    buyerTargetTags: ['Cattle Feed Producer', 'Bio-fertilizer & Compost'],
    primaryBuyerTag: 'Cattle Feed Producer',
    farmer: {
      name: 'Tukaram K. Mane',
      village: 'Pandharpur',
      district: 'Solapur',
      trustTier: 'GOVT_VERIFIED',
      trustScore: 95,
    },
    co2SavedTonnes: 37.5,
    burnPreventionBadge: 'Zero-Waste Cold Pressing',
    description: 'Organic certified expeller pressed oilseed cake with 38% protein content. Ideal nutrient supplement for dairy cattle feed and organic soil enrichment.',
    image: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=600&auto=format&fit=crop&q=80',
    availableImmediate: true,
  }
];
`;

// Add isInsured: true to produce lots if not present
content = content.replace(
  "storageStatus: 'Stored in MSWC Nashik Hub (Chawl Bay #4)',",
  "isInsured: true,\n    insurancePremium: 572,\n    storageStatus: 'Stored in MSWC Nashik Hub (Chawl Bay #4)',"
);
content = content.replace(
  "storageStatus: 'Stored at Latur Grain Silo Hub',",
  "isInsured: true,\n    insurancePremium: 1240,\n    storageStatus: 'Stored at Latur Grain Silo Hub',"
);
content = content.replace(
  "storageStatus: 'Stored in Ginned Bale Warehouse #2',",
  "isInsured: false,\n    insurancePremium: 0,\n    storageStatus: 'Stored in Ginned Bale Warehouse #2',"
);
content = content.replace(
  "storageStatus: 'On-Farm Pre-Cooled Packhouse',",
  "isInsured: true,\n    insurancePremium: 316,\n    storageStatus: 'On-Farm Pre-Cooled Packhouse',"
);

// Append new datasets
content += '\n' + additionalData;

// Update COMPARISON_DATA with 4 differentiators
const newComparisonFeatures = `
  {
    feature: 'Digital Mandi Pooling & Live Reverse Auction',
    agriConnect: { supported: true, detail: 'Taluka aggregation for smallholders (<2T) + live multi-buyer bidding' },
    eNam: { supported: false, detail: 'Individual lot listing only (high mandi gate fee for small lots)' },
    deHaat: { supported: false, detail: 'Fixed village center aggregation price' },
    bijak: { supported: false, detail: 'One-on-one negotiation only' },
    agNext: { supported: false, detail: 'None' },
  },
  {
    feature: 'Crop Residue & Byproduct Exchange (Clean Air)',
    agriConnect: { supported: true, detail: 'Direct sale to Cattle Feed, Biomass Plants & Packaging with CO2 metrics' },
    eNam: { supported: false, detail: 'Food grain & vegetable mandis only' },
    deHaat: { supported: false, detail: 'Primary produce only' },
    bijak: { supported: false, detail: 'Primary produce only' },
    agNext: { supported: false, detail: 'None' },
  },
  {
    feature: 'Micro-Insurance at Point of Sale (0.8% Premium)',
    agriConnect: { supported: true, detail: 'Dynamic 1-click transit & storage damage protection with 48h DBT claim' },
    eNam: { supported: false, detail: 'None (only general PMFBY crop insurance)' },
    deHaat: { supported: false, detail: 'Third-party agent referral' },
    bijak: { supported: false, detail: 'Buyer credit insurance only' },
    agNext: { supported: false, detail: 'None' },
  },
  {
    feature: 'WhatsApp Voice Note AI & Multi-Lingual IVR',
    agriConnect: { supported: true, detail: 'Marathi/Hindi voice note quote + 1-tap listing + 1800 Toll-Free IVR' },
    eNam: { supported: false, detail: 'Complex desktop/mobile portal (high literacy barrier)' },
    deHaat: { supported: false, detail: 'App-only interface' },
    bijak: { supported: false, detail: 'App-only interface' },
    agNext: { supported: false, detail: 'None' },
  },
`;

content = content.replace(
  "export const COMPARISON_DATA = [",
  "export const COMPARISON_DATA = [" + newComparisonFeatures
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('mockData.js successfully updated!');
