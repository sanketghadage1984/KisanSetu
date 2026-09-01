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
