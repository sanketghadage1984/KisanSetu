// Login Page Logic
let selectedUserType = 'farmer';

// User type toggle
document.querySelectorAll('.user-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedUserType = btn.getAttribute('data-type');
  });
});

function togglePassword() {
  const input = document.getElementById('password');
  const btn = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function autoFillDemo() {
  document.getElementById('email').value = 'rajesh@kisansetu.demo';
  document.getElementById('password').value = 'demo123';
  App.showNotification('Auto-filled', 'Demo credentials filled. Click Sign In!', 'info');
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    App.showNotification('Error', 'Please enter email and password', 'error');
    return false;
  }

  const success = App.login(email, password, selectedUserType);
  if (success) {
    App.showNotification('Welcome!', 'Login successful. Redirecting...', 'success');
    setTimeout(() => {
      if (selectedUserType === 'trader') {
        App.navigateTo('trader-dashboard');
      } else {
        App.navigateTo('dashboard');
      }
    }, 800);
  } else {
    App.showNotification('Error', 'Invalid credentials', 'error');
  }
  return false;
}
