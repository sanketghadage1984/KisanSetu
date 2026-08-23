// Offers & Negotiation Page Logic

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initOffersPage();

  window.addEventListener('languageChanged', () => {
    initOffersPage();
  });
});

function initOffersPage() {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('offers', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('offers', userType);
  App.initNavigation();
  App.translatePage();

  renderOffers();
}

function filterOffers(status, btn) {
  currentFilter = status;
  document.querySelectorAll('#offerTabs .tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOffers();
}

function renderOffers() {
  const _t = window.t || ((k) => k);
  let offers = App.getOffers();
  if (currentFilter !== 'all') {
    offers = offers.filter(o => o.status === currentFilter);
  }

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
    const statusClass = offer.status;
    const statusBadge = {
      pending: `<span class="badge badge-warning">${_t('offers.pending')}</span>`,
      accepted: `<span class="badge badge-success">${_t('offers.accepted')}</span>`,
      rejected: `<span class="badge badge-danger">${_t('offers.rejected')}</span>`,
      countered: `<span class="badge badge-info">${_t('offers.countered')}</span>`
    };

    const messages = (offer.messages || []).map(msg => {
      const bubbleClass = msg.from === 'farmer' ? 'farmer' : msg.from === 'trader' ? 'trader' : 'system';
      return `
        <div class="message-bubble ${bubbleClass}">
          <div class="message-text">${msg.text}</div>
          <div class="message-time">${msg.time || ''}</div>
        </div>
      `;
    }).join('');

    const canAct = offer.status === 'pending' || offer.status === 'countered';

    return `
      <div class="offer-card ${statusClass} animate-fade">
        <div class="offer-header">
          <div>
            <h4 style="font-size:1.05rem;">${offer.cropName}</h4>
            <span class="text-sm text-secondary">${offer.traderName} · ${App.formatDate(offer.date)}</span>
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
            <span class="offer-price-value">${offer.quantity.toLocaleString()} ${offer.unit}</span>
          </div>
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.totalValue')}</span>
            <span class="offer-price-value" style="color:var(--success);">${App.formatPrice(offer.offerPrice * offer.quantity)}</span>
          </div>
          ${offer.farmerCounterPrice ? `
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.yourCounter')}</span>
            <span class="offer-price-value" style="color:var(--accent-dark);">${App.formatPrice(offer.farmerCounterPrice)}/kg</span>
          </div>
          ` : ''}
        </div>

        ${messages ? `<div class="offer-conversation">${messages}</div>` : ''}

        ${canAct ? `
        <div class="counter-offer-input" style="margin-top: 1rem;">
          <input type="number" id="counter_${offer.id}" class="form-control" placeholder="${_t('offers.counterPlaceholder')}" step="0.5" min="1">
        </div>
        <div class="offer-actions-row">
          <button class="btn btn-success btn-sm" onclick="acceptOffer('${offer.id}')">${_t('offers.accept')}</button>
          <button class="btn btn-accent btn-sm" onclick="counterOffer('${offer.id}')">${_t('offers.counter')}</button>
          <button class="btn btn-danger btn-sm" onclick="rejectOffer('${offer.id}')">${_t('offers.reject')}</button>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function acceptOffer(offerId) {
  const offers = App.getOffers();
  const offer = offers.find(o => o.id === offerId);
  if (!offer) return;

  offer.status = 'accepted';
  offer.messages.push({
    from: 'farmer',
    text: `Offer accepted at ${App.formatPrice(offer.offerPrice)}/kg`,
    time: new Date().toLocaleString()
  });

  const txns = App.getTransactions();
  txns.unshift({
    id: App.generateId('txn'),
    cropName: offer.cropName,
    traderName: offer.traderName,
    quantity: offer.quantity,
    unit: offer.unit,
    price: offer.offerPrice,
    totalAmount: offer.offerPrice * offer.quantity,
    transportCost: 1500,
    netAmount: (offer.offerPrice * offer.quantity) - 1500,
    date: new Date().toISOString().split('T')[0],
    status: 'completed'
  });

  App.saveOffers(offers);
  App.saveTransactions(txns);
  App.showNotification('Deal Accepted! 🎉', `${offer.cropName} deal with ${offer.traderName} confirmed`, 'success');
  renderOffers();
}

function rejectOffer(offerId) {
  const offers = App.getOffers();
  const offer = offers.find(o => o.id === offerId);
  if (!offer) return;

  offer.status = 'rejected';
  offer.messages.push({
    from: 'farmer',
    text: 'Offer rejected',
    time: new Date().toLocaleString()
  });

  App.saveOffers(offers);
  App.showNotification('Offer Rejected', `${offer.cropName} offer from ${offer.traderName} rejected`, 'warning');
  renderOffers();
}

function counterOffer(offerId) {
  const input = document.getElementById('counter_' + offerId);
  const price = parseFloat(input?.value);

  if (!price || price <= 0) {
    App.showNotification('Enter Price', 'Please enter a valid counter price', 'warning');
    return;
  }

  const offers = App.getOffers();
  const offer = offers.find(o => o.id === offerId);
  if (!offer) return;

  offer.status = 'countered';
  offer.farmerCounterPrice = price;
  offer.messages.push({
    from: 'farmer',
    text: `Counter offer: ${App.formatPrice(price)}/kg`,
    time: new Date().toLocaleString()
  });

  App.saveOffers(offers);
  App.showNotification('Counter Sent', `Counter price of ${App.formatPrice(price)}/kg sent to ${offer.traderName}`, 'info');
  renderOffers();
}
