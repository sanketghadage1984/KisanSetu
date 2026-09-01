// Register Page Logic — Firebase Auth (Email+Password & Google)
let selectedUserType = 'farmer';
let _registerInProgress = false; // Guard to prevent auto-redirect during active registration

document.querySelectorAll('.user-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedUserType = btn.getAttribute('data-type');
  });
});

// ── Helper: navigate based on user's actual stored role ──────
function redirectByRole(userType) {
  const role = userType || localStorage.getItem('kisansetu_userType') || 'farmer';
  if (role === 'trader') {
    App.navigateTo('trader-dashboard');
  } else {
    App.navigateTo('dashboard');
  }
}

// ── Email + Password Registration ───────────────────────────
async function handleRegister(e) {
  e.preventDefault();

  const name            = document.getElementById('fullName').value.trim();
  const email           = document.getElementById('email').value.trim();
  const phone           = document.getElementById('phone').value.trim();
  const location        = document.getElementById('location').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const terms           = document.getElementById('terms').checked;
  const submitBtn       = document.querySelector('button[type="submit"]');

  if (!name || !email || !password) {
    App.showNotification('Error', 'Please fill in all required fields', 'error');
    return false;
  }
  if (password.length < 6) {
    App.showNotification('Error', 'Password must be at least 6 characters', 'error');
    return false;
  }
  if (password !== confirmPassword) {
    App.showNotification('Error', 'Passwords do not match', 'error');
    return false;
  }
  if (!terms) {
    App.showNotification('Error', 'Please accept the terms', 'error');
    return false;
  }

  _registerInProgress = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  try {
    await BackendService.registerUser({
      name, email, phone, location, password,
      userType: selectedUserType
    });

    App.showNotification('Account Created! 🎉', 'Welcome to KisanSetu. Redirecting...', 'success');
    setTimeout(() => {
      redirectByRole(selectedUserType);
    }, 1000);
  } catch (err) {
    _registerInProgress = false;
    let msg = 'Registration failed. Please try again.';
    if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
    if (err.code === 'auth/invalid-email')        msg = 'Please enter a valid email address.';
    if (err.code === 'auth/weak-password')        msg = 'Password too weak. Use at least 6 characters.';
    App.showNotification('Error', msg, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
  return false;
}

// ── Google Sign-Up ───────────────────────────────────────────
async function handleGoogleRegister() {
  const btn = document.getElementById('googleRegisterBtn');
  _registerInProgress = true;
  btn.disabled = true;
  btn.innerHTML = '⏳ Signing up with Google...';

  try {
    const profile = await BackendService.loginWithGoogle(selectedUserType);
    App.showNotification('Welcome! 🌾', 'Account created with Google!', 'success');
    setTimeout(() => {
      redirectByRole(profile ? profile.userType : selectedUserType);
    }, 800);
  } catch (err) {
    _registerInProgress = false;
    let msg = 'Google sign-up failed. Please try again.';
    if (err.code === 'auth/popup-closed-by-user') msg = 'Sign-up cancelled.';
    App.showNotification('Error', msg, 'error');
    btn.disabled = false;
    btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" height="22" alt="Google"> Sign up with Google';
  }
}

// Redirect already logged-in users (only if not mid-registration)
auth.onAuthStateChanged(async user => {
  if (user && !_registerInProgress) {
    // Wait to let any concurrent auth ops finish
    await new Promise(r => setTimeout(r, 200));
    if (!_registerInProgress) {
      redirectByRole(null);
    }
  }
});
