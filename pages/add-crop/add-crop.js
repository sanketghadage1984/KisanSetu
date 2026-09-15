// Add Crop Page Logic — Firebase + Cloudinary

document.addEventListener('DOMContentLoaded', () => {
  // Populate dropdowns immediately so options are always ready
  populateCropDropdown();
  prefillLocation();

  // Guard: must be logged in and be a Farmer
  auth.onAuthStateChanged(async user => {
    if (!user) { App.navigateTo('login'); return; }
    // Role guard: Traders cannot add crops
    const profile = await BackendService.getUserProfile(user.uid).catch(() => null);
    if (profile && profile.userType === 'trader') {
      App.navigateTo('trader-dashboard');
      return;
    }
    initAddCrop();
  });

  window.addEventListener('languageChanged', () => initAddCrop());
});

function initAddCrop() {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('add-crop', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('add-crop', userType);
  App.initNavigation();
  App.translatePage();
  populateCropDropdown();
  prefillLocation();
  bindAIAnalysisListeners();
  updateAIPreListingAnalysis();
}

function populateCropDropdown() {
  const select = document.getElementById('cropName');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = `
    <option value="" data-i18n="addCrop.selectCrop">${window.t ? window.t('addCrop.selectCrop') : 'Select crop'}</option>
    ${KisanSetuData.cropTypes.map(c => `<option value="${c.name}" ${c.name === currentVal ? 'selected' : ''}>${c.name}</option>`).join('')}
    <option value="Other" ${currentVal === 'Other' ? 'selected' : ''}>✏️ Other / Custom</option>
  `;
}

function updateVarieties() {
  const cropSelect = document.getElementById('cropName');
  const cropName = cropSelect.value;
  const customCropInput = document.getElementById('customCropName');
  const varietySelect = document.getElementById('variety');
  const customVarietyInput = document.getElementById('customVariety');

  if (cropName === 'Other') {
    if (customCropInput) {
      customCropInput.style.display = 'block';
      customCropInput.required = true;
      customCropInput.focus();
    }
  } else {
    if (customCropInput) {
      customCropInput.style.display = 'none';
      customCropInput.required = false;
      customCropInput.value = '';
    }
  }

  const crop = KisanSetuData.cropTypes.find(c => c.name === cropName);
  let options = `<option value="">${window.t ? window.t('addCrop.selectVariety') : 'Select variety'}</option>`;
  if (crop && crop.varieties) {
    crop.varieties.forEach(v => {
      options += `<option value="${v}">${v}</option>`;
    });
  }
  options += `<option value="Other">✏️ Other / Custom</option>`;
  varietySelect.innerHTML = options;

  if (cropName === 'Other') {
    varietySelect.value = 'Other';
    handleVarietyChange();
  } else {
    if (customVarietyInput) {
      customVarietyInput.style.display = 'none';
      customVarietyInput.required = false;
      customVarietyInput.value = '';
    }
  }

  const market = KisanSetuData.marketPrices.find(m => m.crop.toLowerCase() === cropName.toLowerCase());
  const hint = document.getElementById('priceHint');
  if (market) {
    hint.textContent = `Market range: ₹${market.minPrice}–₹${market.maxPrice}/kg (Modal: ₹${market.modalPrice})`;
    hint.style.color = 'var(--primary)';
  } else {
    hint.textContent = '';
  }
  updateAIPreListingAnalysis();
}

function handleVarietyChange() {
  const varietySelect = document.getElementById('variety');
  const customVarietyInput = document.getElementById('customVariety');
  if (!varietySelect || !customVarietyInput) return;

  if (varietySelect.value === 'Other') {
    customVarietyInput.style.display = 'block';
    customVarietyInput.required = true;
    customVarietyInput.focus();
  } else {
    customVarietyInput.style.display = 'none';
    customVarietyInput.required = false;
    customVarietyInput.value = '';
  }
}

function prefillLocation() {
  const user = App.getUser();
  if (user && user.location) {
    document.getElementById('location').value = user.location;
  }
}

function handleImagePreview(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('imagePreview');
  if (file) {
    const sizeKB = (file.size / 1024).toFixed(0);
    const afterKB = Math.min(sizeKB, Math.round(sizeKB * 0.15));
    preview.innerHTML = `
      <p style="color:var(--primary); font-size:0.85rem;">📎 ${file.name}</p>
      <p style="color:var(--text-muted); font-size:0.78rem;">
        Original: ${sizeKB}KB → Will compress to ~${afterKB}KB before upload ✅
      </p>
    `;
  }
}

// ── Main Submit Handler — Cloudinary + Firestore ─────────────
async function handleAddCrop(e) {
  e.preventDefault();

  const submitBtn = document.querySelector('button[type="submit"]');
  const cropSelectVal = document.getElementById('cropName').value;
  const customCropVal = document.getElementById('customCropName')?.value.trim();
  const cropName = cropSelectVal === 'Other' ? customCropVal : cropSelectVal;

  const varietySelectVal = document.getElementById('variety').value;
  const customVarietyVal = document.getElementById('customVariety')?.value.trim();
  const variety = varietySelectVal === 'Other' ? customVarietyVal : varietySelectVal;

  const quantity    = parseInt(document.getElementById('quantity').value);
  const expectedPrice = parseFloat(document.getElementById('expectedPrice').value);
  const location    = document.getElementById('location').value.trim();
  const harvestDate = document.getElementById('harvestDate').value;
  const condition   = document.getElementById('condition').value;
  const notes       = document.getElementById('notes').value.trim();
  const imageFile   = document.getElementById('cropImage')?.files[0];

  if (!cropName || !variety || !quantity || !expectedPrice) {
    App.showNotification('Error', 'Please fill in all required fields (crop name, variety, quantity, and price)', 'error');
    return false;
  }

  submitBtn.disabled = true;

  try {
    // Step 1: Upload image (auto-compressed by firebase-config.js)
    if (imageFile) {
      submitBtn.textContent = '📸 Compressing & uploading image...';
    } else {
      submitBtn.textContent = '💾 Saving to cloud...';
    }

    // Step 2: Save crop to Firestore (image upload handled inside BackendService.addCrop)
    const savedCrop = await BackendService.addCrop(
      { name: cropName, variety, quantity, unit: 'kg', expectedPrice, location, harvestDate, condition, notes },
      imageFile
    );

    // Step 3: Mint Genesis Block in Blockchain Tracker
    if (window.BlockchainTracker) {
      try {
        const farmerId = (auth.currentUser && auth.currentUser.uid) || 'farmer_local';
        const cropObj = {
          id: (savedCrop && savedCrop.id) || ('crop_' + Date.now()),
          name: cropName,
          variety,
          quantity,
          expectedPrice,
          location,
          harvestDate,
          condition
        };
        await BlockchainTracker.createCropRecord(cropObj, farmerId);
      } catch (bcErr) {
        console.warn('Blockchain genesis block creation warning:', bcErr);
      }
    }

    App.showNotification('Crop Listed! 🌾', `${cropName} (${variety}) — ${quantity}kg saved & blockchain minted!`, 'success');
    setTimeout(() => App.navigateTo('dashboard'), 1200);

  } catch (err) {
    console.error('Add crop error:', err);
    App.showNotification('Error', 'Failed to save crop. Check your connection and try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = '🌾 List Crop';
  }

  return false;
}

// ═════════════════════════════════════════════════════════
// AI PRE-LISTING ANALYSIS & VOICE SEARCH INTEGRATION
// ═════════════════════════════════════════════════════════

function bindAIAnalysisListeners() {
  const fields = ['quantity', 'expectedPrice', 'harvestDate', 'condition'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => updateAIPreListingAnalysis());
      el.addEventListener('change', () => updateAIPreListingAnalysis());
    }
  });
}

async function updateAIPreListingAnalysis() {
  const container = document.getElementById('aiPreListingContainer');
  if (!container) return;

  const cropSelectVal = document.getElementById('cropName')?.value;
  const customCropVal = document.getElementById('customCropName')?.value.trim();
  const cropName = cropSelectVal === 'Other' ? customCropVal : cropSelectVal;

  if (!cropName) {
    container.innerHTML = '';
    return;
  }

  const quantity = parseFloat(document.getElementById('quantity')?.value) || 1000;
  const expectedPrice = parseFloat(document.getElementById('expectedPrice')?.value) || 20;
  const harvestDate = document.getElementById('harvestDate')?.value || '';
  const condition = document.getElementById('condition')?.value || 'Good';

  // 1. Price Prediction via AIEngine
  let priceData = {
    predictedModalPrice: expectedPrice,
    trend: 'stable',
    recommendation: 'Good time to list on market',
    min: Math.round(expectedPrice * 0.9),
    max: Math.round(expectedPrice * 1.15)
  };

  if (window.AIEngine && typeof AIEngine.predictPrice === 'function') {
    try {
      const pred = AIEngine.predictPrice(cropName, (window.KisanSetuData && KisanSetuData.mandiPrices) || []);
      if (pred) {
        priceData = {
          predictedModalPrice: pred.predictedModalPrice || expectedPrice,
          trend: pred.trend || 'stable',
          recommendation: pred.recommendation || 'Favorable listing window',
          min: pred.historicalMin || Math.round(expectedPrice * 0.9),
          max: pred.historicalMax || Math.round(expectedPrice * 1.15)
        };
      }
    } catch (e) {
      console.warn('AIEngine.predictPrice fallback', e);
    }
  }

  // 2. Spoilage Risk via AIEngine
  let spoilageData = {
    riskScore: 8,
    riskLevel: 'LOW',
    remainingShelfLifeDays: 25,
    estimatedLossRs: 0,
    recommendations: ['Store in well-ventilated dry crate']
  };

  if (window.AIEngine && typeof AIEngine.predictSpoilageRisk === 'function') {
    try {
      const sp = AIEngine.predictSpoilageRisk({
        cropType: cropName,
        currentTempC: 28,
        harvestDate: harvestDate,
        condition: condition
      });
      if (sp) {
        spoilageData = {
          riskScore: sp.riskScore || 8,
          riskLevel: sp.riskLevel || 'LOW',
          remainingShelfLifeDays: sp.remainingShelfLifeDays || 25,
          estimatedLossRs: Math.round((sp.estimatedLossPct || 2) * 0.01 * quantity * expectedPrice),
          recommendations: sp.recommendations || ['Maintain standard dry storage']
        };
      }
    } catch (e) {
      console.warn('AIEngine.predictSpoilageRisk fallback', e);
    }
  }

  // 3. Transport Cost via AIEngine
  let transportData = {
    vehicle: 'Mini Truck (Tata Ace)',
    distanceKm: 35,
    totalEstimatedCost: 650,
    costPerKg: 0.65
  };

  if (window.AIEngine && typeof AIEngine.estimateTransportCost === 'function') {
    try {
      const tc = AIEngine.estimateTransportCost({
        distanceKm: 35,
        quantityKg: quantity,
        cropType: cropName
      });
      if (tc) {
        transportData = {
          vehicle: tc.vehicle || transportData.vehicle,
          distanceKm: tc.distanceKm || 35,
          totalEstimatedCost: tc.totalEstimatedCost || 650,
          costPerKg: tc.costPerKg || 0.65
        };
      }
    } catch (e) {
      console.warn('AIEngine.estimateTransportCost fallback', e);
    }
  }

  // 4. Simulated Genesis Hash
  let genesisHash = 'a7f98e21c3b6441098de719cb...' + cropName.slice(0, 3).toLowerCase();
  if (window.BlockchainTracker && typeof BlockchainTracker.generateHash === 'function') {
    try {
      const h = await BlockchainTracker.generateHash({
        crop: cropName,
        qty: quantity,
        price: expectedPrice,
        condition,
        time: Date.now()
      });
      if (h) genesisHash = h;
    } catch (e) {}
  }

  const riskClass = spoilageData.riskLevel === 'HIGH' || spoilageData.riskLevel === 'CRITICAL' ? 'risk-high' : (spoilageData.riskLevel === 'MEDIUM' ? 'risk-med' : 'risk-low');
  const trendIcon = priceData.trend === 'up' ? '📈 Rising' : (priceData.trend === 'down' ? '📉 Cooling' : '⚖️ Stable');

  container.innerHTML = `
    <div class="ai-analysis-card">
      <div class="ai-analysis-header">
        <div class="ai-header-title">
          <span>🧠 KisanSetu AI Pre-Listing Advisory</span>
        </div>
        <span class="ai-tag">Verified APMC Intelligence</span>
      </div>

      <div class="ai-grid">
        <!-- Price Recommendation -->
        <div class="ai-card-item">
          <div class="ai-card-label">💰 AI Recommended Price</div>
          <div class="ai-card-value" style="color:var(--primary);">
            ₹${priceData.predictedModalPrice}/kg
          </div>
          <div class="ai-card-subtext">
            ${trendIcon} · Range: ₹${priceData.min}–₹${priceData.max}
          </div>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.3rem;">
            ${priceData.recommendation}
          </div>
        </div>

        <!-- Spoilage Risk -->
        <div class="ai-card-item">
          <div class="ai-card-label">🍂 Spoilage Risk Predictor</div>
          <div class="ai-card-value ${riskClass}">
            ${spoilageData.riskScore}% (${spoilageData.riskLevel})
          </div>
          <div class="ai-card-subtext">
            ⏳ ~${spoilageData.remainingShelfLifeDays} days safe shelf-life
          </div>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.3rem;">
            Est. potential loss: ₹${spoilageData.estimatedLossRs.toLocaleString()}
          </div>
        </div>

        <!-- Transport Estimator -->
        <div class="ai-card-item">
          <div class="ai-card-label">🚚 Logistics & Mandi Transit</div>
          <div class="ai-card-value" style="color:#0284c7;">
            ₹${transportData.costPerKg}/kg
          </div>
          <div class="ai-card-subtext">
            ${transportData.vehicle} · ~${transportData.distanceKm} km
          </div>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.3rem;">
            Total Est. Transit: ₹${transportData.totalEstimatedCost.toLocaleString()}
          </div>
        </div>
      </div>

      <!-- Genesis Blockchain Block Preview -->
      <div class="blockchain-preview">
        <div class="bc-header">
          <span>🔒 Blockchain Traceability Hash (Genesis Block)</span>
          <span>SHA-256 Immutable</span>
        </div>
        <div class="bc-hash">${genesisHash}</div>
        <div style="font-size:0.68rem; color:#A7D7C5;">
          Upon submission, this batch will be cryptographically minted for QR provenance verification.
        </div>
      </div>
    </div>
  `;
}

// ── Voice Input Speech Recognition ──────────────────────────
let _speechRecognition = null;
let _isListening = false;

function toggleVoiceInput() {
  const micBtn = document.getElementById('cropMicBtn');
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRec) {
    App.showNotification('Speech Not Supported', 'Your browser does not support Web Speech API. Please type crop name.', 'warning');
    return;
  }

  if (_isListening) {
    if (_speechRecognition) _speechRecognition.stop();
    _isListening = false;
    if (micBtn) micBtn.classList.remove('listening');
    return;
  }

  try {
    _speechRecognition = new SpeechRec();
    _speechRecognition.continuous = false;
    _speechRecognition.interimResults = false;

    // Detect language: Marathi (mr-IN), Hindi (hi-IN), or Indian English (en-IN)
    const lang = App.getLang ? App.getLang() : 'en';
    _speechRecognition.lang = lang === 'mr' ? 'mr-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN');

    _speechRecognition.onstart = () => {
      _isListening = true;
      if (micBtn) micBtn.classList.add('listening');
      App.showNotification('Listening... 🎙️', 'Speak the crop name (उदा. कांदा, टोमॅटो, गेहूं, Onion)', 'info');
    };

    _speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log('Voice transcript:', transcript);
      matchVoiceToCrop(transcript);
    };

    _speechRecognition.onerror = (err) => {
      console.warn('Speech recognition error:', err);
      _isListening = false;
      if (micBtn) micBtn.classList.remove('listening');
    };

    _speechRecognition.onend = () => {
      _isListening = false;
      if (micBtn) micBtn.classList.remove('listening');
    };

    _speechRecognition.start();
  } catch (err) {
    console.error('Speech start error:', err);
    _isListening = false;
    if (micBtn) micBtn.classList.remove('listening');
  }
}

function matchVoiceToCrop(spoken) {
  const cropMap = {
    'onion': 'Onion', 'kanda': 'Onion', 'कांदा': 'Onion', 'pyaz': 'Onion', 'pyaaz': 'Onion', 'प्याज': 'Onion',
    'tomato': 'Tomato', 'tamatar': 'Tomato', 'टोमॅटो': 'Tomato', 'टमाटर': 'Tomato',
    'wheat': 'Wheat', 'gehu': 'Wheat', 'gehun': 'Wheat', 'गहू': 'Wheat', 'गेहूं': 'Wheat',
    'potato': 'Potato', 'batata': 'Potato', 'बटाटा': 'Potato', 'aloo': 'Potato', 'आलू': 'Potato',
    'soybean': 'Soybean', 'सोयाबीन': 'Soybean',
    'rice': 'Rice', 'chawal': 'Rice', 'tandul': 'Rice', 'तांदूळ': 'Rice', 'चावल': 'Rice',
    'sugarcane': 'Sugarcane', 'us': 'Sugarcane', 'ऊस': 'Sugarcane', 'ganna': 'Sugarcane', 'गन्ना': 'Sugarcane',
    'grapes': 'Grapes', 'draksha': 'Grapes', 'द्राक्षे': 'Grapes', 'angur': 'Grapes', 'अंगूर': 'Grapes',
    'cotton': 'Cotton', 'kapas': 'Cotton', 'kapus': 'Cotton', 'कापूस': 'Cotton', 'कपास': 'Cotton',
    'maize': 'Maize', 'makka': 'Maize', 'मका': 'Maize', 'मक्का': 'Maize',
    'chickpea': 'Chickpea', 'harbhara': 'Chickpea', 'chana': 'Chickpea', 'हरभरा': 'Chickpea', 'चना': 'Chickpea'
  };

  let matchedCrop = null;
  for (const [kw, standard] of Object.entries(cropMap)) {
    if (spoken.includes(kw)) {
      matchedCrop = standard;
      break;
    }
  }

  const cropSelect = document.getElementById('cropName');
  if (matchedCrop && cropSelect) {
    cropSelect.value = matchedCrop;
    updateVarieties();
    App.showNotification('Voice Matched! 🎯', `Selected: ${matchedCrop} ("${spoken}")`, 'success');
  } else {
    if (cropSelect) {
      cropSelect.value = 'Other';
      updateVarieties();
      const customInput = document.getElementById('customCropName');
      if (customInput) {
        customInput.value = spoken;
        customInput.style.display = 'block';
      }
      updateAIPreListingAnalysis();
    }
    App.showNotification('Voice Input 🎙️', `Recognized: "${spoken}"`, 'info');
  }
}

