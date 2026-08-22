// Profile Page Logic

document.addEventListener('DOMContentLoaded', () => {
  initProfilePage();

  window.addEventListener('languageChanged', () => {
    initProfilePage();
  });
});

function initProfilePage() {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('profile', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('profile', userType);
  App.initNavigation();
  App.translatePage();

  populateProfile();
}

function populateProfile() {
  const user = App.getUser();
  if (!user) return;

  document.getElementById('profileAvatar').textContent = user.avatar || user.name.charAt(0);
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileLocation').textContent = '📍 ' + (user.location || 'Not set');

  document.getElementById('name').value = user.name || '';
  document.getElementById('email').value = user.email || '';
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('location').value = user.location || '';
}

function saveProfile(e) {
  e.preventDefault();

  const user = App.getUser();
  user.name = document.getElementById('name').value.trim();
  user.email = document.getElementById('email').value.trim();
  user.phone = document.getElementById('phone').value.trim();
  user.location = document.getElementById('location').value.trim();
  user.avatar = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const key = App.getUserType() === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
  localStorage.setItem(key, JSON.stringify(user));

  // Update UI
  document.getElementById('profileAvatar').textContent = user.avatar;
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileLocation').textContent = '📍 ' + user.location;

  App.updateNavUser();
  App.showNotification('Profile Updated', 'Your changes have been saved', 'success');
  return false;
}

function resetDemo() {
  if (confirm('Reset all demo data? This will restore original mock data.')) {
    localStorage.removeItem('kisansetu_initialized');
    localStorage.removeItem('kisansetu_crops');
    localStorage.removeItem('kisansetu_offers');
    localStorage.removeItem('kisansetu_transactions');
    localStorage.removeItem('kisansetu_notifications');
    App.initLocalStorage();
    App.showNotification('Data Reset', 'Demo data has been restored to defaults', 'success');
    setTimeout(() => location.reload(), 1000);
  }
}
