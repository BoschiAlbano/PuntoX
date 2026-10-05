/**
 * Genera iconos y splash desde el isotipo PNG oficial, conservando transparencia.
 * Usa Sharp (ya incluido en Next.js como dependencia interna).
 *
 * Ejecutar: node scripts/generate-pwa-icons.mjs
 */

import sharp from "sharp";
import { writeFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const logoPath = path.join(publicDir, "brand/puntox-isotipo.png");
const background = { r: 15, g: 34, b: 51, alpha: 255 };

async function renderIcon(size) {
  return sharp(logoPath)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function writeIcon(size, filename) {
  const png = await renderIcon(size);
  writeFileSync(path.join(publicDir, filename), png);
  console.log(`Generated ${filename} (${size}x${size})`);
  return png;
}

async function writeSplash(width, height, filename) {
  const logoSize = Math.round(Math.min(width, height) * 0.22);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const left = Math.round((width - logoSize) / 2);
  const top = Math.round(height * 0.34);
  const splash = await sharp({
    create: { width, height, channels: 4, background },
  })
    .composite([{ input: logo, top, left }])
    .png()
    .toBuffer();

  writeFileSync(path.join(publicDir, filename), splash);
  console.log(`Generated ${filename} (${width}x${height})`);
}

function toIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0);
  entry.writeUInt8(0, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

console.log("Generating brand assets from public/brand/puntox-isotipo.png...");

await writeIcon(192, "icon-192.png");
const icon512 = await writeIcon(512, "icon-512.png");
const favicon = await renderIcon(256);
writeFileSync(path.join(publicDir, "favicon.ico"), toIco(favicon));
writeFileSync(path.join(publicDir, "icon.ico"), toIco(favicon));
writeFileSync(path.join(publicDir, "icon-preview.png"), icon512);
writeFileSync(
  path.join(publicDir, "logo.png"),
  await sharp(logoPath).png().toBuffer(),
);
await writeSplash(1170, 2532, "splash-1170x2532.png");

console.log("Generated favicon.ico, icon.ico, icon-preview.png, and logo.png");
