// Trader Dashboard Logic — Firebase Firestore real-time listings

let _allListings = [];
let _unsubscribeListings = null;

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(async user => {
    if (!user) { App.navigateTo('login'); return; }
    // Role guard: Farmers must go to their own dashboard
    const profile = await BackendService.getUserProfile(user.uid).catch(() => null);
    if (profile && profile.userType === 'farmer') {
      App.navigateTo('dashboard');
      return;
    }
    // Sync profile to localStorage in case it was cleared
    if (profile) {
      localStorage.setItem('kisansetu_trader', JSON.stringify({
        uid: profile.uid, name: profile.name, email: profile.email,
        phone: profile.phone || '', location: profile.location || '',
        type: 'trader', avatar: profile.avatar || profile.name.charAt(0)
      }));
      localStorage.setItem('kisansetu_userType', 'trader');
      localStorage.setItem('kisansetu_loggedIn', 'true');
    }
    initTraderDashboard(user);
  });

  window.addEventListener('languageChanged', () => {
    const userType = App.getUserType();
    document.getElementById('topNav').innerHTML = `
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      ${renderTopNav(userType)}
    `;
    App.initNavigation();
    App.translatePage();
    renderListings();
  });
});

function initTraderDashboard(user) {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('trader-dashboard', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('trader-dashboard', userType);
  App.initNavigation();
  App.translatePage();

  document.getElementById('traderName').textContent = user.displayName?.split(' ')[0] || 'Trader';

  let _firstListingLoad = true;

  // Real-time listener for all active crops from Firestore
  if (_unsubscribeListings) _unsubscribeListings();
  _unsubscribeListings = BackendService.listenToAllCrops((crops) => {
    _allListings = crops;

    // Auto-seed demo crops if marketplace is empty (for demo/guest users)
    if (_firstListingLoad && crops.length === 0) {
      _firstListingLoad = false;
      BackendService.seedDemoData(user.uid).catch(e => console.warn('Auto-seed failed:', e));
      return; // Listener will fire again once seed data is written
    }
    _firstListingLoad = false;

    document.getElementById('listingCount').textContent = crops.length;
    renderListings();
  });

  // Load trader's sent offers count
  BackendService.getOffers(user.uid, 'trader').then(offers => {
    document.getElementById('offersSent').textContent = offers.length;
  });
}

function renderListings() {
  const _t = window.t || ((k) => k);
  let listings = [..._allListings];

  const search    = document.getElementById('searchListing')?.value.toLowerCase().trim() || '';
  const cropFilter= document.getElementById('filterCrop')?.value || '';
  const sortBy    = document.getElementById('sortListing')?.value || 'newest';

  if (search) {
    listings = listings.filter(l =>
      (l.name||'').toLowerCase().includes(search) ||
      (l.farmerName||'').toLowerCase().includes(search) ||
      (l.location||'').toLowerCase().includes(search)
    );
  }
  if (cropFilter) {
    listings = listings.filter(l => l.name === cropFilter);
  }
  switch (sortBy) {
    case 'price':    listings.sort((a, b) => a.expectedPrice - b.expectedPrice); break;
    case 'quantity': listings.sort((a, b) => b.quantity - a.quantity); break;
    default:         listings.sort((a, b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  }

  const grid = document.getElementById('listingsGrid');
  if (!listings.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>${_t('traderDash.search')}</h3><p>No active crop listings found.</p></div>`;
    return;
  }

  grid.innerHTML = listings.map(l => `
    <div class="listing-card animate-fade">
      <div class="listing-header">
        <div class="listing-crop-icon">${getCropEmoji(l.name)}</div>
        <div>
          <div style="font-weight:700;font-size:1.05rem;">${l.name} — ${l.variety||''}</div>
          <div class="text-sm text-secondary">by ${l.farmerName||'Farmer'}</div>
        </div>
        <span class="badge badge-${l.condition === 'Excellent' ? 'success' : 'warning'}" style="margin-left:auto;">${l.condition||'Good'}</span>
      </div>

      ${l.imageUrl ? `<img src="${l.imageUrl}" alt="${l.name}" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:0.75rem;">` : ''}

      <div class="listing-meta">
        <div class="listing-meta-item">
          <span class="listing-meta-label">${_t('offers.quantity')}</span>
          <span class="listing-meta-value">${(l.quantity||0).toLocaleString()} ${l.unit||'kg'}</span>
        </div>
        <div class="listing-meta-item">
          <span class="listing-meta-label">${_t('addCrop.expectedPrice')}</span>
          <span class="listing-meta-value" style="color:var(--primary);">${App.formatPrice(l.expectedPrice)}/kg</span>
        </div>
        <div class="listing-meta-item">
          <span class="listing-meta-label">${_t('addCrop.harvestDate')}</span>
          <span class="listing-meta-value">${l.harvestDate ? App.formatDate(l.harvestDate) : '—'}</span>
        </div>
        <div class="listing-meta-item">
          <span class="listing-meta-label">Location</span>
          <span class="listing-meta-value">📍 ${l.location||'—'}</span>
        </div>
      </div>

      <div class="card-footer">
        <button class="btn btn-primary btn-sm" onclick="openOfferModal('${l.id}')">${_t('traderDash.makeOffer')}</button>
      </div>
    </div>
  `).join('');
}

function openOfferModal(listingId) {
  const _t = window.t || ((k) => k);
  const listing = _allListings.find(l => l.id === listingId);
  if (!listing) return;

  document.getElementById('offerModalContent').innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <div class="detail-row">
        <span class="detail-label">Crop</span>
        <span class="detail-value">${listing.name} — ${listing.variety||''}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Farmer</span>
        <span class="detail-value">${listing.farmerName||'—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quantity</span>
        <span class="detail-value">${(listing.quantity||0).toLocaleString()} ${listing.unit||'kg'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Asking Price</span>
        <span class="detail-value" style="color:var(--primary);">${App.formatPrice(listing.expectedPrice)}/kg</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">${_t('offers.traderOffer')} (₹/kg) <span class="required">*</span></label>
      <input type="number" id="offerPrice" class="form-control" placeholder="Enter your offer" min="1" step="0.5" required>
    </div>
    <div class="form-group">
      <label class="form-label">Quantity (kg)</label>
      <input type="number" id="offerQty" class="form-control" value="${listing.quantity}" min="1">
    </div>
    <div class="form-group">
      <label class="form-label">Message to Farmer</label>
      <textarea id="offerMessage" class="form-control" rows="2" placeholder="Add a message..."></textarea>
    </div>

    <div style="display:flex;gap:0.75rem;margin-top:1rem;">
      <button class="btn btn-primary" id="submitOfferBtn" onclick="submitOffer('${listingId}')">📤 Send Offer</button>
      <button class="btn btn-outline" onclick="closeOfferModal()">Cancel</button>
    </div>
  `;

  document.getElementById('offerModal').classList.add('active');
}

function closeOfferModal() {
  document.getElementById('offerModal').classList.remove('active');
}

async function submitOffer(listingId) {
  const listing = _allListings.find(l => l.id === listingId);
  const price   = parseFloat(document.getElementById('offerPrice').value);
  const qty     = parseInt(document.getElementById('offerQty').value) || listing.quantity;
  const message = document.getElementById('offerMessage').value.trim();
  const btn     = document.getElementById('submitOfferBtn');

  if (!price || price <= 0) {
    App.showNotification('Error', 'Please enter a valid offer price', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    await BackendService.sendOffer({
      cropId:    listing.id,
      cropName:  `${listing.name} (${listing.variety||''})`,
      farmerId:  listing.farmerId,
      offerPrice: price,
      quantity:  qty,
      unit:      listing.unit || 'kg',
      message
    });
    closeOfferModal();
    App.showNotification('Offer Sent! 📤', `₹${price}/kg offer sent to ${listing.farmerName}`, 'success');
  } catch (err) {
    App.showNotification('Error', 'Failed to send offer. Try again.', 'error');
    btn.disabled = false;
    btn.textContent = '📤 Send Offer';
  }
}
