/**
 * Generate semua ikon favicon/PWA dari src/assets/images/logo.webp
 *
 * Output (public/):
 *  - favicon.ico                  (16 + 32 + 48, PNG-in-ICO)
 *  - favicon-16x16.png / favicon-32x32.png / favicon-48x48.png / favicon-96x96.png
 *  - apple-touch-icon.png         (180x180)
 *  - android-chrome-192x192.png / android-chrome-512x512.png
 *  - maskable-icon-192x192.png / maskable-icon-512x512.png (dengan safe-zone padding)
 *
 * Jalankan: npm run icons
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src', 'assets', 'images', 'logo.webp');
const OUT = path.join(ROOT, 'public');

/** Warna latar brand (senada theme-color di index.html) */
const BRAND_BG = '#0A0A0E';

async function ensureOutDir() {
  await mkdir(OUT, { recursive: true });
}

async function renderPng(size) {
  return sharp(SRC)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .removeAlpha()
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

/** Ikon dengan latar solid + logo diskalakan (untuk maskable & apple touch) */
async function renderPaddedPng(size, ratio = 0.84) {
  const inner = Math.round(size * ratio);
  const innerBuf = await sharp(SRC)
    .resize(inner, inner, { fit: 'cover', position: 'centre' })
    .removeAlpha()
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BRAND_BG,
    },
  })
    .composite([{ input: innerBuf, gravity: 'centre' }])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

/**
 * Bungkus beberapa PNG ke dalam satu file .ico (PNG-in-ICO).
 * Didukung semua browser modern termasuk IE11+.
 */
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(count, 4);

  const dirSize = 16 * count;
  let dataOffset = header.length + dirSize;

  const entries = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palet warna
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8); // ukuran data
    entry.writeUInt32LE(dataOffset, 12); // offset data
    dataOffset += data.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
  console.log('[icons] Membaca sumber:', path.relative(ROOT, SRC));
  await ensureOutDir();

  // 1. PNG standar
  const sizes = [16, 32, 48, 96, 180, 192, 512];
  const rendered = new Map();
  for (const size of sizes) {
    rendered.set(size, await renderPng(size));
  }

  const plainOutputs = [
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['favicon-48x48.png', 48],
    ['favicon-96x96.png', 96],
    ['apple-touch-icon.png', 180],
    ['android-chrome-192x192.png', 192],
    ['android-chrome-512x512.png', 512],
  ];
  for (const [name, size] of plainOutputs) {
    await writeFile(path.join(OUT, name), rendered.get(size));
    console.log(`[icons] ✓ ${name} (${size}x${size})`);
  }

  // 2. Maskable icon (PWA) — logo 80% + safe zone
  for (const size of [192, 512]) {
    const buf = await renderPaddedPng(size, 0.8);
    await writeFile(path.join(OUT, `maskable-icon-${size}x${size}.png`), buf);
    console.log(`[icons] ✓ maskable-icon-${size}x${size}.png`);
  }

  // 3. favicon.ico multi-resolusi
  const ico = buildIco(
    [16, 32, 48].map((size) => ({ size, data: rendered.get(size) })),
  );
  await writeFile(path.join(OUT, 'favicon.ico'), ico);
  console.log('[icons] ✓ favicon.ico (16+32+48)');

  console.log('[icons] Selesai. Semua ikon tersimpan di public/');
}

main().catch((err) => {
  console.error('[icons] Gagal:', err);
  process.exit(1);
});
