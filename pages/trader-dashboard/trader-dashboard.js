// Trader Dashboard Logic

const cropEmojiMap = {
  'onion': '🧅', 'tomato': '🍅', 'wheat': '🌾', 'potato': '🥔',
  'soybean': '🫘', 'rice': '🍚', 'sugarcane': '🎋', 'grapes': '🍇'
};
function getCropEmoji(name) {
  return cropEmojiMap[name.toLowerCase()] || '🌱';
}

document.addEventListener('DOMContentLoaded', () => {
  initTraderDashboard();

  window.addEventListener('languageChanged', () => {
    initTraderDashboard();
  });
});

function initTraderDashboard() {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('trader-dashboard', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('trader-dashboard', userType);
  App.initNavigation();
  App.translatePage();

  const user = App.getUser();
  if (user) {
    document.getElementById('traderName').textContent = user.name.split(' ')[0];
  }

  document.getElementById('listingCount').textContent = KisanSetuData.traderListings.length;
  renderListings();
}

function renderListings() {
  const _t = window.t || ((k) => k);
  let listings = [...KisanSetuData.traderListings];

  const search = document.getElementById('searchListing').value.toLowerCase().trim();
  const cropFilter = document.getElementById('filterCrop').value;
  const sortBy = document.getElementById('sortListing').value;

  if (search) {
    listings = listings.filter(l =>
      l.crop.toLowerCase().includes(search) ||
      l.farmerName.toLowerCase().includes(search) ||
      l.location.toLowerCase().includes(search)
    );
  }

  if (cropFilter) {
    listings = listings.filter(l => l.crop === cropFilter);
  }

  switch (sortBy) {
    case 'price': listings.sort((a, b) => a.expectedPrice - b.expectedPrice); break;
    case 'quantity': listings.sort((a, b) => b.quantity - a.quantity); break;
    default: listings.sort((a, b) => a.distance - b.distance);
  }

  const grid = document.getElementById('listingsGrid');

  if (!listings.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>${_t('traderDash.search')}</h3></div>`;
    return;
  }

  grid.innerHTML = listings.map(l => `
    <div class="listing-card animate-fade">
      <div class="listing-header">
        <div class="listing-crop-icon">${getCropEmoji(l.crop)}</div>
        <div>
          <div style="font-weight:700; font-size:1.05rem;">${l.crop} — ${l.variety}</div>
          <div class="text-sm text-secondary">by ${l.farmerName}</div>
        </div>
        <span class="badge badge-${l.condition === 'Excellent' ? 'success' : 'warning'}" style="margin-left:auto;">${l.condition}</span>
      </div>

      <div class="listing-meta">
        <div class="listing-meta-item">
          <span class="listing-meta-label">${_t('offers.quantity')}</span>
          <span class="listing-meta-value">${l.quantity.toLocaleString()} ${l.unit}</span>
        </div>
        <div class="listing-meta-item">
          <span class="listing-meta-label">${_t('addCrop.expectedPrice')}</span>
          <span class="listing-meta-value" style="color:var(--primary);">${App.formatPrice(l.expectedPrice)}/kg</span>
        </div>
        <div class="listing-meta-item">
          <span class="listing-meta-label">Distance</span>
          <span class="listing-meta-value">${l.distance} km</span>
        </div>
        <div class="listing-meta-item">
          <span class="listing-meta-label">${_t('addCrop.harvestDate')}</span>
          <span class="listing-meta-value">${App.formatDate(l.harvestDate)}</span>
        </div>
      </div>

      <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">
        📍 ${l.location}
      </div>

      <div class="card-footer">
        <button class="btn btn-primary btn-sm" onclick="openOfferModal('${l.id}')">${_t('traderDash.makeOffer')}</button>
        <button class="btn btn-outline btn-sm">${_t('traderDash.contactFarmer')}</button>
      </div>
    </div>
  `).join('');
}

function openOfferModal(listingId) {
  const _t = window.t || ((k) => k);
  const listing = KisanSetuData.traderListings.find(l => l.id === listingId);
  if (!listing) return;

  document.getElementById('offerModalContent').innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <div class="detail-row">
        <span class="detail-label">${_t('addCrop.cropName')}</span>
        <span class="detail-value">${listing.crop} — ${listing.variety}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('auth.farmer')}</span>
        <span class="detail-value">${listing.farmerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('offers.quantity')}</span>
        <span class="detail-value">${listing.quantity.toLocaleString()} ${listing.unit}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${_t('addCrop.expectedPrice')}</span>
        <span class="detail-value" style="color:var(--primary);">${App.formatPrice(listing.expectedPrice)}/kg</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Distance</span>
        <span class="detail-value">${listing.distance} km</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">${_t('offers.traderOffer')} (₹/kg) <span class="required">*</span></label>
      <input type="number" id="offerPrice" class="form-control" placeholder="Enter your offer" min="1" step="0.5" required>
    </div>

    <div class="form-group">
      <label class="form-label">${_t('offers.quantity')} (kg)</label>
      <input type="number" id="offerQty" class="form-control" placeholder="${listing.quantity}" value="${listing.quantity}" min="1">
    </div>

    <div class="form-group">
      <label class="form-label">${_t('addCrop.notes')}</label>
      <textarea id="offerMessage" class="form-control" rows="2" placeholder="Add a message for the farmer..."></textarea>
    </div>

    <div style="display:flex; gap:0.75rem; margin-top:1rem;">
      <button class="btn btn-primary" onclick="submitOffer('${listingId}')">${_t('traderDash.makeOffer')}</button>
      <button class="btn btn-outline" onclick="closeOfferModal()">${_t('common.cancel')}</button>
    </div>
  `;

  document.getElementById('offerModal').classList.add('active');
}

function closeOfferModal() {
  document.getElementById('offerModal').classList.remove('active');
}

function submitOffer(listingId) {
  const listing = KisanSetuData.traderListings.find(l => l.id === listingId);
  const price = parseFloat(document.getElementById('offerPrice').value);
  const qty = parseInt(document.getElementById('offerQty').value) || listing.quantity;
  const message = document.getElementById('offerMessage').value.trim();

  if (!price || price <= 0) {
    App.showNotification('Error', 'Please enter a valid offer price', 'error');
    return;
  }

  const offers = App.getOffers();
  offers.unshift({
    id: App.generateId('offer'),
    cropId: listing.id,
    cropName: `${listing.crop} (${listing.variety})`,
    traderId: 'trader_self',
    traderName: App.getUser()?.name || 'You',
    offerPrice: price,
    quantity: qty,
    unit: listing.unit,
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    farmerCounterPrice: null,
    messages: [
      { from: 'trader', text: message || `Offering ₹${price}/kg for ${qty} kg.`, time: new Date().toLocaleString() }
    ]
  });
  App.saveOffers(offers);

  closeOfferModal();
  App.showNotification('Offer Sent! 📤', `Offer of ${App.formatPrice(price)}/kg sent to ${listing.farmerName}`, 'success');
}
