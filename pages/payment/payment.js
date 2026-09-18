// Payment & Escrow Page Logic
// Reads offer data from URL params or localStorage, renders step-by-step escrow flow

let _paymentOffer = null;
let _paymentStage = 1; // 1=Deal Confirmed, 2=Escrow Payment, 3=Dispatched, 4=Delivered

document.addEventListener('DOMContentLoaded', () => {
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (!user) { App.navigateTo('login'); return; }
      initPaymentPage(user);
    });
  } else {
    initPaymentPage(null);
  }

  window.addEventListener('languageChanged', () => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const userType = roleParam || App.getUserType();
    const topNav = document.getElementById('topNav');
    if (topNav && typeof renderTopNav === 'function') {
      topNav.innerHTML = `
        <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
        ${renderTopNav(userType)}
      `;
    }
    const sidebar = document.getElementById('sidebar');
    if (sidebar && typeof renderDashboardSidebar === 'function') {
      sidebar.innerHTML = renderDashboardSidebar('offers', userType);
    }
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav && typeof renderBottomNav === 'function') {
      bottomNav.innerHTML = renderBottomNav('offers', userType);
    }
    if (App && typeof App.initNavigation === 'function') {
      App.initNavigation();
    }
    if (App && typeof App.translatePage === 'function') {
      App.translatePage();
    }
  });
});

function initPaymentPage(user) {
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role');
  const userType = roleParam || App.getUserType();
  const isFarmer = userType !== 'trader';

  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('offers', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('offers', userType);
  App.initNavigation();
  App.translatePage();

  // Load offer data
  loadOfferData();
  renderTransactionSummary();

  // Role-specific Header & Stepper text
  if (isFarmer) {
    document.querySelector('.payment-hero-badge').textContent = '🌾 FARMER ESCROW & PAYOUT HUB';
    document.querySelector('.payment-hero-title').textContent = 'Harvest Dispatch & Direct Bank Settlement';
    document.querySelector('#step2 .step-title').textContent = '2. Trader Escrow Deposit';
    document.querySelector('#step2 .step-desc').textContent = 'Buyer deposits funds into KisanSetu Escrow vault (100% Guaranteed)';
    document.querySelector('#step3 .step-title').textContent = '3. Dispatch Produce & e-Way Pass';
    document.querySelector('#step3 .step-desc').textContent = 'Enter vehicle details & generate official gate pass';
    document.querySelector('#step4 .step-title').textContent = '4. Delivery & Bank Payout';
    document.querySelector('#step4 .step-desc').textContent = 'Direct payout credit into farmer\'s registered bank account';
  }

  updateStepper();
}

function loadOfferData() {
  const params = new URLSearchParams(window.location.search);
  const offerId = params.get('offerId');

  // Try to load from localStorage (offers cache)
  let offers = [];
  try {
    offers = JSON.parse(localStorage.getItem('kisansetu_real_offers') || '[]');
  } catch (e) {}

  if (!offers.length) {
    try {
      offers = JSON.parse(localStorage.getItem('kisansetu_offers') || '[]');
    } catch (e) {}
  }

  if (offerId) {
    _paymentOffer = offers.find(o => o.id === offerId);
  }

  if (!_paymentOffer && offers.length) {
    // Fallback: pick the latest accepted offer
    _paymentOffer = offers.find(o => o.status === 'accepted') || offers[0];
  }

  if (!_paymentOffer) {
    // Create a demo offer for display
    _paymentOffer = {
      id: 'demo_offer',
      cropName: 'Onion (Nashik Red)',
      quantity: 1000,
      offerPrice: 28,
      farmerName: 'Ramesh Patil',
      traderName: 'Kishor Agro',
      location: 'Nashik, Maharashtra',
      status: 'accepted',
      date: new Date().toLocaleDateString('en-IN')
    };
  }

  // Load escrow stage
  const savedStage = localStorage.getItem('kisansetu_escrow_' + _paymentOffer.id);
  _paymentStage = savedStage ? parseInt(savedStage, 10) : 1;
}

function renderTransactionSummary() {
  if (!_paymentOffer) return;

  const total = (_paymentOffer.offerPrice || 0) * (_paymentOffer.quantity || 0);
  const escrowId = `KS-ESC-${(_paymentOffer.id || 'X').slice(0, 8).toUpperCase()}`;

  document.getElementById('paymentSubtitle').textContent =
    `${_paymentOffer.cropName} — ${(_paymentOffer.quantity || 0).toLocaleString()} kg @ ₹${_paymentOffer.offerPrice}/kg`;

  document.getElementById('txnSummaryGrid').innerHTML = `
    <div class="txn-item">
      <div class="txn-item-label">Crop</div>
      <div class="txn-item-value">${_paymentOffer.cropName || '—'}</div>
    </div>
    <div class="txn-item">
      <div class="txn-item-label">Escrow ID</div>
      <div class="txn-item-value" style="font-family:monospace; color:var(--primary);">${escrowId}</div>
    </div>
    <div class="txn-item">
      <div class="txn-item-label">Quantity</div>
      <div class="txn-item-value">${(_paymentOffer.quantity || 0).toLocaleString()} kg</div>
    </div>
    <div class="txn-item">
      <div class="txn-item-label">Agreed Price</div>
      <div class="txn-item-value" style="color:var(--primary);">₹${_paymentOffer.offerPrice}/kg</div>
    </div>
    <div class="txn-item">
      <div class="txn-item-label">Farmer (Seller)</div>
      <div class="txn-item-value">🌾 ${_paymentOffer.farmerName || 'Farmer'}</div>
    </div>
    <div class="txn-item">
      <div class="txn-item-label">Trader (Buyer)</div>
      <div class="txn-item-value">🤝 ${_paymentOffer.traderName || 'Trader'}</div>
    </div>
    <div class="txn-item" style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(45,106,79,0.08), rgba(82,183,136,0.12)); border: 1px solid rgba(45,106,79,0.2);">
      <div class="txn-item-label">Total Transaction Value</div>
      <div class="txn-item-value" style="font-size:1.2rem; color:#2D6A4F;">₹${total.toLocaleString('en-IN')}</div>
    </div>
  `;
}

function updateStepper() {
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role');
  const userType = roleParam || App.getUserType();
  const isFarmer = userType !== 'trader';
  const total = (_paymentOffer.offerPrice || 0) * (_paymentOffer.quantity || 0);

  // Step classes
  ['step1', 'step2', 'step3', 'step4'].forEach((id, i) => {
    const el = document.getElementById(id);
    const stageNum = i + 1;
    el.className = 'step-item';
    if (stageNum < _paymentStage + 1) el.classList.add('completed');
    else if (stageNum === _paymentStage + 1) el.classList.add('active');
    else el.classList.add('pending');
  });

  // Connectors
  document.getElementById('conn12').className = 'step-connector' + (_paymentStage >= 2 ? ' filled' : '');
  document.getElementById('conn23').className = 'step-connector' + (_paymentStage >= 3 ? ' filled' : '');
  document.getElementById('conn34').className = 'step-connector' + (_paymentStage >= 4 ? ' filled' : '');

  // Step statuses
  document.getElementById('step2Status').textContent = _paymentStage >= 2 ? '✅ Escrow Funded & Locked' : (_paymentStage === 1 ? '⏳ Awaiting Deposit' : 'Pending');
  document.getElementById('step2Status').className = 'step-status ' + (_paymentStage >= 2 ? 'done' : (_paymentStage === 1 ? 'in-progress' : 'waiting'));

  document.getElementById('step3Status').textContent = _paymentStage >= 3 ? '✅ Dispatched (In-Transit)' : (_paymentStage === 2 ? '⏳ Action Required: Dispatch' : 'Pending');
  document.getElementById('step3Status').className = 'step-status ' + (_paymentStage >= 3 ? 'done' : (_paymentStage === 2 ? 'in-progress' : 'waiting'));

  document.getElementById('step4Status').textContent = _paymentStage >= 4 ? '✅ Bank Settlement Complete' : (_paymentStage === 3 ? '⏳ Awaiting Inspection' : 'Pending');
  document.getElementById('step4Status').className = 'step-status ' + (_paymentStage >= 4 ? 'done' : (_paymentStage === 3 ? 'in-progress' : 'waiting'));

  // Step actions (role-based)
  const step2Action = document.getElementById('step2Action');
  const step3Action = document.getElementById('step3Action');
  const step4Action = document.getElementById('step4Action');

  step2Action.innerHTML = '';
  step3Action.innerHTML = '';
  step4Action.innerHTML = '';

  // Card visibilities
  const simCard = document.getElementById('paymentSimCard');
  const guaranteeBox = document.getElementById('farmerGuaranteeBox');
  const dispatchCard = document.getElementById('farmerDispatchCard');
  const challanCard = document.getElementById('farmerChallanCard');
  const bankCard = document.getElementById('farmerBankCard');
  const receiptCard = document.getElementById('receiptCard');

  if (isFarmer) {
    // ═══════════════════════════════════════════════════════
    // FARMER EXPERIENCE (CLEAR, NON-CONFUSING STEPS)
    // ═══════════════════════════════════════════════════════
    simCard.style.display = 'none'; // Farmer never pays
    guaranteeBox.style.display = 'flex';
    bankCard.style.display = 'block';

    if (_paymentStage === 1) {
      document.getElementById('farmerGuaranteeText').innerHTML =
        `Deal confirmed! Waiting for Trader (<strong>${_paymentOffer.traderName || 'Trader'}</strong>) to deposit ₹${total.toLocaleString('en-IN')} into KisanSetu Escrow. You will be notified the moment funds are secured.`;
      step2Action.innerHTML = `
        <div style="margin-top:0.4rem;">
          <button class="btn btn-outline btn-sm" onclick="advanceStage(2)">⚡ Simulate Trader Deposit (Demo)</button>
        </div>
      `;
      dispatchCard.style.display = 'none';
      challanCard.style.display = 'none';
    }

    if (_paymentStage === 2) {
      document.getElementById('farmerGuaranteeText').innerHTML =
        `✅ <strong>Payment is 100% Guaranteed!</strong> ₹${total.toLocaleString('en-IN')} is safely locked in KisanSetu's RBI-regulated Escrow. You can now dispatch your produce safely without any fear of non-payment.`;
      step3Action.innerHTML = `
        <span style="font-size:0.82rem; color:var(--primary); font-weight:700;">
          👇 Fill in vehicle details below to generate gate pass & dispatch
        </span>
      `;
      dispatchCard.style.display = 'block';
      challanCard.style.display = 'none';
      dispatchCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (_paymentStage === 3) {
      document.getElementById('farmerGuaranteeText').innerHTML =
        `🚚 <strong>Produce In-Transit!</strong> GPS route tracking is active. As soon as the trader inspects & confirms delivery at APMC, ₹${total.toLocaleString('en-IN')} will be released directly into your bank account.`;
      dispatchCard.style.display = 'none';
      challanCard.style.display = 'block';
      step4Action.innerHTML = `
        <div style="margin-top:0.4rem;">
          <button class="btn btn-success btn-sm" onclick="advanceStage(4)">✅ Simulate Delivery & Release Payout (Demo)</button>
        </div>
      `;
    }

    if (_paymentStage >= 4) {
      dispatchCard.style.display = 'none';
      challanCard.style.display = 'block';
      receiptCard.style.display = 'block';
      document.getElementById('payoutStatusText').textContent = `✅ ₹${total.toLocaleString('en-IN')} Credited (UTR-2026-KS-889210)`;
      document.getElementById('receiptTitle').textContent = `🎉 Payout Credited to Your Bank Account!`;
      document.getElementById('receiptSubtitle').textContent = `₹${total.toLocaleString('en-IN')} has been transferred to your SBI Account (UTR-2026-KS-889210)`;
      showReceipt();
    }

  } else {
    // ═══════════════════════════════════════════════════════
    // TRADER EXPERIENCE (UNCHANGED)
    // ═══════════════════════════════════════════════════════
    guaranteeBox.style.display = 'none';
    dispatchCard.style.display = 'none';
    challanCard.style.display = 'none';
    bankCard.style.display = 'none';

    if (_paymentStage === 1) {
      step2Action.innerHTML = `<button class="btn btn-primary btn-sm" onclick="showPaymentUI()">💳 Deposit ₹${total.toLocaleString('en-IN')} into Escrow</button>`;
      simCard.style.display = 'none';
    }

    if (_paymentStage === 2) {
      step3Action.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted);">Waiting for farmer to dispatch produce...</span>`;
    }

    if (_paymentStage === 3) {
      step4Action.innerHTML = `<button class="btn btn-success btn-sm" onclick="advanceStage(4)">✅ Confirm Delivery & Release ₹${total.toLocaleString('en-IN')}</button>`;
    }

    if (_paymentStage >= 4) {
      showReceipt();
    }
  }

  // Update badge
  const badge = document.getElementById('txnStatusBadge');
  if (_paymentStage >= 4) {
    badge.textContent = '🎉 Settlement Complete';
    badge.className = 'badge badge-success';
  } else if (_paymentStage >= 2) {
    badge.textContent = '🔒 Escrow Active';
    badge.className = 'badge badge-warning';
  } else {
    badge.textContent = '✅ Deal Confirmed';
    badge.className = 'badge badge-success';
  }
}

function showPaymentUI() {
  const total = (_paymentOffer.offerPrice || 0) * (_paymentOffer.quantity || 0);
  document.getElementById('paymentSimCard').style.display = 'block';
  document.getElementById('upiAmount').textContent = `₹${total.toLocaleString('en-IN')}`;
  document.getElementById('upiNote').textContent = `Escrow for ${_paymentOffer.cropName}`;
  document.getElementById('paymentSimCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function selectPaymentMethod(method) {
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  const upiMockup = document.getElementById('upiMockup');
  if (method === 'bank') {
    upiMockup.innerHTML = `
      <div class="upi-amount">${document.getElementById('upiAmount').textContent}</div>
      <div class="upi-id">A/C: 9876543210987654 (ICICI Bank)</div>
      <div class="upi-note">IFSC: ICIC0001234 — KisanSetu Escrow Account</div>
    `;
  } else {
    const total = (_paymentOffer.offerPrice || 0) * (_paymentOffer.quantity || 0);
    upiMockup.innerHTML = `
      <div class="upi-amount" id="upiAmount">₹${total.toLocaleString('en-IN')}</div>
      <div class="upi-id">kisansetu.escrow@icicipay</div>
      <div class="upi-note" id="upiNote">Escrow for ${_paymentOffer.cropName}</div>
    `;
  }
}

function simulatePayment() {
  const btn = document.getElementById('payNowBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Processing Payment...';

  setTimeout(() => {
    document.getElementById('paymentSimCard').style.display = 'none';

    // Show success animation
    const successEl = document.getElementById('paymentSuccess');
    successEl.style.display = 'block';
    document.getElementById('successTitle').textContent = 'Payment Secured! 🔒';
    document.getElementById('successSubtitle').textContent = 'Funds locked in RBI-compliant escrow vault';
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Advance to stage 2
    advanceStage(2);

    // Hide success after 3s
    setTimeout(() => {
      successEl.style.display = 'none';
    }, 3000);

    btn.disabled = false;
    btn.textContent = '🔒 Pay & Lock in Escrow';
  }, 2000);
}

function advanceStage(newStage) {
  _paymentStage = newStage;
  localStorage.setItem('kisansetu_escrow_' + _paymentOffer.id, newStage);

  // Persist to Firestore
  if (window.db && _paymentOffer.id !== 'demo_offer') {
    db.collection('offers').doc(_paymentOffer.id).update({ escrowStage: newStage }).catch(() => {});
  }

  if (newStage === 2) {
    App.showNotification('Escrow Funded! 🔒', 'Funds secured. Waiting for farmer to dispatch.', 'success');
  } else if (newStage === 3) {
    App.showNotification('Produce Dispatched! 🚚', 'GPS tracking activated. Buyer will confirm delivery.', 'info');

    const successEl = document.getElementById('paymentSuccess');
    successEl.style.display = 'block';
    document.getElementById('successTitle').textContent = 'Dispatched! 🚚';
    document.getElementById('successSubtitle').textContent = 'Produce on the way. Tracking activated.';
    setTimeout(() => { successEl.style.display = 'none'; }, 3000);
  } else if (newStage === 4) {
    App.showNotification('Settlement Complete! 🎉', 'Funds released to farmer\'s bank account.', 'success');

    const successEl = document.getElementById('paymentSuccess');
    successEl.style.display = 'block';
    document.getElementById('successTitle').textContent = 'Settlement Complete! 🎉';
    document.getElementById('successSubtitle').textContent = 'Funds transferred to farmer\'s account.';
  }

  updateStepper();
}

function showReceipt() {
  const total = (_paymentOffer.offerPrice || 0) * (_paymentOffer.quantity || 0);
  const escrowId = `KS-ESC-${(_paymentOffer.id || 'X').slice(0, 8).toUpperCase()}`;
  const receiptCard = document.getElementById('receiptCard');
  receiptCard.style.display = 'block';

  document.getElementById('receiptGrid').innerHTML = `
    <div class="receipt-row">
      <span class="receipt-label">Transaction ID</span>
      <span class="receipt-value" style="font-family:monospace;">${escrowId}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Crop</span>
      <span class="receipt-value">${_paymentOffer.cropName}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Quantity</span>
      <span class="receipt-value">${(_paymentOffer.quantity || 0).toLocaleString()} kg</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Rate</span>
      <span class="receipt-value">₹${_paymentOffer.offerPrice}/kg</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Total Paid</span>
      <span class="receipt-value" style="color:#2D6A4F; font-size:1rem;">₹${total.toLocaleString('en-IN')}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Farmer</span>
      <span class="receipt-value">${_paymentOffer.farmerName || '—'}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Trader</span>
      <span class="receipt-value">${_paymentOffer.traderName || '—'}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Date</span>
      <span class="receipt-value">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Status</span>
      <span class="receipt-value" style="color:#2D6A4F;">✅ Settlement Complete</span>
    </div>
  `;

  document.getElementById('backButtons').style.display = 'none';
}

function downloadReceipt() {
  const total = (_paymentOffer.offerPrice || 0) * (_paymentOffer.quantity || 0);
  const escrowId = `KS-ESC-${(_paymentOffer.id || 'X').slice(0, 8).toUpperCase()}`;

  const receipt = `
═══════════════════════════════════════
       KisanSetu — Payment Receipt
═══════════════════════════════════════

Transaction ID:  ${escrowId}
Date:            ${new Date().toLocaleDateString('en-IN')}
Status:          ✅ Settlement Complete

───────────────────────────────────────
Crop:            ${_paymentOffer.cropName}
Quantity:        ${(_paymentOffer.quantity || 0).toLocaleString()} kg
Rate:            ₹${_paymentOffer.offerPrice}/kg
Total Amount:    ₹${total.toLocaleString('en-IN')}
───────────────────────────────────────

Farmer (Seller): ${_paymentOffer.farmerName || '—'}
Trader (Buyer):  ${_paymentOffer.traderName || '—'}

═══════════════════════════════════════
Powered by KisanSetu — Escrow Protected
  `.trim();

  const blob = new Blob([receipt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KisanSetu_Receipt_${escrowId}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  App.showNotification('Receipt Downloaded 📄', 'Transaction receipt saved', 'success');
}

// ── Farmer Dispatch Handler & e-Way Challan ─────────────────
function handleFarmerDispatch(e) {
  if (e) e.preventDefault();

  const vehicle = document.getElementById('dispatchVehicle')?.value.trim() || 'MH-15-EG-4421';
  const driverName = document.getElementById('dispatchDriverName')?.value.trim() || 'Santosh Shinde';
  const driverPhone = document.getElementById('dispatchDriverPhone')?.value.trim() || '+91 98220 12345';
  const origin = document.getElementById('dispatchOrigin')?.value.trim() || 'Pimpalgaon Farm, Nashik';

  // Populate challan preview
  const challanDocNo = 'KS-EWAY-' + Math.floor(10000 + Math.random() * 90000);
  const docNoEl = document.getElementById('challanDocNo');
  if (docNoEl) docNoEl.textContent = challanDocNo;

  const cropEl = document.getElementById('challanCrop');
  if (cropEl && _paymentOffer) {
    cropEl.textContent = `${_paymentOffer.cropName} — ${(_paymentOffer.quantity || 0).toLocaleString()} kg`;
  }
  const buyerEl = document.getElementById('challanBuyer');
  if (buyerEl && _paymentOffer) {
    buyerEl.textContent = `${_paymentOffer.traderName || 'Trader'} (APMC Mandi)`;
  }
  const vehEl = document.getElementById('challanVehicle');
  if (vehEl) vehEl.textContent = `${vehicle} (Mini Truck)`;
  const driverEl = document.getElementById('challanDriver');
  if (driverEl) driverEl.textContent = `${driverName} · ${driverPhone}`;

  // Save dispatch state
  if (_paymentOffer && _paymentOffer.id) {
    localStorage.setItem('kisansetu_dispatch_' + _paymentOffer.id, JSON.stringify({
      vehicle, driverName, driverPhone, origin, challanDocNo, dispatchedAt: new Date().toISOString()
    }));
  }

  App.showNotification('Dispatched! 🚚', `Gate pass ${challanDocNo} generated. GPS tracking is live!`, 'success');

  // Advance to stage 3
  advanceStage(3);
  return false;
}

function printChallan() {
  window.print();
}
