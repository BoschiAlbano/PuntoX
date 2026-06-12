/**
 * Genera icon-192.png e icon-512.png desde el logo SVG real del sistema.
 * Usa Sharp (ya incluido en Next.js como dependencia interna).
 * 
 * Ejecutar: node scripts/generate-pwa-icons.mjs
 */

import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

// SVG del ícono real del sistema (de src/app/icon.svg)
const logoSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="puntoXGrad" x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#2dd4bf" />
    </linearGradient>
  </defs>
  <!-- Ghost arm -->
  <path d="M25 25 L75 75" stroke="url(#puntoXGrad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />
  <!-- Main arm -->
  <path d="M25 75 L75 25" stroke="url(#puntoXGrad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Accent dot top-right -->
  <circle cx="75" cy="25" r="10" fill="#2dd4bf" />
</svg>`;

// Colores del sistema
const BG_COLOR = "#0F2233"; // navy (nav-bg del sistema)

async function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

async function generateIcon(size, filename) {
  const bg = await hexToRgb(BG_COLOR);

  // Padding: 18% de cada lado para que el logo no quede pegado al borde
  const padding = Math.round(size * 0.18);
  const logoSize = size - padding * 2;

  // Convertir SVG a PNG del tamaño del logo (con fondo transparente)
  const logoPng = await sharp(Buffer.from(logoSvg))
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  // Crear fondo sólido con el color del sistema
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: bg.r, g: bg.g, b: bg.b, alpha: 255 },
    },
  })
    .composite([
      {
        input: logoPng,
        top: padding,
        left: padding,
      },
    ])
    .png()
    .toFile(path.join(publicDir, filename));

  console.log(`✅ ${filename} (${size}x${size}px) → generado`);
  return background;
}

async function generateSplashScreen(width, height, filename) {
  const bg = await hexToRgb(BG_COLOR);

  const logoSize = Math.round(Math.min(width, height) * 0.22);
  const logoPng = await sharp(Buffer.from(logoSvg))
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  // Posición del logo: centrado horizontalmente, un poco arriba del centro vertical
  const logoLeft = Math.round((width - logoSize) / 2);
  const logoTop = Math.round(height * 0.34);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: bg.r, g: bg.g, b: bg.b, alpha: 255 },
    },
  })
    .composite([{ input: logoPng, top: logoTop, left: logoLeft }])
    .png()
    .toFile(path.join(publicDir, filename));

  console.log(`✅ ${filename} (${width}x${height}px) → generado`);
}

console.log("🎨 Generando íconos PWA desde el logo del sistema...\n");

try {
  await generateIcon(192, "icon-192.png");
  await generateIcon(512, "icon-512.png");
  await generateSplashScreen(1170, 2532, "splash-1170x2532.png");
  await generateSplashScreen(1290, 2796, "splash-1290x2796.png"); // iPhone 15 Pro Max
  await generateSplashScreen(828, 1792, "splash-828x1792.png");   // iPhone 11

  console.log("\n🚀 Todos los archivos generados en /public");
  console.log("   Reinstalá la PWA para ver los nuevos íconos.");
} catch (err) {
  console.error("❌ Error:", err.message);
  console.log("\n💡 Si sharp no está disponible como módulo ESM, ejecutar:");
  console.log("   npx --yes sharp-cli ...");
}
