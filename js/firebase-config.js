// ============================================================
//  KisanSetu — Firebase & Cloudinary Configuration
//  firebase-config.js
// ============================================================

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5sJnXAiTWOzTo7zC2ID5fXW_8b4ygQ7o",
  authDomain: "kisansetu-1d151.firebaseapp.com",
  projectId: "kisansetu-1d151",
  storageBucket: "kisansetu-1d151.firebasestorage.app",
  messagingSenderId: "316150533162",
  appId: "1:316150533162:web:777ab54df071b4ca80c753",
  measurementId: "G-Q8JRCTPMPK"
};

// ✅ Initialize Firebase (guard against double-init)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ✅ Firebase Services — available globally
const db   = firebase.firestore();
const auth = firebase.auth();

// Enable Firestore offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});

// ✅ Cloudinary Configuration
// Steps: cloudinary.com → Dashboard → copy Cloud Name
//        Settings → Upload → Add preset → set Unsigned → name "kisansetu_crops"
const CLOUDINARY_CONFIG = {
  cloudName:    "dwokofevr",  // ✅ Your Cloudinary Cloud Name
  uploadPreset: "kisansetu_crops"              // ⬅️ Replace with your unsigned preset
};

// ============================================================
//  HELPER 1: Compress image using HTML5 Canvas API
//  Runs entirely in browser BEFORE uploading — no libraries needed.
//
//  Results (typical phone camera photo):
//    Before: 3–6 MB  →  After: 80–200 KB  (up to 96% smaller!)
//
//  Options:
//    maxWidth  — max image width in px (default 800)
//    maxHeight — max image height in px (default 800)
//    quality   — JPEG quality 0.0–1.0 (default 0.72 ≈ 72%)
// ============================================================
function compressImage(file, options = {}) {
  const {
    maxWidth  = 800,
    maxHeight = 800,
    quality   = 0.72   // 72% quality — great balance of size vs. clarity
  } = options;

  return new Promise((resolve, reject) => {
    // Only compress image files
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }

        // Draw resized image onto canvas
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            // Wrap in File object to keep filename
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            const savedKB = ((file.size - compressed.size) / 1024).toFixed(0);
            console.log(`✅ Image compressed: ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB (saved ${savedKB}KB)`);
            resolve(compressed);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file); // fallback: use original
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file); // fallback: use original
    reader.readAsDataURL(file);
  });
}

// ============================================================
//  HELPER 2: Upload image to Cloudinary
//  Automatically compresses the image first to save storage!
//  Returns: secure CDN URL string or null on failure
// ============================================================
async function uploadImageToCloudinary(file) {
  if (!file) return null;
  if (CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUDINARY_CLOUD_NAME') {
    console.warn('⚠️ Cloudinary Cloud Name not set. Image upload skipped.');
    return null;
  }

  // 🔥 Step 1: Compress first (free tier saver!)
  const compressedFile = await compressImage(file, {
    maxWidth:  800,   // max 800px wide
    maxHeight: 800,   // max 800px tall
    quality:   0.72   // 72% JPEG quality
  });

  // 🔥 Step 2: Upload the compressed file
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', 'kisansetu/crops');

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    console.error('❌ Cloudinary upload error:', data.error?.message);
    return null;
  } catch (err) {
    console.error('❌ Cloudinary upload failed:', err);
    return null;
  }
}
