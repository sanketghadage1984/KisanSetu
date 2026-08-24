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

    const userDoc = {
      uid,
      name,
      email,
      phone: phone || '',
      location: location || '',
      userType: userType || 'farmer',
      avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      joined: firebase.firestore.FieldValue.serverTimestamp(),
      photoUrl: ''
    };

    await db.collection('users').doc(uid).set(userDoc);

    // Persist userType in localStorage for fast access
    localStorage.setItem('kisansetu_userType', userType || 'farmer');
    localStorage.setItem('kisansetu_loggedIn', 'true');
    return userDoc;
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Login with Email + Password
  // ─────────────────────────────────────────────────────────────

  async loginUser(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const profile = await this.getUserProfile(cred.user.uid);
    if (profile) {
      localStorage.setItem('kisansetu_userType', profile.userType || 'farmer');
      localStorage.setItem('kisansetu_loggedIn', 'true');
    }
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

    if (!snap.exists) {
      // New Google user → create Firestore profile
      const name = cred.user.displayName || 'User';
      const userDoc = {
        uid,
        name,
        email: cred.user.email || '',
        phone: cred.user.phoneNumber || '',
        location: '',
        userType: userType || 'farmer',
        avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        joined: firebase.firestore.FieldValue.serverTimestamp(),
        photoUrl: cred.user.photoURL || ''
      };
      await db.collection('users').doc(uid).set(userDoc);
      localStorage.setItem('kisansetu_userType', userType || 'farmer');
    } else {
      localStorage.setItem('kisansetu_userType', snap.data().userType || 'farmer');
    }

    localStorage.setItem('kisansetu_loggedIn', 'true');
    return snap.exists ? snap.data() : null;
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
    const recaptchaVerifier = new firebase.auth.RecaptchaVerifier(recaptchaContainerId, {
      size: 'invisible',
      callback: () => {}
    });
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
    window._kisanPhoneConfirmation = null;
    return snap.exists ? snap.data() : null;
  },

  // ─────────────────────────────────────────────────────────────
  // AUTH — Logout
  // ─────────────────────────────────────────────────────────────

  async logoutUser() {
    await auth.signOut();
    localStorage.setItem('kisansetu_loggedIn', 'false');
    localStorage.removeItem('kisansetu_userType');
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
  async getCrops(filters = {}) {
    let query = db.collection('crops');

    if (filters.farmerId) {
      query = query.where('farmerId', '==', filters.farmerId);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    query = query.orderBy('createdAt', 'desc').limit(filters.limit || 50);
    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Real-time listener for a farmer's crops
   * Calls callback(crops[]) whenever data changes
   */
  listenToCrops(farmerId, callback) {
    return db.collection('crops')
      .where('farmerId', '==', farmerId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(crops);
      });
  },

  /**
   * Real-time listener for ALL active crops (for trader discovery)
   */
  listenToAllCrops(callback, filters = {}) {
    let query = db.collection('crops').where('status', '==', 'active');
    if (filters.cropName) query = query.where('name', '==', filters.cropName);
    return query.orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
      const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(crops);
    });
  },

  async updateCropStatus(cropId, status) {
    await db.collection('crops').doc(cropId).update({ status });
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

    const profile = await this.getUserProfile(user.uid);
    const doc = {
      ...offerData,
      traderId: user.uid,
      traderName: profile?.name || user.displayName || 'Trader',
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
    const field = userType === 'trader' ? 'traderId' : 'farmerId';
    const snap = await db.collection('offers')
      .where(field, '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Real-time listener for offers (farmer or trader perspective)
   */
  listenToOffers(uid, userType, callback) {
    const field = userType === 'trader' ? 'traderId' : 'farmerId';
    return db.collection('offers')
      .where(field, '==', uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        const offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(offers);
      });
  },

  async acceptOffer(offerId, offerData) {
    const batch = db.batch();

    // Update offer status
    const offerRef = db.collection('offers').doc(offerId);
    batch.update(offerRef, {
      status: 'accepted',
      messages: firebase.firestore.FieldValue.arrayUnion({
        from: 'farmer',
        text: `Offer accepted at ₹${offerData.offerPrice}/kg`,
        time: new Date().toLocaleString()
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update crop status to 'sold'
    if (offerData.cropId) {
      const cropRef = db.collection('crops').doc(offerData.cropId);
      batch.update(cropRef, { status: 'sold' });
    }

    // Create transaction record
    const txnRef = db.collection('transactions').doc();
    batch.set(txnRef, {
      offerId,
      cropId: offerData.cropId,
      cropName: offerData.cropName,
      farmerId: offerData.farmerId,
      traderId: offerData.traderId,
      traderName: offerData.traderName,
      quantity: offerData.quantity,
      unit: offerData.unit || 'kg',
      price: offerData.offerPrice,
      totalAmount: offerData.offerPrice * offerData.quantity,
      netAmount: (offerData.offerPrice * offerData.quantity) - 1500,
      date: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    await batch.commit();
  },

  async rejectOffer(offerId, offerData) {
    await db.collection('offers').doc(offerId).update({
      status: 'rejected',
      messages: firebase.firestore.FieldValue.arrayUnion({
        from: 'farmer',
        text: 'Offer rejected',
        time: new Date().toLocaleString()
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async counterOffer(offerId, counterPrice, offerData) {
    await db.collection('offers').doc(offerId).update({
      status: 'countered',
      farmerCounterPrice: counterPrice,
      messages: firebase.firestore.FieldValue.arrayUnion({
        from: 'farmer',
        text: `Counter offer: ₹${counterPrice}/kg`,
        time: new Date().toLocaleString()
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  // ─────────────────────────────────────────────────────────────
  // TRANSACTIONS — Firestore /transactions
  // ─────────────────────────────────────────────────────────────

  async getTransactions(uid) {
    const snap = await db.collection('transactions')
      .where('farmerId', '==', uid)
      .orderBy('date', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
   * 🌱 Seed ALL demo data into Firestore (crops + offers + market prices)
   * Run ONCE in browser console: BackendService.seedDemoData('YOUR_FIREBASE_UID')
   * Get your UID from Firebase Console → Authentication → Users
   */
  async seedDemoData(farmerUid, traderUid) {
    if (typeof KisanSetuData === 'undefined') {
      console.error('KisanSetuData not loaded.');
      return;
    }

    if (!farmerUid) {
      console.error('❌ Please pass your Firebase UID: BackendService.seedDemoData("your-uid-here")');
      return;
    }

    console.log('🌱 Seeding demo data to Firestore...');
    const batch = db.batch();

    // 1. Seed Crops
    KisanSetuData.farmerCrops.forEach(crop => {
      const ref = db.collection('crops').doc();
      batch.set(ref, {
        ...crop,
        farmerId:   farmerUid,
        farmerName: KisanSetuData.defaultFarmer.name,
        imageUrl:   null,
        createdAt:  firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // 2. Seed Market Prices
    KisanSetuData.marketPrices.forEach(price => {
      const ref = db.collection('market_prices').doc();
      batch.set(ref, { ...price, seededAt: firebase.firestore.FieldValue.serverTimestamp() });
    });

    // 3. Seed Offers (link to farmer)
    KisanSetuData.offers.forEach(offer => {
      const ref = db.collection('offers').doc();
      batch.set(ref, {
        ...offer,
        farmerId:  farmerUid,
        traderId:  traderUid || 'demo_trader',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log('✅ Demo data seeded! Refresh your dashboard.');
  }

};
