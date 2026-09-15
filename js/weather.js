/* ═══════════════════════════════════════════════════════
   KisanSetu — Weather Integration
   Uses free Open-Meteo API (no key needed)
   Feeds into AI spoilage risk calculator
   ═══════════════════════════════════════════════════════ */

const WeatherService = {

  // Default coordinates (Nashik, Maharashtra)
  DEFAULT_LAT: 19.9975,
  DEFAULT_LON: 73.7898,

  // Location coordinates for major Indian agri regions
  locationCoords: {
    'nashik': { lat: 19.9975, lon: 73.7898 },
    'pune': { lat: 18.5204, lon: 73.8567 },
    'mumbai': { lat: 19.0760, lon: 72.8777 },
    'nagpur': { lat: 21.1458, lon: 79.0882 },
    'kolhapur': { lat: 16.7050, lon: 74.2433 },
    'aurangabad': { lat: 19.8762, lon: 75.3433 },
    'delhi': { lat: 28.6139, lon: 77.2090 },
    'lucknow': { lat: 26.8467, lon: 80.9462 },
    'jaipur': { lat: 26.9124, lon: 75.7873 },
    'bhopal': { lat: 23.2599, lon: 77.4126 },
    'indore': { lat: 22.7196, lon: 75.8577 },
    'bangalore': { lat: 12.9716, lon: 77.5946 },
    'hyderabad': { lat: 17.3850, lon: 78.4867 },
    'chennai': { lat: 13.0827, lon: 80.2707 },
    'kolkata': { lat: 22.5726, lon: 88.3639 },
    'chandigarh': { lat: 30.7333, lon: 76.7794 },
    'ahmedabad': { lat: 23.0225, lon: 72.5714 },
    'patna': { lat: 25.6093, lon: 85.1376 },
    'ranchi': { lat: 23.3441, lon: 85.3096 },
    'bhubaneswar': { lat: 20.2961, lon: 85.8245 }
  },

  // Get coordinates from location string
  getCoords(locationStr) {
    if (!locationStr) return { lat: this.DEFAULT_LAT, lon: this.DEFAULT_LON };
    const loc = locationStr.toLowerCase();
    for (const [city, coords] of Object.entries(this.locationCoords)) {
      if (loc.includes(city)) return coords;
    }
    // Default to Nashik
    return { lat: this.DEFAULT_LAT, lon: this.DEFAULT_LON };
  },

  // ── Fetch weather from Open-Meteo (FREE, no key!) ──
  async fetchWeather(location = '') {
    const { lat, lon } = this.getCoords(location);
    const cacheKey = `weather_${lat}_${lon}`;
    const cacheExpiry = 3 * 60 * 60 * 1000; // 3 hours

    // Check cache
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && (Date.now() - cached.timestamp < cacheExpiry)) {
        return { ...cached.data, source: 'cached' };
      }
    } catch {}

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=5`;

      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
      const data = await response.json();

      const result = this._parseWeatherData(data, location);

      // Cache
      localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));

      return { ...result, source: 'live' };

    } catch (err) {
      console.warn('[Weather] API fetch failed:', err.message);
      return this._getFallbackWeather(location);
    }
  },

  // ── Parse API response ─────────────────────────────
  _parseWeatherData(data, location) {
    const current = data.current || {};
    const daily = data.daily || {};

    const weatherCodes = {
      0: { desc: 'Clear Sky', icon: '☀️' },
      1: { desc: 'Mainly Clear', icon: '🌤️' },
      2: { desc: 'Partly Cloudy', icon: '⛅' },
      3: { desc: 'Overcast', icon: '☁️' },
      45: { desc: 'Fog', icon: '🌫️' },
      48: { desc: 'Rime Fog', icon: '🌫️' },
      51: { desc: 'Light Drizzle', icon: '🌦️' },
      53: { desc: 'Moderate Drizzle', icon: '🌦️' },
      55: { desc: 'Dense Drizzle', icon: '🌧️' },
      61: { desc: 'Slight Rain', icon: '🌧️' },
      63: { desc: 'Moderate Rain', icon: '🌧️' },
      65: { desc: 'Heavy Rain', icon: '🌧️' },
      71: { desc: 'Slight Snowfall', icon: '🌨️' },
      73: { desc: 'Moderate Snowfall', icon: '🌨️' },
      75: { desc: 'Heavy Snowfall', icon: '❄️' },
      80: { desc: 'Slight Showers', icon: '🌦️' },
      81: { desc: 'Moderate Showers', icon: '🌧️' },
      82: { desc: 'Violent Showers', icon: '⛈️' },
      95: { desc: 'Thunderstorm', icon: '⛈️' },
      96: { desc: 'Thunderstorm + Hail', icon: '⛈️' },
      99: { desc: 'Thunderstorm + Heavy Hail', icon: '⛈️' }
    };

    const currentWeather = weatherCodes[current.weather_code] || { desc: 'Unknown', icon: '🌤️' };

    // Build 5-day forecast
    const forecast = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < Math.min(5, (daily.time || []).length); i++) {
      const date = new Date(daily.time[i]);
      const code = daily.weather_code?.[i] || 0;
      const weather = weatherCodes[code] || { desc: 'Clear', icon: '☀️' };
      forecast.push({
        day: i === 0 ? 'Today' : dayNames[date.getDay()],
        date: daily.time[i],
        maxTemp: Math.round(daily.temperature_2m_max?.[i] || 30),
        minTemp: Math.round(daily.temperature_2m_min?.[i] || 20),
        precipitation: Math.round(daily.precipitation_sum?.[i] || 0),
        precipProb: daily.precipitation_probability_max?.[i] || 0,
        weatherDesc: weather.desc,
        weatherIcon: weather.icon
      });
    }

    return {
      location: location || 'Nashik, Maharashtra',
      current: {
        temperature: Math.round(current.temperature_2m || 28),
        feelsLike: Math.round(current.apparent_temperature || 30),
        humidity: current.relative_humidity_2m || 60,
        precipitation: current.precipitation || 0,
        windSpeed: Math.round(current.wind_speed_10m || 10),
        weatherDesc: currentWeather.desc,
        weatherIcon: currentWeather.icon
      },
      forecast,
      // For AI engine
      avgTemperature: Math.round((forecast.reduce((sum, d) => sum + d.maxTemp, 0) / Math.max(1, forecast.length))),
      isRainy: forecast.some(d => d.precipitation > 5),
      farmingAdvice: this._generateFarmingAdvice(current, forecast)
    };
  },

  // ── Farming-specific weather advice ────────────────
  _generateFarmingAdvice(current, forecast) {
    const advice = [];
    const temp = current.temperature_2m || 28;
    const humidity = current.relative_humidity_2m || 60;

    if (temp > 38) advice.push('🌡️ Extreme heat — irrigate crops and harvest early morning');
    else if (temp > 35) advice.push('☀️ Hot weather — ensure adequate water supply for crops');

    if (humidity > 85) advice.push('💧 High humidity — watch for fungal diseases in crops');

    const heavyRain = (forecast || []).some(d => d.precipitation > 20);
    if (heavyRain) advice.push('🌧️ Heavy rain expected — protect harvested crops, delay spraying');

    const noRain = (forecast || []).every(d => (d.precipitation || 0) < 2);
    if (noRain && temp > 30) advice.push('🏜️ Dry spell expected — plan irrigation carefully');

    if (advice.length === 0) advice.push('✅ Good weather for farming activities');

    return advice;
  },

  // ── Fallback weather data ──────────────────────────
  _getFallbackWeather(location) {
    const month = new Date().getMonth();
    const isMonsoon = month >= 5 && month <= 9;
    const isWinter = month >= 10 || month <= 1;
    const temp = isWinter ? 22 : (isMonsoon ? 28 : 35);

    return {
      location: location || 'Nashik, Maharashtra',
      current: {
        temperature: temp,
        feelsLike: temp + 2,
        humidity: isMonsoon ? 80 : 45,
        precipitation: isMonsoon ? 5 : 0,
        windSpeed: 12,
        weatherDesc: isMonsoon ? 'Rainy Season' : (isWinter ? 'Cool & Clear' : 'Hot & Sunny'),
        weatherIcon: isMonsoon ? '🌧️' : (isWinter ? '🌤️' : '☀️')
      },
      forecast: Array.from({ length: 5 }, (_, i) => ({
        day: i === 0 ? 'Today' : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date().getDay() + i) % 7],
        maxTemp: temp + Math.round(Math.random() * 4 - 2),
        minTemp: temp - 8 + Math.round(Math.random() * 3),
        precipitation: isMonsoon ? Math.round(Math.random() * 15) : 0,
        precipProb: isMonsoon ? 60 : 10,
        weatherDesc: isMonsoon ? 'Showers' : 'Clear',
        weatherIcon: isMonsoon ? '🌦️' : '☀️'
      })),
      avgTemperature: temp,
      isRainy: isMonsoon,
      farmingAdvice: ['📡 Weather data unavailable — showing seasonal estimate'],
      source: 'fallback'
    };
  },

  // ── Render Weather Widget HTML ─────────────────────
  renderWidget(weather) {
    if (!weather) return '';

    const c = weather.current;
    const sourceBadge = weather.source === 'live' ? '🟢 Live' : weather.source === 'cached' ? '🔵 Cached' : '🟡 Estimate';

    return `
      <div class="weather-widget">
        <div class="weather-header">
          <div class="weather-current">
            <span class="weather-icon-lg">${c.weatherIcon}</span>
            <div>
              <div class="weather-temp">${c.temperature}°C</div>
              <div class="weather-desc">${c.weatherDesc}</div>
            </div>
          </div>
          <div class="weather-meta">
            <div class="weather-location">📍 ${weather.location}</div>
            <div class="weather-details">
              <span>💧 ${c.humidity}%</span>
              <span>🌬️ ${c.windSpeed} km/h</span>
              <span class="data-badge-sm">${sourceBadge}</span>
            </div>
          </div>
        </div>
        <div class="weather-forecast">
          ${weather.forecast.map(d => `
            <div class="forecast-day">
              <div class="forecast-day-name">${d.day}</div>
              <div class="forecast-icon">${d.weatherIcon}</div>
              <div class="forecast-temps">
                <span class="temp-high">${d.maxTemp}°</span>
                <span class="temp-low">${d.minTemp}°</span>
              </div>
              ${d.precipitation > 0 ? `<div class="forecast-rain">🌧 ${d.precipitation}mm</div>` : ''}
            </div>
          `).join('')}
        </div>
        ${weather.farmingAdvice && weather.farmingAdvice.length ? `
          <div class="weather-advice">
            ${weather.farmingAdvice.map(a => `<div class="advice-item">${a}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
};

// Make globally available
window.WeatherService = WeatherService;
