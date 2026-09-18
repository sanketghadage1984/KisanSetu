/* ═══════════════════════════════════════════════════════
   KisanSetu — Centralized Crop Emoji Mappings
   ═══════════════════════════════════════════════════════ */

function getCropEmoji(name) {
  const map = {
    'onion': '🧅',
    'wheat': '🌾',
    'soybean': '🌱',
    'cotton': '☁️',
    'tomato': '🍅',
    'potato': '🥔',
    'rice': '🍚',
    'paddy': '🌾',
    'chilli': '🌶️',
    'garlic': '🧄',
    'ginger': '🫚',
    'sugarcane': '🎋',
    'maize': '🌽',
    'corn': '🌽',
    'turmeric': '🟡',
    'gram': '🫘',
    'moong': '🫘',
    'bajra': '🌾',
    'jowar': '🌾',
    'ragi': '🌾',
    'millet': '🌾'
  };
  return map[(name || '').toLowerCase()] || '🌾';
}

if (typeof window !== 'undefined') {
  window.getCropEmoji = getCropEmoji;
}
