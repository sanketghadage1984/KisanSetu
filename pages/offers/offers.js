// Offers & Negotiation Page Logic — Firebase Firestore real-time

let currentFilter = 'all';
let _allOffers = [];
let _unsubscribeOffers = null;

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (!user) { App.navigateTo('login'); return; }
    initOffersPage(user);
  });

  window.addEventListener('languageChanged', () => {
    renderOffers();
    const userType = App.getUserType();
    document.getElementById('topNav').innerHTML = `
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      ${renderTopNav(userType)}
    `;
    App.initNavigation();
    App.translatePage();
  });
});

function initOffersPage(user) {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('offers', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('offers', userType);
  App.initNavigation();
  App.translatePage();

  // Real-time Firestore listener for offers
  if (_unsubscribeOffers) _unsubscribeOffers();
  _unsubscribeOffers = BackendService.listenToOffers(user.uid, userType, (offers) => {
    _allOffers = offers;
    renderOffers();
  });
}

function filterOffers(status, btn) {
  currentFilter = status;
  document.querySelectorAll('#offerTabs .tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOffers();
}

function renderOffers() {
  const _t = window.t || ((k) => k);
  let offers = currentFilter === 'all'
    ? _allOffers
    : _allOffers.filter(o => o.status === currentFilter);

  const container = document.getElementById('offersList');

  if (!offers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>${_t('offers.noOffers')}</h3>
        <p>${_t('offers.browseTraders')}</p>
        <a href="../traders/traders.html" class="btn btn-primary btn-sm">${_t('offers.browseTraders')}</a>
      </div>
    `;
    return;
  }

  container.innerHTML = offers.map(offer => {
    const statusBadge = {
      pending:  `<span class="badge badge-warning">${_t('offers.pending')}</span>`,
      accepted: `<span class="badge badge-success">${_t('offers.accepted')}</span>`,
      rejected: `<span class="badge badge-danger">${_t('offers.rejected')}</span>`,
      countered:`<span class="badge badge-info">${_t('offers.countered')}</span>`
    };

    const messages = (offer.messages || []).map(msg => `
      <div class="message-bubble ${msg.from}">
        <div class="message-text">${msg.text}</div>
        <div class="message-time">${msg.time || ''}</div>
      </div>
    `).join('');

    const canAct = offer.status === 'pending' || offer.status === 'countered';
    const offerId = offer.id;

    return `
      <div class="offer-card ${offer.status} animate-fade">
        <div class="offer-header">
          <div>
            <h4 style="font-size:1.05rem;">${offer.cropName}</h4>
            <span class="text-sm text-secondary">${offer.traderName} · ${offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleDateString('en-IN') : offer.date || ''}</span>
          </div>
          ${statusBadge[offer.status] || ''}
        </div>

        <div class="offer-prices">
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.traderOffer')}</span>
            <span class="offer-price-value text-primary">${App.formatPrice(offer.offerPrice)}/kg</span>
          </div>
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.quantity')}</span>
            <span class="offer-price-value">${(offer.quantity||0).toLocaleString()} kg</span>
          </div>
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.totalValue')}</span>
            <span class="offer-price-value" style="color:var(--success);">${App.formatPrice((offer.offerPrice||0) * (offer.quantity||0))}</span>
          </div>
          ${offer.farmerCounterPrice ? `
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.yourCounter')}</span>
            <span class="offer-price-value" style="color:var(--accent-dark);">${App.formatPrice(offer.farmerCounterPrice)}/kg</span>
          </div>` : ''}
        </div>

        ${messages ? `<div class="offer-conversation">${messages}</div>` : ''}

        ${canAct ? `
<<<<<<< HEAD
        <div class="counter-offer-input" style="margin-top:1rem;">
          <input type="number" id="counter_${offerId}" class="form-control" placeholder="${_t('offers.counterPlaceholder')}" step="0.5" min="1">
=======
        <div class="counter-offer-input">
          <input type="number" id="counter_${offer.id}" placeholder="${_t('offers.counterPlaceholder')}" step="0.5" min="1">
>>>>>>> parent of b40a222 (Update crop icons, add dark mode, and fix animations)
        </div>
        <div class="offer-actions-row">
          <button class="btn btn-success btn-sm" onclick="acceptOffer('${offerId}')">✅ ${_t('offers.accept')}</button>
          <button class="btn btn-accent btn-sm"  onclick="counterOffer('${offerId}')">💬 ${_t('offers.counter')}</button>
          <button class="btn btn-danger btn-sm"  onclick="rejectOffer('${offerId}')">❌ ${_t('offers.reject')}</button>
        </div>` : ''}
      </div>
    `;
  }).join('');
}

async function acceptOffer(offerId) {
  const offer = _allOffers.find(o => o.id === offerId);
  if (!offer) return;
  try {
    await BackendService.acceptOffer(offerId, offer);
    App.showNotification('Deal Accepted! 🎉', `${offer.cropName} deal confirmed!`, 'success');
  } catch (err) {
    App.showNotification('Error', 'Failed to accept offer. Try again.', 'error');
  }
}

async function rejectOffer(offerId) {
  const offer = _allOffers.find(o => o.id === offerId);
  if (!offer) return;
  try {
    await BackendService.rejectOffer(offerId, offer);
    App.showNotification('Offer Rejected', `${offer.cropName} offer rejected`, 'warning');
  } catch (err) {
    App.showNotification('Error', 'Failed to reject offer. Try again.', 'error');
  }
}

async function counterOffer(offerId) {
  const input = document.getElementById('counter_' + offerId);
  const price = parseFloat(input?.value);
  if (!price || price <= 0) {
    App.showNotification('Enter Price', 'Please enter a valid counter price', 'warning');
    return;
  }
  const offer = _allOffers.find(o => o.id === offerId);
  if (!offer) return;
  try {
    await BackendService.counterOffer(offerId, price, offer);
    App.showNotification('Counter Sent 💬', `Counter price of ${App.formatPrice(price)}/kg sent`, 'info');
  } catch (err) {
    App.showNotification('Error', 'Failed to send counter. Try again.', 'error');
  }
}
