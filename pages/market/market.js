// Market Prices Page Logic

const cropEmojiMap = {
  'onion': '🧅', 'tomato': '🍅', 'wheat': '🌾', 'potato': '🥔',
  'soybean': '🫘', 'rice': '🍚', 'sugarcane': '🎋', 'grapes': '🍇',
  'pomegranate': '🫐', 'cotton': '☁️', 'maize': '🌽', 'chickpea': '🫘'
};

function getCropEmoji(name) {
  return cropEmojiMap[name.toLowerCase()] || '🌱';
}

let currentView = 'cards';

document.addEventListener('DOMContentLoaded', () => {
  // Guard: must be logged in to view market prices
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (!user) { App.navigateTo('login'); return; }
      initMarket();
    });
  } else {
    initMarket();
  }

  window.addEventListener('languageChanged', () => {
    initMarket();
  });
});

function initMarket() {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('market', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('market', userType);
  App.initNavigation();
  App.translatePage();

  renderMarket();
}

function getFilteredPrices() {
  let prices = [...KisanSetuData.marketPrices];
  const search = document.getElementById('searchCrop').value.toLowerCase().trim();
  const sort = document.getElementById('sortBy').value;

  if (search) {
    prices = prices.filter(p =>
      p.crop.toLowerCase().includes(search) ||
      p.variety.toLowerCase().includes(search) ||
      p.market.toLowerCase().includes(search)
    );
  }

  switch (sort) {
    case 'price-high': prices.sort((a, b) => b.modalPrice - a.modalPrice); break;
    case 'price-low': prices.sort((a, b) => a.modalPrice - b.modalPrice); break;
    case 'distance': prices.sort((a, b) => a.distance - b.distance); break;
    default: prices.sort((a, b) => a.crop.localeCompare(b.crop));
  }

  return prices;
}

function renderMarket() {
  const prices = getFilteredPrices();
  renderCards(prices);
  renderTable(prices);
}

function filterMarket() {
  renderMarket();
}

function setView(view, btn) {
  currentView = view;
  document.querySelectorAll('#viewToggle .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('marketCards').style.display = view === 'cards' ? 'grid' : 'none';
  document.getElementById('marketTable').style.display = view === 'table' ? 'block' : 'none';
}

function renderCards(prices) {
  const container = document.getElementById('marketCards');
  const _t = window.t || ((k) => k);

  if (!prices.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>${_t('traderDash.search')}</h3></div>`;
    return;
  }

  container.innerHTML = prices.map(p => {
    const trendClass = p.trendDirection === 'up' ? 'up' : p.trendDirection === 'down' ? 'down' : 'stable';
    const trendLabel = p.trendDirection === 'up' ? _t('market.rising') : p.trendDirection === 'down' ? _t('market.falling') : _t('market.stable');

    return `
      <div class="market-card animate-fade">
        <div class="market-card-header">
          <div class="market-crop-info">
            <div class="market-crop-icon">${getCropEmoji(p.crop)}</div>
            <div>
              <div class="market-crop-name">${p.crop}</div>
              <div class="market-crop-variety">${p.variety}</div>
            </div>
          </div>
          <span class="trend-badge ${trendClass}">${trendLabel}</span>
        </div>

        <div class="price-grid">
          <div class="price-item">
            <div class="price-item-label">${_t('market.min')}</div>
            <div class="price-item-value min">₹${p.minPrice}/${p.unit}</div>
          </div>
          <div class="price-item">
            <div class="price-item-label">${_t('market.modal')}</div>
            <div class="price-item-value modal">₹${p.modalPrice}/${p.unit}</div>
          </div>
          <div class="price-item">
            <div class="price-item-label">${_t('market.max')}</div>
            <div class="price-item-value max">₹${p.maxPrice}/${p.unit}</div>
          </div>
        </div>

        ${App.renderTrendBars(p.trend)}

        <div class="market-meta">
          <span>📍 ${p.market} (${p.distance} km)</span>
          <span>📅 ${App.formatDate(p.date)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderTable(prices) {
  const container = document.getElementById('marketTable');
  const _t = window.t || ((k) => k);

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>${_t('addCrop.cropName')}</th>
          <th>${_t('addCrop.variety')}</th>
          <th>${_t('dash.marketPrices')}</th>
          <th>${_t('market.min')}</th>
          <th>${_t('market.modal')}</th>
          <th>${_t('market.max')}</th>
          <th>Dist.</th>
          <th>Trend</th>
          <th>${_t('addCrop.harvestDate')}</th>
        </tr>
      </thead>
      <tbody>
        ${prices.map(p => {
          const trendClass = p.trendDirection === 'up' ? 'text-success' : p.trendDirection === 'down' ? 'text-danger' : 'text-muted';
          const trendIcon = p.trendDirection === 'up' ? '↑' : p.trendDirection === 'down' ? '↓' : '→';
          return `
            <tr>
              <td><strong>${getCropEmoji(p.crop)} ${p.crop}</strong></td>
              <td>${p.variety}</td>
              <td>${p.market}</td>
              <td class="text-danger">₹${p.minPrice}</td>
              <td><strong class="text-primary">₹${p.modalPrice}</strong></td>
              <td class="text-success">₹${p.maxPrice}</td>
              <td>${p.distance} km</td>
              <td class="${trendClass}">${trendIcon}</td>
              <td class="text-muted text-sm">${App.formatDate(p.date)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
