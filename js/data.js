/* ═══════════════════════════════════════════════════════
   KisanSetu — Mock Data Store
   All data is demo/illustrative only
   ═══════════════════════════════════════════════════════ */

const KisanSetuData = {
  // ── Demo Users ────────────────────────────────────
  defaultFarmer: {
    id: 'farmer_001',
    name: 'Rajesh Patil',
    email: 'rajesh@kisansetu.demo',
    phone: '9876543210',
    location: 'Nashik, Maharashtra',
    type: 'farmer',
    avatar: 'RP',
    joined: '2024-06-15',
    totalCrops: 5,
    totalDeals: 12,
    preferredLang: 'en'
  },

  defaultTrader: {
    id: 'trader_001',
    name: 'Amit Sharma',
    email: 'amit@kisansetu.demo',
    phone: '9123456780',
    location: 'Mumbai, Maharashtra',
    type: 'trader',
    avatar: 'AS',
    joined: '2024-03-10',
    totalDeals: 45,
    rating: 4.6,
    verified: true
  },

  // ── Farmer's Crops ────────────────────────────────
  farmerCrops: [
    {
      id: 'crop_001',
      name: 'Onion',
      variety: 'Red Nashik',
      quantity: 1000,
      unit: 'kg',
      expectedPrice: 28,
      location: 'Nashik, Maharashtra',
      harvestDate: '2026-08-10',
      condition: 'Excellent',
      status: 'active',
      image: null,
      addedOn: '2026-08-12'
    },
    {
      id: 'crop_002',
      name: 'Tomato',
      variety: 'Hybrid',
      quantity: 500,
      unit: 'kg',
      expectedPrice: 35,
      location: 'Nashik, Maharashtra',
      harvestDate: '2026-08-15',
      condition: 'Good',
      status: 'active',
      image: null,
      addedOn: '2026-08-16'
    },
    {
      id: 'crop_003',
      name: 'Wheat',
      variety: 'Sharbati',
      quantity: 2000,
      unit: 'kg',
      expectedPrice: 25,
      location: 'Nashik, Maharashtra',
      harvestDate: '2026-07-20',
      condition: 'Good',
      status: 'sold',
      image: null,
      addedOn: '2026-07-25'
    },
    {
      id: 'crop_004',
      name: 'Potato',
      variety: 'Kufri Jyoti',
      quantity: 800,
      unit: 'kg',
      expectedPrice: 18,
      location: 'Nashik, Maharashtra',
      harvestDate: '2026-08-05',
      condition: 'Excellent',
      status: 'active',
      image: null,
      addedOn: '2026-08-08'
    },
    {
      id: 'crop_005',
      name: 'Soybean',
      variety: 'JS-335',
      quantity: 1500,
      unit: 'kg',
      expectedPrice: 45,
      location: 'Nashik, Maharashtra',
      harvestDate: '2026-09-01',
      condition: 'Good',
      status: 'upcoming',
      image: null,
      addedOn: '2026-08-20'
    }
  ],

  // ── Nearby Traders ────────────────────────────────
  traders: [
    {
      id: 'trader_101',
      name: 'ABC Traders',
      location: 'Pimpalgaon, Nashik',
      distance: 18,
      rating: 4.7,
      verified: true,
      totalDeals: 320,
      avatar: 'AT',
      speciality: 'Onion, Potato',
      offers: {
        'crop_001': { pricePerKg: 28, quantityNeeded: 1000, transportCost: 1500 },
        'crop_002': { pricePerKg: 33, quantityNeeded: 400, transportCost: 1500 },
        'crop_004': { pricePerKg: 19, quantityNeeded: 800, transportCost: 1500 }
      }
    },
    {
      id: 'trader_102',
      name: 'Kishor Agro',
      location: 'Lasalgaon, Nashik',
      distance: 25,
      rating: 4.5,
      verified: true,
      totalDeals: 210,
      avatar: 'KA',
      speciality: 'Onion, Tomato',
      offers: {
        'crop_001': { pricePerKg: 27, quantityNeeded: 1500, transportCost: 2200 },
        'crop_002': { pricePerKg: 36, quantityNeeded: 500, transportCost: 2200 }
      }
    },
    {
      id: 'trader_103',
      name: 'Mahalaxmi Trading Co.',
      location: 'Sinnar, Nashik',
      distance: 32,
      rating: 4.3,
      verified: true,
      totalDeals: 180,
      avatar: 'MT',
      speciality: 'Vegetables, Grains',
      offers: {
        'crop_001': { pricePerKg: 29, quantityNeeded: 800, transportCost: 3000 },
        'crop_002': { pricePerKg: 34, quantityNeeded: 500, transportCost: 3000 },
        'crop_004': { pricePerKg: 20, quantityNeeded: 600, transportCost: 3000 }
      }
    },
    {
      id: 'trader_104',
      name: 'Sahyadri Farmers Collective',
      location: 'Dindori, Nashik',
      distance: 12,
      rating: 4.8,
      verified: true,
      totalDeals: 450,
      avatar: 'SF',
      speciality: 'All Vegetables',
      offers: {
        'crop_001': { pricePerKg: 26, quantityNeeded: 2000, transportCost: 900 },
        'crop_002': { pricePerKg: 35, quantityNeeded: 500, transportCost: 900 },
        'crop_004': { pricePerKg: 18, quantityNeeded: 1000, transportCost: 900 }
      }
    },
    {
      id: 'trader_105',
      name: 'Priya Agri Services',
      location: 'Igatpuri, Nashik',
      distance: 45,
      rating: 4.1,
      verified: false,
      totalDeals: 95,
      avatar: 'PA',
      speciality: 'Grains, Pulses',
      offers: {
        'crop_001': { pricePerKg: 30, quantityNeeded: 500, transportCost: 4200 },
        'crop_005': { pricePerKg: 47, quantityNeeded: 1500, transportCost: 4200 }
      }
    },
    {
      id: 'trader_106',
      name: 'Nashik Fresh Market',
      location: 'Nashik City',
      distance: 8,
      rating: 4.4,
      verified: true,
      totalDeals: 280,
      avatar: 'NF',
      speciality: 'Tomato, Onion',
      offers: {
        'crop_001': { pricePerKg: 25, quantityNeeded: 500, transportCost: 600 },
        'crop_002': { pricePerKg: 37, quantityNeeded: 300, transportCost: 600 }
      }
    }
  ],

  // ── Market Prices (Demo Data) ─────────────────────
  marketPrices: [
    {
      crop: 'Onion',
      variety: 'Red Nashik',
      market: 'Lasalgaon APMC',
      distance: 25,
      minPrice: 20,
      maxPrice: 32,
      modalPrice: 26,
      date: '2026-08-22',
      trend: [22, 24, 23, 26, 25, 28, 26],
      trendDirection: 'up',
      unit: 'kg'
    },
    {
      crop: 'Tomato',
      variety: 'Hybrid',
      market: 'Nashik APMC',
      distance: 10,
      minPrice: 25,
      maxPrice: 42,
      modalPrice: 34,
      date: '2026-08-22',
      trend: [30, 32, 28, 35, 33, 36, 34],
      trendDirection: 'up',
      unit: 'kg'
    },
    {
      crop: 'Wheat',
      variety: 'Sharbati',
      market: 'Nashik APMC',
      distance: 10,
      minPrice: 22,
      maxPrice: 28,
      modalPrice: 25,
      date: '2026-08-22',
      trend: [24, 25, 25, 24, 26, 25, 25],
      trendDirection: 'stable',
      unit: 'kg'
    },
    {
      crop: 'Potato',
      variety: 'Kufri Jyoti',
      market: 'Pimpalgaon APMC',
      distance: 18,
      minPrice: 14,
      maxPrice: 22,
      modalPrice: 18,
      date: '2026-08-22',
      trend: [16, 15, 17, 18, 19, 18, 18],
      trendDirection: 'up',
      unit: 'kg'
    },
    {
      crop: 'Soybean',
      variety: 'JS-335',
      market: 'Nashik APMC',
      distance: 10,
      minPrice: 40,
      maxPrice: 52,
      modalPrice: 45,
      date: '2026-08-22',
      trend: [44, 46, 43, 45, 47, 45, 45],
      trendDirection: 'stable',
      unit: 'kg'
    },
    {
      crop: 'Rice',
      variety: 'Basmati',
      market: 'Sinnar APMC',
      distance: 32,
      minPrice: 35,
      maxPrice: 55,
      modalPrice: 42,
      date: '2026-08-22',
      trend: [38, 40, 42, 41, 43, 42, 42],
      trendDirection: 'up',
      unit: 'kg'
    },
    {
      crop: 'Sugarcane',
      variety: 'Co-86032',
      market: 'Nashik APMC',
      distance: 10,
      minPrice: 2.8,
      maxPrice: 3.5,
      modalPrice: 3.1,
      date: '2026-08-22',
      trend: [2.9, 3.0, 3.0, 3.1, 3.1, 3.2, 3.1],
      trendDirection: 'up',
      unit: 'kg'
    },
    {
      crop: 'Grapes',
      variety: 'Thompson Seedless',
      market: 'Nashik APMC',
      distance: 10,
      minPrice: 45,
      maxPrice: 75,
      modalPrice: 58,
      date: '2026-08-22',
      trend: [50, 55, 52, 58, 60, 57, 58],
      trendDirection: 'up',
      unit: 'kg'
    }
  ],

  // ── Offers / Negotiations ─────────────────────────
  offers: [
    {
      id: 'offer_001',
      cropId: 'crop_001',
      cropName: 'Onion (Red Nashik)',
      traderId: 'trader_101',
      traderName: 'ABC Traders',
      offerPrice: 28,
      quantity: 1000,
      unit: 'kg',
      status: 'pending',
      date: '2026-08-20',
      farmerCounterPrice: null,
      messages: [
        { from: 'trader', text: 'We can offer ₹28/kg for your onions. Pickup within 2 days.', time: '2026-08-20 10:30' }
      ]
    },
    {
      id: 'offer_002',
      cropId: 'crop_002',
      cropName: 'Tomato (Hybrid)',
      traderId: 'trader_106',
      traderName: 'Nashik Fresh Market',
      offerPrice: 37,
      quantity: 300,
      unit: 'kg',
      status: 'pending',
      date: '2026-08-21',
      farmerCounterPrice: null,
      messages: [
        { from: 'trader', text: 'Interested in 300 kg tomatoes at ₹37/kg.', time: '2026-08-21 14:00' }
      ]
    },
    {
      id: 'offer_003',
      cropId: 'crop_003',
      cropName: 'Wheat (Sharbati)',
      traderId: 'trader_103',
      traderName: 'Mahalaxmi Trading Co.',
      offerPrice: 24,
      quantity: 2000,
      unit: 'kg',
      status: 'accepted',
      date: '2026-08-01',
      farmerCounterPrice: 25,
      messages: [
        { from: 'trader', text: 'Offering ₹24/kg for 2000 kg wheat.', time: '2026-08-01 09:00' },
        { from: 'farmer', text: 'Can you do ₹25/kg?', time: '2026-08-01 11:00' },
        { from: 'trader', text: 'Deal at ₹25/kg. Will pickup tomorrow.', time: '2026-08-01 12:30' }
      ]
    },
    {
      id: 'offer_004',
      cropId: 'crop_001',
      cropName: 'Onion (Red Nashik)',
      traderId: 'trader_104',
      traderName: 'Sahyadri Farmers Collective',
      offerPrice: 26,
      quantity: 2000,
      unit: 'kg',
      status: 'rejected',
      date: '2026-08-18',
      farmerCounterPrice: null,
      messages: [
        { from: 'trader', text: 'We need 2000 kg onions. Price: ₹26/kg', time: '2026-08-18 16:00' },
        { from: 'farmer', text: 'Price too low. Looking for at least ₹27/kg.', time: '2026-08-18 18:00' }
      ]
    },
    {
      id: 'offer_005',
      cropId: 'crop_004',
      cropName: 'Potato (Kufri Jyoti)',
      traderId: 'trader_101',
      traderName: 'ABC Traders',
      offerPrice: 19,
      quantity: 800,
      unit: 'kg',
      status: 'countered',
      date: '2026-08-19',
      farmerCounterPrice: 20,
      messages: [
        { from: 'trader', text: 'Offering ₹19/kg for 800 kg potatoes.', time: '2026-08-19 10:00' },
        { from: 'farmer', text: 'Counter: ₹20/kg. Potatoes are excellent quality.', time: '2026-08-19 14:00' }
      ]
    }
  ],

  // ── Recent Transactions ───────────────────────────
  transactions: [
    {
      id: 'txn_001',
      cropName: 'Wheat (Sharbati)',
      traderName: 'Mahalaxmi Trading Co.',
      quantity: 2000,
      unit: 'kg',
      price: 25,
      totalAmount: 50000,
      transportCost: 3000,
      netAmount: 47000,
      date: '2026-08-02',
      status: 'completed'
    },
    {
      id: 'txn_002',
      cropName: 'Onion (Red)',
      traderName: 'ABC Traders',
      quantity: 500,
      unit: 'kg',
      price: 24,
      totalAmount: 12000,
      transportCost: 1500,
      netAmount: 10500,
      date: '2026-07-15',
      status: 'completed'
    }
  ],

  // ── Crop Types for Add Crop Form ──────────────────
  cropTypes: [
    { name: 'Onion', varieties: ['Red Nashik', 'White', 'Shallot'] },
    { name: 'Tomato', varieties: ['Hybrid', 'Desi', 'Cherry'] },
    { name: 'Wheat', varieties: ['Sharbati', 'Lokwan', 'MP Wheat'] },
    { name: 'Potato', varieties: ['Kufri Jyoti', 'Kufri Pukhraj', 'Atlantic'] },
    { name: 'Soybean', varieties: ['JS-335', 'JS-9560', 'NRC-37'] },
    { name: 'Rice', varieties: ['Basmati', 'Indrayani', 'Kolam'] },
    { name: 'Sugarcane', varieties: ['Co-86032', 'CoM-0265', 'Co-92005'] },
    { name: 'Grapes', varieties: ['Thompson Seedless', 'Sharad Seedless', 'Sonaka'] },
    { name: 'Pomegranate', varieties: ['Bhagwa', 'Ganesh', 'Arakta'] },
    { name: 'Cotton', varieties: ['BT Cotton', 'Desi Cotton'] },
    { name: 'Maize', varieties: ['Yellow', 'White', 'Baby Corn'] },
    { name: 'Chickpea', varieties: ['Desi', 'Kabuli'] }
  ],

  // ── Notifications ─────────────────────────────────
  notifications: [
    {
      id: 'notif_001',
      title: 'New Offer Received',
      message: 'ABC Traders offered ₹28/kg for your Onion crop',
      type: 'info',
      time: '2 hours ago',
      read: false
    },
    {
      id: 'notif_002',
      title: 'Price Alert',
      message: 'Onion prices are trending up in Lasalgaon market',
      type: 'success',
      time: '5 hours ago',
      read: false
    },
    {
      id: 'notif_003',
      title: 'Offer Accepted',
      message: 'Your wheat deal with Mahalaxmi Trading is confirmed',
      type: 'success',
      time: '1 day ago',
      read: true
    },
    {
      id: 'notif_004',
      title: 'New Trader Nearby',
      message: 'Nashik Fresh Market is now available in your area',
      type: 'info',
      time: '2 days ago',
      read: true
    }
  ],

  // ── Trader Dashboard Listings (from farmers) ──────
  traderListings: [
    {
      id: 'listing_001',
      farmerName: 'Rajesh Patil',
      farmerId: 'farmer_001',
      crop: 'Onion',
      variety: 'Red Nashik',
      quantity: 1000,
      unit: 'kg',
      expectedPrice: 28,
      location: 'Nashik, Maharashtra',
      distance: 18,
      condition: 'Excellent',
      harvestDate: '2026-08-10',
      status: 'available'
    },
    {
      id: 'listing_002',
      farmerName: 'Sunita Jadhav',
      farmerId: 'farmer_002',
      crop: 'Tomato',
      variety: 'Hybrid',
      quantity: 300,
      unit: 'kg',
      expectedPrice: 35,
      location: 'Pimpalgaon, Nashik',
      distance: 22,
      condition: 'Good',
      harvestDate: '2026-08-18',
      status: 'available'
    },
    {
      id: 'listing_003',
      farmerName: 'Ganesh More',
      farmerId: 'farmer_003',
      crop: 'Potato',
      variety: 'Kufri Jyoti',
      quantity: 1500,
      unit: 'kg',
      expectedPrice: 18,
      location: 'Sinnar, Nashik',
      distance: 30,
      condition: 'Excellent',
      harvestDate: '2026-08-12',
      status: 'available'
    },
    {
      id: 'listing_004',
      farmerName: 'Anita Deshmukh',
      farmerId: 'farmer_004',
      crop: 'Soybean',
      variety: 'JS-335',
      quantity: 2000,
      unit: 'kg',
      expectedPrice: 44,
      location: 'Dindori, Nashik',
      distance: 15,
      condition: 'Good',
      harvestDate: '2026-09-05',
      status: 'available'
    },
    {
      id: 'listing_005',
      farmerName: 'Manoj Shinde',
      farmerId: 'farmer_005',
      crop: 'Grapes',
      variety: 'Thompson Seedless',
      quantity: 800,
      unit: 'kg',
      expectedPrice: 55,
      location: 'Nashik Road',
      distance: 12,
      condition: 'Excellent',
      harvestDate: '2026-08-20',
      status: 'available'
    },
    {
      id: 'listing_006',
      farmerName: 'Rajesh Patil',
      farmerId: 'farmer_001',
      crop: 'Tomato',
      variety: 'Hybrid',
      quantity: 500,
      unit: 'kg',
      expectedPrice: 35,
      location: 'Nashik, Maharashtra',
      distance: 18,
      condition: 'Good',
      harvestDate: '2026-08-15',
      status: 'available'
    }
  ]
};

// Make data available globally
window.KisanSetuData = KisanSetuData;
