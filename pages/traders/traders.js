// Nearby Traders Page Logic
// getCropEmoji is now provided by the centralized crop-icons.js


document.addEventListener('DOMContentLoaded', () => {
  // Guard: must be logged in to view traders
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (!user) { App.navigateTo('login'); return; }
      initTradersPage(user);
    });
  } else {
    initTradersPage();
  }

  window.addEventListener('languageChanged', () => {
    initTradersPage();
  });
});

function initTradersPage(user) {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('traders', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('traders', userType);
  App.initNavigation();
  App.translatePage();

  populateCropSelector();
  renderTraders();

  // Auto-open trader details if ?trader=ID is in the URL (from dashboard link)
  const urlParams = new URLSearchParams(window.location.search);
  const traderId = urlParams.get('trader');
  if (traderId) {
    // Small delay so the page renders first, then open the modal
    setTimeout(() => viewTraderDetails(traderId), 300);
  }

  const currentUser = user || (typeof auth !== 'undefined' ? auth.currentUser : null);
  if (currentUser && typeof BackendService !== 'undefined') {
    BackendService.getCrops({ farmerId: currentUser.uid }).then(realCrops => {
      if (realCrops && realCrops.length) {
        const current = App.getCrops() || [];
        const cropMap = new Map();
        current.forEach(c => cropMap.set(c.id, c));
        realCrops.forEach(c => cropMap.set(c.id, c));
        const merged = Array.from(cropMap.values());
        App.saveCrops(merged);
        populateCropSelector();
        renderTraders();
      }
    }).catch(e => console.warn('Could not fetch real crops in traders page:', e));
  }
}

function populateCropSelector() {
  const crops = App.getCrops().filter(c => c.status === 'active');
  const select = document.getElementById('cropSelect');
  const selected = select.value;
  const _t = window.t || ((k) => k);

  select.innerHTML = `<option value="" data-i18n="traders.all">${_t('traders.all')}</option>`;
  crops.forEach(crop => {
    const opt = document.createElement('option');
    opt.value = crop.id;
    opt.textContent = `${crop.name} — ${crop.variety} (${crop.quantity} kg)`;
    if (crop.id === selected) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderTraders() {
  const _t = window.t || ((k) => k);
  const selectedCropId = document.getElementById('cropSelect').value;
  const sortBy = document.getElementById('sortTraders').value;
  const search = document.getElementById('searchTrader').value.toLowerCase().trim();
  const recSection = document.getElementById('bestTraderRecommendation');
  const grid = document.getElementById('tradersGrid');

  if (selectedCropId) {
    const result = App.calculateBestTrader(selectedCropId);
    if (!result || !result.rankings.length) {
      recSection.innerHTML = '';
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No traders available for this crop</h3></div>';
      return;
    }

    let rankings = [...result.rankings];

    if (search) {
      rankings = rankings.filter(r =>
        r.trader.name.toLowerCase().includes(search) ||
        r.trader.location.toLowerCase().includes(search)
      );
    }

    switch (sortBy) {
      case 'price': rankings.sort((a, b) => b.offer.pricePerKg - a.offer.pricePerKg); break;
      case 'distance': rankings.sort((a, b) => a.trader.distance - b.trader.distance); break;
      case 'rating': rankings.sort((a, b) => b.trader.rating - a.trader.rating); break;
      default: rankings.sort((a, b) => b.netReturn - a.netReturn);
    }

    const best = rankings[0];
    const maxNet = Math.max(...rankings.map(r => r.netReturn));
    const crop = result.crop;
    const recommended = App.getRecommendedPrice(crop.name);

    recSection.innerHTML = `
      <div class="best-trader-card" style="margin-bottom:1.5rem;">
        <div class="best-trader-badge">${_t('traders.bestFor')} ${crop.name}</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
          <div>
            <div class="detail-row">
              <span class="detail-label">${_t('feat.1Title')}</span>
              <span class="detail-value">${best.trader.name} ${best.trader.verified ? `<span class="badge badge-verified">${_t('common.verified')}</span>` : ''}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${_t('offers.traderOffer')}</span>
              <span class="detail-value highlight">${App.formatPrice(best.offer.pricePerKg)}/kg</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Distance</span>
              <span class="detail-value">${best.trader.distance} km</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${_t('feat.4Title')}</span>
              <span class="detail-value">${App.formatPrice(best.offer.transportCost)}</span>
            </div>
          </div>
          <div>
            <div class="detail-row">
              <span class="detail-label">${_t('offers.totalValue')}</span>
              <span class="detail-value">${App.formatPrice(best.grossReturn)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${_t('traders.netReturn')}</span>
              <span class="detail-value net-return">${App.formatPrice(best.netReturn)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${_t('offers.quantity')}</span>
              <span class="detail-value">${best.sellableQty.toLocaleString()} kg</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${_t('traderDash.rating')}</span>
              <span class="detail-value">${App.renderStars(best.trader.rating)} ${best.trader.rating}</span>
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
        <div class="best-trader-actions" style="margin-top:1rem;">
          <button class="btn btn-primary" onclick="openDealModal('${crop.id}', '${best.trader.id}')">${_t('traders.makeDeal')}</button>
          <button class="btn btn-outline" onclick="App.navigateTo('offers')">${_t('side.offers')}</button>
        </div>
      </div>
    `;

    grid.innerHTML = rankings.map((r, idx) => {
      const pct = maxNet > 0 ? Math.round((r.netReturn / maxNet) * 100) : 0;
      const isBest = idx === 0;

      return `
        <div class="trader-card ${isBest ? 'best' : ''} animate-fade" style="position:relative;">
          <div class="trader-rank ${isBest ? 'gold' : ''}">#${idx + 1}</div>
          <div class="trader-header">
            <div class="trader-avatar">${r.trader.avatar}</div>
            <div>
              <div class="trader-name">${r.trader.name}</div>
              <div class="trader-rating">${App.renderStars(r.trader.rating)} ${r.trader.rating}</div>
            </div>
            ${r.trader.verified ? `<span class="badge badge-verified" style="margin-left:auto;">${_t('common.verified')}</span>` : ''}
          </div>

          <div class="trader-meta">
            <div class="meta-item">
              <span class="meta-label">${_t('offers.traderOffer')}</span>
              <span class="meta-value price-value">${App.formatPrice(r.offer.pricePerKg)}/kg</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Distance</span>
              <span class="meta-value">${r.trader.distance} km</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">${_t('feat.4Title')}</span>
              <span class="meta-value">${App.formatPrice(r.offer.transportCost)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">${_t('offers.quantity')}</span>
              <span class="meta-value">${r.offer.quantityNeeded.toLocaleString()} kg</span>
            </div>
          </div>

          <div class="comparison-highlight">
            <span class="label">${_t('traders.netReturn')}</span>
            <span class="value">${App.formatPrice(r.netReturn)}</span>
          </div>

          <div class="net-return-bar">
            <div class="net-return-fill" style="width:${pct}%;"></div>
          </div>

          <div class="card-footer">
            <button class="btn btn-primary btn-sm" onclick="openDealModal('${crop.id}', '${r.trader.id}')">${_t('traders.makeDeal')}</button>
            <button class="btn btn-outline btn-sm" onclick="viewTraderDetails('${r.trader.id}')">${_t('traders.viewDetails')}</button>
          </div>
        </div>
      `;
    }).join('');

  } else {
    recSection.innerHTML = '';
    let traders = [...KisanSetuData.traders];

    if (search) {
      traders = traders.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.location.toLowerCase().includes(search) ||
        t.speciality.toLowerCase().includes(search)
      );
    }

    switch (sortBy) {
      case 'distance': traders.sort((a, b) => a.distance - b.distance); break;
      case 'rating': traders.sort((a, b) => b.rating - a.rating); break;
      default: traders.sort((a, b) => b.rating - a.rating);
    }

    grid.innerHTML = traders.map(trader => `
      <div class="trader-card animate-fade" style="position:relative;">
        <div class="trader-header">
          <div class="trader-avatar">${trader.avatar}</div>
          <div>
            <div class="trader-name">${trader.name}</div>
            <div class="trader-rating">${App.renderStars(trader.rating)} ${trader.rating}</div>
          </div>
          ${trader.verified ? `<span class="badge badge-verified" style="margin-left:auto;">${_t('common.verified')}</span>` : ''}
        </div>
        <div class="trader-meta">
          <div class="meta-item">
            <span class="meta-label">${_t('auth.location')}</span>
            <span class="meta-value">${trader.location}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Distance</span>
            <span class="meta-value">${trader.distance} km</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Speciality</span>
            <span class="meta-value">${trader.speciality}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${_t('dash.dealsCompleted')}</span>
            <span class="meta-value">${trader.totalDeals}</span>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary btn-sm" onclick="openTradeModal('${trader.id}')">🤝 ${_t('traders.makeDeal') || 'Trade Now'}</button>
          <button class="btn btn-outline btn-sm" onclick="viewTraderDetails('${trader.id}')">${_t('traders.viewDetails')}</button>
        </div>
      </div>
    `).join('');
  }
}

function openDealModal(cropId, traderId) {
  const _t = window.t || ((k) => k);
  const crops = App.getCrops();
  const crop = crops.find(c => c.id === cropId);
  const trader = KisanSetuData.traders.find(t => t.id === traderId);
  if (!crop || !trader) return;

  const offer = trader.offers[cropId];
  const grossReturn = offer.pricePerKg * Math.min(offer.quantityNeeded, crop.quantity);
  const netReturn = grossReturn - offer.transportCost;
  const recommended = App.getRecommendedPrice(crop.name);

  document.getElementById('dealModalContent').innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <div class="detail-row">
        <span class="detail-label">${_t('addCrop.cropName')}</span>
        <span class="detail-value">${crop.name} — ${crop.variety}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('auth.trader')}</span>
        <span class="detail-value">${trader.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('offers.traderOffer')}</span>
        <span class="detail-value highlight">${App.formatPrice(offer.pricePerKg)}/kg</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('offers.quantity')}</span>
        <span class="detail-value">${Math.min(offer.quantityNeeded, crop.quantity).toLocaleString()} kg</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('offers.totalValue')}</span>
        <span class="detail-value">${App.formatPrice(grossReturn)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('feat.4Title')}</span>
        <span class="detail-value">${App.formatPrice(offer.transportCost)}</span>
      </div>
      <div class="detail-row" style="background:var(--success-bg); padding:0.5rem 0.75rem; border-radius:var(--radius-sm);">
        <span class="detail-label"><strong>${_t('traders.netReturn')}</strong></span>
        <span class="detail-value net-return">${App.formatPrice(netReturn)}</span>
      </div>
    </div>

    ${recommended ? `
    <div class="recommended-price" style="margin-bottom:1.25rem;">
      <div>
        <div class="price-label">${_t('dash.recommendedPrice')}</div>
        <div class="price-range">${App.formatPrice(recommended.low)} – ${App.formatPrice(recommended.high)} /kg</div>
      </div>
    </div>
    ` : ''}

    <div class="form-group">
      <label class="form-label">${_t('offers.yourCounter')} (₹/kg)</label>
      <input type="number" id="counterPrice" class="form-control" placeholder="Leave empty to accept offer as-is" step="0.5" min="1">
    </div>

    <div style="display:flex; gap:0.75rem; margin-top:1rem;">
      <button class="btn btn-success" onclick="submitDeal('${cropId}', '${traderId}', 'accept')">${_t('offers.accept')}</button>
      <button class="btn btn-accent" onclick="submitDeal('${cropId}', '${traderId}', 'counter')">${_t('offers.counter')}</button>
      <button class="btn btn-outline" onclick="closeModal()">${_t('common.cancel')}</button>
    </div>
  `;

  document.getElementById('dealModal').classList.add('active');
}

function closeModal() {
  document.getElementById('dealModal').classList.remove('active');
}

async function submitDeal(cropId, traderId, action) {
  const trader = KisanSetuData.traders.find(t => t.id === traderId) || { name: 'Trader' };
  const crops = App.getCrops();
  const crop = crops.find(c => c.id === cropId) || { name: 'Crop', variety: '', quantity: 1000 };
  const offer = (trader.offers && trader.offers[cropId]) ? trader.offers[cropId] : { pricePerKg: 30, quantityNeeded: 1000, transportCost: 1500 };
  const counterPrice = document.getElementById('counterPrice')?.value;
  const user = (typeof auth !== 'undefined') ? auth.currentUser : null;

  const offerId = App.generateId('offer');
  const nowStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgText = action === 'accept' ? `Deal accepted at ₹${offer.pricePerKg}/kg` : `Counter offer sent: ₹${counterPrice}/kg`;

  const offerBase = {
    id: offerId,
    cropId: cropId,
    cropName: `${crop.name} (${crop.variety || ''})`,
    farmerId: user ? user.uid : 'farmer_current',
    farmerName: user ? (user.displayName || 'Farmer') : 'Farmer',
    traderId: traderId,
    traderName: trader.name,
    traderPhone: '',
    farmerPhone: '',
    offerPrice: offer.pricePerKg,
    quantity: Math.min(offer.quantityNeeded || 1000, crop.quantity || 1000),
    unit: 'kg',
    status: action === 'accept' ? 'accepted' : 'countered',
    date: nowStr,
    farmerCounterPrice: action === 'counter' && counterPrice ? parseFloat(counterPrice) : null,
    messages: [
      { from: 'farmer', text: msgText, time: timeStr }
    ]
  };

  // 1. Save to localStorage immediately (plain date, no FieldValue)
  const localOffer = { ...offerBase, createdAt: nowStr };
  const offers = App.getOffers() || [];
  offers.unshift(localOffer);
  App.saveOffers(offers);
  localStorage.setItem('kisansetu_real_offers', JSON.stringify(offers));

  // 2. Save to Firestore (with server timestamp)
  if (user && typeof db !== 'undefined') {
    try {
      const firestoreOffer = { ...offerBase, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
      await db.collection('offers').doc(offerId).set(firestoreOffer);
      if (action === 'accept') {
        const txnRef = db.collection('transactions').doc();
        await txnRef.set({
          offerId: offerId,
          cropId: cropId,
          cropName: offerBase.cropName,
          farmerId: user.uid,
          traderId: traderId,
          traderName: trader.name,
          quantity: offerBase.quantity,
          unit: 'kg',
          price: offer.pricePerKg,
          totalAmount: offer.pricePerKg * offerBase.quantity,
          netAmount: Math.max(0, (offer.pricePerKg * offerBase.quantity) - (offer.transportCost || 1200)),
          date: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'completed'
        });
      }
    } catch(err) {
      console.warn('Firestore deal write warning:', err);
    }
  }

  closeModal();

  if (action === 'accept') {
    App.showNotification('Deal Accepted! 🎉', `You accepted ${trader.name}'s offer at ₹${offer.pricePerKg}/kg`, 'success');
  } else {
    App.showNotification('Counter Offer Sent', `Counter price of ₹${counterPrice}/kg sent to ${trader.name}`, 'info');
  }

  setTimeout(() => App.navigateTo('offers'), 1000);
}

// ── Trade modal for all-traders view (no crop pre-selected) ──
function openTradeModal(traderId) {
  const _t = window.t || ((k) => k);
  const trader = KisanSetuData.traders.find(t => t.id === traderId);
  if (!trader) return;

  const crops = App.getCrops().filter(c => c.status === 'active');
  const cropOptions = crops.length
    ? crops.map(c => `<option value="${c.id}">${c.name} — ${c.variety || ''} (${c.quantity} kg)</option>`).join('')
    : `<option value="" disabled>No active crops — add a crop first</option>`;

  document.getElementById('dealModalContent').innerHTML = `
    <div style="text-align:center; margin-bottom:1.25rem;">
      <div class="trader-avatar" style="width:56px;height:56px;font-size:1.3rem;margin:0 auto 0.5rem;">${trader.avatar}</div>
      <h3 style="margin:0;">${trader.name}</h3>
      <div class="trader-rating" style="justify-content:center;margin:0.25rem 0;">${App.renderStars(trader.rating)} ${trader.rating}</div>
      ${trader.verified ? `<span class="badge badge-verified">${_t('common.verified')}</span>` : ''}
    </div>

    <div class="form-group">
      <label class="form-label">Select Your Crop <span class="required">*</span></label>
      <select id="tradeCropSelect" class="form-control">
        <option value="">— Choose a crop —</option>
        ${cropOptions}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Your Offer Price (₹/kg) <span class="required">*</span></label>
      <input type="number" id="tradeOfferPrice" class="form-control" placeholder="e.g. 28" min="1" step="0.5">
    </div>
    <div class="form-group">
      <label class="form-label">Quantity (kg)</label>
      <input type="number" id="tradeOfferQty" class="form-control" placeholder="Leave blank for full quantity" min="1">
    </div>
    <div class="form-group">
      <label class="form-label">Message (optional)</label>
      <textarea id="tradeOfferMsg" class="form-control" rows="2" placeholder="Any message for the trader..."></textarea>
    </div>

    <div style="display:flex; gap:0.75rem; margin-top:1rem;">
      <button class="btn btn-primary" id="tradeSubmitBtn" onclick="submitTradeOffer('${traderId}')">📤 Send Offer</button>
      <button class="btn btn-outline" onclick="closeModal()">${_t('common.cancel') || 'Cancel'}</button>
    </div>
  `;

  // Auto-fill price when crop is selected
  const cropSelect = document.getElementById('tradeCropSelect');
  cropSelect.addEventListener('change', () => {
    const crop = crops.find(c => c.id === cropSelect.value);
    if (crop) {
      document.getElementById('tradeOfferPrice').value = crop.expectedPrice || '';
      document.getElementById('tradeOfferQty').value = crop.quantity || '';
    }
  });

  document.getElementById('dealModal').classList.add('active');
}

async function submitTradeOffer(traderId) {
  const cropId = document.getElementById('tradeCropSelect').value;
  const price = parseFloat(document.getElementById('tradeOfferPrice').value);
  const qty = parseInt(document.getElementById('tradeOfferQty').value);
  const message = document.getElementById('tradeOfferMsg')?.value?.trim() || '';
  const btn = document.getElementById('tradeSubmitBtn');

  if (!cropId) {
    App.showNotification('Select Crop', 'Please select a crop to offer.', 'warning');
    return;
  }
  if (!price || price <= 0) {
    App.showNotification('Enter Price', 'Please enter a valid offer price.', 'warning');
    return;
  }

  const crops = App.getCrops();
  const crop = crops.find(c => c.id === cropId);
  if (!crop) return;

  const user = (typeof auth !== 'undefined') ? auth.currentUser : null;
  if (!user) {
    App.showNotification('Login Required', 'Please log in to send offers.', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    // Use BackendService.sendOffer — this creates a proper Firestore offer
    // Note: sendOffer is designed for traders, so we create the offer doc directly
    const trader = KisanSetuData.traders.find(t => t.id === traderId) || { name: 'Trader' };
    const offerDoc = {
      cropId: cropId,
      cropName: `${crop.name} (${crop.variety || ''})`,
      farmerId: user.uid,
      farmerName: user.displayName || 'Farmer',
      traderId: traderId,
      traderName: trader.name,
      traderPhone: '',
      farmerPhone: '',
      offerPrice: price,
      quantity: qty || crop.quantity || 0,
      unit: crop.unit || 'kg',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      messages: [
        {
          from: 'farmer',
          text: message || `Offering ₹${price}/kg for ${qty || crop.quantity} kg of ${crop.name}.`,
          time: new Date().toLocaleString()
        }
      ]
    };

    const ref = await db.collection('offers').add(offerDoc);

    // Also save to localStorage so the offers page shows it immediately
    const localOffer = { ...offerDoc, id: ref.id, createdAt: new Date().toISOString() };
    const existingOffers = App.getOffers() || [];
    existingOffers.unshift(localOffer);
    App.saveOffers(existingOffers);
    localStorage.setItem('kisansetu_real_offers', JSON.stringify(existingOffers));
    closeModal();
    App.showNotification('Offer Sent! 📤', `₹${price}/kg offer sent to ${trader.name}`, 'success');
    setTimeout(() => App.navigateTo('offers'), 1000);
  } catch (err) {
    console.error('submitTradeOffer error:', err);
    App.showNotification('Error', 'Failed to send offer. Try again.', 'error');
    btn.disabled = false;
    btn.textContent = '📤 Send Offer';
  }
}

function viewTraderDetails(traderId) {
  const _t = window.t || ((k) => k);
  const trader = KisanSetuData.traders.find(t => t.id === traderId);
  if (!trader) return;

  document.getElementById('dealModalContent').innerHTML = `
    <div style="text-align:center; margin-bottom:1.5rem;">
      <div class="trader-avatar" style="width:64px;height:64px;font-size:1.5rem;margin:0 auto 0.75rem;">${trader.avatar}</div>
      <h3>${trader.name}</h3>
      <div class="trader-rating" style="justify-content:center;margin:0.25rem 0;">${App.renderStars(trader.rating)} ${trader.rating}</div>
      ${trader.verified ? `<span class="badge badge-verified">${_t('common.verified')}</span>` : ''}
    </div>
    <div class="detail-row"><span class="detail-label">${_t('auth.location')}</span><span class="detail-value">${trader.location}</span></div>
    <div class="detail-row"><span class="detail-label">Distance</span><span class="detail-value">${trader.distance} km</span></div>
    <div class="detail-row"><span class="detail-label">Speciality</span><span class="detail-value">${trader.speciality}</span></div>
    <div class="detail-row"><span class="detail-label">${_t('dash.dealsCompleted')}</span><span class="detail-value">${trader.totalDeals}</span></div>
    <div style="margin-top:1.25rem; display:flex; gap:0.75rem;">
      <button class="btn btn-primary btn-sm" onclick="closeModal(); openTradeModal('${trader.id}');">🤝 ${_t('traders.makeDeal') || 'Trade Now'}</button>
      <button class="btn btn-outline btn-block" onclick="closeModal()">${_t('common.close')}</button>
    </div>
  `;

  document.getElementById('dealModal').querySelector('h3').textContent = 'Trader Details';
  document.getElementById('dealModal').classList.add('active');
}
