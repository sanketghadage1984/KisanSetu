/* ═══════════════════════════════════════════════════════
   KisanSetu — Mandi Price API Service
   Fetches live market prices from data.gov.in
   Falls back to IndexedDB cache, then mock data
   ═══════════════════════════════════════════════════════ */

const MandiAPI = {

  // Configuration
  API_BASE: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
  API_KEY: '', // Set via MandiAPI.setApiKey() or from localStorage
  CACHE_TTL: 6 * 60 * 60 * 1000, // 6 hours
  DB_NAME: 'KisanSetuMandiDB',
  DB_VERSION: 1,
  STORE_NAME: 'mandiPrices',

  // ── API Key Management ────────────────────────────
  setApiKey(key) {
    this.API_KEY = key;
    localStorage.setItem('kisansetu_mandi_api_key', key);
  },

  getApiKey() {
    if (this.API_KEY) return this.API_KEY;
    this.API_KEY = localStorage.getItem('kisansetu_mandi_api_key') || '';
    return this.API_KEY;
  },

  // ── IndexedDB for Caching ────────────────────────
  _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'cacheKey' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async _getCached(cacheKey) {
    try {
      const db = await this._openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(cacheKey);
        req.onsuccess = () => {
          const result = req.result;
          if (result && (Date.now() - result.timestamp < this.CACHE_TTL)) {
            resolve(result.data);
          } else {
            resolve(null); // Expired or missing
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch { return null; }
  },

  async _setCache(cacheKey, data) {
    try {
      const db = await this._openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      store.put({ cacheKey, data, timestamp: Date.now() });
    } catch (e) { console.warn('[MandiAPI] Cache write failed:', e); }
  },

  // ── Fetch from data.gov.in ────────────────────────
  async fetchPrices(state = 'Maharashtra', commodity = '', district = '') {
    const apiKey = this.getApiKey();
    const cacheKey = `mandi_${state}_${commodity}_${district}`.toLowerCase();

    // 1. Check cache first
    const cached = await this._getCached(cacheKey);
    if (cached) {
      console.log('[MandiAPI] Serving from cache:', cacheKey);
      return { data: cached, source: 'cache' };
    }

    // 2. If no API key, fall back to mock data
    if (!apiKey) {
      console.log('[MandiAPI] No API key — using mock data');
      return { data: this._getMockData(commodity), source: 'demo' };
    }

    // 3. Fetch from API
    try {
      const params = new URLSearchParams({
        'api-key': apiKey,
        'format': 'json',
        'limit': 50,
        'offset': 0
      });

      if (state) params.append('filters[state.keyword]', state);
      if (commodity) params.append('filters[commodity]', commodity);
      if (district) params.append('filters[district]', district);

      const url = `${this.API_BASE}?${params.toString()}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const json = await response.json();
      const records = json.records || [];

      // Normalize data to our format
      const normalized = this._normalizeApiData(records);

      // Cache the result
      await this._setCache(cacheKey, normalized);

      return { data: normalized, source: 'live' };

    } catch (err) {
      console.warn('[MandiAPI] API fetch failed:', err.message);

      // Try stale cache
      const staleCache = await this._getCached(cacheKey + '_stale');
      if (staleCache) {
        return { data: staleCache, source: 'stale_cache' };
      }

      // Final fallback: mock data
      return { data: this._getMockData(commodity), source: 'demo' };
    }
  },

  // ── Normalize API response to our format ──────────
  _normalizeApiData(records) {
    return records.map(r => ({
      crop: r.commodity || '',
      variety: r.variety || '',
      market: r.market || '',
      state: r.state || '',
      district: r.district || '',
      minPrice: parseFloat(r.min_price) || 0,
      maxPrice: parseFloat(r.max_price) || 0,
      modalPrice: parseFloat(r.modal_price) || 0,
      date: r.arrival_date || r.date || new Date().toISOString().split('T')[0],
      unit: 'quintal', // data.gov.in reports in quintal (100kg)
      // Convert quintal to kg for display
      minPricePerKg: Math.round((parseFloat(r.min_price) || 0) / 100),
      maxPricePerKg: Math.round((parseFloat(r.max_price) || 0) / 100),
      modalPricePerKg: Math.round((parseFloat(r.modal_price) || 0) / 100),
      trendDirection: 'stable', // Will be calculated from historical
      trend: [],
      distance: null, // Not available from API
      source: 'data.gov.in'
    }));
  },

  // ── Mock data fallback ─────────────────────────────
  _getMockData(commodity) {
    if (typeof KisanSetuData === 'undefined') return [];
    let prices = [...KisanSetuData.marketPrices];
    if (commodity) {
      const c = commodity.toLowerCase();
      prices = prices.filter(p => p.crop.toLowerCase().includes(c));
    }
    return prices.map(p => ({ ...p, source: 'demo' }));
  },

  // ── Get all commodities list ───────────────────────
  async fetchCommodities() {
    const cached = await this._getCached('commodity_list');
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return (typeof KisanSetuData !== 'undefined')
        ? KisanSetuData.cropTypes.map(c => c.name)
        : ['Onion', 'Tomato', 'Wheat', 'Rice', 'Potato'];
    }

    try {
      const params = new URLSearchParams({
        'api-key': apiKey,
        'format': 'json',
        'limit': 200
      });
      const url = `${this.API_BASE}?${params.toString()}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const json = await response.json();
      const commodities = [...new Set((json.records || []).map(r => r.commodity).filter(Boolean))];
      await this._setCache('commodity_list', commodities);
      return commodities;
    } catch {
      return (typeof KisanSetuData !== 'undefined')
        ? KisanSetuData.cropTypes.map(c => c.name)
        : ['Onion', 'Tomato', 'Wheat', 'Rice', 'Potato'];
    }
  },

  // ── Data source badge HTML helper ──────────────────
  getSourceBadge(source) {
    const badges = {
      'live': '<span class="data-badge live">🟢 Live Data</span>',
      'cache': '<span class="data-badge cached">🔵 Cached</span>',
      'stale_cache': '<span class="data-badge stale">🟠 Stale Cache</span>',
      'demo': '<span class="data-badge demo">🟡 Demo Data</span>'
    };
    return badges[source] || badges['demo'];
  },

  // ── Indian States List ─────────────────────────────
  states: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal'
  ]
};

// Make globally available
window.MandiAPI = MandiAPI;
