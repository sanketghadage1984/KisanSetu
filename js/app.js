/* ═══════════════════════════════════════════════════════
   KisanSetu — Shared Application Logic
   Navigation, Auth, Notifications, localStorage, Utilities, i18n
   ═══════════════════════════════════════════════════════ */

const App = {
  // ── Initialize ────────────────────────────────────
  init() {
    this.initLocalStorage();
    this.initNavigation();
    this.initLangSelector();
    this.translatePage();
    this.checkAuth();
    this.registerServiceWorker();
    this.initPWAInstall();
    this.initConnectivityDetection();
  },

  // ── Service Worker Registration ──────────────────
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swPath = this.getBasePath() + 'sw.js';
        navigator.serviceWorker.register(swPath).then(reg => {
          console.log('[KisanSetu] SW registered:', reg.scope);
        }).catch(err => {
          console.warn('[KisanSetu] SW registration failed:', err);
        });
      });
    }
  },

  // ── PWA Install Prompt ─────────────────────────
  _deferredPrompt: null,
  initPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;
      this._showInstallBanner();
    });
  },

  _showInstallBanner() {
    if (document.getElementById('pwaInstallBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-install-content">
        <span>📱 Install KisanSetu for offline access</span>
        <div class="pwa-install-actions">
          <button class="btn btn-primary btn-sm" id="pwaInstallBtn">Install App</button>
          <button class="btn btn-sm" onclick="this.parentElement.parentElement.parentElement.remove()" style="background:transparent;color:var(--text-muted);">Later</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);
    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
      if (this._deferredPrompt) {
        this._deferredPrompt.prompt();
        const { outcome } = await this._deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showNotification('App Installed! 🎉', 'KisanSetu has been added to your home screen', 'success');
        }
        this._deferredPrompt = null;
        banner.remove();
      }
    });
  },

  // ── Connectivity Detection ────────────────────
  initConnectivityDetection() {
    window.addEventListener('offline', () => {
      this.showNotification('You\'re Offline 📴', 'Some features may be limited. Data will sync when back online.', 'warning');
    });
    window.addEventListener('online', () => {
      this.showNotification('Back Online! 🌐', 'Syncing your data...', 'success');
    });
  },

  // ── LocalStorage Helpers ──────────────────────────
  initLocalStorage() {
    if (!localStorage.getItem('kisansetu_initialized') || !localStorage.getItem('kisansetu_crops')) {
      localStorage.setItem('kisansetu_farmer', JSON.stringify(KisanSetuData.defaultFarmer));
      localStorage.setItem('kisansetu_trader', JSON.stringify(KisanSetuData.defaultTrader));
      localStorage.setItem('kisansetu_crops', JSON.stringify(KisanSetuData.farmerCrops));
      localStorage.setItem('kisansetu_offers', JSON.stringify(KisanSetuData.offers));
      localStorage.setItem('kisansetu_transactions', JSON.stringify(KisanSetuData.transactions));
      localStorage.setItem('kisansetu_notifications', JSON.stringify(KisanSetuData.notifications));
      localStorage.setItem('kisansetu_lang', 'en');
      localStorage.setItem('kisansetu_initialized', 'true');
    }
  },

  getUser() {
    const type = localStorage.getItem('kisansetu_userType') || 'farmer';
    const key = type === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },

  getCrops() {
    try { return JSON.parse(localStorage.getItem('kisansetu_crops')) || []; }
    catch { return []; }
  },

  saveCrops(crops) {
    localStorage.setItem('kisansetu_crops', JSON.stringify(crops));
  },

  getOffers() {
    try { return JSON.parse(localStorage.getItem('kisansetu_offers')) || []; }
    catch { return []; }
  },

  saveOffers(offers) {
    localStorage.setItem('kisansetu_offers', JSON.stringify(offers));
  },

  getTransactions() {
    try { return JSON.parse(localStorage.getItem('kisansetu_transactions')) || []; }
    catch { return []; }
  },

  saveTransactions(txns) {
    localStorage.setItem('kisansetu_transactions', JSON.stringify(txns));
  },

  getNotifications() {
    try { return JSON.parse(localStorage.getItem('kisansetu_notifications')) || []; }
    catch { return []; }
  },

  saveNotifications(notifs) {
    localStorage.setItem('kisansetu_notifications', JSON.stringify(notifs));
  },

  isLoggedIn() {
    return localStorage.getItem('kisansetu_loggedIn') === 'true';
  },

  getUserType() {
    return localStorage.getItem('kisansetu_userType') || 'farmer';
  },

  getLang() {
    return localStorage.getItem('kisansetu_lang') || 'en';
  },

  setLang(lang) {
    localStorage.setItem('kisansetu_lang', lang);
    this.translatePage();
    // Also trigger custom event if pages need to re-render dynamic parts
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  },

  translatePage() {
    if (typeof window.t !== 'function') return;

    const currentLang = this.getLang();

    // Update active class on language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });

    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = window.t(key);
        if (translated) {
          el.innerHTML = translated;
        }
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        const translated = window.t(key);
        if (translated) {
          el.setAttribute('placeholder', translated);
        }
      }
    });

    // Translate titles/tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const translated = window.t(key);
        if (translated) {
          el.setAttribute('title', translated);
        }
      }
    });
  },

  // ── Auth ──────────────────────────────────────────
  checkAuth() {
    const protectedPages = ['dashboard', 'add-crop', 'market', 'traders', 'offers', 'trader-dashboard', 'profile'];
    const currentPage = this.getCurrentPage();

    if (protectedPages.includes(currentPage) && !this.isLoggedIn()) {
      this.navigateTo('login');
    }
  },

  login(email, password, userType) {
    if (!email || !password) return false;
    localStorage.setItem('kisansetu_loggedIn', 'true');
    localStorage.setItem('kisansetu_userType', userType || 'farmer');
    // Ensure demo records are available
    if (!localStorage.getItem('kisansetu_crops') || JSON.parse(localStorage.getItem('kisansetu_crops') || '[]').length === 0) {
      localStorage.setItem('kisansetu_crops', JSON.stringify(KisanSetuData.farmerCrops));
    }
    if (!localStorage.getItem('kisansetu_offers') || JSON.parse(localStorage.getItem('kisansetu_offers') || '[]').length === 0) {
      localStorage.setItem('kisansetu_offers', JSON.stringify(KisanSetuData.offers));
    }
    if (!localStorage.getItem('kisansetu_transactions') || JSON.parse(localStorage.getItem('kisansetu_transactions') || '[]').length === 0) {
      localStorage.setItem('kisansetu_transactions', JSON.stringify(KisanSetuData.transactions));
    }
    return true;
  },

  register(data) {
    if (!data.name || !data.email || !data.password) return false;
    const userType = data.userType || 'farmer';
    const user = {
      id: 'user_' + Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      location: data.location || '',
      type: userType,
      avatar: data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      joined: new Date().toISOString().split('T')[0]
    };
    const key = userType === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
    localStorage.setItem(key, JSON.stringify(user));
    localStorage.setItem('kisansetu_loggedIn', 'true');
    localStorage.setItem('kisansetu_userType', userType);
    return true;
  },

  logout() {
    // Use BackendService.logoutUser if available (clears Firebase + all localStorage)
    if (typeof BackendService !== 'undefined' && typeof BackendService.logoutUser === 'function') {
      BackendService.logoutUser().then(() => {
        this.navigateTo('login');
      }).catch(() => {
        localStorage.setItem('kisansetu_loggedIn', 'false');
        localStorage.removeItem('kisansetu_userType');
        localStorage.removeItem('kisansetu_farmer');
        localStorage.removeItem('kisansetu_trader');
        this.navigateTo('login');
      });
    } else if (typeof auth !== 'undefined') {
      auth.signOut().then(() => {
        localStorage.setItem('kisansetu_loggedIn', 'false');
        localStorage.removeItem('kisansetu_userType');
        localStorage.removeItem('kisansetu_farmer');
        localStorage.removeItem('kisansetu_trader');
        this.navigateTo('login');
      });
    } else {
      localStorage.setItem('kisansetu_loggedIn', 'false');
      localStorage.removeItem('kisansetu_userType');
      localStorage.removeItem('kisansetu_farmer');
      localStorage.removeItem('kisansetu_trader');
      this.navigateTo('login');
    }
  },

  // ── Navigation ────────────────────────────────────
  getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) return '../../';
    return './';
  },

  getPagePath(page) {
    const base = this.getBasePath();
    const routes = {
      'home': base + 'index.html',
      'login': base + 'pages/login/login.html',
      'register': base + 'pages/register/register.html',
      'dashboard': base + 'pages/dashboard/dashboard.html',
      'add-crop': base + 'pages/add-crop/add-crop.html',
      'market': base + 'pages/market/market.html',
      'traders': base + 'pages/traders/traders.html',
      'offers': base + 'pages/offers/offers.html',
      'trader-dashboard': base + 'pages/trader-dashboard/trader-dashboard.html',
      'profile': base + 'pages/profile/profile.html',
      'community': base + 'pages/community/community.html'
    };
    return routes[page] || routes['home'];
  },

  navigateTo(page) {
    window.location.href = this.getPagePath(page);
  },

  getCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/login/')) return 'login';
    if (path.includes('/register/')) return 'register';
    if (path.includes('/dashboard/')) return 'dashboard';
    if (path.includes('/add-crop/')) return 'add-crop';
    if (path.includes('/market/')) return 'market';
    if (path.includes('/traders/')) return 'traders';
    if (path.includes('/offers/')) return 'offers';
    if (path.includes('/trader-dashboard/')) return 'trader-dashboard';
    if (path.includes('/profile/')) return 'profile';
    if (path.includes('/community/')) return 'community';
    return 'home';
  },

  initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    const currentPage = this.getCurrentPage();
    document.querySelectorAll('.sidebar-link, .bottom-nav-item, .nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const linkPage = link.getAttribute('data-page') || '';
      if (linkPage === currentPage || href.includes('/' + currentPage + '/')) {
        link.classList.add('active');
      }
    });

    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });

    this.updateNavUser();
    this.updateNotifBadge();
  },

  updateNavUser() {
    const user = this.getUser();
    if (!user) return;

    document.querySelectorAll('.nav-avatar').forEach(el => {
      el.textContent = user.avatar || user.name.charAt(0);
    });
    document.querySelectorAll('.nav-username').forEach(el => {
      el.textContent = user.name;
    });
    document.querySelectorAll('.profile-avatar-large').forEach(el => {
      el.textContent = user.avatar || user.name.charAt(0);
    });
  },

  updateNotifBadge() {
    const notifs = this.getNotifications();
    const unread = notifs.filter(n => !n.read).length;
    document.querySelectorAll('.notif-badge').forEach(el => {
      el.textContent = unread;
      el.style.display = unread > 0 ? 'flex' : 'none';
    });
  },

  // ── Language Selector ─────────────────────────────
  initLangSelector() {
    const currentLang = this.getLang();
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', btnLang === currentLang);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = btn.getAttribute('data-lang');
        App.setLang(lang);
        const langNames = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };
        App.showNotification('Language / भाषा', `${langNames[lang] || lang}`, 'info');
      });
    });
  },

  // ── Notifications (Toast) ────────────────────────
  showNotification(title, message, type = 'info') {
    document.querySelectorAll('.notification-toast').forEach(el => el.remove());

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.innerHTML = `
      <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.classList.remove('show'); setTimeout(()=>this.parentElement.remove(), 300);">✕</button>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  },

  // ── Utility Functions ─────────────────────────────
  formatPrice(price) {
    return '₹' + Number(price).toLocaleString('en-IN');
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  },

  renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  },

  renderTrendBars(trend, color) {
    if (!trend || !trend.length) return '';
    const max = Math.max(...trend);
    const c = color || 'var(--primary-lighter)';
    return `<div class="mini-chart">${trend.map((v, i) => {
      const h = Math.max(10, (v / max) * 100);
      const isLast = i === trend.length - 1;
      return `<div class="chart-bar" style="height:${h}%; background:${isLast ? 'var(--primary)' : c};" title="₹${v}"></div>`;
    }).join('')}</div>`;
  },

  // ── Best Trader Calculation ───────────────────────
  calculateBestTrader(cropId) {
    const crops = this.getCrops();
    const crop = crops.find(c => c.id === cropId);
    if (!crop) return null;

    const traders = KisanSetuData.traders;
    const results = [];
    const cropLower = (crop.name || '').toLowerCase();

    traders.forEach(trader => {
      let offer = trader.offers ? trader.offers[cropId] : null;
      if (!offer && crop.name && trader.offers) {
        const matchingKey = Object.keys(trader.offers).find(k => {
          const sample = KisanSetuData.farmerCrops.find(fc => fc.id === k);
          return sample && sample.name.toLowerCase() === cropLower;
        });
        if (matchingKey) {
          offer = trader.offers[matchingKey];
        } else {
          const market = KisanSetuData.marketPrices.find(m => m.crop.toLowerCase() === cropLower);
          const basePrice = market ? market.modalPrice : (crop.expectedPrice || 30);
          offer = {
            pricePerKg: Math.round(basePrice * (0.95 + (trader.rating - 4) * 0.05)),
            quantityNeeded: crop.quantity || 1000,
            transportCost: Math.round(trader.distance * 40 + 500)
          };
        }
      }
      if (!offer) return;

      const grossReturn = offer.pricePerKg * Math.min(offer.quantityNeeded, crop.quantity);
      const netReturn = grossReturn - offer.transportCost;
      const quantityMatch = Math.min(offer.quantityNeeded, crop.quantity) / (crop.quantity || 1);

      const maxDistance = 50;
      const distanceScore = Math.max(0, (maxDistance - trader.distance) / maxDistance);
      const ratingScore = trader.rating / 5;

      const score = (netReturn / 100000) * 0.60
        + distanceScore * 0.15
        + ratingScore * 0.15
        + quantityMatch * 0.10;

      results.push({
        trader,
        offer,
        grossReturn,
        netReturn,
        quantityMatch,
        score,
        sellableQty: Math.min(offer.quantityNeeded, crop.quantity)
      });
    });

    results.sort((a, b) => b.score - a.score);
    return { crop, rankings: results, bestTrader: results[0] || null };
  },

  getRecommendedPrice(cropName) {
    const market = KisanSetuData.marketPrices.find(
      m => m.crop.toLowerCase() === cropName.toLowerCase()
    );
    if (!market) return null;

    const low = Math.round(market.modalPrice * 0.96);
    const high = Math.round(market.modalPrice * 1.08);
    return { low, high, modal: market.modalPrice };
  }
};

// ── Sidebar & Bottom Nav HTML Generators ──────────────
function renderDashboardSidebar(currentPage, userType) {
  const base = App.getBasePath();
  const isFarmer = userType !== 'trader';
  const isRealUser = Boolean(typeof firebase !== 'undefined' && firebase && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser);
  
  // Real authenticated users: only show count from kisansetu_real_offers (set by Firestore listener)
  // Default to 0 until the Firestore listener fires and populates real data
  let pendingOffersCount = 0;
  if (isRealUser) {
    try {
      const userOffers = JSON.parse(localStorage.getItem('kisansetu_real_offers') || '[]');
      pendingOffersCount = userOffers.filter(o => o.status === 'pending' || (!isFarmer && o.status === 'countered')).length;
    } catch(e) { pendingOffersCount = 0; }
  }
  const _t = window.t || ((k) => k);

  const farmerLinks = `
    <div class="sidebar-section">
      <div class="sidebar-title" data-i18n="side.main">${_t('side.main')}</div>
      <a href="${base}pages/dashboard/dashboard.html" class="sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <span class="icon">📊</span> <span data-i18n="side.dashboard">${_t('side.dashboard')}</span>
      </a>
      <a href="${base}pages/add-crop/add-crop.html" class="sidebar-link ${currentPage === 'add-crop' ? 'active' : ''}" data-page="add-crop">
        <span class="icon">🌾</span> <span data-i18n="side.addCrop">${_t('side.addCrop')}</span>
      </a>
      <a href="${base}pages/market/market.html" class="sidebar-link ${currentPage === 'market' ? 'active' : ''}" data-page="market">
        <span class="icon">📈</span> <span data-i18n="side.marketPrices">${_t('side.marketPrices')}</span>
      </a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-title" data-i18n="side.trade">${_t('side.trade')}</div>
      <a href="${base}pages/traders/traders.html" class="sidebar-link ${currentPage === 'traders' ? 'active' : ''}" data-page="traders">
        <span class="icon">🤝</span> <span data-i18n="side.nearbyTraders">${_t('side.nearbyTraders')}</span>
      </a>
      <a href="${base}pages/offers/offers.html" class="sidebar-link ${currentPage === 'offers' ? 'active' : ''}" data-page="offers">
        <span class="icon">💰</span> <span data-i18n="side.offers">${_t('side.offers')}</span>
        ${pendingOffersCount > 0 ? `<span class="link-badge notif-badge">${pendingOffersCount}</span>` : ''}
      </a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-title" data-i18n="side.account">${_t('side.account')}</div>
      <a href="${base}pages/profile/profile.html" class="sidebar-link ${currentPage === 'profile' ? 'active' : ''}" data-page="profile">
        <span class="icon">👤</span> <span data-i18n="side.profile">${_t('side.profile')}</span>
      </a>
      <a href="#" class="sidebar-link" data-action="logout">
        <span class="icon">🚪</span> <span data-i18n="side.logout">${_t('side.logout')}</span>
      </a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-title">Community</div>
      <a href="${base}pages/community/community.html" class="sidebar-link ${currentPage === 'community' ? 'active' : ''}" data-page="community">
        <span class="icon">👥</span> <span>Community</span>
      </a>
    </div>
  `;

  const traderLinks = `
    <div class="sidebar-section">
      <div class="sidebar-title" data-i18n="side.main">${_t('side.main')}</div>
      <a href="${base}pages/trader-dashboard/trader-dashboard.html" class="sidebar-link ${currentPage === 'trader-dashboard' ? 'active' : ''}" data-page="trader-dashboard">
        <span class="icon">📊</span> <span data-i18n="side.dashboard">${_t('side.dashboard')}</span>
      </a>
      <a href="${base}pages/market/market.html" class="sidebar-link ${currentPage === 'market' ? 'active' : ''}" data-page="market">
        <span class="icon">📈</span> <span data-i18n="side.marketPrices">${_t('side.marketPrices')}</span>
      </a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-title" data-i18n="side.trade">${_t('side.trade')}</div>
      <a href="${base}pages/offers/offers.html" class="sidebar-link ${currentPage === 'offers' ? 'active' : ''}" data-page="offers">
        <span class="icon">💰</span> <span data-i18n="side.offers">${_t('side.offers')}</span>
        ${pendingOffersCount > 0 ? `<span class="link-badge notif-badge">${pendingOffersCount}</span>` : ''}
      </a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-title" data-i18n="side.account">${_t('side.account')}</div>
      <a href="${base}pages/profile/profile.html" class="sidebar-link ${currentPage === 'profile' ? 'active' : ''}" data-page="profile">
        <span class="icon">👤</span> <span data-i18n="side.profile">${_t('side.profile')}</span>
      </a>
      <a href="#" class="sidebar-link" data-action="logout">
        <span class="icon">🚪</span> <span data-i18n="side.logout">${_t('side.logout')}</span>
      </a>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-title">Community</div>
      <a href="${base}pages/community/community.html" class="sidebar-link ${currentPage === 'community' ? 'active' : ''}" data-page="community">
        <span class="icon">👥</span> <span>Community</span>
      </a>
    </div>
  `;

  return isFarmer ? farmerLinks : traderLinks;
}

function renderBottomNav(currentPage, userType) {
  const base = App.getBasePath();
  const isFarmer = userType !== 'trader';
  const _t = window.t || ((k) => k);

  if (isFarmer) {
    return `
      <a href="${base}pages/dashboard/dashboard.html" class="bottom-nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
        <span class="icon">📊</span> <span data-i18n="bnav.home">${_t('bnav.home')}</span>
      </a>
      <a href="${base}pages/market/market.html" class="bottom-nav-item ${currentPage === 'market' ? 'active' : ''}">
        <span class="icon">📈</span> <span data-i18n="bnav.market">${_t('bnav.market')}</span>
      </a>
      <a href="${base}pages/add-crop/add-crop.html" class="bottom-nav-item ${currentPage === 'add-crop' ? 'active' : ''}">
        <span class="icon">➕</span> <span data-i18n="bnav.add">${_t('bnav.add')}</span>
      </a>
      <a href="${base}pages/traders/traders.html" class="bottom-nav-item ${currentPage === 'traders' ? 'active' : ''}">
        <span class="icon">🤝</span> <span data-i18n="bnav.traders">${_t('bnav.traders')}</span>
      </a>
      <a href="${base}pages/offers/offers.html" class="bottom-nav-item ${currentPage === 'offers' ? 'active' : ''}">
        <span class="icon">💰</span> <span data-i18n="bnav.offers">${_t('bnav.offers')}</span>
      </a>
    `;
  } else {
    return `
      <a href="${base}pages/trader-dashboard/trader-dashboard.html" class="bottom-nav-item ${currentPage === 'trader-dashboard' ? 'active' : ''}">
        <span class="icon">📊</span> <span data-i18n="bnav.home">${_t('bnav.home')}</span>
      </a>
      <a href="${base}pages/market/market.html" class="bottom-nav-item ${currentPage === 'market' ? 'active' : ''}">
        <span class="icon">📈</span> <span data-i18n="bnav.market">${_t('bnav.market')}</span>
      </a>
      <a href="${base}pages/offers/offers.html" class="bottom-nav-item ${currentPage === 'offers' ? 'active' : ''}">
        <span class="icon">💰</span> <span data-i18n="bnav.offers">${_t('bnav.offers')}</span>
      </a>
      <a href="${base}pages/profile/profile.html" class="bottom-nav-item ${currentPage === 'profile' ? 'active' : ''}">
        <span class="icon">👤</span> <span data-i18n="bnav.profile">${_t('bnav.profile')}</span>
      </a>
    `;
  }
}

function renderTopNav(userType) {
  const base = App.getBasePath();
  const user = App.getUser();
  const name = user ? user.name : 'User';
  const avatar = user ? (user.avatar || name.charAt(0)) : 'U';
  const currentLang = App.getLang();

  return `
    <a href="${base}index.html" class="nav-logo">🌾 Kisan<span>Setu</span></a>
    <div class="nav-actions">
      <div class="lang-selector">
        <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
        <button class="lang-btn ${currentLang === 'hi' ? 'active' : ''}" data-lang="hi">हिं</button>
        <button class="lang-btn ${currentLang === 'mr' ? 'active' : ''}" data-lang="mr">मरा</button>
      </div>
      <div class="nav-user" onclick="App.navigateTo('profile')">
        <div class="nav-avatar">${avatar}</div>
        <span class="nav-username">${name}</span>
      </div>
    </div>
  `;
}

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
