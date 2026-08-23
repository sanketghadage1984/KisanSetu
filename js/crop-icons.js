/**
 * KisanSetu — Crop SVG Icon System
 * Clean, professional flat-style SVG icons for all crops.
 * Replaces emoji-based crop icons across all pages.
 */

const CROP_SVG_ICONS = {
  onion: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8c-2 0-3.5 1.5-3.5 3v4h7V11c0-1.5-1.5-3-3.5-3z" fill="#4CAF50"/>
    <path d="M32 15C22 15 14 24 14 36c0 8 4 14 10 16.5C26.5 53.8 29 54 32 54s5.5-.2 8-1.5c6-2.5 10-8.5 10-16.5 0-12-8-21-18-21z" fill="#C68B59"/>
    <path d="M32 15c-3 0-5.5 1-7.5 3C22 20 20 25 20 31c0 7 3.5 13 8 15.5 1.2.5 2.5.8 4 .8s2.8-.3 4-.8c4.5-2.5 8-8.5 8-15.5 0-6-2-11-4.5-13-2-2-4.5-3-7.5-3z" fill="#D4A574"/>
    <path d="M32 18c-2 0-3.5.7-5 2-2 2-3.5 5.5-3.5 10s2 9 4.5 11c1 .7 2.2 1 4 1s3-.3 4-1c2.5-2 4.5-6.5 4.5-11s-1.5-8-3.5-10c-1.5-1.3-3-2-5-2z" fill="#E0BE98" opacity="0.6"/>
    <line x1="32" y1="20" x2="32" y2="48" stroke="#C68B59" stroke-width="0.8" opacity="0.4"/>
  </svg>`,

  tomato: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 14c-12 0-20 9-20 20s8 18 20 18 20-6 20-18-8-20-20-20z" fill="#E74C3C"/>
    <path d="M32 14c-6 0-11 3-14 7 3 2 8 3 14 3s11-1 14-3c-3-4-8-7-14-7z" fill="#C0392B"/>
    <path d="M22 30c0-4 2-8 5-11-3 1-5.5 4-7 8-.5 2-.7 4-.7 6 0 6 2.5 11 6.5 14-3.5-4-5.5-9.5-3.8-17z" fill="#FF6B6B" opacity="0.3"/>
    <path d="M28 10c-1-2-1-4 0-5s3-1 4 0c1-1.5 3-2 4-.5s0 3.5-1 4.5" fill="#4CAF50"/>
    <path d="M32 9c-2 0-3 1-4 3 1.5-.5 3-.8 4-.8s2.5.3 4 .8c-1-2-2-3-4-3z" fill="#388E3C"/>
    <path d="M30 5c0-1 .5-2 1.5-2s1.8 1 1.8 2v5h-3.3V5z" fill="#4CAF50"/>
  </svg>`,

  wheat: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="32" y1="58" x2="32" y2="20" stroke="#8D6E44" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="26" cy="18" rx="4" ry="8" transform="rotate(20 26 18)" fill="#DAA520"/>
    <ellipse cx="38" cy="18" rx="4" ry="8" transform="rotate(-20 38 18)" fill="#DAA520"/>
    <ellipse cx="22" cy="28" rx="3.5" ry="7" transform="rotate(30 22 28)" fill="#DAA520"/>
    <ellipse cx="42" cy="28" rx="3.5" ry="7" transform="rotate(-30 42 28)" fill="#DAA520"/>
    <ellipse cx="25" cy="38" rx="3" ry="6" transform="rotate(25 25 38)" fill="#DAA520"/>
    <ellipse cx="39" cy="38" rx="3" ry="6" transform="rotate(-25 39 38)" fill="#DAA520"/>
    <ellipse cx="32" cy="12" rx="3.5" ry="7" fill="#DAA520"/>
    <line x1="26" y1="18" x2="32" y2="24" stroke="#8D6E44" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="38" y1="18" x2="32" y2="24" stroke="#8D6E44" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="22" y1="28" x2="32" y2="34" stroke="#8D6E44" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="42" y1="28" x2="32" y2="34" stroke="#8D6E44" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="25" y1="38" x2="32" y2="44" stroke="#8D6E44" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="39" y1="38" x2="32" y2="44" stroke="#8D6E44" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  potato: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="34" rx="20" ry="15" transform="rotate(-10 32 34)" fill="#C4956A"/>
    <ellipse cx="32" cy="34" rx="18" ry="13" transform="rotate(-10 32 34)" fill="#D4A574"/>
    <circle cx="25" cy="30" r="1.5" fill="#B8845A" opacity="0.5"/>
    <circle cx="37" cy="28" r="1.2" fill="#B8845A" opacity="0.5"/>
    <circle cx="30" cy="38" r="1" fill="#B8845A" opacity="0.5"/>
    <circle cx="40" cy="35" r="1.3" fill="#B8845A" opacity="0.5"/>
    <circle cx="22" cy="36" r="1" fill="#B8845A" opacity="0.4"/>
    <path d="M20 28c4-3 10-4 16-3 4 1 7 3 9 5" stroke="#E0BE98" stroke-width="1" opacity="0.3" fill="none"/>
  </svg>`,

  soybean: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="32" rx="10" ry="7" transform="rotate(-30 24 32)" fill="#8BC34A"/>
    <ellipse cx="40" cy="32" rx="10" ry="7" transform="rotate(30 40 32)" fill="#7CB342"/>
    <line x1="24" y1="32" x2="40" y2="32" stroke="#689F38" stroke-width="1.5"/>
    <ellipse cx="24" cy="32" rx="8" ry="5" transform="rotate(-30 24 32)" fill="#9CCC65" opacity="0.4"/>
    <ellipse cx="40" cy="32" rx="8" ry="5" transform="rotate(30 40 32)" fill="#9CCC65" opacity="0.4"/>
    <path d="M32 22c-1-4-1-8 0-12" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M32 22c3-2 6-3 9-3" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M32 22c-3-2-6-3-9-3" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </svg>`,

  rice: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 56V20" stroke="#8D6E44" stroke-width="2" stroke-linecap="round"/>
    <path d="M32 20c0-6-2-10-2-14" stroke="#7CB342" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="28" cy="22" rx="3" ry="5" transform="rotate(30 28 22)" fill="#F5E6C8"/>
    <ellipse cx="36" cy="22" rx="3" ry="5" transform="rotate(-30 36 22)" fill="#F5E6C8"/>
    <ellipse cx="25" cy="30" rx="2.5" ry="4.5" transform="rotate(40 25 30)" fill="#F5E6C8"/>
    <ellipse cx="39" cy="30" rx="2.5" ry="4.5" transform="rotate(-40 39 30)" fill="#F5E6C8"/>
    <ellipse cx="27" cy="38" rx="2.5" ry="4" transform="rotate(35 27 38)" fill="#F5E6C8"/>
    <ellipse cx="37" cy="38" rx="2.5" ry="4" transform="rotate(-35 37 38)" fill="#F5E6C8"/>
    <ellipse cx="32" cy="17" rx="2.5" ry="5" fill="#F5E6C8"/>
    <line x1="28" y1="22" x2="32" y2="26" stroke="#8D6E44" stroke-width="1" stroke-linecap="round"/>
    <line x1="36" y1="22" x2="32" y2="26" stroke="#8D6E44" stroke-width="1" stroke-linecap="round"/>
    <line x1="25" y1="30" x2="32" y2="34" stroke="#8D6E44" stroke-width="1" stroke-linecap="round"/>
    <line x1="39" y1="30" x2="32" y2="34" stroke="#8D6E44" stroke-width="1" stroke-linecap="round"/>
    <line x1="27" y1="38" x2="32" y2="42" stroke="#8D6E44" stroke-width="1" stroke-linecap="round"/>
    <line x1="37" y1="38" x2="32" y2="42" stroke="#8D6E44" stroke-width="1" stroke-linecap="round"/>
  </svg>`,

  sugarcane: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="8" width="8" height="48" rx="4" fill="#8BC34A"/>
    <rect x="28" y="8" width="8" height="48" rx="4" fill="#7CB342"/>
    <line x1="28" y1="18" x2="36" y2="18" stroke="#689F38" stroke-width="2"/>
    <line x1="28" y1="28" x2="36" y2="28" stroke="#689F38" stroke-width="2"/>
    <line x1="28" y1="38" x2="36" y2="38" stroke="#689F38" stroke-width="2"/>
    <line x1="28" y1="48" x2="36" y2="48" stroke="#689F38" stroke-width="2"/>
    <path d="M36 14c4-2 8-1 10 1" stroke="#4CAF50" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M28 24c-4-2-8-1-10 1" stroke="#4CAF50" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M36 34c4-2 8-1 10 1" stroke="#4CAF50" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M28 44c-4-2-8-1-10 1" stroke="#4CAF50" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M30 6c-2-3-1-5 2-5s4 2 2 5" fill="#4CAF50"/>
    <path d="M34 6c2-3 1-5-2-5s-4 2-2 5" fill="#66BB6A"/>
  </svg>`,

  grapes: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="34" r="6" fill="#7B1FA2"/>
    <circle cx="36" cy="34" r="6" fill="#8E24AA"/>
    <circle cx="30" cy="26" r="6" fill="#9C27B0"/>
    <circle cx="18" cy="42" r="5.5" fill="#6A1B9A"/>
    <circle cx="30" cy="42" r="5.5" fill="#7B1FA2"/>
    <circle cx="42" cy="42" r="5.5" fill="#8E24AA"/>
    <circle cx="24" cy="50" r="5" fill="#6A1B9A"/>
    <circle cx="36" cy="50" r="5" fill="#7B1FA2"/>
    <circle cx="30" cy="56" r="4.5" fill="#6A1B9A"/>
    <path d="M30 20V8" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M30 12c3-3 7-4 10-3" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M30 12c-3-3-7-4-10-3" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="24" cy="34" r="3" fill="#AB47BC" opacity="0.3"/>
    <circle cx="30" cy="26" r="3" fill="#CE93D8" opacity="0.3"/>
  </svg>`,

  pomegranate: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="36" r="18" fill="#D32F2F"/>
    <circle cx="32" cy="36" r="16" fill="#E53935"/>
    <path d="M26 8c0-2 1-3 3-3h6c2 0 3 1 3 3v6c0 2-2 4-6 4s-6-2-6-4V8z" fill="#8D6E44"/>
    <path d="M28 8c0-1 .5-2 2-2h4c1.5 0 2 1 2 2v4c0 1.5-1.5 3-4 3s-4-1.5-4-3V8z" fill="#A1887F"/>
    <circle cx="27" cy="33" r="2.5" fill="#EF9A9A"/>
    <circle cx="33" cy="30" r="2.5" fill="#EF9A9A"/>
    <circle cx="37" cy="35" r="2.5" fill="#EF9A9A"/>
    <circle cx="30" cy="38" r="2.5" fill="#EF9A9A"/>
    <circle cx="36" cy="41" r="2.5" fill="#EF9A9A"/>
    <circle cx="28" cy="43" r="2" fill="#EF9A9A"/>
    <path d="M24 30c-2 2-3 6-2 10" stroke="#C62828" stroke-width="0.8" opacity="0.3"/>
  </svg>`,

  cotton: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="32" y1="58" x2="32" y2="34" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="32" cy="24" r="8" fill="#ECEFF1"/>
    <circle cx="24" cy="28" r="7" fill="#F5F5F5"/>
    <circle cx="40" cy="28" r="7" fill="#E0E0E0"/>
    <circle cx="26" cy="20" r="6" fill="#F5F5F5"/>
    <circle cx="38" cy="20" r="6" fill="#ECEFF1"/>
    <circle cx="32" cy="16" r="5.5" fill="#FAFAFA"/>
    <path d="M32 34c-3 0-6-2-8-4" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M32 34c3 0 6-2 8-4" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M32 42c-2 1-5 1-7 0" stroke="#388E3C" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M32 42c2 1 5 1 7 0" stroke="#388E3C" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </svg>`,

  maize: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="32" rx="10" ry="20" fill="#FDD835"/>
    <ellipse cx="32" cy="32" rx="8" ry="18" fill="#FFEE58" opacity="0.5"/>
    <line x1="32" y1="14" x2="32" y2="50" stroke="#F9A825" stroke-width="1" opacity="0.5"/>
    <line x1="24" y1="20" x2="24" y2="44" stroke="#F9A825" stroke-width="0.8" opacity="0.3"/>
    <line x1="40" y1="20" x2="40" y2="44" stroke="#F9A825" stroke-width="0.8" opacity="0.3"/>
    <circle cx="28" cy="22" r="2" fill="#FFB300"/>
    <circle cx="36" cy="22" r="2" fill="#FFB300"/>
    <circle cx="28" cy="28" r="2" fill="#FFB300"/>
    <circle cx="36" cy="28" r="2" fill="#FFB300"/>
    <circle cx="28" cy="34" r="2" fill="#FFB300"/>
    <circle cx="36" cy="34" r="2" fill="#FFB300"/>
    <circle cx="28" cy="40" r="2" fill="#FFB300"/>
    <circle cx="36" cy="40" r="2" fill="#FFB300"/>
    <circle cx="32" cy="25" r="2" fill="#FFA000"/>
    <circle cx="32" cy="31" r="2" fill="#FFA000"/>
    <circle cx="32" cy="37" r="2" fill="#FFA000"/>
    <path d="M22 22c-6-2-10 0-12 4" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M22 32c-6 0-10 2-12 5" stroke="#66BB6A" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M42 22c6-2 10 0 12 4" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M30 10c-2-4-1-7 2-8s5 1 3 5" fill="#4CAF50"/>
    <path d="M34 10c2-4 1-7-2-8s-5 1-3 5" fill="#66BB6A"/>
  </svg>`,

  chickpea: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="36" r="11" fill="#D4A574"/>
    <circle cx="38" cy="36" r="9" fill="#C4956A"/>
    <circle cx="26" cy="36" r="8" fill="#E0BE98" opacity="0.4"/>
    <circle cx="38" cy="36" r="6.5" fill="#D4A574" opacity="0.4"/>
    <path d="M30 26c0-3 1-6 2-8" stroke="#8D6E44" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M32 18c2 0 4 1 5 3" stroke="#8D6E44" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    <path d="M32 18c-2 0-4 1-5 3" stroke="#8D6E44" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  </svg>`,

  default: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 56V30" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M32 30c-4-8-14-16-14-22 0-4 6-6 10-2 1.5 1.5 3 3 4 5 1-2 2.5-3.5 4-5 4-4 10-2 10 2 0 6-10 14-14 22z" fill="#4CAF50"/>
    <path d="M32 30c-2-4-7-10-10-14 2 0 5 1 7 4 1-3 3-5 5-6-1 4-2 10-2 16z" fill="#66BB6A" opacity="0.4"/>
    <path d="M32 40c-3 2-7 3-10 2" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M32 46c3 1 6 1 8 0" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </svg>`
};

/**
 * Returns a professional inline SVG icon for the given crop name.
 * @param {string} name - The crop name (e.g., 'onion', 'tomato')
 * @returns {string} - The SVG markup string
 */
function getCropSVG(name) {
  const key = name.toLowerCase().trim();
  return CROP_SVG_ICONS[key] || CROP_SVG_ICONS.default;
}

/**
 * Legacy compatibility — returns SVG icon wrapped in a span.
 * Drop-in replacement for getCropEmoji() across all pages.
 * @param {string} name - The crop name
 * @returns {string} - HTML string with inline SVG
 */
function getCropEmoji(name) {
  return `<span class="crop-svg-icon">${getCropSVG(name)}</span>`;
}

// Expose globally
window.getCropSVG = getCropSVG;
window.getCropEmoji = getCropEmoji;
