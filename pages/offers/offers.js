// Offers & Negotiation Page Logic — Firebase Firestore real-time

let currentFilter = 'all';
let _allOffers = [];
let _unsubscribeOffers = null;

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (!user) { App.navigateTo('login'); return; }
    initOffersPage(user);
  });

  window.addEventListener('languageChanged', () => {
    renderOffers();
    const userType = App.getUserType();
    document.getElementById('topNav').innerHTML = `
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      ${renderTopNav(userType)}
    `;
    App.initNavigation();
    App.translatePage();
  });
});

function initOffersPage(user) {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('offers', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('offers', userType);
  App.initNavigation();
  App.translatePage();

  // Real-time Firestore listener for offers — sole source of truth for authenticated users
  if (_unsubscribeOffers) _unsubscribeOffers();
  _unsubscribeOffers = BackendService.listenToOffers(user.uid, userType, (offers) => {
    // Use only Firestore offers — no merging with demo/localStorage data
    _allOffers = offers.filter(o => o && o.id);

    _allOffers.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.date ? new Date(a.date).getTime() : 0));
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.date ? new Date(b.date).getTime() : 0));
      return tB - tA;
    });

    // Cache real offers for sidebar badge
    localStorage.setItem('kisansetu_real_offers', JSON.stringify(_allOffers));

    const badge = document.querySelector('.sidebar-link[data-page="offers"] .link-badge');
    const pendingCount = _allOffers.filter(o => o.status === 'pending' || (userType === 'trader' && o.status === 'countered')).length;
    if (badge) {
      if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
    renderOffers();
  });
}

function filterOffers(status, btn) {
  currentFilter = status;
  document.querySelectorAll('#offerTabs .tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOffers();
}

function renderOffers() {
  const _t = window.t || ((k) => k);
  const userType = App.getUserType();
  let offers = currentFilter === 'all'
    ? _allOffers
    : _allOffers.filter(o => o.status === currentFilter);

  const container = document.getElementById('offersList');

  if (!offers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>${_t('offers.noOffers')}</h3>
        <p>${_t('offers.browseTraders')}</p>
        <a href="../traders/traders.html" class="btn btn-primary btn-sm">${_t('offers.browseTraders')}</a>
      </div>
    `;
    return;
  }

  container.innerHTML = offers.map(offer => {
    const statusBadge = {
      pending:  `<span class="badge badge-warning">${_t('offers.pending')}</span>`,
      accepted: `<span class="badge badge-success">${_t('offers.accepted')}</span>`,
      rejected: `<span class="badge badge-danger">${_t('offers.rejected')}</span>`,
      countered:`<span class="badge badge-info">${_t('offers.countered')}</span>`
    };

    const messages = (offer.messages || []).map(msg => `
      <div class="message-bubble ${msg.from}">
        <div class="message-text">${msg.text}</div>
        <div class="message-time">${msg.time || ''}</div>
      </div>
    `).join('');

    const canAct = offer.status === 'pending' || offer.status === 'countered';
    const offerId = offer.id;

    // Determine the other party's phone for WhatsApp/Call
    // Farmer sees trader's phone, Trader sees farmer's phone
    const contactPhone = userType === 'trader' ? (offer.farmerPhone || '') : (offer.traderPhone || '');
    const contactName = userType === 'trader' ? (offer.farmerName || 'Farmer') : (offer.traderName || 'Trader');
    const hasPhone = contactPhone && contactPhone.length >= 10;

    // Format phone for WhatsApp (ensure country code)
    const waPhone = contactPhone.startsWith('+') ? contactPhone.replace(/[^0-9]/g, '') : '91' + contactPhone.replace(/[^0-9]/g, '');
    const waMessage = encodeURIComponent(`Hi ${contactName}, regarding ${offer.cropName} offer on KisanSetu — ₹${offer.offerPrice}/kg for ${offer.quantity} kg.`);

    const contactButtons = `
      <div class="offer-contact-row">
        ${hasPhone ? `
          <a href="https://wa.me/${waPhone}?text=${waMessage}" target="_blank" rel="noopener" class="btn btn-contact btn-whatsapp" title="WhatsApp ${contactName}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a href="tel:${contactPhone}" class="btn btn-contact btn-call" title="Call ${contactName}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
            Call
          </a>
        ` : `
          <button class="btn btn-contact btn-fetch-phone" onclick="fetchContactPhone('${offerId}')" title="Load contact info">
            📱 Get Contact
          </button>
        `}
      </div>
    `;

    return `
      <div class="offer-card ${offer.status} animate-fade">
        <div class="offer-header">
          <div>
            <h4 style="font-size:1.05rem;">${offer.cropName}</h4>
            <span class="text-sm text-secondary">${offer.traderName} · ${offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleDateString('en-IN') : offer.date || ''}</span>
          </div>
          ${statusBadge[offer.status] || ''}
        </div>

        <div class="offer-prices">
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.traderOffer')}</span>
            <span class="offer-price-value text-primary">${App.formatPrice(offer.offerPrice)}/kg</span>
          </div>
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.quantity')}</span>
            <span class="offer-price-value">${(offer.quantity||0).toLocaleString()} kg</span>
          </div>
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.totalValue')}</span>
            <span class="offer-price-value" style="color:var(--success);">${App.formatPrice((offer.offerPrice||0) * (offer.quantity||0))}</span>
          </div>
          ${offer.farmerCounterPrice ? `
          <div class="offer-price-item">
            <span class="offer-price-label">${_t('offers.yourCounter')}</span>
            <span class="offer-price-value" style="color:var(--accent-dark);">${App.formatPrice(offer.farmerCounterPrice)}/kg</span>
          </div>` : ''}
        </div>

        ${contactButtons}

        ${messages ? `<div class="offer-conversation">${messages}</div>` : ''}

        ${offer.status === 'accepted' ? renderEscrowAndLogistics(offer, userType) : ''}

        ${canAct ? `
        <div class="counter-offer-input" style="margin-top:1rem;">
          <input type="number" id="counter_${offerId}" class="form-control" placeholder="${_t('offers.counterPlaceholder')}" step="0.5" min="1">
        </div>
        <div class="offer-actions-row">
          <button class="btn btn-success btn-sm" onclick="acceptOffer('${offerId}')">✅ ${_t('offers.accept')}</button>
          <button class="btn btn-accent btn-sm"  onclick="counterOffer('${offerId}')">💬 ${_t('offers.counter')}</button>
          <button class="btn btn-danger btn-sm"  onclick="rejectOffer('${offerId}')">❌ ${_t('offers.reject')}</button>
        </div>` : ''}
      </div>
    `;
  }).join('');
}

// Fetch contact phone for older offers that don't have phone stored
async function fetchContactPhone(offerId) {
  const userType = App.getUserType();
  const offer = _allOffers.find(o => o.id === offerId);
  if (!offer) return;

  const contactUid = userType === 'trader' ? offer.farmerId : offer.traderId;
  if (!contactUid) {
    App.showNotification('No Contact', 'Contact info unavailable for this offer.', 'warning');
    return;
  }

  try {
    const profile = await BackendService.getUserProfile(contactUid);
    if (!profile || !profile.phone) {
      App.showNotification('No Phone', 'This user has not added a phone number.', 'warning');
      return;
    }
    // Update the offer locally with the fetched phone
    if (userType === 'trader') {
      offer.farmerPhone = profile.phone;
    } else {
      offer.traderPhone = profile.phone;
    }
    // Also update it in Firestore for future use
    const updateField = userType === 'trader' ? 'farmerPhone' : 'traderPhone';
    db.collection('offers').doc(offerId).update({ [updateField]: profile.phone }).catch(() => {});
    renderOffers();
  } catch (err) {
    App.showNotification('Error', 'Could not load contact info.', 'error');
  }
}

async function acceptOffer(offerId) {
  const offer = _allOffers.find(o => o.id === offerId);
  if (!offer) return;
  try {
    offer.status = 'accepted';
    offer.messages = offer.messages || [];
    offer.messages.push({
      from: 'farmer',
      text: `Offer accepted at ₹${offer.offerPrice}/kg`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderOffers();

    await BackendService.acceptOffer(offerId, offer);
    App.showNotification('Deal Accepted! 🎉', `${offer.cropName} deal confirmed!`, 'success');
  } catch (err) {
    console.error('acceptOffer error:', err);
    App.showNotification('Error', 'Failed to accept offer. Try again.', 'error');
  }
}

async function rejectOffer(offerId) {
  const offer = _allOffers.find(o => o.id === offerId);
  if (!offer) return;
  try {
    offer.status = 'rejected';
    offer.messages = offer.messages || [];
    offer.messages.push({
      from: 'farmer',
      text: 'Offer rejected',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderOffers();

    await BackendService.rejectOffer(offerId, offer);
    App.showNotification('Offer Rejected', `${offer.cropName} offer rejected`, 'warning');
  } catch (err) {
    console.error('rejectOffer error:', err);
    App.showNotification('Error', 'Failed to reject offer. Try again.', 'error');
  }
}

async function counterOffer(offerId) {
  const input = document.getElementById('counter_' + offerId);
  const price = parseFloat(input?.value);
  if (!price || price <= 0) {
    App.showNotification('Enter Price', 'Please enter a valid counter price', 'warning');
    return;
  }
  const offer = _allOffers.find(o => o.id === offerId);
  if (!offer) return;
  try {
    offer.status = 'countered';
    offer.farmerCounterPrice = price;
    offer.messages = offer.messages || [];
    offer.messages.push({
      from: 'farmer',
      text: `Counter offer: ₹${price}/kg`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderOffers();

    await BackendService.counterOffer(offerId, price, offer);
    App.showNotification('Counter Sent 💬', `Counter price of ${App.formatPrice(price)}/kg sent`, 'info');
  } catch (err) {
    console.error('counterOffer error:', err);
    App.showNotification('Error', 'Failed to send counter. Try again.', 'error');
  }
}

// ═════════════════════════════════════════════════════════
// ESCROW PAYMENT TIMELINE & LOGISTICS TRACKING UI
// ═════════════════════════════════════════════════════════

function getEscrowStage(offerId) {
  try {
    const saved = localStorage.getItem('kisansetu_escrow_' + offerId);
    return saved ? parseInt(saved, 10) : 1;
  } catch (e) {
    return 1;
  }
}

async function updateEscrowStage(offerId, newStage) {
  try {
    localStorage.setItem('kisansetu_escrow_' + offerId, newStage);
    const offer = _allOffers.find(o => o.id === offerId);
    if (offer) {
      offer.escrowStage = newStage;
      if (window.db) {
        db.collection('offers').doc(offerId).update({ escrowStage: newStage }).catch(() => {});
      }
      // Update blockchain traceability event if available
      if (window.BlockchainTracker && offer.cropId) {
        const eventType = newStage === 2 ? 'dispatched' : (newStage === 3 ? 'delivered' : 'offer_accepted');
        await BlockchainTracker.updateChainEvent(offer.cropId, eventType, {
          offerId: offer.id,
          amount: (offer.offerPrice || 0) * (offer.quantity || 0),
          stage: newStage,
          timestamp: Date.now()
        });
      }
    }

    if (newStage === 2) {
      App.showNotification('Produce Dispatched! 🚚', 'Logistics GPS tracking has been activated.', 'info');
    } else if (newStage === 3) {
      App.showNotification('Escrow Released! 💸', 'Delivery verified. Funds transferred to farmer account.', 'success');
    } else {
      App.showNotification('Escrow Reset', 'Reset to Stage 1 for testing.', 'info');
    }

    renderOffers();
  } catch (err) {
    console.error('updateEscrowStage error:', err);
  }
}

function renderEscrowAndLogistics(offer, userType) {
  const stage = getEscrowStage(offer.id);
  const totalAmount = (offer.offerPrice || 0) * (offer.quantity || 0);
  const escrowId = `KS-ESC-${(offer.id || '99').slice(0, 8).toUpperCase()}`;

  // Calculate logistics using AIEngine
  let logisticsData = {
    vehicle: 'Mini Truck (Tata Ace)',
    distanceKm: 45,
    estimatedCost: 850,
    costPerKg: 0.85,
    fuelCost: 450,
    labourCost: 300
  };

  if (window.AIEngine && typeof AIEngine.estimateTransportCost === 'function') {
    try {
      const calc = AIEngine.estimateTransportCost({
        distanceKm: 48,
        quantityKg: offer.quantity || 1000,
        cropType: offer.cropName || 'onion'
      });
      if (calc) {
        logisticsData = {
          vehicle: calc.vehicle || logisticsData.vehicle,
          distanceKm: calc.distanceKm || 48,
          estimatedCost: calc.totalEstimatedCost || 950,
          costPerKg: calc.costPerKg || 0.95,
          fuelCost: calc.breakdown?.fuel || 480,
          labourCost: calc.breakdown?.labour || 300
        };
      }
    } catch (e) {
      console.warn('AIEngine estimateTransportCost fallback', e);
    }
  }

  // Stepper classes
  const step1Class = 'completed';
  const step2Class = stage >= 2 ? (stage > 2 ? 'completed' : 'active') : 'pending';
  const step3Class = stage === 3 ? 'completed' : 'pending';

  // Route progress percentage
  const progressPct = stage === 1 ? 25 : (stage === 2 ? 65 : 100);
  const statusLabel = stage === 1 ? 'Awaiting Dispatch' : (stage === 2 ? 'In Transit (On Highway)' : 'Delivered & Verified');
  const etaLabel = stage === 1 ? 'Scheduled: Today' : (stage === 2 ? 'ETA: 2 hrs 15 mins' : 'Completed');

  return `
    <div class="escrow-container">
      <div class="escrow-header">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="escrow-badge">🛡️ Escrow Smart Contract</span>
          <span class="escrow-id">${escrowId}</span>
        </div>
        <div style="font-size:0.85rem; font-weight:700; color:var(--primary);">
          Secured Vault: ${App.formatPrice(totalAmount)}
        </div>
      </div>

      <!-- 3-Step Escrow Timeline -->
      <div class="escrow-steps">
        <div class="escrow-step ${step1Class}">
          <div class="escrow-step-icon">🔒</div>
          <div class="escrow-step-title">1. Funds Locked</div>
          <div class="escrow-step-desc">Buyer deposited ${App.formatPrice(totalAmount)} into RBI-compliant escrow vault</div>
          <div class="escrow-step-status">✅ Escrow Funded</div>
        </div>

        <div class="escrow-step ${step2Class}">
          <div class="escrow-step-icon">🚚</div>
          <div class="escrow-step-title">2. In-Transit</div>
          <div class="escrow-step-desc">Produce dispatched with GPS route tracking and condition monitoring</div>
          <div class="escrow-step-status">
            ${stage >= 2 ? (stage > 2 ? '✅ Transit Complete' : '⏳ In Progress') : '⏸ Pending Dispatch'}
          </div>
        </div>

        <div class="escrow-step ${step3Class}">
          <div class="escrow-step-icon">💸</div>
          <div class="escrow-step-title">3. Payout Released</div>
          <div class="escrow-step-desc">Quality verified via QR code inspection; payment auto-released to farmer</div>
          <div class="escrow-step-status">
            ${stage === 3 ? '✅ Payout Released' : '⏸ Locked Until Inspection'}
          </div>
        </div>
      </div>

      <!-- Action buttons for advancing escrow simulation -->
      <div class="escrow-actions">
        ${stage === 1 ? `
          <button class="btn btn-primary btn-sm" onclick="updateEscrowStage('${offer.id}', 2)">
            🚚 Dispatch Produce (Start Tracking)
          </button>
        ` : ''}

        ${stage === 2 ? `
          <button class="btn btn-success btn-sm" onclick="updateEscrowStage('${offer.id}', 3)">
            ✅ Verify Delivery & Release Payment (${App.formatPrice(totalAmount)})
          </button>
        ` : ''}

        ${stage === 3 ? `
          <span style="font-size:0.85rem; color:#2D6A4F; font-weight:700; display:inline-flex; align-items:center; gap:0.3rem;">
            🎉 Settlement Complete · Transaction Hash Verified
          </span>
          <button class="btn btn-outline btn-sm" onclick="updateEscrowStage('${offer.id}', 1)" style="margin-left:auto;">
            🔄 Reset Demo Flow
          </button>
        ` : ''}
      </div>

      <!-- Logistics GPS Tracking Simulator -->
      <div class="logistics-card">
        <div class="logistics-header">
          <div class="logistics-title">
            <span class="live-pulse"></span>
            <span>Live Logistics GPS Simulator</span>
          </div>
          <span class="badge ${stage === 2 ? 'badge-warning' : (stage === 3 ? 'badge-success' : 'badge-info')}">
            ${statusLabel}
          </span>
        </div>

        <!-- Route visualizer -->
        <div class="route-progress-wrap">
          <div class="route-bar-bg">
            <div class="route-bar-fill" style="width: ${progressPct}%;"></div>
          </div>
          <div class="route-points">
            <div class="route-point">
              <span class="route-point-name">📍 Farm (Origin)</span>
              <span class="route-point-meta">${offer.location || 'Nashik District'}</span>
            </div>
            <div class="route-point" style="text-align:center;">
              <span class="route-point-name">🚚 ${stage === 2 ? 'En Route (NH 3)' : 'Checkpoint'}</span>
              <span class="route-point-meta">${etaLabel}</span>
            </div>
            <div class="route-point end">
              <span class="route-point-name">🏁 APMC Hub / Mandi</span>
              <span class="route-point-meta">${offer.traderLocation || 'Vashi Mandi Hub'}</span>
            </div>
          </div>
        </div>

        <!-- AI Logistics Details -->
        <div class="logistics-meta-grid">
          <div class="logistics-meta-item">
            <div class="logistics-meta-label">Transport Vehicle</div>
            <div class="logistics-meta-val">${logisticsData.vehicle}</div>
          </div>
          <div class="logistics-meta-item">
            <div class="logistics-meta-label">Distance & ETA</div>
            <div class="logistics-meta-val">${logisticsData.distanceKm} km · ${etaLabel}</div>
          </div>
          <div class="logistics-meta-item">
            <div class="logistics-meta-label">AI Transport Cost</div>
            <div class="logistics-meta-val">₹${logisticsData.estimatedCost.toLocaleString()} (₹${logisticsData.costPerKg}/kg)</div>
          </div>
          <div class="logistics-meta-item">
            <div class="logistics-meta-label">Driver Contact</div>
            <div class="logistics-meta-val">Ramesh S. (+91 98231 44120)</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

