// Profile Page Logic — Firebase Firestore

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(async user => {
    if (!user) { App.navigateTo('login'); return; }
    await initProfilePage(user);
  });

  window.addEventListener('languageChanged', () => {
    const userType = App.getUserType();
    document.getElementById('topNav').innerHTML = `
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      ${renderTopNav(userType)}
    `;
    App.initNavigation();
    App.translatePage();
  });
});

async function initProfilePage(user) {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('profile', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('profile', userType);
  App.initNavigation();
  App.translatePage();

  // Load profile from Firestore
  try {
    const profile = await BackendService.getUserProfile(user.uid);
    if (profile) populateProfile(profile);
  } catch (err) {
    // Fallback to localStorage if offline
    const localUser = App.getUser();
    if (localUser) populateProfile(localUser);
  }
}

function populateProfile(user) {
  document.getElementById('profileAvatar').textContent = user.avatar || user.name.charAt(0);
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileLocation').textContent = '📍 ' + (user.location || 'Not set');

  document.getElementById('name').value     = user.name     || '';
  document.getElementById('email').value    = user.email    || '';
  document.getElementById('phone').value    = user.phone    || '';
  document.getElementById('location').value = user.location || '';
}

async function saveProfile(e) {
  e.preventDefault();

  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    App.showNotification('Error', 'Not logged in', 'error');
    return false;
  }

  const name     = document.getElementById('name').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const location = document.getElementById('location').value.trim();
  const avatar   = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const saveBtn = document.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // Update Firestore
    await BackendService.updateUserProfile(firebaseUser.uid, { name, phone, location, avatar });
    // Update Firebase Auth display name
    await firebaseUser.updateProfile({ displayName: name });

    // Sync to localStorage so App.getUser() & navbar shows updated name
    const userType = App.getUserType();
    const profileKey = userType === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
    const existing = JSON.parse(localStorage.getItem(profileKey) || '{}');
    localStorage.setItem(profileKey, JSON.stringify({ ...existing, name, phone, location, avatar }));

    // Update header UI
    document.getElementById('profileAvatar').textContent = avatar;
    document.getElementById('profileName').textContent   = name;
    document.getElementById('profileLocation').textContent = '📍 ' + location;
    App.updateNavUser();

    App.showNotification('Profile Updated ✅', 'Your changes have been saved to cloud', 'success');
  } catch (err) {
    App.showNotification('Error', 'Failed to save profile. Check your connection.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Changes';
  }
  return false;
}

function resetDemo() {
  if (confirm('Reset all local data? This will clear cached data.')) {
    localStorage.removeItem('kisansetu_initialized');
    localStorage.removeItem('kisansetu_crops');
    localStorage.removeItem('kisansetu_offers');
    localStorage.removeItem('kisansetu_transactions');
    localStorage.removeItem('kisansetu_notifications');
    App.showNotification('Data Reset', 'Local cache cleared', 'success');
    setTimeout(() => location.reload(), 1000);
  }
}

// ═════════════════════════════════════════════════════════
// SMS & WHATSAPP ALERT PREFERENCES
// ═════════════════════════════════════════════════════════

function toggleCropChip(checkbox) {
  const label = checkbox.closest('.crop-chip-label');
  if (!label) return;
  if (checkbox.checked) {
    label.classList.add('selected');
  } else {
    label.classList.remove('selected');
  }
  saveAlertPreferences(false);
}

function saveAlertPreferences(showNotif) {
  const prefs = {
    whatsapp: document.getElementById('alertWhatsApp')?.checked ?? true,
    sms: document.getElementById('alertSMS')?.checked ?? true,
    frequency: document.getElementById('alertFrequency')?.value || 'daily_morning',
    crops: []
  };

  // Collect selected crop chips
  document.querySelectorAll('#cropAlertChips input[type="checkbox"]').forEach(cb => {
    if (cb.checked) prefs.crops.push(cb.value);
  });

  // Save to localStorage
  localStorage.setItem('kisansetu_alert_prefs', JSON.stringify(prefs));

  // Persist to Firestore if available
  const firebaseUser = (typeof auth !== 'undefined' && auth.currentUser) ? auth.currentUser : null;
  if (firebaseUser && typeof BackendService !== 'undefined' && BackendService.updateUserProfile) {
    BackendService.updateUserProfile(firebaseUser.uid, { alertPreferences: prefs }).catch(() => {});
  }

  if (showNotif) {
    App.showNotification('Preferences Saved ✅', `Alerts: ${prefs.whatsapp ? 'WhatsApp' : ''}${prefs.whatsapp && prefs.sms ? ' + ' : ''}${prefs.sms ? 'SMS' : ''} for ${prefs.crops.length} crops`, 'success');
  }
}

function loadAlertPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('kisansetu_alert_prefs'));
    if (!saved) return;

    const waCheck = document.getElementById('alertWhatsApp');
    const smsCheck = document.getElementById('alertSMS');
    const freqSelect = document.getElementById('alertFrequency');

    if (waCheck) waCheck.checked = saved.whatsapp !== false;
    if (smsCheck) smsCheck.checked = saved.sms !== false;
    if (freqSelect && saved.frequency) freqSelect.value = saved.frequency;

    if (saved.crops && saved.crops.length) {
      document.querySelectorAll('#cropAlertChips input[type="checkbox"]').forEach(cb => {
        const isSelected = saved.crops.includes(cb.value);
        cb.checked = isSelected;
        const label = cb.closest('.crop-chip-label');
        if (label) label.classList.toggle('selected', isSelected);
      });
    }
  } catch (e) {
    console.warn('loadAlertPreferences:', e);
  }
}

function sendTestWhatsAppAlert() {
  const phone = document.getElementById('phone')?.value?.trim() || '';
  if (!phone || phone.length < 10) {
    App.showNotification('Phone Required', 'Please save your phone number first to test WhatsApp alerts.', 'warning');
    return;
  }

  const waPhone = phone.startsWith('+') ? phone.replace(/[^0-9]/g, '') : '91' + phone.replace(/[^0-9]/g, '');
  const sampleMsg = encodeURIComponent(
    '🌾 [KisanSetu Alert] Today\'s Mandi Rates:\n' +
    '🧅 Onion: ₹28/kg (↑ ₹2)\n' +
    '🍅 Tomato: ₹22/kg (→ Stable)\n' +
    '🌾 Wheat: ₹32/kg (↑ ₹1)\n\n' +
    '📊 AI Advice: Onion demand rising — favorable selling window!\n' +
    '— KisanSetu (kisansetu.in)'
  );

  window.open(`https://wa.me/${waPhone}?text=${sampleMsg}`, '_blank');
  App.showNotification('Test Sent 📲', 'WhatsApp opened with a sample mandi alert message.', 'success');
}

