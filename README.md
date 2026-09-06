# 🌾 KisanSetu (किसान सेतु) — Direct Farmer-to-Trader Marketplace

> **Bridging the gap between Indian Farmers and Verified Traders.**  
> A high-performance, mobile-responsive, multi-lingual web portal enabling fair pricing, direct bidding, market trends, and transparent agricultural trade.

---

## 🌟 Key Features

- 🌐 **Multi-Language Support (i18n)**: Seamless instant translation for **English (EN)**, **Hindi (HI)**, and **Marathi (MR)**.
- 👨‍🌾 **Farmer Portal**:
  - **Live Dashboard**: Track active listings, pending buyer offers, total revenue, and price trends.
  - **Add & Manage Crops**: Upload crop details, harvest dates, photos, target price, and quantity.
  - **Incoming Offers & Bids**: Review offers from verified traders, accept/reject bids with real-time status updates.
  - **Market Prices (Mandi Rates)**: Live/mock APMC mandi price comparison across Indian states.
  - **Trader Directory**: Browse verified buyers with direct WhatsApp / phone call integration.
- 🏪 **Trader / Buyer Portal**:
  - **Trader Dashboard**: Search crops by category/state, place offers, review transaction records.
  - **Direct Negotiation**: Send custom counter-offers directly to farmers.
- 📱 **Mobile-First & Responsive**: Full glassmorphic UI, responsive bottom navigation bar on mobile, slide-out drawer menus, and rich micro-interactions.
- 🌙 **Dark Mode**: Full dark theme support with one-click toggle.
- ⚡ **Zero-Config Pure Web Tech**: Built purely with HTML5, modern CSS3, and modular Vanilla JavaScript.

---

## 📁 Repository Structure

```
KisanSetu/
├── index.html                    # Landing page & feature showcase
├── README.md                     # Main project documentation (this file)
├── CODE_GUIDE.md                 # 📖 Comprehensive file-by-file code & developer guide
├── .gitignore                    # Git ignore file
│
├── css/
│   └── style.css                 # Global CSS design system, theme variables, navbar & modals
│
├── js/
│   ├── app.js                    # Global application core (auth, storage, toast, modal, i18n)
│   ├── data.js                   # Mock database seeds (crops, traders, mandi prices, offers)
│   ├── translations.js           # Multi-language dictionary (English, Hindi, Marathi)
│   ├── crop-icons.js             # Centralized crop emoji mappings
│   ├── firebase-config.js        # 🔥 Firebase + Cloudinary configuration (backend branch only)
│   └── firebase-backend.js       # 🔥 Firebase Auth, Firestore CRUD service (backend branch only)
│
└── pages/                        # Individual portal pages
    ├── add-crop/                 # Add new crop listing (form + image preview + validation)
    ├── dashboard/                # Farmer main dashboard (stats, active crops, quick actions)
    ├── login/                    # Authentication login (Farmer / Trader switch)
    ├── register/                 # New user registration & profile creation
    ├── market/                   # Live Mandi rates, price ticker & trends
    ├── offers/                   # Incoming offers & bidding management
    ├── profile/                  # User profile, farm/business details, preferences
    ├── trader-dashboard/         # Dedicated Trader portal (browse listings & place bids)
    └── traders/                  # Directory of verified traders with contact links
```

---

## 🔀 Branch Guide — Which Branch to Use?

This project has **two branches** for different use cases:

| Branch | What's Inside | When to Use |
|:-------|:-------------|:------------|
| **`main`** | ✅ Frontend-only (HTML + CSS + JS + localStorage) | Quick demo, no setup needed, works offline |
| **`backend`** | ✅ Frontend + Firebase Auth + Firestore Database + Cloudinary Image Upload | Full working app with real login, real database, cloud images |

---

## 🚀 Quick Start — Frontend Only (`main` branch)

> **No setup, no accounts, no database needed.** Just open and run!  
> Uses `localStorage` for demo data. Everything runs in the browser.

### Step 1: Clone the repo
```bash
git clone https://github.com/sanketghadage1984/KisanSetu.git
cd KisanSetu
```
> ℹ️ This automatically gives you the `main` (frontend-only) branch.

### Step 2: Run it

**Option A — Just double-click:**  
Open `index.html` directly in Chrome / Edge / Firefox.

**Option B — Local server (recommended):**
```bash
# Using Node.js:
npx -y serve .

# Or using Python:
python -m http.server 3000
```
Then visit **http://localhost:3000**

### Step 3: Explore
- Click **"Join as Farmer"** or **"Join as Trader"** on the landing page
- Use any name/email to register (it's stored locally in your browser)
- Dashboard will show **pre-loaded demo data** — crops, offers, market prices
- Try switching languages (EN / हिं / मरा) and dark mode 🌙

### Demo Credentials (Frontend Mode)
> No real login needed — just fill any name and email to register.  
> Demo data (crops, traders, offers) is automatically loaded.

---

## 🔥 Quick Start — Frontend + Backend (`backend` branch)

> **Full working app** with Firebase Authentication (Email, Google, Phone OTP), Firestore real-time database, and Cloudinary image uploads.

### Step 1: Clone and switch to `backend` branch
```bash
git clone https://github.com/sanketghadage1984/KisanSetu.git
cd KisanSetu
git checkout backend
```

### Step 2: Run a local server
```bash
# Using Node.js:
npx -y serve .

# Or using Python:
python -m http.server 3000
```
Then visit **http://localhost:3000**

### Step 3: Register / Login
- Click **"Join as Farmer"** or **"Join as Trader"**
- **Register** with a real email + password, or use **Google Sign-In**
- On first login, **demo data is automatically seeded** into your account (crops, offers, market prices) — so the dashboard looks populated!

### Step 4: Test the Features
| Feature | How to Test |
|:--------|:-----------|
| **Add Crop** | Go to Dashboard → "➕ Add Crop" → Fill form → Upload image → Submit (saves to Firestore + Cloudinary) |
| **Browse Traders** | Go to Traders page → Select a crop → See ranked traders → Make a deal |
| **Offers & Negotiation** | Go to Offers → Accept / Reject / Counter-offer incoming bids |
| **Trader View** | Register as Trader → See farmer crop listings → Send purchase offers |
| **Market Rates** | Go to Market page → Filter by state/crop → See price trends |
| **Language Switch** | Click EN / हिं / मरा in the top bar → entire UI translates instantly |
| **Dark Mode** | Click 🌙 in the top bar |

### What's Different in Backend Branch?
| Feature | `main` (Frontend) | `backend` (Full Stack) |
|:--------|:-------------------|:----------------------|
| Authentication | Fake local login | Firebase Auth (Email, Google, Phone OTP) |
| Database | localStorage (browser only) | Firestore (cloud, real-time sync) |
| Image Upload | No upload | Cloudinary CDN with auto-compression |
| Data Persistence | Lost if browser cache is cleared | Permanent cloud storage |
| Multi-Device Sync | ❌ | ✅ Real-time across all devices |
| Demo Data | Pre-loaded from data.js | Auto-seeded to Firestore on first login |

---

## 🧪 Testing Checklist for Friends

Use this checklist when testing:

### Frontend (`main` branch)
- [ ] Landing page loads with hero banner and market ticker
- [ ] Register as Farmer → Dashboard shows demo crops
- [ ] Register as Trader → Trader dashboard shows crop listings
- [ ] Switch language (EN → Hindi → Marathi) — all text changes
- [ ] Toggle dark mode 🌙
- [ ] Add a new crop from Dashboard
- [ ] Browse Traders → Make a deal → Check Offers page
- [ ] Mobile responsive — resize browser to phone width

### Backend (`backend` branch)
- [ ] All frontend tests above ✅
- [ ] Register with real email + password → Login works
- [ ] Google Sign-In works (popup opens, signs in)
- [ ] Dashboard auto-populates with demo data on first login
- [ ] Add Crop with image → Image uploads to Cloudinary
- [ ] Make offer from Traders page → Shows in Offers page
- [ ] Accept/Reject/Counter-offer works
- [ ] Open in 2 different browsers → Data syncs in real-time

---

## 👥 How to Collaborate

### For Friends: Clone & Test
```bash
# 1. Clone the repo
git clone https://github.com/sanketghadage1984/KisanSetu.git
cd KisanSetu

# 2. Test frontend-only (default):
npx -y serve .

# 3. Test with backend:
git checkout backend
npx -y serve .
```

### For Contributors: Make Changes
```bash
# 1. Create a branch for your feature/fix
git checkout -b feature/my-new-feature

# 2. Make changes and test in the browser

# 3. Commit and push
git add .
git commit -m "Added new feature: XYZ"
git push origin feature/my-new-feature

# 4. Create a Pull Request (PR) on GitHub!
```

### Adding Collaborators
1. Go to the repository on **GitHub.com**
2. Click **Settings** → **Collaborators** → **Add people**
3. Search for your friend's GitHub username or email
4. Once they accept the invitation, they can push & pull!

---

## 📖 Deep-Dive Codebase Guide

For a complete breakdown of every file, function, state variable, and step-by-step instructions on how to add new features, please read **[CODE_GUIDE.md](./CODE_GUIDE.md)**!

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | HTML5, CSS3 (Custom Properties, Glassmorphism), Vanilla JavaScript ES6+ |
| **Backend** | Firebase Auth, Cloud Firestore, Firebase Analytics |
| **Image CDN** | Cloudinary (auto-compressed uploads) |
| **Internationalization** | Custom i18n system (EN, HI, MR) |
| **Hosting** | Any static host (GitHub Pages, Netlify, Vercel, or local) |

---

## 📄 License
This project is open-source and available for educational, personal, and commercial development.
