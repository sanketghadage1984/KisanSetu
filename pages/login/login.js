// Login Page Logic — Firebase Auth (Email, Google, Phone OTP)
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
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁️'; }
}

// ── Email + Password Login ──────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const btn      = document.getElementById('loginBtn');

  if (!email || !password) {
    App.showNotification('Error', 'Please enter email and password', 'error');
    return false;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    await BackendService.loginUser(email, password);
    App.showNotification('Welcome! 🌾', 'Login successful. Redirecting...', 'success');
    setTimeout(() => {
      selectedUserType === 'trader'
        ? App.navigateTo('trader-dashboard')
        : App.navigateTo('dashboard');
    }, 800);
  } catch (err) {
    let msg = 'Invalid credentials. Please try again.';
    if (err.code === 'auth/user-not-found')    msg = 'No account found with this email.';
    if (err.code === 'auth/wrong-password')    msg = 'Incorrect password.';
    if (err.code === 'auth/invalid-email')     msg = 'Please enter a valid email address.';
    if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    App.showNotification('Login Failed', msg, 'error');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
  return false;
}

// ── Google Sign-In ──────────────────────────────────────────
async function handleGoogleLogin() {
  const btn = document.getElementById('googleSignInBtn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Signing in with Google...';

  try {
    await BackendService.loginWithGoogle(selectedUserType);
    App.showNotification('Welcome! 🌾', 'Signed in with Google!', 'success');
    setTimeout(() => {
      const userType = localStorage.getItem('kisansetu_userType') || 'farmer';
      userType === 'trader'
        ? App.navigateTo('trader-dashboard')
        : App.navigateTo('dashboard');
    }, 800);
  } catch (err) {
    let msg = 'Google sign-in failed. Please try again.';
    if (err.code === 'auth/popup-closed-by-user') msg = 'Sign-in cancelled.';
    if (err.code === 'auth/popup-blocked')        msg = 'Please allow popups for this site.';
    App.showNotification('Error', msg, 'error');
    btn.disabled = false;
    btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" height="22" alt="Google"> Continue with Google';
  }
}

// ── Phone OTP ───────────────────────────────────────────────
function togglePhoneSection() {
  const form = document.getElementById('phoneOtpForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function handleSendOTP() {
  const phone = document.getElementById('phoneNumber').value.trim();
  if (!phone) {
    App.showNotification('Error', 'Please enter your phone number', 'error');
    return;
  }
  // Format: +91XXXXXXXXXX
  const formatted = phone.startsWith('+') ? phone : '+91' + phone.replace(/\D/g, '');

  const btn = document.getElementById('sendOtpBtn');
  btn.disabled = true;
  btn.textContent = 'Sending OTP...';

  try {
    await BackendService.sendPhoneOTP(formatted, 'recaptcha-container');
    document.getElementById('otpVerifySection').style.display = 'block';
    btn.textContent = 'OTP Sent ✅';
    App.showNotification('OTP Sent', 'Check your phone for the 6-digit code', 'success');
  } catch (err) {
    App.showNotification('Error', 'Failed to send OTP. Check number format (+91XXXXXXXXXX)', 'error');
    btn.disabled = false;
    btn.textContent = 'Send OTP';
  }
}

async function handleVerifyOTP() {
  const code = document.getElementById('otpCode').value.trim();
  if (!code || code.length < 6) {
    App.showNotification('Error', 'Enter the 6-digit OTP code', 'error');
    return;
  }
  try {
    await BackendService.verifyPhoneOTP(code, selectedUserType);
    App.showNotification('Welcome! 🌾', 'Phone verified! Redirecting...', 'success');
    setTimeout(() => {
      selectedUserType === 'trader'
        ? App.navigateTo('trader-dashboard')
        : App.navigateTo('dashboard');
    }, 800);
  } catch (err) {
    App.showNotification('Error', 'Invalid OTP code. Please try again.', 'error');
  }
}

// Redirect already logged-in users
auth.onAuthStateChanged(user => {
  if (user) {
    const userType = localStorage.getItem('kisansetu_userType') || 'farmer';
    setTimeout(() => {
      userType === 'trader'
        ? App.navigateTo('trader-dashboard')
        : App.navigateTo('dashboard');
    }, 300);
  }
});
