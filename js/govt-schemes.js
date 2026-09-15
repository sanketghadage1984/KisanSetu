/* ═══════════════════════════════════════════════════════
   KisanSetu — Government Scheme Eligibility Checker
   Database of 12+ Indian agri schemes with eligibility logic
   ═══════════════════════════════════════════════════════ */

const GovtSchemes = {

  // ── Scheme Database ────────────────────────────────
  schemes: [
    {
      id: 'pm_kisan',
      name: 'PM-KISAN',
      fullName: 'Pradhan Mantri Kisan Samman Nidhi',
      icon: '🏛️',
      benefit: '₹6,000/year in 3 installments',
      description: 'Direct income support of ₹6,000 per year to small and marginal farmer families.',
      eligibility: ['All farmer families with cultivable land', 'Valid Aadhaar card required', 'Bank account linked to Aadhaar'],
      applyUrl: 'https://pmkisan.gov.in/',
      category: 'income_support',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'pmfby',
      name: 'PMFBY',
      fullName: 'Pradhan Mantri Fasal Bima Yojana',
      icon: '🛡️',
      benefit: 'Crop insurance at 2% premium (Kharif), 1.5% (Rabi)',
      description: 'Comprehensive crop insurance against natural calamities, pests, and diseases at minimal premium.',
      eligibility: ['All farmers growing notified crops', 'Premium: 2% for Kharif, 1.5% for Rabi, 5% for Commercial', 'Mandatory for loanee farmers'],
      applyUrl: 'https://pmfby.gov.in/',
      category: 'insurance',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'pmfme',
      name: 'PMFME',
      fullName: 'PM Formalisation of Micro Food Processing Enterprises',
      icon: '🏭',
      benefit: 'Up to 35% subsidy (max ₹10 lakh) for food processing units',
      description: 'Credit-linked subsidy for micro food processing enterprises including millets, fruits, vegetables.',
      eligibility: ['Individual micro food processing units', 'Self Help Groups (SHGs)', 'FPOs and cooperatives', 'Special focus on millet-based products'],
      applyUrl: 'https://pmfme.mofpi.gov.in/',
      category: 'subsidy',
      matchCriteria: { userType: 'farmer', crops: ['ragi', 'bajra', 'jowar', 'foxtail millet', 'little millet', 'barnyard millet', 'kodo millet'] }
    },
    {
      id: 'enam',
      name: 'e-NAM',
      fullName: 'National Agriculture Market',
      icon: '📱',
      benefit: 'Online trading across 1,000+ mandis nationwide',
      description: 'Pan-India electronic trading portal linking APMCs across states for transparent price discovery.',
      eligibility: ['All farmers with produce to sell', 'Traders with valid license', 'Registration free on e-NAM portal'],
      applyUrl: 'https://enam.gov.in/',
      category: 'market_access',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'kcc',
      name: 'KCC',
      fullName: 'Kisan Credit Card',
      icon: '💳',
      benefit: 'Crop loans at 4% interest (with subsidy) up to ₹3 lakh',
      description: 'Short-term credit for crop production, post-harvest, and consumption needs at subsidized interest rates.',
      eligibility: ['All farmers — owner cultivators', 'Tenant farmers and sharecroppers', 'Interest subvention: 7% reduced to 4% for timely repayment'],
      applyUrl: 'https://www.pmkisan.gov.in/KCC.aspx',
      category: 'credit',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'soil_health',
      name: 'Soil Health Card',
      fullName: 'Soil Health Card Scheme',
      icon: '🧪',
      benefit: 'Free soil testing + nutrient recommendations',
      description: 'Every farmer gets a Soil Health Card with crop-wise recommendations on nutrients and fertilizers.',
      eligibility: ['All farmers', 'Card issued every 2 years', 'Free soil testing at government labs'],
      applyUrl: 'https://soilhealth.dac.gov.in/',
      category: 'advisory',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'millet_mission',
      name: 'National Millet Mission',
      fullName: 'National Mission on Millets (Shree Anna)',
      icon: '🌾',
      benefit: 'MSP procurement + 50% subsidy on millet processing equipment',
      description: 'India declared 2023 as International Year of Millets. This mission promotes millet cultivation, processing, and marketing with special incentives.',
      eligibility: ['Farmers growing millets (Ragi, Bajra, Jowar, etc.)', 'FPOs dealing in millets', 'Millet-based food processing units', 'Special MSP support for millet crops'],
      applyUrl: 'https://millets.dac.gov.in/',
      category: 'subsidy',
      matchCriteria: { userType: 'farmer', crops: ['ragi', 'bajra', 'jowar', 'foxtail millet', 'little millet', 'barnyard millet', 'kodo millet', 'finger millet', 'pearl millet', 'sorghum'] }
    },
    {
      id: 'agri_infra_fund',
      name: 'AIF',
      fullName: 'Agriculture Infrastructure Fund',
      icon: '🏗️',
      benefit: '3% interest subvention + ₹2 Cr CGCL guarantee',
      description: 'Medium-long term financing for post-harvest infrastructure — warehouses, cold storage, sorting/grading units.',
      eligibility: ['Farmers, FPOs, PACS, Agri-entrepreneurs', 'Projects: Cold storage, warehousing, processing', 'Loan up to ₹2 crore with 3% interest subvention'],
      applyUrl: 'https://agriinfra.dac.gov.in/',
      category: 'infrastructure',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'pm_kusum',
      name: 'PM-KUSUM',
      fullName: 'Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan',
      icon: '☀️',
      benefit: '60% subsidy on solar pumps and solar power plants',
      description: 'Subsidized solar pumps for irrigation and installation of solar power plants on barren/fallow land.',
      eligibility: ['Farmers with irrigation needs', 'Land owners with barren/fallow land', 'Central + State subsidy covers 60%'],
      applyUrl: 'https://pmkusum.mnre.gov.in/',
      category: 'energy',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'fpo_scheme',
      name: 'FPO Scheme',
      fullName: '10,000 FPO Formation & Promotion',
      icon: '👥',
      benefit: '₹18 lakh/FPO over 3 years + equity grant up to ₹15 lakh',
      description: 'Support for formation and promotion of 10,000 Farmer Producer Organizations across India.',
      eligibility: ['Group of 300+ farmers (plain areas) or 100+ (hilly/tribal)', 'Must register as Producer Company under Companies Act', 'Dedicated support for millet FPOs'],
      applyUrl: 'https://enam.gov.in/web/fpo',
      category: 'collective',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'organic_farming',
      name: 'Paramparagat Krishi',
      fullName: 'Paramparagat Krishi Vikas Yojana (PKVY)',
      icon: '🌿',
      benefit: '₹50,000/ha over 3 years for organic farming',
      description: 'Financial assistance for adoption of organic farming practices through cluster approach.',
      eligibility: ['Farmers willing to adopt organic practices', 'Cluster of 50 farmers with 50 acres minimum', 'Organic certification support included'],
      applyUrl: 'https://pgsindia-ncof.gov.in/',
      category: 'organic',
      matchCriteria: { userType: 'farmer' }
    },
    {
      id: 'rashtriya_krishi',
      name: 'RKVY-RAFTAAR',
      fullName: 'Rashtriya Krishi Vikas Yojana',
      icon: '🚀',
      benefit: 'Agri-startup funding up to ₹25 lakh',
      description: 'Supports agri-startups and innovation in agriculture with incubation and funding support.',
      eligibility: ['Agri-entrepreneurs and startups', 'Innovative agriculture solutions', 'Applications through Agri Innovation Hubs'],
      applyUrl: 'https://rkvy.nic.in/',
      category: 'startup',
      matchCriteria: { userType: 'farmer' }
    }
  ],

  // ── Check Eligibility ──────────────────────────────
  checkEligibility(userProfile = {}, crops = []) {
    const userType = userProfile.type || userProfile.userType || 'farmer';
    const userCrops = crops.map(c => (c.name || c).toLowerCase());

    return this.schemes.map(scheme => {
      let eligible = true;
      let matchScore = 0;
      const reasons = [];

      // Check user type
      if (scheme.matchCriteria.userType && scheme.matchCriteria.userType !== userType) {
        eligible = false;
        reasons.push('Available for ' + scheme.matchCriteria.userType + 's only');
      } else {
        matchScore += 30;
      }

      // Check crop match (if scheme is crop-specific)
      if (scheme.matchCriteria.crops && scheme.matchCriteria.crops.length > 0) {
        const matchingCrops = userCrops.filter(c =>
          scheme.matchCriteria.crops.some(sc => c.includes(sc) || sc.includes(c))
        );
        if (matchingCrops.length > 0) {
          matchScore += 50;
          reasons.push('Your crops match: ' + matchingCrops.join(', '));
        } else {
          matchScore += 10; // Still partially eligible
          reasons.push('Best for: ' + scheme.matchCriteria.crops.slice(0, 3).join(', '));
        }
      } else {
        matchScore += 40; // General scheme — good for everyone
      }

      // Bonus for millet growers on millet schemes
      const isMillet = userCrops.some(c => ['ragi', 'bajra', 'jowar', 'millet', 'sorghum'].some(m => c.includes(m)));
      if (isMillet && scheme.id === 'millet_mission') matchScore += 20;
      if (isMillet && scheme.id === 'pmfme') matchScore += 15;

      return {
        ...scheme,
        eligible,
        matchScore,
        reasons
      };
    })
    .filter(s => s.eligible)
    .sort((a, b) => b.matchScore - a.matchScore);
  },

  // ── Render Scheme Card HTML ────────────────────────
  renderSchemeCard(scheme, compact = false) {
    if (compact) {
      return `
        <div class="scheme-card-compact" data-scheme-id="${scheme.id}">
          <div class="scheme-icon">${scheme.icon}</div>
          <div class="scheme-info">
            <div class="scheme-name">${scheme.name}</div>
            <div class="scheme-benefit text-sm">${scheme.benefit}</div>
          </div>
          <a href="${scheme.applyUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">Apply →</a>
        </div>
      `;
    }

    return `
      <div class="scheme-card" data-scheme-id="${scheme.id}">
        <div class="scheme-header">
          <span class="scheme-icon-lg">${scheme.icon}</span>
          <div>
            <h4 class="scheme-title">${scheme.name}</h4>
            <p class="scheme-fullname text-sm text-muted">${scheme.fullName}</p>
          </div>
        </div>
        <div class="scheme-benefit-badge">${scheme.benefit}</div>
        <p class="scheme-desc">${scheme.description}</p>
        <div class="scheme-eligibility">
          <h5>Eligibility:</h5>
          <ul>${scheme.eligibility.map(e => `<li>✓ ${e}</li>`).join('')}</ul>
        </div>
        ${scheme.reasons ? `<div class="scheme-match"><strong>Match:</strong> ${scheme.reasons.join(' · ')}</div>` : ''}
        <a href="${scheme.applyUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="margin-top:0.75rem;">
          Apply Now →
        </a>
      </div>
    `;
  },

  // ── Render Widget (for Dashboard) ──────────────────
  renderWidget(eligibleSchemes, maxShow = 3) {
    if (!eligibleSchemes || !eligibleSchemes.length) {
      return '<p class="text-muted text-sm">No schemes matched your profile.</p>';
    }

    const shown = eligibleSchemes.slice(0, maxShow);
    const remaining = eligibleSchemes.length - maxShow;

    return `
      ${shown.map(s => this.renderSchemeCard(s, true)).join('')}
      ${remaining > 0 ? `<p class="text-sm text-muted" style="margin-top:0.5rem; text-align:center;">+ ${remaining} more schemes available</p>` : ''}
    `;
  }
};

// Make globally available
window.GovtSchemes = GovtSchemes;
