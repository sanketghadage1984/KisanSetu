// Login Page Logic — Firebase Auth (Email, Google, Phone OTP)
let selectedUserType = 'farmer';
let _loginInProgress = false; // guard to prevent onAuthStateChanged from looping

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

// ── Helper: navigate based on user's actual stored role ──────
function redirectByRole(userType) {
  const role = userType || localStorage.getItem('kisansetu_userType') || 'farmer';
  if (role === 'trader') {
    App.navigateTo('trader-dashboard');
  } else {
    App.navigateTo('dashboard');
  }
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

  _loginInProgress = true;
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    // loginUser now syncs profile to localStorage and returns profile with userType
    const profile = await BackendService.loginUser(email, password);
    App.showNotification('Welcome! 🌾', 'Login successful. Redirecting...', 'success');
    setTimeout(() => {
      // Redirect based on Firestore profile role — NOT the UI toggle
      redirectByRole(profile ? profile.userType : null);
    }, 800);
  } catch (err) {
    _loginInProgress = false;
    let msg = 'Invalid credentials. Please try again.';
    if (err.code === 'auth/user-not-found')    msg = 'No account found with this email.';
    if (err.code === 'auth/wrong-password')    msg = 'Incorrect password.';
    if (err.code === 'auth/invalid-email')     msg = 'Please enter a valid email address.';
    if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password. Please try again.';
    App.showNotification('Login Failed', msg, 'error');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
  return false;
}

// ── Google Sign-In ──────────────────────────────────────────
async function handleGoogleLogin() {
  const btn = document.getElementById('googleSignInBtn');
  _loginInProgress = true;
  btn.disabled = true;
  btn.innerHTML = '⏳ Signing in with Google...';

  try {
    const profile = await BackendService.loginWithGoogle(selectedUserType);
    App.showNotification('Welcome! 🌾', 'Signed in with Google!', 'success');
    setTimeout(() => {
      redirectByRole(profile ? profile.userType : null);
    }, 800);
  } catch (err) {
    _loginInProgress = false;
    let msg = 'Google sign-in failed. Please try again.';
    if (err.code === 'auth/popup-closed-by-user') msg = 'Sign-in cancelled.';
    if (err.code === 'auth/popup-blocked')        msg = 'Please allow popups for this site.';
    App.showNotification('Error', msg, 'error');
    btn.disabled = false;
    btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" height="22" alt="Google"> Continue with Google';
  }
}

// ── Forgot Password ─────────────────────────────────────────
async function handleForgotPassword() {
  const email = document.getElementById('email').value.trim();
  if (!email) {
    App.showNotification('Enter Email', 'Please enter your email address first', 'warning');
    document.getElementById('email').focus();
    return;
  }
  try {
    await BackendService.sendPasswordReset(email);
    App.showNotification('Email Sent ✉️', `Password reset link sent to ${email}`, 'success');
  } catch (err) {
    let msg = 'Failed to send reset email. Check your email address.';
    if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
    if (err.code === 'auth/invalid-email')  msg = 'Please enter a valid email address.';
    App.showNotification('Error', msg, 'error');
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
  _loginInProgress = true;
  try {
    await BackendService.verifyPhoneOTP(code, selectedUserType);
    App.showNotification('Welcome! 🌾', 'Phone verified! Redirecting...', 'success');
    setTimeout(() => {
      redirectByRole(null);
    }, 800);
  } catch (err) {
    _loginInProgress = false;
    App.showNotification('Error', 'Invalid OTP code. Please try again.', 'error');
  }
}

// Redirect already logged-in users (only if not in the middle of logging in)
auth.onAuthStateChanged(async user => {
  if (user && !_loginInProgress) {
    // Wait a tick to allow BackendService.loginUser to finish writing to localStorage
    await new Promise(r => setTimeout(r, 200));
    await BackendService.seedDemoData(user.uid, localStorage.getItem('kisansetu_userType') || 'farmer').catch(() => {});
    // Now read role from localStorage (set by loginUser/loginWithGoogle)
    redirectByRole(null);
  }
});
