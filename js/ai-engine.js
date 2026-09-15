/* ═══════════════════════════════════════════════════════
   KisanSetu — AI Intelligence Engine
   Transport Cost, Spoilage Risk, Price Prediction
   All calculations run client-side (no API keys needed)
   ═══════════════════════════════════════════════════════ */

const AIEngine = {

  // ── Crop Database (shelf life, ideal temps, perishability) ──
  cropProfiles: {
    'onion':       { shelfLifeDays: 30, idealTempC: 25, perishability: 'low', spoilageBaseRate: 0.02, category: 'vegetable' },
    'tomato':      { shelfLifeDays: 7,  idealTempC: 13, perishability: 'high', spoilageBaseRate: 0.10, category: 'vegetable' },
    'potato':      { shelfLifeDays: 60, idealTempC: 10, perishability: 'low', spoilageBaseRate: 0.01, category: 'vegetable' },
    'wheat':       { shelfLifeDays: 180, idealTempC: 25, perishability: 'very_low', spoilageBaseRate: 0.003, category: 'grain' },
    'rice':        { shelfLifeDays: 180, idealTempC: 25, perishability: 'very_low', spoilageBaseRate: 0.003, category: 'grain' },
    'soybean':     { shelfLifeDays: 120, idealTempC: 20, perishability: 'low', spoilageBaseRate: 0.005, category: 'grain' },
    'sugarcane':   { shelfLifeDays: 3,  idealTempC: 25, perishability: 'very_high', spoilageBaseRate: 0.15, category: 'cash_crop' },
    'grapes':      { shelfLifeDays: 5,  idealTempC: 2,  perishability: 'very_high', spoilageBaseRate: 0.12, category: 'fruit' },
    'pomegranate': { shelfLifeDays: 14, idealTempC: 5,  perishability: 'medium', spoilageBaseRate: 0.05, category: 'fruit' },
    'cotton':      { shelfLifeDays: 365, idealTempC: 25, perishability: 'very_low', spoilageBaseRate: 0.001, category: 'fibre' },
    'maize':       { shelfLifeDays: 150, idealTempC: 20, perishability: 'very_low', spoilageBaseRate: 0.004, category: 'grain' },
    'chickpea':    { shelfLifeDays: 180, idealTempC: 20, perishability: 'very_low', spoilageBaseRate: 0.003, category: 'pulse' },
    // Millets (Shree Anna)
    'ragi':        { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' },
    'bajra':       { shelfLifeDays: 150, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.003, category: 'millet' },
    'jowar':       { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' },
    'foxtail millet': { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' },
    'little millet':  { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' },
    'barnyard millet': { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' },
    'kodo millet':    { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' },
    'finger millet':  { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' },
    'pearl millet':   { shelfLifeDays: 150, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.003, category: 'millet' },
    'sorghum':        { shelfLifeDays: 180, idealTempC: 22, perishability: 'very_low', spoilageBaseRate: 0.002, category: 'millet' }
  },

  // Get crop profile (case-insensitive fuzzy match)
  getCropProfile(cropName) {
    if (!cropName) return this.cropProfiles['onion']; // default
    const key = cropName.toLowerCase().trim();
    // Exact match
    if (this.cropProfiles[key]) return this.cropProfiles[key];
    // Partial match
    const match = Object.keys(this.cropProfiles).find(k => key.includes(k) || k.includes(key));
    return match ? this.cropProfiles[match] : { shelfLifeDays: 30, idealTempC: 25, perishability: 'medium', spoilageBaseRate: 0.04, category: 'unknown' };
  },

  // ═══════════════════════════════════════════════════
  // 🚚 AI TRANSPORT COST ESTIMATOR
  // ═══════════════════════════════════════════════════
  estimateTransportCost({
    distanceKm = 20,
    quantityKg = 1000,
    cropType = 'onion',
    roadCondition = 'good',   // good | moderate | poor
    fuelPricePerLitre = 90
  } = {}) {
    const profile = this.getCropProfile(cropType);

    // Auto-select vehicle based on quantity
    let vehicle, baseCostPerKm, capacity, mileage;
    if (quantityKg <= 300) {
      vehicle = 'Auto Rickshaw / Tempo';
      baseCostPerKm = 12;
      capacity = 300;
      mileage = 18; // km/litre
    } else if (quantityKg <= 1000) {
      vehicle = 'Mini Truck (Tata Ace)';
      baseCostPerKm = 18;
      capacity = 1000;
      mileage = 14;
    } else if (quantityKg <= 3000) {
      vehicle = 'Medium Truck';
      baseCostPerKm = 25;
      capacity = 3000;
      mileage = 10;
    } else {
      vehicle = 'Heavy Truck';
      baseCostPerKm = 32;
      capacity = 8000;
      mileage = 7;
    }

    // Road condition multiplier
    const roadMultiplier = { good: 1.0, moderate: 1.18, poor: 1.40 }[roadCondition] || 1.0;

    // Fuel cost
    const fuelLitres = (distanceKm * 2) / mileage; // round trip
    const fuelCost = Math.round(fuelLitres * fuelPricePerLitre);

    // Labour (loading + unloading)
    const labourRate = profile.category === 'grain' || profile.category === 'millet' ? 2 : 
                       profile.category === 'fruit' ? 5 : 3; // ₹/kg
    const labourCost = Math.round(quantityKg * labourRate * 0.3); // ~30% manual handling

    // Vehicle rent (base cost * distance * road condition)
    const vehicleRent = Math.round(baseCostPerKm * distanceKm * roadMultiplier);

    // Toll estimate (₹50 per 30km on highways)
    const tollEstimate = Math.round((distanceKm / 30) * 50);

    // Packaging (perishable crops need crates/boxes)
    const packagingCost = profile.perishability === 'very_high' ? Math.round(quantityKg * 1.5) :
                          profile.perishability === 'high' ? Math.round(quantityKg * 0.8) :
                          profile.perishability === 'medium' ? Math.round(quantityKg * 0.3) : 0;

    const totalCost = fuelCost + labourCost + vehicleRent + tollEstimate + packagingCost;
    const costPerKg = Math.round((totalCost / quantityKg) * 100) / 100;

    // Estimated transit time
    const avgSpeed = { good: 40, moderate: 30, poor: 20 }[roadCondition] || 35;
    const transitTimeHours = Math.round((distanceKm / avgSpeed) * 10) / 10;

    return {
      totalCost,
      costPerKg,
      fuelCost,
      labourCost,
      vehicleRent,
      tollEstimate,
      packagingCost,
      vehicle,
      roadCondition,
      transitTimeHours,
      distanceKm,
      quantityKg,
      breakdown: [
        { label: 'Fuel (round trip)', value: fuelCost },
        { label: 'Vehicle Rent', value: vehicleRent },
        { label: 'Labour', value: labourCost },
        { label: 'Toll', value: tollEstimate },
        { label: 'Packaging', value: packagingCost }
      ]
    };
  },

  // ═══════════════════════════════════════════════════
  // 🧪 AI SPOILAGE RISK PREDICTOR
  // ═══════════════════════════════════════════════════
  predictSpoilageRisk({
    cropName = 'onion',
    harvestDate = null,
    currentDate = null,
    condition = 'Good',        // Excellent | Good | Average | Below Average
    temperatureC = null,       // optional, defaults to seasonal avg
    storageType = 'open',      // open | covered | cold_storage
    distanceKm = 20,
    transitTimeHours = null
  } = {}) {
    const profile = this.getCropProfile(cropName);
    const now = currentDate ? new Date(currentDate) : new Date();
    const harvest = harvestDate ? new Date(harvestDate) : new Date(now - 2 * 86400000); // default: 2 days ago

    // Days since harvest
    const daysSinceHarvest = Math.max(0, Math.floor((now - harvest) / 86400000));

    // Temperature (default: seasonal average for Maharashtra ~30°C summer, ~22°C winter)
    const month = now.getMonth();
    const seasonalTemp = month >= 3 && month <= 9 ? 32 : 22; // rough India seasonal
    const temp = temperatureC || seasonalTemp;

    // Condition multiplier
    const conditionMultiplier = {
      'Excellent': 0.6,
      'Good': 1.0,
      'Average': 1.5,
      'Below Average': 2.2
    }[condition] || 1.0;

    // Storage multiplier
    const storageMultiplier = {
      'cold_storage': 0.15,
      'covered': 0.7,
      'open': 1.0
    }[storageType] || 1.0;

    // Temperature factor (higher temp = faster spoilage for perishables)
    const tempDiff = Math.max(0, temp - profile.idealTempC);
    const tempFactor = 1 + (tempDiff * 0.06);

    // Transit time
    const transit = transitTimeHours || (distanceKm / 35); // avg 35 km/h
    const transitFactor = 1 + (transit * 0.03);

    // Calculate daily spoilage rate
    const dailyRate = profile.spoilageBaseRate * conditionMultiplier * storageMultiplier * tempFactor;

    // Total spoilage percentage
    const totalSpoilagePercent = Math.min(95, dailyRate * daysSinceHarvest * transitFactor * 100);

    // Remaining shelf life
    const usedLife = daysSinceHarvest / profile.shelfLifeDays;
    const remainingDays = Math.max(0, Math.round(profile.shelfLifeDays * (1 - usedLife) / (conditionMultiplier * storageMultiplier)));

    // Risk level
    let riskLevel, riskColor;
    if (totalSpoilagePercent < 10) { riskLevel = 'Low'; riskColor = '#22C55E'; }
    else if (totalSpoilagePercent < 25) { riskLevel = 'Medium'; riskColor = '#F59E0B'; }
    else if (totalSpoilagePercent < 50) { riskLevel = 'High'; riskColor = '#EF4444'; }
    else { riskLevel = 'Critical'; riskColor = '#DC2626'; }

    // Recommendations
    const recommendations = [];
    if (riskLevel === 'Critical' || riskLevel === 'High') {
      recommendations.push('🚨 Sell immediately — spoilage risk is very high');
      recommendations.push('🧊 Move to cold storage if available');
    }
    if (temp > profile.idealTempC + 10) {
      recommendations.push('🌡️ High temperature — store in shade or cool area');
    }
    if (storageType === 'open') {
      recommendations.push('📦 Move to covered storage to extend shelf life');
    }
    if (daysSinceHarvest > profile.shelfLifeDays * 0.7) {
      recommendations.push('⏰ Nearing end of shelf life — prioritize this crop for sale');
    }
    if (distanceKm > 40 && profile.perishability === 'high') {
      recommendations.push('🚚 Choose nearest trader to minimize transit spoilage');
    }
    if (profile.category === 'millet' || profile.category === 'grain') {
      recommendations.push('✅ Grains/millets have long shelf life — you can wait for better prices');
    }
    if (recommendations.length === 0) {
      recommendations.push('✅ Crop is in good condition. You have time to negotiate.');
    }

    return {
      riskLevel,
      riskColor,
      riskPercent: Math.round(totalSpoilagePercent * 10) / 10,
      estimatedShelfLifeDays: remainingDays,
      daysSinceHarvest,
      spoilageLossPercent: Math.round(totalSpoilagePercent * 10) / 10,
      temperatureC: temp,
      storageType,
      condition,
      recommendations,
      profile: {
        perishability: profile.perishability,
        category: profile.category,
        totalShelfLife: profile.shelfLifeDays
      }
    };
  },

  // ═══════════════════════════════════════════════════
  // 📈 AI PRICE PREDICTION (7-day forecast)
  // ═══════════════════════════════════════════════════
  predictPrice({
    cropName = 'onion',
    historicalPrices = [],
    currentPrice = null,
    season = null           // 'kharif' | 'rabi' | 'zaid' | auto-detect
  } = {}) {
    // Auto-detect season from current month
    const month = new Date().getMonth(); // 0-11
    if (!season) {
      if (month >= 5 && month <= 9) season = 'kharif';      // June-Oct
      else if (month >= 10 || month <= 2) season = 'rabi';    // Nov-Mar
      else season = 'zaid';                                   // Apr-May (summer)
    }

    // Seasonal demand factor per crop
    const seasonalFactors = {
      'onion':  { kharif: 1.15, rabi: 0.90, zaid: 1.25 },
      'tomato': { kharif: 0.85, rabi: 1.10, zaid: 1.20 },
      'potato': { kharif: 1.05, rabi: 0.95, zaid: 1.10 },
      'wheat':  { kharif: 1.00, rabi: 0.90, zaid: 1.05 },
      'rice':   { kharif: 0.90, rabi: 1.05, zaid: 1.00 },
      'ragi':   { kharif: 0.95, rabi: 1.10, zaid: 1.00 },
      'bajra':  { kharif: 0.90, rabi: 1.05, zaid: 1.00 },
      'jowar':  { kharif: 0.90, rabi: 1.10, zaid: 1.00 }
    };

    const key = cropName.toLowerCase().trim();
    const factors = seasonalFactors[key] || { kharif: 1.0, rabi: 1.0, zaid: 1.0 };
    const seasonFactor = factors[season] || 1.0;

    // Use provided or default historical prices
    let prices = historicalPrices.length >= 3 ? [...historicalPrices] : null;

    if (!prices) {
      // Generate synthetic history from market data
      const market = (typeof KisanSetuData !== 'undefined')
        ? KisanSetuData.marketPrices.find(m => m.crop.toLowerCase() === key)
        : null;
      if (market && market.trend) {
        prices = market.trend;
      } else {
        const base = currentPrice || 30;
        prices = Array.from({ length: 7 }, (_, i) =>
          Math.round(base * (0.95 + Math.random() * 0.10))
        );
      }
    }

    // Weighted Moving Average (recent values weighted more)
    const n = prices.length;
    const weights = prices.map((_, i) => i + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const wma = prices.reduce((sum, p, i) => sum + p * weights[i], 0) / totalWeight;

    // Calculate trend (slope of last N points)
    const recentN = Math.min(5, n);
    const recentSlice = prices.slice(-recentN);
    const xMean = (recentN - 1) / 2;
    const yMean = recentSlice.reduce((a, b) => a + b, 0) / recentN;
    let numerator = 0, denominator = 0;
    recentSlice.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += (x - xMean) * (x - xMean);
    });
    const slope = denominator > 0 ? numerator / denominator : 0;

    // Generate 7-day predictions
    const lastPrice = prices[prices.length - 1];
    const predictedPrices = [];
    for (let day = 1; day <= 7; day++) {
      const trendComponent = slope * day;
      const seasonComponent = (seasonFactor - 1) * lastPrice * (day / 14); // gradual seasonal effect
      const noise = (Math.random() - 0.5) * lastPrice * 0.03; // ±1.5% noise
      const predicted = Math.round((lastPrice + trendComponent + seasonComponent + noise) * 100) / 100;
      predictedPrices.push(Math.max(1, predicted));
    }

    // Determine trend direction
    const avgPredicted = predictedPrices.reduce((a, b) => a + b, 0) / predictedPrices.length;
    const pctChange = ((avgPredicted - lastPrice) / lastPrice) * 100;
    let trend, trendIcon;
    if (pctChange > 3) { trend = 'rising'; trendIcon = '📈'; }
    else if (pctChange < -3) { trend = 'falling'; trendIcon = '📉'; }
    else { trend = 'stable'; trendIcon = '➡️'; }

    // Confidence based on data quality
    const confidence = Math.min(90, 50 + historicalPrices.length * 3);

    // Sell recommendation
    let sellRecommendation, sellUrgency;
    if (trend === 'falling' && pctChange < -5) {
      sellRecommendation = 'Sell Now — prices are expected to drop significantly';
      sellUrgency = 'high';
    } else if (trend === 'falling') {
      sellRecommendation = 'Consider selling soon — slight downward trend';
      sellUrgency = 'medium';
    } else if (trend === 'rising' && pctChange > 5) {
      sellRecommendation = 'Hold for 3-5 days — prices are rising';
      sellUrgency = 'low';
    } else if (trend === 'rising') {
      sellRecommendation = 'Can wait 1-2 days — slight upward trend';
      sellUrgency = 'low';
    } else {
      sellRecommendation = 'Stable prices — sell when convenient';
      sellUrgency = 'medium';
    }

    return {
      predictedPrices,
      currentPrice: lastPrice,
      trend,
      trendIcon,
      pctChange: Math.round(pctChange * 10) / 10,
      confidence,
      season,
      seasonFactor,
      sellRecommendation,
      sellUrgency,
      weightedAvg: Math.round(wma * 100) / 100,
      historical: prices
    };
  },

  // ═══════════════════════════════════════════════════
  // 🏆 ENHANCED SMART TRADER SCORING
  // ═══════════════════════════════════════════════════
  scoreTrader({
    trader,
    crop,
    offer,
    spoilageData = null,
    transportData = null
  } = {}) {
    if (!trader || !crop || !offer) return null;

    // Get or calculate transport cost
    const transport = transportData || this.estimateTransportCost({
      distanceKm: trader.distance || 20,
      quantityKg: crop.quantity || 1000,
      cropType: crop.name || 'onion'
    });

    // Get or calculate spoilage
    const spoilage = spoilageData || this.predictSpoilageRisk({
      cropName: crop.name,
      harvestDate: crop.harvestDate,
      condition: crop.condition,
      distanceKm: trader.distance,
      transitTimeHours: transport.transitTimeHours
    });

    const sellableQty = Math.min(offer.quantityNeeded || crop.quantity, crop.quantity);
    const grossReturn = offer.pricePerKg * sellableQty;
    const spoilageLoss = grossReturn * (spoilage.riskPercent / 100);
    const adjustedNetReturn = grossReturn - transport.totalCost - spoilageLoss;

    // Scoring weights
    const maxDist = 60;
    const distScore = Math.max(0, (maxDist - (trader.distance || 0)) / maxDist);
    const ratingScore = (trader.rating || 3) / 5;
    const qtyMatch = sellableQty / (crop.quantity || 1);
    const verifiedBonus = trader.verified ? 0.1 : 0;

    const score = (adjustedNetReturn / 100000) * 0.55
      + distScore * 0.15
      + ratingScore * 0.12
      + qtyMatch * 0.08
      + verifiedBonus;

    return {
      trader,
      offer,
      transport,
      spoilage,
      grossReturn,
      spoilageLoss: Math.round(spoilageLoss),
      adjustedNetReturn: Math.round(adjustedNetReturn),
      sellableQty,
      score: Math.round(score * 1000) / 1000,
      highlights: [
        `Net Return: ₹${Math.round(adjustedNetReturn).toLocaleString()}`,
        `Transport: ₹${transport.totalCost.toLocaleString()} (${transport.vehicle})`,
        `Spoilage Risk: ${spoilage.riskLevel} (${spoilage.riskPercent}%)`,
        `Transit: ${transport.transitTimeHours}h`
      ]
    };
  },

  // ═══════════════════════════════════════════════════
  // 🌾 FULL CROP ANALYSIS (combines all AI features)
  // ═══════════════════════════════════════════════════
  analyzeCrop(crop) {
    if (!crop) return null;

    const spoilage = this.predictSpoilageRisk({
      cropName: crop.name,
      harvestDate: crop.harvestDate,
      condition: crop.condition || 'Good'
    });

    const priceForecast = this.predictPrice({
      cropName: crop.name,
      currentPrice: crop.expectedPrice
    });

    // Transport to nearest 3 sample distances
    const transportEstimates = [10, 25, 50].map(d => ({
      distance: d,
      ...this.estimateTransportCost({
        distanceKm: d,
        quantityKg: crop.quantity || 1000,
        cropType: crop.name
      })
    }));

    return {
      crop,
      spoilage,
      priceForecast,
      transportEstimates,
      overallRecommendation: this._generateOverallRecommendation(spoilage, priceForecast),
      timestamp: new Date().toISOString()
    };
  },

  _generateOverallRecommendation(spoilage, forecast) {
    if (spoilage.riskLevel === 'Critical') return '🚨 Sell immediately — high spoilage risk outweighs waiting for better price';
    if (spoilage.riskLevel === 'High' && forecast.trend !== 'rising') return '⚠️ Sell within 1-2 days — spoilage risk is significant';
    if (forecast.trend === 'rising' && spoilage.riskLevel === 'Low') return '📈 Hold for 3-5 days — prices are rising and your crop is stable';
    if (forecast.trend === 'falling') return '💰 Sell now — prices are trending down';
    return '✅ Stable conditions — sell when you find a good trader match';
  }
};

// Make globally available
window.AIEngine = AIEngine;
