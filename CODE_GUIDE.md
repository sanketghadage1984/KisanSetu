# 📚 KisanSetu — Complete Codebase & Developer Guide

Welcome to the **KisanSetu** codebase guide! This document is specially created for you and your developer friends / collaborators to understand every file in this repository, how data flows across components, and how to safely modify or extend features.

---

## 📑 Table of Contents

1. [Architecture & Design Principles](#1-architecture--design-principles)
2. [Global Core Files](#2-global-core-files)
   - [`index.html`](#indexhtml)
   - [`css/style.css`](#cssstylecss)
   - [`js/app.js`](#jsappjs)
   - [`js/data.js`](#jsdatajs)
   - [`js/translations.js`](#jstranslationsjs)
3. [Page-by-Page Breakdown](#3-page-by-page-breakdown)
   - [Farmer Dashboard (`pages/dashboard/`)](#farmer-dashboard-pagesdashboard)
   - [Add Crop (`pages/add-crop/`)](#add-crop-pagesadd-crop)
   - [Market Rates (`pages/market/`)](#market-rates-pagesmarket)
   - [Incoming Offers (`pages/offers/`)](#incoming-offers-pagesoffers)
   - [Trader Directory (`pages/traders/`)](#trader-directory-pagestraders)
   - [User Profile (`pages/profile/`)](#user-profile-pagesprofile)
   - [Trader Dashboard (`pages/trader-dashboard/`)](#trader-dashboard-pagestrader-dashboard)
   - [Login & Register (`pages/login/` & `pages/register/`)](#login--register-pageslogin--pagesregister)
4. [Common Developer Recipes (How to modify)](#4-common-developer-recipes)
   - [Recipe 1: Add a New Language (e.g., Gujarati, Telugu)](#recipe-1-add-a-new-language)
   - [Recipe 2: Add New Crops / Pre-filled Data](#recipe-2-add-new-crops--pre-filled-data)
   - [Recipe 3: Customize Theme Colors & Fonts](#recipe-3-customize-theme-colors--fonts)
   - [Recipe 4: Connect to a Real Backend API](#recipe-4-connect-to-a-real-backend-api)
   - [Recipe 5: Adding a Brand New Page](#recipe-5-adding-a-brand-new-page)
5. [Git Collaboration Best Practices](#5-git-collaboration-best-practices)

---

## 1. Architecture & Design Principles

KisanSetu is built with **Vanilla Web Technologies** (HTML5, CSS3, ES6+ JavaScript) for zero installation friction, maximum loading speed, and easy deployment on any static host (GitHub Pages, Vercel, Netlify).

### Data & State Architecture
- **Persistent Local Database**: `localStorage` acts as a browser-side mock database.
  - Keys used: `kisansetu_farmer`, `kisansetu_trader`, `kisansetu_crops`, `kisansetu_offers`, `kisansetu_transactions`, `kisansetu_notifications`, `kisansetu_lang`, `kisansetu_userType`.
- **First-Time Seed**: When a user first opens any page, `App.initLocalStorage()` in `js/app.js` seeds default mock records from `js/data.js`.
- **Internationalization (i18n)**: All translatable elements use `data-i18n="key"` attributes in HTML. `App.translatePage()` automatically replaces the text based on the selected language in `js/translations.js`.
- **Unified Navigation & Layout**: All pages share standard responsive headers, sidebar navigation drawers, and mobile bottom navigation bars.

---

## 2. Global Core Files

### `index.html`
- **Purpose**: The public landing page of KisanSetu.
- **Key Sections**:
  - Hero banner with quick call-to-actions ("Join as Farmer", "Join as Trader", "Explore Mandi Rates").
  - Live animated Market Rate ticker.
  - Feature highlights (Direct Deals, Fair Pricing, Verified Network).
  - Testimonials & impact stats counter.
  - Language switcher dropdown.

---

### `css/style.css`
- **Purpose**: Global CSS Design System and styling rules used across every page.
- **Key Sections**:
  - `:root` variables:
    - Primary greens: `--primary: #2e7d32`, `--primary-light: #4caf50`, `--primary-dark: #1b5e20`.
    - Accents & status colors: `--accent: #ff9800`, `--success: #43a047`, `--warning: #fbc02d`, `--danger: #e53935`.
    - Neutral palette: `--bg-main: #f8faf9`, `--surface: #ffffff`, `--text-main: #1f2937`.
    - Shadows & border radius tokens.
  - **Shared Components**:
    - `.app-header` & `.app-nav`: Top navigation bar with logo, language selector, notifications, user avatar.
    - `.bottom-nav`: Fixed mobile bottom navigation with active indicators.
    - `.sidebar-drawer`: Slide-out menu for mobile viewports.
    - `.btn`, `.btn-primary`, `.btn-outline`, `.btn-danger`: Standard button system with hover micro-animations.
    - `.card`, `.badge`, `.stat-card`: Reusable UI containers.
    - `.toast`: Floating notifications for success, error, and info alerts.
    - `.modal`: Reusable modal dialogs with backdrop blur.

---

### `js/app.js`
- **Purpose**: The central engine and utility library for the entire application.
- **Key Methods**:
  - `App.init()`: Initializes storage, event listeners, language selector, and auth checks.
  - `App.initLocalStorage()`: Seeds default data if running for the first time.
  - `App.getUser()` / `App.getUserType()`: Retrieves current authenticated user (farmer or trader).
  - `App.getCrops()`, `App.saveCrops(crops)`: CRUD operations for crop inventory.
  - `App.getOffers()`, `App.saveOffers(offers)`: CRUD operations for bids/offers.
  - `App.getNotifications()`, `App.saveNotifications()`: Notification management.
  - `App.translatePage()`: Scans the DOM for `[data-i18n]` tags and injects the active language strings.
  - `App.setLang(lang)`: Changes active language, saves to `localStorage`, re-translates, and dispatches `languageChanged` event.
  - `App.showToast(message, type)`: Displays dynamic toast alerts (`'success'`, `'error'`, `'info'`).
  - `App.openModal(id)` / `App.closeModal(id)`: Modal control helpers.
  - `App.formatCurrency(amount)`: Formats numbers into Indian Rupee format (`₹12,500`).
  - `App.formatDate(dateStr)`: Human-friendly date formatting.

---

### `js/data.js`
- **Purpose**: Default seed datasets and mock database.
- **Key Data Objects**:
  - `KisanSetuData.defaultFarmer`: Mock profile for farmer Rajesh Patil.
  - `KisanSetuData.defaultTrader`: Mock profile for trader Amit Sharma.
  - `KisanSetuData.farmerCrops`: Sample crops (Onion, Tomato, Wheat, Potato, Soybean, Cotton) with quantities, varieties, locations, and pricing.
  - `KisanSetuData.mandiPrices`: Realistic Mandi price points across Indian states (Maharashtra, Madhya Pradesh, Gujarat, Punjab, Karnataka) with high/low ranges and price trend indicators (`up`, `down`, `stable`).
  - `KisanSetuData.traders`: Verified traders list with contact numbers, ratings, crop specialties, and locations.
  - `KisanSetuData.offers`: Sample buyer offers for farmer listings.
  - `KisanSetuData.transactions`: History of completed trade transactions.
  - `KisanSetuData.notifications`: System alerts and buyer bid updates.

---

### `js/translations.js`
- **Purpose**: Tri-lingual translation dictionary.
- **Languages supported**:
  - `en` (English)
  - `hi` (Hindi — हिन्दी)
  - `mr` (Marathi — मराठी)
- **Structure**:
  ```javascript
  const Translations = {
    en: { "nav_dashboard": "Dashboard", "add_crop": "Add Crop", ... },
    hi: { "nav_dashboard": "डैशबोर्ड", "add_crop": "फसल जोड़ें", ... },
    mr: { "nav_dashboard": "डॅशबोर्ड", "add_crop": "पीक जोडा", ... }
  };
  ```

---

## 3. Page-by-Page Breakdown

Every folder in `pages/` contains an isolated trio of files: `page.html`, `page.css`, and `page.js`.

### Farmer Dashboard (`pages/dashboard/`)
- **Files**: `dashboard.html`, `dashboard.css`, `dashboard.js`
- **Features**:
  - **Metric Summary Cards**: Total active crops, pending offers, completed deals, estimated revenue.
  - **Crop Cards Grid**: Visual cards for each active crop with quick edit/delete actions.
  - **Recent Offers Preview**: Quick table showing incoming buyer bids with "Accept" / "Reject" buttons.
  - **Quick Action Bar**: Shortcuts to add a new crop, check mandi rates, or view all traders.

---

### Add Crop (`pages/add-crop/`)
- **Files**: `add-crop.html`, `add-crop.css`, `add-crop.js`
- **Features**:
  - Multi-field input form: Crop Name, Variety, Quantity, Unit (kg / quintal / ton), Expected Price per Unit, Harvest Date, Quality Condition, and Farm Location.
  - **Image Upload & Live Preview**: Lets farmers select a photo with instant thumbnail preview.
  - **Form Validation**: Checks required fields, adds new entry to `localStorage` via `App.saveCrops()`, triggers success toast, and redirects to Dashboard.

---

### Market Rates (`pages/market/`)
- **Files**: `market.html`, `market.css`, `market.js`
- **Features**:
  - **Live Mandi Rates Table**: Shows Crop Name, Mandi / State, Min Price, Max Price, Modal Price, and Trend indicator.
  - **Filter & Search Bar**: Filter rates by State/District, or search by crop name.
  - **Price Analysis Calculator**: Estimate total value by entering crop quantity and comparing against current modal APMC rate.

---

### Incoming Offers (`pages/offers/`)
- **Files**: `offers.html`, `offers.css`, `offers.js`
- **Features**:
  - Filter offers by status: **All**, **Pending**, **Accepted**, **Rejected**.
  - Interactive Action Buttons:
    - **Accept**: Changes status to accepted, saves to `localStorage`, notifies trader.
    - **Reject**: Rejects offer and updates UI.
    - **Counter-Offer**: Opens modal dialog to propose a new price per unit.

---

### Trader Directory (`pages/traders/`)
- **Files**: `traders.html`, `traders.css`, `traders.js`
- **Features**:
  - Grid of verified trader business cards with verification badges, rating stars, location, and crops traded.
  - **Direct Contact Buttons**:
    - "Call Now" (`tel:` link)
    - "Chat on WhatsApp" (Direct WhatsApp URL with pre-filled message)
  - Search by trader name, state, or required crop.

---

### User Profile (`pages/profile/`)
- **Files**: `profile.html`, `profile.css`, `profile.js`
- **Features**:
  - View and update personal profile, contact number, location, farm size, bank account/UPI details.
  - Language preference selector.
  - Role switcher (Farmer ⮂ Trader mode).

---

### Trader Dashboard (`pages/trader-dashboard/`)
- **Files**: `trader-dashboard.html`, `trader-dashboard.css`, `trader-dashboard.js`
- **Features**:
  - Dedicated buyer view: Browse active farmer listings across India.
  - **Make Offer Modal**: Submit purchase bids directly to farmers with quantity, offer price, and custom terms.
  - View active deals and purchase history.

---

### Login & Register (`pages/login/` & `pages/register/`)
- **Files**: `login.html`, `login.css`, `login.js`, `register.html`, `register.css`, `register.js`
- **Features**:
  - Role Selection toggle (Farmer / Trader).
  - Client-side validation and session creation in `localStorage`.
  - Demo autofill shortcuts for instant testing.

---

## 4. Common Developer Recipes

### Recipe 1: Add a New Language
To add a new language (e.g. Gujarati `gu` or Tamil `ta`):
1. Open `js/translations.js`.
2. Add your new language key object:
   ```javascript
   Translations.gu = {
     "nav_dashboard": "ડેશબોર્ડ",
     "nav_market": "બજાર ભાવ",
     // copy keys from 'en' and add translation...
   };
   ```
3. Open `index.html` and any `pages/*/*.html` file, and add `<option value="gu">ગુજરાતી</option>` inside the `<select id="lang-select">` dropdown.

---

### Recipe 2: Add New Crops / Pre-filled Data
To add more default crops or traders:
1. Open `js/data.js`.
2. Locate `farmerCrops` or `mandiPrices` array and add your new item:
   ```javascript
   {
     id: 'crop_007',
     name: 'Turmeric',
     variety: 'Salem',
     quantity: 400,
     unit: 'kg',
     expectedPrice: 120,
     location: 'Sangli, Maharashtra',
     harvestDate: '2026-09-01',
     condition: 'Premium',
     status: 'active',
     image: null,
     addedOn: '2026-08-20'
   }
   ```
3. To reset the browser storage with the new data, open Developer Tools (F12) ➔ Console ➔ type `localStorage.clear()` ➔ refresh the page!

---

### Recipe 3: Customize Theme Colors & Fonts
To change branding colors or font styles:
1. Open `css/style.css`.
2. Update the `:root` variables at the top of the file:
   ```css
   :root {
     --primary: #1b7a42;       /* Your custom brand color */
     --primary-light: #34a853;
     --accent: #f57c00;
     --font-main: 'Poppins', sans-serif;
   }
   ```

---

### Recipe 4: Connect to a Real Backend API
Currently, `js/app.js` reads from `localStorage`. To plug in a Node.js/Express, Python/Django, or Firebase backend:
1. Replace `App.getCrops()` and `App.saveCrops()` in `js/app.js` with `fetch()` calls:
   ```javascript
   async getCrops() {
     const res = await fetch('https://api.yourdomain.com/crops');
     return await res.json();
   },
   async saveCrop(cropData) {
     const res = await fetch('https://api.yourdomain.com/crops', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(cropData)
     });
     return await res.json();
   }
   ```

---

### Recipe 5: Adding a Brand New Page
1. Create a new directory under `pages/`, e.g. `pages/weather/`.
2. Create three files: `weather.html`, `weather.css`, `weather.js`.
3. In `weather.html`:
   - Include `<link rel="stylesheet" href="../../css/style.css">` and `<link rel="stylesheet" href="weather.css">`.
   - Copy the header/navigation structure from `pages/dashboard/dashboard.html`.
   - Include `<script src="../../js/translations.js"></script>`, `<script src="../../js/data.js"></script>`, `<script src="../../js/app.js"></script>`, and `<script src="weather.js"></script>`.
4. In `weather.js`, initialize with:
   ```javascript
   document.addEventListener('DOMContentLoaded', () => {
     App.init();
     // Your custom page logic here
   });
   ```

---

## 5. Git Collaboration Best Practices

When working with friends:
1. **Never commit directly to `main`**: Always create a feature branch (`git checkout -b feature/awesome-feature`).
2. **Pull latest changes frequently**:
   ```bash
   git checkout main
   git pull origin main
   ```
3. **Write clear commit messages**:
   - `git commit -m "fix: update mandi calculation formula"`
   - `git commit -m "feat: add crop photo gallery preview"`
4. **Use Pull Requests (PRs)**: Test changes locally first, push your branch to GitHub, and open a PR for your friends to review!

---

*Happy Coding! 🌾 Let's empower our farmers with technology.*
