// Register Page Logic
let selectedUserType = 'farmer';

document.querySelectorAll('.user-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedUserType = btn.getAttribute('data-type');
  });
});

function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const location = document.getElementById('location').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const terms = document.getElementById('terms').checked;

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

  const success = App.register({
    name, email, phone, location, password,
    userType: selectedUserType
  });

  if (success) {
    App.showNotification('Account Created!', 'Welcome to KisanSetu. Redirecting...', 'success');
    setTimeout(() => {
      if (selectedUserType === 'trader') {
        App.navigateTo('trader-dashboard');
      } else {
        App.navigateTo('dashboard');
      }
    }, 1000);
  } else {
    App.showNotification('Error', 'Registration failed. Try again.', 'error');
  }
  return false;
}
