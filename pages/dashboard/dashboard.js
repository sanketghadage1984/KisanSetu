// ═══════════════════════════════════════════════════════
// KisanSetu — Farmer Dashboard Logic (Firebase Firestore)
// ═══════════════════════════════════════════════════════
/* global App, BackendService, auth, renderTopNav, renderDashboardSidebar, renderBottomNav, getCropEmoji, KisanSetuData */

let _dashCrops = [], _dashOffers = [], _dashTxns = [];
let _unsubCrops = null, _unsubOffers = null;

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(async user => {
    if (!user) { App.navigateTo('login'); return; }
    // Role guard: Traders must go to their own dashboard
    const profile = await BackendService.getUserProfile(user.uid).catch(() => null);
    if (profile && profile.userType === 'trader') {
      App.navigateTo('trader-dashboard');
      return;
    }
    // Sync profile to localStorage in case it was cleared
    if (profile) {
      localStorage.setItem('kisansetu_farmer', JSON.stringify({
        uid: profile.uid, name: profile.name, email: profile.email,
        phone: profile.phone || '', location: profile.location || '',
        type: 'farmer', avatar: profile.avatar || profile.name.charAt(0)
      }));
      localStorage.setItem('kisansetu_userType', 'farmer');
      localStorage.setItem('kisansetu_loggedIn', 'true');
    }
    initDashboard(user);
  });

  window.addEventListener('languageChanged', () => {
    const userType = App.getUserType();
    const topNav = document.getElementById('topNav');
    if (topNav && typeof renderTopNav === 'function') {
      topNav.innerHTML = `
        <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
        ${renderTopNav(userType)}
      `;
    }
    const sidebar = document.getElementById('sidebar');
    if (sidebar && typeof renderDashboardSidebar === 'function') {
      sidebar.innerHTML = renderDashboardSidebar('dashboard', userType);
    }
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav && typeof renderBottomNav === 'function') {
      bottomNav.innerHTML = renderBottomNav('dashboard', userType);
    }
    if (App && typeof App.initNavigation === 'function') {
      App.initNavigation();
    }
    if (App && typeof App.translatePage === 'function') {
      App.translatePage();
    }
    populateStats();
    populateBestTrader();
    populateCrops();
    populateMarketQuick();
    populateRecentOffers();
    populateRecentTransactions();
  });
});

function initDashboard(user) {
  const userType = App.getUserType();
  const topNav = document.getElementById('topNav');
  if (topNav && typeof renderTopNav === 'function') {
    topNav.innerHTML = `
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      ${renderTopNav(userType)}
    `;
  }
  const sidebar = document.getElementById('sidebar');
  if (sidebar && typeof renderDashboardSidebar === 'function') {
    sidebar.innerHTML = renderDashboardSidebar('dashboard', userType);
  }
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav && typeof renderBottomNav === 'function') {
    bottomNav.innerHTML = renderBottomNav('dashboard', userType);
  }

  // Re-init nav after injecting
  if (App && typeof App.initNavigation === 'function') {
    App.initNavigation();
  }
  if (App && typeof App.translatePage === 'function') {
    App.translatePage();
  }

  document.getElementById('farmerName').textContent = (user.displayName || user.name || 'Farmer').split(' ')[0];

  let _firstCropLoad = true;

  // Real-time listener — Farmer's crops
  if (_unsubCrops) _unsubCrops();
  _unsubCrops = BackendService.listenToCrops(user.uid, (crops) => {
    _dashCrops = crops;

    // Auto-seed demo data on first login if account is empty
    if (_firstCropLoad && crops.length === 0) {
      _firstCropLoad = false;
      BackendService.seedDemoData(user.uid, 'farmer').catch(e => console.warn('Auto-seed failed:', e));
      return; // Listener will fire again once seed data is written
    }
    _firstCropLoad = false;

    populateStats();
    populateBestTrader();
    populateCrops();
  });

  // Real-time listener — Farmer's offers
  if (_unsubOffers) _unsubOffers();
  _unsubOffers = BackendService.listenToOffers(user.uid, 'farmer', (offers) => {
    _dashOffers = offers;
    populateStats();
    populateRecentOffers();
  });

  // One-time load of transactions
  BackendService.getTransactions(user.uid).then(txns => {
    _dashTxns = txns;
    populateStats();
    populateRecentTransactions();
  }).catch(() => {
    _dashTxns = App.getTransactions();
    populateRecentTransactions();
  });

  populateMarketQuick();

  // ── New SIH Feature Widgets ──────────────────────
  populateWeatherWidget();
  populateGovtSchemes();
  populateAISpoilageAlerts();
}

// ── Weather Widget ─────────────────────────────────
async function populateWeatherWidget() {
  const container = document.getElementById('weatherWidget');
  if (!container || typeof WeatherService === 'undefined') return;

  const user = App.getUser();
  const location = user?.location || '';

  try {
    const weather = await WeatherService.fetchWeather(location);
    container.innerHTML = WeatherService.renderWidget(weather);

    // Feed temperature to AI Engine for future spoilage calculations
    window._currentWeather = weather;
  } catch (err) {
    console.warn('[Dashboard] Weather widget failed:', err);
  }
}

// ── Government Schemes Widget ──────────────────────
function populateGovtSchemes() {
  const container = document.getElementById('govtSchemesWidget');
  if (!container || typeof GovtSchemes === 'undefined') return;

  const user = App.getUser();
  const crops = _dashCrops.map(c => c.name || c.crop || '');
  const eligible = GovtSchemes.checkEligibility(user || {}, crops);
  container.innerHTML = GovtSchemes.renderWidget(eligible, 3);
}

// ── AI Spoilage Alerts ─────────────────────────────
// ── AI Spoilage & Logistics Intelligence Card ─────────────
function populateAISpoilageAlerts() {
  const container = document.getElementById('aiSpoilageAlerts');
  if (!container) return;

  const crops = (_dashCrops && _dashCrops.length > 0) ? _dashCrops : (App.getCrops && App.getCrops().length > 0 ? App.getCrops() : [
    { name: 'Onion', quantity: 1200, condition: 'Good', harvestDate: new Date(Date.now() - 5*86400000).toISOString().split('T')[0] },
    { name: 'Tomato', quantity: 800, condition: 'Good', harvestDate: new Date(Date.now() - 2*86400000).toISOString().split('T')[0] }
  ]);

  const activeCrops = crops.filter(c => c.status !== 'sold');
  const tempC = window._currentWeather?.avgTemperature || 28;

  const analysis = activeCrops.slice(0, 3).map(crop => {
    const cropName = crop.name || crop.crop || 'Crop';
    let risk = { riskLevel: 'Low', riskPercent: 8, riskColor: '#22C55E', remainingDays: 24, recommendations: ['Standard dry storage'] };
    let transport = { vehicle: 'Mini Truck (Tata Ace)', totalEstimatedCost: 650, costPerKg: 0.65 };

    if (window.AIEngine) {
      if (typeof AIEngine.predictSpoilageRisk === 'function') {
        try {
          const r = AIEngine.predictSpoilageRisk({
            cropType: cropName,
            currentTempC: tempC,
            harvestDate: crop.harvestDate,
            condition: crop.condition || 'Good'
          });
          if (r) {
            risk = {
              riskLevel: r.riskLevel || 'Low',
              riskPercent: r.riskPercent || Math.round(r.estimatedLossPct || 8),
              riskColor: r.riskColor || (r.riskLevel === 'High' ? '#EF4444' : (r.riskLevel === 'Medium' ? '#F59E0B' : '#22C55E')),
              remainingDays: r.remainingShelfLifeDays || 22,
              recommendations: r.recommendations || ['Good shelf condition']
            };
          }
        } catch (e) {}
      }

      if (typeof AIEngine.estimateTransportCost === 'function') {
        try {
          const t = AIEngine.estimateTransportCost({
            distanceKm: 35,
            quantityKg: crop.quantity || 1000,
            cropType: cropName
          });
          if (t) {
            transport = {
              vehicle: t.vehicle || transport.vehicle,
              totalEstimatedCost: t.totalEstimatedCost || 650,
              costPerKg: t.costPerKg || 0.65
            };
          }
        } catch (e) {}
      }
    }

    return { crop, cropName, risk, transport };
  });

  container.innerHTML = `
    <div class="ai-analysis-card animate-fade" style="margin-bottom:1.5rem; background:linear-gradient(135deg, rgba(45,106,79,0.08), rgba(82,183,136,0.12)); border:1px solid rgba(45,106,79,0.3);">
      <div class="ai-analysis-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; border-bottom:1px dashed rgba(45,106,79,0.3); padding-bottom:0.6rem; margin-bottom:0.75rem;">
        <div class="ai-header-title" style="display:flex; align-items:center; gap:0.5rem; font-weight:700; color:var(--primary);">
          <span>🧠 KisanSetu AI Crop Monitor</span>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="ai-tag">Real-Time APMC & Spoilage AI</span>
          <a href="../add-crop/add-crop.html" class="btn btn-primary btn-sm" style="font-size:0.78rem; padding:0.25rem 0.65rem;">➕ Add Crop with AI</a>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:0.75rem;">
        ${analysis.map(item => `
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span style="font-weight:700; font-size:0.95rem;">${item.cropName} (${item.crop.quantity || 1000} kg)</span>
              <span style="background:${item.risk.riskColor}; color:white; padding:0.15rem 0.5rem; border-radius:12px; font-size:0.72rem; font-weight:700;">
                ${item.risk.riskLevel} Risk (${item.risk.riskPercent}%)
              </span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.35rem;">
              ⏳ Safe shelf-life: ~${item.risk.remainingDays} days at ${tempC}°C
            </div>
            <div style="font-size:0.76rem; color:#0284c7; background:rgba(2,132,199,0.08); padding:0.3rem 0.5rem; border-radius:4px;">
              🚚 Mandi Transit: ₹${item.transport.costPerKg}/kg (${item.transport.vehicle})
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:0.75rem; font-size:0.76rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <span>📸 Photo listings include <strong>AI Auto-Compression (saves 85% data)</strong> + Freshness Scanner</span>
        <a href="../add-crop/add-crop.html" style="color:var(--primary); font-weight:600; text-decoration:none;">List new harvest & optimize returns →</a>
      </div>
    </div>
  `;
}

function populateStats() {
  const activeCrops    = _dashCrops.filter(c => c.status === 'active').length;
  const pendingOffers  = _dashOffers.filter(o => o.status === 'pending' || o.status === 'countered').length;
  const totalEarnings  = _dashTxns.reduce((sum, t) => sum + (t.netAmount || 0), 0);
  const completedDeals = _dashTxns.filter(t => t.status === 'completed').length;

  document.getElementById('activeCropCount').textContent  = activeCrops;
  document.getElementById('pendingOfferCount').textContent = pendingOffers;
  document.getElementById('totalEarnings').textContent    = App.formatPrice(totalEarnings);
  document.getElementById('completedDeals').textContent   = completedDeals;
}

function populateBestTrader() {
  const _t = window.t || ((k) => k);
  const activeCrops = (_dashCrops && _dashCrops.length) 
    ? _dashCrops.filter(c => c.status === 'active') 
    : App.getCrops().filter(c => c.status === 'active');
  const crops = activeCrops;
  if (!crops.length) {
    document.getElementById('bestTraderSection').innerHTML = `
      <div class="card" style="text-align:center; padding:2rem;">
        <p style="font-size:1.2rem; margin-bottom:0.5rem;">🌾</p>
        <h4>${_t('dash.addFirstCrop')}</h4>
        <p class="text-muted" style="margin-bottom:1rem;">${_t('dash.addFirstCropText')}</p>
        <a href="../add-crop/add-crop.html" class="btn btn-primary">${_t('dash.addCrop')}</a>
      </div>
    `;
    return;
  }

  let bestResult = null;
  let bestCropResult = null;

  crops.forEach(crop => {
    const result = App.calculateBestTrader(crop.id);
    if (result && result.bestTrader) {
      if (!bestResult || result.bestTrader.netReturn > bestResult.netReturn) {
        bestResult = result.bestTrader;
        bestCropResult = result;
      }
    }
  });

  if (!bestResult) {
    document.getElementById('bestTraderSection').innerHTML = `
      <div class="card" style="text-align:center; padding:2rem;">
        <p style="font-size:1.5rem;">🔍</p>
        <h4>${_t('dash.noTraders')}</h4>
        <p class="text-muted">${_t('offers.browseTraders')}</p>
      </div>
    `;
    return;
  }

  const crop = bestCropResult.crop;
  const trader = bestResult.trader;
  const offer = bestResult.offer;
  const recommended = App.getRecommendedPrice(crop.name);
  const cropEmoji = getCropEmoji(crop.name);

  document.getElementById('bestTraderSection').innerHTML = `
    <div class="best-trader-card">
      <div class="best-trader-badge">${_t('dash.bestOpp')}</div>

      <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
        <span style="font-size:1.5rem;">${cropEmoji}</span>
        <div>
          <h3 style="font-size:1.2rem; color:var(--primary-dark);">${crop.name} — ${crop.variety}</h3>
          <span class="text-secondary text-sm">${crop.quantity.toLocaleString()} ${crop.unit}</span>
        </div>
      </div>

      <div class="best-trader-details">
        <div class="best-trader-info">
          <div class="detail-row">
            <span class="detail-label">${_t('feat.1Title')}</span>
            <span class="detail-value">${trader.name} ${trader.verified ? `<span class="badge badge-verified">${_t('common.verified')}</span>` : ''}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${_t('offers.traderOffer')}</span>
            <span class="detail-value highlight">${App.formatPrice(offer.pricePerKg)}/kg</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${_t('market.sortDist').split(':')[0] || 'Distance'}</span>
            <span class="detail-value">${trader.distance} km</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${_t('traderDash.rating')}</span>
            <span class="detail-value"><span class="trader-rating">${App.renderStars(trader.rating)} ${trader.rating}</span></span>
          </div>
        </div>

        <div class="best-trader-info">
          <div class="detail-row">
            <span class="detail-label">${_t('feat.4Title')}</span>
            <span class="detail-value">${App.formatPrice(offer.transportCost)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${_t('offers.totalValue')}</span>
            <span class="detail-value">${App.formatPrice(bestResult.grossReturn)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${_t('traders.netReturn')}</span>
            <span class="detail-value net-return">${App.formatPrice(bestResult.netReturn)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${_t('offers.quantity')}</span>
            <span class="detail-value">${offer.quantityNeeded.toLocaleString()} kg</span>
          </div>
        </div>
      </div>

      ${recommended ? `
      <div class="recommended-price">
        <div>
          <div class="price-label">${_t('dash.recommendedPrice')}</div>
          <div class="price-range">${App.formatPrice(recommended.low)} – ${App.formatPrice(recommended.high)} /kg</div>
        </div>
      </div>
      ` : ''}

      <div class="why-recommended">
        <h5>${_t('dash.whyRecommended')}</h5>
        <div class="why-list">
          <div class="why-item"><span class="check">✓</span> Highest estimated net return</div>
          <div class="why-item"><span class="check">✓</span> ${trader.verified ? 'Verified & trusted trader' : 'Good trader rating'}</div>
          <div class="why-item"><span class="check">✓</span> ${trader.distance <= 20 ? 'Close distance (' + trader.distance + ' km)' : 'Reasonable distance'}</div>
          <div class="why-item"><span class="check">✓</span> Quantity match: ${Math.round(bestResult.quantityMatch * 100)}%</div>
        </div>
      </div>

      <div class="best-trader-actions">
        <a href="../traders/traders.html?trader=${trader.id}" class="btn btn-primary">${_t('dash.viewTrader')}</a>
        <button class="btn btn-accent" onclick="quickDeal('${crop.id}', '${trader.id}')">${_t('dash.makeDeal')}</button>
        <a href="../traders/traders.html" class="btn btn-outline">${_t('dash.compareAll')}</a>
      </div>
    </div>
  `;
}

function populateCrops() {
  const _t = window.t || ((k) => k);
  const crops = _dashCrops;
  const container = document.getElementById('cropList');

  if (!crops.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <h3>No crops listed</h3>
        <p>Add your first crop to get started</p>
        <a href="../add-crop/add-crop.html" class="btn btn-primary btn-sm">+ Add Crop</a>
      </div>
    `;
    return;
  }

  container.innerHTML = crops.slice(0, 5).map(crop => {
    const statusBadge = {
      active:   `<span class="badge badge-success">${_t('common.active')}</span>`,
      sold:     `<span class="badge badge-info">${_t('common.sold')}</span>`,
      upcoming: `<span class="badge badge-warning">${_t('common.upcoming')}</span>`
    };
    return `
      <div class="crop-listing">
        <div class="crop-info">
          ${crop.imageUrl ? `<img src="${crop.imageUrl}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;" alt="${crop.name}">` : `<div class="crop-icon">${getCropEmoji(crop.name)}</div>`}
          <div>
            <div class="crop-name">${crop.name} — ${crop.variety||''}</div>
            <div class="crop-detail">${crop.quantity} ${crop.unit||'kg'} · ${App.formatPrice(crop.expectedPrice)}/kg</div>
          </div>
        </div>
        <div class="crop-status">${statusBadge[crop.status] || ''}</div>
      </div>
    `;
  }).join('');
}

function populateMarketQuick() {
  const _t = window.t || ((k) => k);
  const prices = KisanSetuData.marketPrices.slice(0, 4);
  const container = document.getElementById('marketQuick');

  container.innerHTML = prices.map(p => `
    <div class="crop-listing">
      <div class="crop-info">
        <div class="crop-icon">${getCropEmoji(p.crop)}</div>
        <div>
          <div class="crop-name">${p.crop}</div>
          <div class="crop-detail">${p.market} · ${p.distance} km</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700; color:var(--primary);">${App.formatPrice(p.modalPrice)}/kg</div>
        <div class="text-xs ${p.trendDirection === 'up' ? 'text-success' : p.trendDirection === 'down' ? 'text-danger' : 'text-muted'}">
          ${p.trendDirection === 'up' ? _t('market.rising') : p.trendDirection === 'down' ? _t('market.falling') : _t('market.stable')}
        </div>
      </div>
    </div>
  `).join('');
}

function populateRecentOffers() {
  const _t = window.t || ((k) => k);
  const offers = _dashOffers.slice(0, 4);
  const container = document.getElementById('recentOffers');
  if (!offers.length) {
    container.innerHTML = '<div class="empty-state"><p>No offers yet</p></div>';
    return;
  }
  const statusBadge = {
    pending:  (v) => `<span class="badge badge-warning">${_t('offers.pending')}</span>`,
    accepted: (v) => `<span class="badge badge-success">${_t('offers.accepted')}</span>`,
    rejected: (v) => `<span class="badge badge-danger">${_t('offers.rejected')}</span>`,
    countered:(v) => `<span class="badge badge-info">${_t('offers.countered')}</span>`
  };
  container.innerHTML = offers.map(offer => `
    <div class="crop-listing">
      <div class="crop-info">
        <div class="crop-icon">💰</div>
        <div>
          <div class="crop-name">${offer.cropName||''}</div>
          <div class="crop-detail">${offer.traderName||''} · ${App.formatPrice(offer.offerPrice||0)}/kg</div>
        </div>
      </div>
      <div>${(statusBadge[offer.status] || (() => ''))(offer)}</div>
    </div>
  `).join('');
}

function populateRecentTransactions() {
  const txns = _dashTxns;
  const container = document.getElementById('recentTransactions');
  if (!txns.length) {
    container.innerHTML = '<div class="empty-state"><p>No transactions yet</p></div>';
    return;
  }
  container.innerHTML = txns.map(t => `
    <div class="transaction-row">
      <div class="txn-info">
        <div class="txn-crop">${t.cropName||''}</div>
        <div class="txn-trader">${t.traderName||''} · ${t.quantity||0} ${t.unit||'kg'}</div>
      </div>
      <div style="text-align:right;">
        <div class="txn-amount">${App.formatPrice(t.netAmount||0)}</div>
        <div class="txn-date">${t.date ? App.formatDate(t.date) : ''}</div>
      </div>
    </div>
  `).join('');
}

async function quickDeal(cropId, traderId) {
  const trader = KisanSetuData.traders.find(t => t.id === traderId) || { name: 'Verified Trader', offers: {} };
  const crops = _dashCrops.length ? _dashCrops : App.getCrops();
  const crop = crops.find(c => c.id === cropId) || { name: 'Crop', variety: '', quantity: 1000 };
  const offer = (trader.offers && trader.offers[cropId]) ? trader.offers[cropId] : { pricePerKg: crop.expectedPrice || 30, quantityNeeded: crop.quantity || 1000, transportCost: 1200 };
  const user = (typeof auth !== 'undefined') ? auth.currentUser : null;

  const newOffer = {
    id: App.generateId('offer'),
    cropId: cropId,
    cropName: `${crop.name} (${crop.variety || ''})`,
    farmerId: user ? user.uid : 'farmer_current',
    farmerName: user ? (user.displayName || 'Farmer') : 'Farmer',
    traderId: traderId,
    traderName: trader.name,
    offerPrice: offer.pricePerKg,
    quantity: Math.min(offer.quantityNeeded || 1000, crop.quantity || 1000),
    unit: 'kg',
    status: 'accepted',
    date: new Date().toISOString().split('T')[0],
    messages: [
      { 
        from: 'farmer', 
        text: `Deal accepted at ₹${offer.pricePerKg}/kg`, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ],
    createdAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
  };

  // 1. Save to local state
  const offers = App.getOffers() || [];
  offers.unshift(newOffer);
  App.saveOffers(offers);
  localStorage.setItem('kisansetu_real_offers', JSON.stringify(offers));

  // 2. Save to Firestore
  if (user && typeof db !== 'undefined') {
    try {
      await db.collection('offers').doc(newOffer.id).set(newOffer);
      const txnRef = db.collection('transactions').doc();
      await txnRef.set({
        offerId: newOffer.id,
        cropId: cropId,
        cropName: newOffer.cropName,
        farmerId: user.uid,
        traderId: traderId,
        traderName: trader.name,
        quantity: newOffer.quantity,
        unit: 'kg',
        price: offer.pricePerKg,
        totalAmount: offer.pricePerKg * newOffer.quantity,
        netAmount: Math.max(0, (offer.pricePerKg * newOffer.quantity) - (offer.transportCost || 1200)),
        date: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });
    } catch(err) {
      console.warn('quickDeal Firestore write warning:', err);
    }
  }

  App.showNotification('Deal Accepted! 🎉', `Deal initiated with ${trader.name} at ₹${offer.pricePerKg}/kg`, 'success');
  setTimeout(() => App.navigateTo('offers'), 800);
}

function getCropEmoji(name) {
  const map = {
    'onion': '🧅', 'tomato': '🍅', 'wheat': '🌾', 'potato': '🥔',
    'soybean': '🫘', 'rice': '🍚', 'sugarcane': '🎋', 'grapes': '🍇',
    'pomegranate': '🫐', 'cotton': '☁️', 'maize': '🌽', 'chickpea': '🫘'
  };
  return map[name.toLowerCase()] || '🌱';
}

window.getCropEmoji = getCropEmoji;
