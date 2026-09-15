/* ═══════════════════════════════════════════════════════
   KisanSetu — Blockchain Traceability (Visual/Mock)
   Generates deterministic hashes and QR codes for crops
   ═══════════════════════════════════════════════════════ */

const BlockchainTracker = {

  // ── Generate deterministic hash (SHA-256 mock) ────
  async generateHash(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    // Use Web Crypto API for real SHA-256
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0') + Date.now().toString(16);
  },

  // ── Generate QR Code as SVG (no external library) ──
  generateQRCodeSVG(text, size = 200) {
    // Simplified QR-like code generator (visual placeholder)
    // For a real QR, we'd use a library like qrcode.js
    const modules = 21; // 21x21 grid (version 1 QR)
    const cellSize = size / modules;
    const seed = this._simpleHash(text);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;

    // Draw finder patterns (the three big squares in QR corners)
    svg += this._drawFinderPattern(0, 0, cellSize);
    svg += this._drawFinderPattern((modules - 7) * cellSize, 0, cellSize);
    svg += this._drawFinderPattern(0, (modules - 7) * cellSize, cellSize);

    // Draw data modules based on hash
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // Skip finder pattern areas
        if ((row < 8 && col < 8) || (row < 8 && col > modules - 9) || (row > modules - 9 && col < 8)) continue;

        const idx = row * modules + col;
        const bit = (seed + idx * 7 + row * 13 + col * 17) % 3;
        if (bit === 0) {
          svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1B4332"/>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  },

  _drawFinderPattern(x, y, cellSize) {
    let pattern = '';
    // Outer ring
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          pattern += `<rect x="${x + j * cellSize}" y="${y + i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1B4332"/>`;
        }
      }
    }
    return pattern;
  },

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  // ── Create blockchain record for a crop ───────────
  async createCropRecord(crop, farmerId) {
    const timestamp = Date.now();
    const genesisData = {
      type: 'GENESIS',
      platform: 'KisanSetu',
      version: '1.0',
      timestamp: new Date('2026-01-01').getTime()
    };

    const cropData = {
      type: 'CROP_LISTED',
      cropId: crop.id,
      cropName: crop.name,
      variety: crop.variety || '',
      quantity: crop.quantity,
      farmerId: farmerId,
      location: crop.location || '',
      harvestDate: crop.harvestDate || '',
      condition: crop.condition || 'Good',
      timestamp: timestamp,
      listingDate: new Date().toISOString()
    };

    const genesisHash = await this.generateHash(genesisData);
    const cropHash = await this.generateHash({ ...cropData, previousHash: genesisHash });

    const blockchain = {
      traceabilityId: 'KS-' + crop.id + '-' + timestamp.toString(36).toUpperCase(),
      chain: [
        {
          index: 0,
          type: 'Genesis Block',
          icon: '🏗️',
          hash: genesisHash.substring(0, 16) + '...',
          fullHash: genesisHash,
          timestamp: genesisData.timestamp,
          date: 'Platform Created',
          status: 'confirmed',
          data: genesisData
        },
        {
          index: 1,
          type: 'Crop Listed',
          icon: '🌾',
          hash: cropHash.substring(0, 16) + '...',
          fullHash: cropHash,
          timestamp: timestamp,
          date: new Date().toLocaleDateString('en-IN'),
          status: 'confirmed',
          data: cropData
        },
        {
          index: 2,
          type: 'Quality Verified',
          icon: '🔬',
          hash: '(pending)',
          timestamp: null,
          date: 'Pending',
          status: 'pending',
          data: null
        },
        {
          index: 3,
          type: 'Offer Accepted',
          icon: '🤝',
          hash: '(pending)',
          timestamp: null,
          date: 'Pending',
          status: 'pending',
          data: null
        },
        {
          index: 4,
          type: 'Dispatched',
          icon: '🚚',
          hash: '(pending)',
          timestamp: null,
          date: 'Pending',
          status: 'pending',
          data: null
        },
        {
          index: 5,
          type: 'Delivered',
          icon: '✅',
          hash: '(pending)',
          timestamp: null,
          date: 'Pending',
          status: 'pending',
          data: null
        }
      ],
      qrData: JSON.stringify({
        id: 'KS-' + crop.id,
        crop: crop.name,
        farmer: farmerId,
        hash: cropHash.substring(0, 24),
        verified: true,
        platform: 'KisanSetu'
      })
    };

    // Store in localStorage
    const records = JSON.parse(localStorage.getItem('kisansetu_blockchain') || '{}');
    records[crop.id] = blockchain;
    localStorage.setItem('kisansetu_blockchain', JSON.stringify(records));

    return blockchain;
  },

  // ── Get blockchain record for a crop ──────────────
  getCropRecord(cropId) {
    try {
      const records = JSON.parse(localStorage.getItem('kisansetu_blockchain') || '{}');
      return records[cropId] || null;
    } catch { return null; }
  },

  // ── Update blockchain when offer is accepted ──────
  async updateChainEvent(cropId, eventType, eventData) {
    const records = JSON.parse(localStorage.getItem('kisansetu_blockchain') || '{}');
    const record = records[cropId];
    if (!record) return null;

    const eventMap = {
      'quality_verified': 2,
      'offer_accepted': 3,
      'dispatched': 4,
      'delivered': 5
    };

    const blockIndex = eventMap[eventType];
    if (blockIndex === undefined || !record.chain[blockIndex]) return record;

    const prevHash = record.chain[blockIndex - 1].fullHash || record.chain[blockIndex - 1].hash;
    const hash = await this.generateHash({ ...eventData, previousHash: prevHash, timestamp: Date.now() });

    record.chain[blockIndex] = {
      ...record.chain[blockIndex],
      hash: hash.substring(0, 16) + '...',
      fullHash: hash,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-IN'),
      status: 'confirmed',
      data: eventData
    };

    records[cropId] = record;
    localStorage.setItem('kisansetu_blockchain', JSON.stringify(records));
    return record;
  },

  // ── Render blockchain timeline HTML ────────────────
  renderTimeline(blockchain) {
    if (!blockchain || !blockchain.chain) return '';

    return `
      <div class="blockchain-timeline">
        <div class="blockchain-header">
          <h4>🔗 Blockchain Traceability</h4>
          <span class="blockchain-id">${blockchain.traceabilityId}</span>
        </div>
        <div class="blockchain-chain">
          ${blockchain.chain.map((block, i) => `
            <div class="blockchain-block ${block.status}">
              <div class="block-connector ${i === 0 ? 'first' : ''}"></div>
              <div class="block-icon">${block.icon}</div>
              <div class="block-info">
                <div class="block-type">${block.type}</div>
                <div class="block-date">${block.date}</div>
                <div class="block-hash" title="${block.fullHash || block.hash}">
                  ${block.status === 'confirmed' ? '🔒 ' : '⏳ '}${block.hash}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="blockchain-qr">
          <div class="qr-label">Scan to Verify</div>
          <div class="qr-code">${this.generateQRCodeSVG(blockchain.qrData || '', 120)}</div>
        </div>
      </div>
    `;
  }
};

// Make globally available
window.BlockchainTracker = BlockchainTracker;
