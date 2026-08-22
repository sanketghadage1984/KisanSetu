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
- ⚡ **Zero-Config Pure Web Tech**: Built purely with HTML5, modern CSS3, and modular Vanilla JavaScript — no build steps or heavy dependencies required.

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
│   └── translations.js           # Multi-language dictionary (English, Hindi, Marathi)
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

## 🚀 Quick Start (Running Locally)

Because **KisanSetu** uses vanilla web standards, you don't need `npm install` or complex build pipelines!

### Option 1: Double-Click to Open
Simply double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari.

### Option 2: Using VS Code Live Server (Recommended)
1. Open this repository in **VS Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and click **"Open with Live Server"**.

### Option 3: Using Node.js or Python Local Server
```bash
# Using Python 3:
python -m http.server 3000

# Or using Node npx:
npx serve .
```
Then visit `http://localhost:3000` in your browser.

---

## 👥 How to Push to GitHub & Collaborate with Friends

### 1. Initialize Git and Push to Your GitHub
```bash
# 1. Initialize git in this folder
git init

# 2. Stage all files
git add .

# 3. Create initial commit
git commit -m "Initial commit of KisanSetu platform"

# 4. Rename default branch to main
git branch -M main

# 5. Link your GitHub repository (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/KisanSetu.git

# 6. Push to GitHub
git push -u origin main
```

### 2. Giving Your Friends Access to Make Changes
1. Go to your repository on **GitHub.com**.
2. Click **Settings** (top tab) ➔ **Collaborators** (left sidebar).
3. Click **"Add people"** and search for your friend's GitHub username or email.
4. Once they accept the email invitation, they have full push & pull access!

### 3. Workflow for Your Friends / Collaborators
```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/KisanSetu.git
cd KisanSetu

# 2. Create a new branch for their feature/fix
git checkout -b feature/my-new-feature

# 3. Make changes and test in the browser

# 4. Commit and push their branch
git add .
git commit -m "Added new feature: XYZ"
git push origin feature/my-new-feature

# 5. Create a Pull Request (PR) on GitHub for review and merge!
```

---

## 📖 Deep-Dive Codebase Guide

For a complete breakdown of every file, function, state variable, and step-by-step instructions on how to add new features, please read **[CODE_GUIDE.md](./CODE_GUIDE.md)**!

---

## 📄 License
This project is open-source and available for educational, personal, and commercial development.
