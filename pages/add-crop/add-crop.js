// Add Crop Page Logic — Firebase + Cloudinary

document.addEventListener('DOMContentLoaded', () => {
  // Guard: must be logged in
  auth.onAuthStateChanged(user => {
    if (!user) { App.navigateTo('login'); return; }
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
}

function populateCropDropdown() {
  const select = document.getElementById('cropName');
  const selected = select.value;
  select.innerHTML = `<option value="" data-i18n="addCrop.selectCrop">${window.t ? window.t('addCrop.selectCrop') : 'Select crop'}</option>`;
  KisanSetuData.cropTypes.forEach(crop => {
    const opt = document.createElement('option');
    opt.value = crop.name;
    opt.textContent = crop.name;
    if (crop.name === selected) opt.selected = true;
    select.appendChild(opt);
  });
}

function updateVarieties() {
  const cropName = document.getElementById('cropName').value;
  const varietySelect = document.getElementById('variety');
  varietySelect.innerHTML = `<option value="">${window.t ? window.t('addCrop.selectVariety') : 'Select variety'}</option>`;

  const crop = KisanSetuData.cropTypes.find(c => c.name === cropName);
  if (crop) {
    crop.varieties.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      varietySelect.appendChild(opt);
    });
  }

  const market = KisanSetuData.marketPrices.find(m => m.crop.toLowerCase() === cropName.toLowerCase());
  const hint = document.getElementById('priceHint');
  if (market) {
    hint.textContent = `Market range: ₹${market.minPrice}–₹${market.maxPrice}/kg (Modal: ₹${market.modalPrice})`;
    hint.style.color = 'var(--primary)';
  } else {
    hint.textContent = '';
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
  const cropName    = document.getElementById('cropName').value;
  const variety     = document.getElementById('variety').value;
  const quantity    = parseInt(document.getElementById('quantity').value);
  const expectedPrice = parseFloat(document.getElementById('expectedPrice').value);
  const location    = document.getElementById('location').value.trim();
  const harvestDate = document.getElementById('harvestDate').value;
  const condition   = document.getElementById('condition').value;
  const notes       = document.getElementById('notes').value.trim();
  const imageFile   = document.getElementById('cropImage')?.files[0];

  if (!cropName || !variety || !quantity || !expectedPrice) {
    App.showNotification('Error', 'Please fill in all required fields', 'error');
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
    await BackendService.addCrop(
      { name: cropName, variety, quantity, unit: 'kg', expectedPrice, location, harvestDate, condition, notes },
      imageFile
    );

    App.showNotification('Crop Listed! 🌾', `${cropName} (${variety}) — ${quantity}kg saved to cloud!`, 'success');
    setTimeout(() => App.navigateTo('dashboard'), 1200);

  } catch (err) {
    console.error('Add crop error:', err);
    App.showNotification('Error', 'Failed to save crop. Check your connection and try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = '🌾 List Crop';
  }

  return false;
}
