// Add Crop Page Logic

document.addEventListener('DOMContentLoaded', () => {
  initAddCrop();

  window.addEventListener('languageChanged', () => {
    initAddCrop();
  });
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
  varietySelect.innerHTML = `<option value="" data-i18n="addCrop.selectVariety">${window.t ? window.t('addCrop.selectVariety') : 'Select variety'}</option>`;

  const crop = KisanSetuData.cropTypes.find(c => c.name === cropName);
  if (crop) {
    crop.varieties.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      varietySelect.appendChild(opt);
    });
  }

  // Show price hint from market data
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
    preview.innerHTML = `<p style="color:var(--primary); font-size:0.85rem;">📎 ${file.name}</p>`;
  }
}

function handleAddCrop(e) {
  e.preventDefault();

  const cropName = document.getElementById('cropName').value;
  const variety = document.getElementById('variety').value;
  const quantity = parseInt(document.getElementById('quantity').value);
  const expectedPrice = parseFloat(document.getElementById('expectedPrice').value);
  const location = document.getElementById('location').value.trim();
  const harvestDate = document.getElementById('harvestDate').value;
  const condition = document.getElementById('condition').value;
  const notes = document.getElementById('notes').value.trim();

  if (!cropName || !variety || !quantity || !expectedPrice) {
    App.showNotification('Error', 'Please fill in all required fields', 'error');
    return false;
  }

  const newCrop = {
    id: App.generateId('crop'),
    name: cropName,
    variety: variety,
    quantity: quantity,
    unit: 'kg',
    expectedPrice: expectedPrice,
    location: location,
    harvestDate: harvestDate,
    condition: condition,
    notes: notes,
    status: 'active',
    image: null,
    addedOn: new Date().toISOString().split('T')[0]
  };

  const crops = App.getCrops();
  crops.push(newCrop);
  App.saveCrops(crops);

  App.showNotification('Crop Added! 🌾', `${cropName} (${variety}) — ${quantity} kg listed successfully`, 'success');

  setTimeout(() => App.navigateTo('dashboard'), 1200);
  return false;
}
