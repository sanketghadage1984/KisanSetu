/* ═══════════════════════════════════════════════════════════════
   KisanSetu — Firebase Backend Service
   firebase-backend.js

   Central service layer for all Firebase Auth + Firestore operations.
   Replace all localStorage-based auth/data calls with these methods.
   ═══════════════════════════════════════════════════════════════ */

const BackendService = {

  // ─────────────────────────────────────────────────────────────
  // AUTH — Registration
  // ─────────────────────────────────────────────────────────────

  /**
   * Register a new user with Email + Password
   * Creates Firebase Auth account + Firestore user profile document
   */
  async registerUser({ name, email, phone, location, password, userType }) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    await cred.user.updateProfile({ displayName: name });

    const resolvedType = userType || 'farmer';
    const avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const userDoc = {
      uid,
      name,
      email,
      phone: phone || '',
      location: location || '',
      userType: resolvedType,
      avatar,
      joined: firebase.firestore.FieldValue.serverTimestamp(),
      photoUrl: ''
    };

    await db.collection('users').doc(uid).set(userDoc);

    // Sync to localStorage so App.getUser() works immediately
    const profileKey = resolvedType === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
    localStorage.setItem(profileKey, JSON.stringify({ uid, name, email, phone: phone||'', location: location||'', type: resolvedType, avatar, joined: new Date().toISOString().split('T')[0] }));
    localStorage.setItem('kisansetu_userType', resolvedType);
    localStorage.setItem('kisansetu_loggedIn', 'true');

    // Auto-seed demo data for new user
    await this.seedDemoData(uid, resolvedType).catch(e => console.warn('Seed on register warning:', e));
    return userDoc;
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Login with Email + Password
  // ─────────────────────────────────────────────────────────────

  async loginUser(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const profile = await this.getUserProfile(cred.user.uid);
    if (profile) {
      const resolvedType = profile.userType || 'farmer';
      // Sync profile to localStorage so App.getUser() and navbar work immediately
      const profileKey = resolvedType === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
      const localProfile = {
        uid: profile.uid || cred.user.uid,
        name: profile.name || cred.user.displayName || 'User',
        email: profile.email || email,
        phone: profile.phone || '',
        location: profile.location || '',
        type: resolvedType,
        avatar: profile.avatar || (profile.name || 'U').charAt(0).toUpperCase()
      };
      localStorage.setItem(profileKey, JSON.stringify(localProfile));
      localStorage.setItem('kisansetu_userType', resolvedType);
      localStorage.setItem('kisansetu_loggedIn', 'true');
    }

    // Auto-seed demo data if user account is empty
    const uid = cred.user.uid;
    const resolvedType = profile ? (profile.userType || 'farmer') : 'farmer';
    await this.seedDemoData(uid, resolvedType).catch(e => console.warn('Seed on login warning:', e));
    return profile;
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Login with Google Sign-In (popup)
  // ─────────────────────────────────────────────────────────────

  async loginWithGoogle(userType) {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const cred = await auth.signInWithPopup(provider);
    const uid = cred.user.uid;

    // Check if user already has a Firestore profile
    const snap = await db.collection('users').doc(uid).get();
    let profile = null;

    if (!snap.exists) {
      // New Google user → create Firestore profile
      const name = cred.user.displayName || 'User';
      const resolvedType = userType || 'farmer';
      const avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const userDoc = {
        uid,
        name,
        email: cred.user.email || '',
        phone: cred.user.phoneNumber || '',
        location: '',
        userType: resolvedType,
        avatar,
        joined: firebase.firestore.FieldValue.serverTimestamp(),
        photoUrl: cred.user.photoURL || ''
      };
      await db.collection('users').doc(uid).set(userDoc);
      profile = userDoc;
      const profileKey = resolvedType === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
      localStorage.setItem(profileKey, JSON.stringify({ uid, name, email: cred.user.email||'', phone: '', location: '', type: resolvedType, avatar }));
      localStorage.setItem('kisansetu_userType', resolvedType);
    } else {
      profile = snap.data();
      const resolvedType = profile.userType || 'farmer';
      const profileKey = resolvedType === 'trader' ? 'kisansetu_trader' : 'kisansetu_farmer';
      const localProfile = {
        uid: profile.uid || uid,
        name: profile.name || cred.user.displayName || 'User',
        email: profile.email || cred.user.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        type: resolvedType,
        avatar: profile.avatar || (profile.name || 'U').charAt(0).toUpperCase()
      };
      localStorage.setItem(profileKey, JSON.stringify(localProfile));
      localStorage.setItem('kisansetu_userType', resolvedType);
    }

    localStorage.setItem('kisansetu_loggedIn', 'true');
    await this.seedDemoData(uid, profile ? profile.userType : userType).catch(e => console.warn('Seed on Google login warning:', e));
    return profile;
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Phone OTP
  // ─────────────────────────────────────────────────────────────

  /**
   * Step 1: Send OTP to phone number
   * @param {string} phoneNumber - format: "+919876543210"
   * @param {string} recaptchaContainerId - ID of div element for reCAPTCHA
   */
  async sendPhoneOTP(phoneNumber, recaptchaContainerId) {
    // Clear any previous reCAPTCHA instance to avoid duplicate widget errors
    if (window._kisanRecaptchaVerifier) {
      try { window._kisanRecaptchaVerifier.clear(); } catch(e) {}
      window._kisanRecaptchaVerifier = null;
    }
    const recaptchaVerifier = new firebase.auth.RecaptchaVerifier(recaptchaContainerId, {
      size: 'invisible',
      callback: () => {}
    });
    window._kisanRecaptchaVerifier = recaptchaVerifier;
    const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
    // Store temporarily for step 2
    window._kisanPhoneConfirmation = confirmationResult;
    return confirmationResult;
  },

  /**
   * Step 2: Verify OTP code entered by user
   * @param {string} code - 6-digit OTP code
   * @param {string} userType - 'farmer' or 'trader'
   */
  async verifyPhoneOTP(code, userType) {
    if (!window._kisanPhoneConfirmation) throw new Error('No OTP session. Please request OTP first.');
    const cred = await window._kisanPhoneConfirmation.confirm(code);
    const uid = cred.user.uid;

    // Check if profile exists, create if not
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      const userDoc = {
        uid,
        name: cred.user.displayName || 'Farmer',
        email: cred.user.email || '',
        phone: cred.user.phoneNumber || '',
        location: '',
        userType: userType || 'farmer',
        avatar: 'KS',
        joined: firebase.firestore.FieldValue.serverTimestamp(),
        photoUrl: ''
      };
      await db.collection('users').doc(uid).set(userDoc);
    }

    localStorage.setItem('kisansetu_userType', userType || snap.data()?.userType || 'farmer');
    localStorage.setItem('kisansetu_loggedIn', 'true');
    await this.seedDemoData(uid, userType || snap.data()?.userType || 'farmer').catch(e => console.warn('Seed on OTP warning:', e));
    window._kisanPhoneConfirmation = null;
    return snap.exists ? snap.data() : null;
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Logout
  // ─────────────────────────────────────────────────────────────

  async logoutUser() {
    await auth.signOut();
    // Clear all auth-related localStorage keys
    localStorage.setItem('kisansetu_loggedIn', 'false');
    localStorage.removeItem('kisansetu_userType');
    localStorage.removeItem('kisansetu_farmer');
    localStorage.removeItem('kisansetu_trader');
    localStorage.removeItem('kisansetu_initialized');
    window._kisanPhoneConfirmation = null;
    if (window._kisanRecaptchaVerifier) {
      try { window._kisanRecaptchaVerifier.clear(); } catch(e) {}
      window._kisanRecaptchaVerifier = null;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Password Reset
  // ─────────────────────────────────────────────────────────────

  async sendPasswordReset(email) {
    if (!email) throw new Error('Email is required');
    await auth.sendPasswordResetEmail(email);
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Watch auth state changes (call once on app init)
  // ─────────────────────────────────────────────────────────────

  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await this.getUserProfile(firebaseUser.uid);
        localStorage.setItem('kisansetu_loggedIn', 'true');
        if (profile) localStorage.setItem('kisansetu_userType', profile.userType || 'farmer');
        callback(firebaseUser, profile);
      } else {
        localStorage.setItem('kisansetu_loggedIn', 'false');
        callback(null, null);
      }
    });
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  // ─────────────────────────────────────────────────────────────
  // USER PROFILES — Firestore /users/{uid}
  // ─────────────────────────────────────────────────────────────

  async getUserProfile(uid) {
    if (!uid) return null;
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async updateUserProfile(uid, data) {
    await db.collection('users').doc(uid).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  // ─────────────────────────────────────────────────────────────
  // CROPS — Firestore /crops
  // ─────────────────────────────────────────────────────────────

  /**
   * Add a new crop listing with optional image upload to Cloudinary
   */
  async addCrop(cropData, imageFile) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Upload image to Cloudinary first (if provided)
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImageToCloudinary(imageFile);
    }

    const doc = {
      ...cropData,
      imageUrl,
      farmerId: user.uid,
      farmerName: user.displayName || cropData.farmerName || 'Farmer',
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection('crops').add(doc);
    return { id: ref.id, ...doc };
  },

  /**
   * Get crops from Firestore, optionally filtered by farmerId
   * Returns an array of crop objects
   */
  /**
   * Get crops from Firestore, optionally filtered by farmerId
   * Returns an array of crop objects
   */
  async getCrops(filters = {}) {
    try {
      let query = db.collection('crops');

      if (filters.farmerId) {
        query = query.where('farmerId', '==', filters.farmerId);
      }
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      const snap = await query.limit(filters.limit || 50).get();
      const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      crops.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });
      return crops;
    } catch (err) {
      console.warn('getCrops error:', err);
      return App.getCrops() || [];
    }
  },

  /**
   * Real-time listener for a farmer's crops
   * Calls callback(crops[]) whenever data changes
   */
  listenToCrops(farmerId, callback) {
    return db.collection('crops')
      .where('farmerId', '==', farmerId)
      .onSnapshot(snap => {
        const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        crops.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return tB - tA;
        });
        callback(crops);
      }, err => {
        console.warn('listenToCrops snapshot error:', err);
        callback(App.getCrops() || []);
      });
  },

  /**
   * Real-time listener for ALL active crops (for trader discovery)
   */
  listenToAllCrops(callback, filters = {}) {
    let query = db.collection('crops').where('status', '==', 'active');
    if (filters.cropName) query = query.where('name', '==', filters.cropName);
    return query.limit(50).onSnapshot(snap => {
      const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      crops.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return tB - tA;
      });
      callback(crops);
    }, err => {
      console.warn('listenToAllCrops error:', err);
      callback([]);
    });
  },

  async updateCropStatus(cropId, status) {
    await db.collection('crops').doc(cropId).set({ status }, { merge: true });
  },

  // ─────────────────────────────────────────────────────────────
  // OFFERS — Firestore /offers
  // ─────────────────────────────────────────────────────────────

  /**
   * Trader submits a new offer for a crop listing
   */
  async sendOffer(offerData) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const traderProfile = await this.getUserProfile(user.uid);
    // Fetch farmer's phone for contact buttons
    let farmerPhone = '';
    if (offerData.farmerId) {
      const farmerProfile = await this.getUserProfile(offerData.farmerId).catch(() => null);
      farmerPhone = farmerProfile?.phone || '';
    }

    const doc = {
      ...offerData,
      traderId: user.uid,
      traderName: traderProfile?.name || user.displayName || 'Trader',
      traderPhone: traderProfile?.phone || '',
      farmerPhone: farmerPhone,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      messages: [
        {
          from: 'trader',
          text: offerData.message || `Offering ₹${offerData.offerPrice}/kg for ${offerData.quantity} kg.`,
          time: new Date().toLocaleString()
        }
      ]
    };
    const ref = await db.collection('offers').add(doc);
    return { id: ref.id, ...doc };
  },

  /**
   * Get offers — for a farmer (their crops' offers) or a trader (their sent offers)
   */
  async getOffers(uid, userType) {
    try {
      const field = userType === 'trader' ? 'traderId' : 'farmerId';
      const snap = await db.collection('offers')
        .where(field, '==', uid)
        .get();
      const offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      offers.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.date ? new Date(a.date).getTime() : 0));
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.date ? new Date(b.date).getTime() : 0));
        return tB - tA;
      });
      return offers;
    } catch (err) {
      console.warn('getOffers error:', err);
      return App.getOffers() || [];
    }
  },

  /**
   * Real-time listener for offers (farmer or trader perspective)
   */
  listenToOffers(uid, userType, callback) {
    const field = userType === 'trader' ? 'traderId' : 'farmerId';
    return db.collection('offers')
      .where(field, '==', uid)
      .onSnapshot(snap => {
        const offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        offers.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.date ? new Date(a.date).getTime() : 0));
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.date ? new Date(b.date).getTime() : 0));
          return tB - tA;
        });
        callback(offers);
      }, err => {
        console.warn('listenToOffers error (falling back to local):', err);
        callback(App.getOffers() || []);
      });
  },

  async acceptOffer(offerId, offerData) {
    const batch = db.batch();

    // Update offer status safely with merge
    const offerRef = db.collection('offers').doc(offerId);
    batch.set(offerRef, {
      ...offerData,
      status: 'accepted',
      messages: firebase.firestore.FieldValue.arrayUnion({
        from: 'farmer',
        text: `Offer accepted at ₹${offerData.offerPrice}/kg`,
        time: new Date().toLocaleString()
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Update crop status to 'sold'
    if (offerData.cropId) {
      const cropRef = db.collection('crops').doc(offerData.cropId);
      batch.set(cropRef, { status: 'sold' }, { merge: true });
    }

    // Create transaction record
    const txnRef = db.collection('transactions').doc();
    batch.set(txnRef, {
      offerId,
      cropId: offerData.cropId || '',
      cropName: offerData.cropName || '',
      farmerId: offerData.farmerId || (auth.currentUser ? auth.currentUser.uid : ''),
      traderId: offerData.traderId || '',
      traderName: offerData.traderName || '',
      quantity: offerData.quantity || 0,
      unit: offerData.unit || 'kg',
      price: offerData.offerPrice || 0,
      totalAmount: (offerData.offerPrice || 0) * (offerData.quantity || 0),
      netAmount: Math.max(0, ((offerData.offerPrice || 0) * (offerData.quantity || 0)) - 1500),
      date: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    await batch.commit();

    // Update localStorage immediately
    const offers = App.getOffers() || [];
    const idx = offers.findIndex(o => o.id === offerId);
    if (idx !== -1) {
      offers[idx].status = 'accepted';
      App.saveOffers(offers);
    }
  },

  async rejectOffer(offerId, offerData) {
    await db.collection('offers').doc(offerId).set({
      ...offerData,
      status: 'rejected',
      messages: firebase.firestore.FieldValue.arrayUnion({
        from: 'farmer',
        text: 'Offer rejected',
        time: new Date().toLocaleString()
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const offers = App.getOffers() || [];
    const idx = offers.findIndex(o => o.id === offerId);
    if (idx !== -1) {
      offers[idx].status = 'rejected';
      App.saveOffers(offers);
    }
  },

  async counterOffer(offerId, counterPrice, offerData) {
    await db.collection('offers').doc(offerId).set({
      ...offerData,
      status: 'countered',
      farmerCounterPrice: counterPrice,
      messages: firebase.firestore.FieldValue.arrayUnion({
        from: 'farmer',
        text: `Counter offer: ₹${counterPrice}/kg`,
        time: new Date().toLocaleString()
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const offers = App.getOffers() || [];
    const idx = offers.findIndex(o => o.id === offerId);
    if (idx !== -1) {
      offers[idx].status = 'countered';
      offers[idx].farmerCounterPrice = counterPrice;
      App.saveOffers(offers);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // TRANSACTIONS — Firestore /transactions
  // ─────────────────────────────────────────────────────────────

  async getTransactions(uid) {
    try {
      const snap = await db.collection('transactions')
        .where('farmerId', '==', uid)
        .get();
      const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      txns.sort((a, b) => {
        const tA = a.date?.toMillis ? a.date.toMillis() : (a.date?.seconds ? a.date.seconds * 1000 : 0);
        const tB = b.date?.toMillis ? b.date.toMillis() : (b.date?.seconds ? b.date.seconds * 1000 : 0);
        return tB - tA;
      });
      return txns;
    } catch(err) {
      console.warn('getTransactions error:', err);
      return App.getTransactions() || [];
    }
  },

  // ─────────────────────────────────────────────────────────────
  // TRADERS — Firestore /users (where userType == 'trader')
  // ─────────────────────────────────────────────────────────────

  async getTraders() {
    const snap = await db.collection('users')
      .where('userType', '==', 'trader')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ─────────────────────────────────────────────────────────────
  // MARKET PRICES — Firestore /market_prices
  // ─────────────────────────────────────────────────────────────

  async getMarketPrices(filters = {}) {
    let query = db.collection('market_prices');
    if (filters.crop) query = query.where('crop', '==', filters.crop);
    if (filters.state) query = query.where('state', '==', filters.state);
    const snap = await query.limit(50).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * One-time seed: push market prices from data.js into Firestore
   * Run this ONCE by calling BackendService.seedMarketPrices() in the browser console
   */
  async seedMarketPrices() {
    if (typeof KisanSetuData === 'undefined') {
      console.error('KisanSetuData not loaded. Include data.js first.');
      return;
    }
    const batch = db.batch();
    KisanSetuData.marketPrices.forEach(price => {
      const ref = db.collection('market_prices').doc();
      batch.set(ref, { ...price, seededAt: firebase.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    console.log('✅ Market prices seeded to Firestore!');
  },

  /**
   * 🌱 Auto-seed rich demo data into Firestore & localStorage for any user who logs in
   * Seeds:
   *  - Farmer: 4 Active Crops, 5 Incoming Offers, 2 Completed Transactions (₹57,500), Mandi prices
   *  - Trader: Marketplace Crops, Sent Offers, Completed Deals, Mandi prices
   * Prevents duplicate seeding via localStorage flag.
   */
  async seedDemoData(targetUid, role) {
    if (typeof KisanSetuData === 'undefined') {
      console.error('KisanSetuData not loaded.');
      return;
    }

    const currentUser = (typeof auth !== 'undefined' && auth.currentUser) ? auth.currentUser : null;
    const uid = targetUid || (currentUser ? currentUser.uid : null);
    if (!uid) {
      console.warn('No user UID available for demo data seeding.');
      return;
    }

    const resolvedRole = role || localStorage.getItem('kisansetu_userType') || 'farmer';
    const userName = (currentUser && (currentUser.displayName || currentUser.email))
      ? (currentUser.displayName || currentUser.email.split('@')[0])
      : (resolvedRole === 'trader' ? KisanSetuData.defaultTrader.name : KisanSetuData.defaultFarmer.name);

    // Prevent duplicate seeding for this user
    const seedKey = 'kisansetu_demo_seeded_' + uid;
    if (localStorage.getItem(seedKey) === 'true') {
      console.log('ℹ️ Demo data already seeded for this user.');
      return;
    }

    console.log(`🌱 Seeding demo data for ${resolvedRole} (${userName})...`);

    // 1. Sync rich demo data immediately to localStorage so UI displays records with zero latency
    if (resolvedRole === 'farmer') {
      localStorage.setItem('kisansetu_crops', JSON.stringify(KisanSetuData.farmerCrops));
      localStorage.setItem('kisansetu_offers', JSON.stringify(KisanSetuData.offers));
      localStorage.setItem('kisansetu_transactions', JSON.stringify(KisanSetuData.transactions));
      localStorage.setItem('kisansetu_real_offers', JSON.stringify(KisanSetuData.offers));
    } else {
      localStorage.setItem('kisansetu_crops', JSON.stringify(KisanSetuData.farmerCrops));
      const traderOffers = KisanSetuData.offers.map(o => ({
        ...o,
        traderId: uid,
        traderName: userName,
        status: o.status === 'accepted' ? 'accepted' : 'pending'
      }));
      localStorage.setItem('kisansetu_offers', JSON.stringify(traderOffers));
      localStorage.setItem('kisansetu_transactions', JSON.stringify(KisanSetuData.transactions));
      localStorage.setItem('kisansetu_real_offers', JSON.stringify(traderOffers));
    }

    // 2. If Firestore is active, seed documents directly to Firestore
    if (typeof db !== 'undefined' && db && typeof db.batch === 'function') {
      try {
        const batch = db.batch();

        if (resolvedRole === 'farmer') {
          // A. Farmer's own crops
          const createdCropIds = [];
          KisanSetuData.farmerCrops.forEach((crop, idx) => {
            const cropRef = db.collection('crops').doc();
            createdCropIds.push(cropRef.id);
            batch.set(cropRef, {
              ...crop,
              id: cropRef.id,
              farmerId: uid,
              farmerName: userName,
              imageUrl: crop.image || null,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });

          // B. Offers received on farmer's crops from verified traders
          KisanSetuData.offers.forEach((offer, idx) => {
            const offerRef = db.collection('offers').doc();
            const matchingCropId = createdCropIds[idx % createdCropIds.length] || offer.cropId;
            batch.set(offerRef, {
              ...offer,
              id: offerRef.id,
              cropId: matchingCropId,
              farmerId: uid,
              farmerName: userName,
              traderId: offer.traderId || 'trader_101',
              traderName: offer.traderName || 'ABC Traders',
              traderPhone: '+91 98231 44556',
              farmerPhone: '',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });

          // C. Completed transactions for the farmer (Revenue: ₹57,500)
          KisanSetuData.transactions.forEach(txn => {
            const txnRef = db.collection('transactions').doc();
            batch.set(txnRef, {
              ...txn,
              id: txnRef.id,
              farmerId: uid,
              farmerName: userName,
              traderName: txn.traderName || 'Mahalaxmi Trading Co.',
              status: 'completed',
              date: firebase.firestore.FieldValue.serverTimestamp()
            });
          });

        } else {
          // Trader Role:
          // A. Marketplace crops available for traders to discover
          KisanSetuData.farmerCrops.forEach((crop, idx) => {
            const cropRef = db.collection('crops').doc();
            batch.set(cropRef, {
              ...crop,
              id: cropRef.id,
              farmerId: 'demo_farmer_' + (idx + 1),
              farmerName: idx % 2 === 0 ? 'Ramesh Patil' : 'Suresh Deshmukh',
              imageUrl: crop.image || null,
              status: 'active',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });

          // B. Offers sent by this trader
          KisanSetuData.offers.slice(0, 3).forEach((offer, idx) => {
            const offerRef = db.collection('offers').doc();
            batch.set(offerRef, {
              ...offer,
              id: offerRef.id,
              farmerId: 'demo_farmer_' + (idx + 1),
              farmerName: idx % 2 === 0 ? 'Ramesh Patil' : 'Suresh Deshmukh',
              traderId: uid,
              traderName: userName,
              traderPhone: '',
              status: idx === 0 ? 'pending' : (idx === 1 ? 'countered' : 'accepted'),
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });

          // C. Trader transactions
          KisanSetuData.transactions.forEach(txn => {
            const txnRef = db.collection('transactions').doc();
            batch.set(txnRef, {
              ...txn,
              id: txnRef.id,
              traderId: uid,
              traderName: userName,
              farmerName: 'Ramesh Patil',
              status: 'completed',
              date: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
        }

        // D. Shared Mandi Prices
        KisanSetuData.marketPrices.forEach(price => {
          const priceRef = db.collection('market_prices').doc();
          batch.set(priceRef, {
            ...price,
            seededAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });

        await batch.commit();
        console.log(`✅ Demo data successfully committed to Firestore for ${resolvedRole}!`);
      } catch (err) {
        console.warn('Firestore demo seed warning (localStorage active):', err);
      }
    }

    localStorage.setItem(seedKey, 'true');
    console.log('✅ Demo data ready. Dashboard will update automatically.');
  }

};
