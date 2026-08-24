// ═══════════════════════════════════════════════════════
// KisanSetu — Farmer Dashboard Logic (Firebase Firestore)
// ═══════════════════════════════════════════════════════

let _dashCrops = [], _dashOffers = [], _dashTxns = [];
let _unsubCrops = null, _unsubOffers = null;

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (!user) { App.navigateTo('login'); return; }
    initDashboard(user);
  });

  window.addEventListener('languageChanged', () => {
    const userType = App.getUserType();
    document.getElementById('topNav').innerHTML = `
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      ${renderTopNav(userType)}
    `;
    App.initNavigation();
    App.translatePage();
    populateBestTrader();
    populateCrops();
    populateMarketQuick();
    populateRecentOffers();
    populateRecentTransactions();
  });
});

function initDashboard(user) {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('dashboard', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('dashboard', userType);

  // Re-init nav after injecting
  App.initNavigation();
  App.translatePage();

  document.getElementById('farmerName').textContent = (user.displayName || user.name || 'Farmer').split(' ')[0];

  // Real-time listener — Farmer's crops
  if (_unsubCrops) _unsubCrops();
  _unsubCrops = BackendService.listenToCrops(user.uid, (crops) => {
    _dashCrops = crops;
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
  const crops = App.getCrops().filter(c => c.status === 'active');
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
        <a href="../traders/traders.html" class="btn btn-primary">${_t('dash.viewTrader')}</a>
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

function quickDeal(cropId, traderId) {
  App.showNotification('Deal Initiated', 'Redirecting to offers page...', 'success');
  setTimeout(() => App.navigateTo('offers'), 800);
}


// getCropEmoji is now provided by the centralized crop-icons.js

