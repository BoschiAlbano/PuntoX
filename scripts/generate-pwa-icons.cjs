// Script CJS para generar íconos PWA con el logo real del sistema
// Ejecutar: node scripts/generate-pwa-icons.cjs
const sharp = require("sharp");
const path = require("path");

const publicDir = path.resolve(__dirname, "../public");
const BG = { r: 15, g: 34, b: 51, alpha: 255 }; // #0F2233

const logoSvg = Buffer.from(
  [
    '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">',
    "  <defs>",
    '    <linearGradient id="g" x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#0284c7"/>',
    '      <stop offset="100%" stop-color="#2dd4bf"/>',
    "    </linearGradient>",
    "  </defs>",
    '  <path d="M25 25 L75 75" stroke="url(#g)" stroke-width="14" stroke-linecap="round" opacity="0.4"/>',
    '  <path d="M25 75 L75 25" stroke="url(#g)" stroke-width="14" stroke-linecap="round"/>',
    '  <circle cx="75" cy="25" r="10" fill="#2dd4bf"/>',
    "</svg>",
  ].join("\n")
);

async function makeIcon(size, file) {
  const pad = Math.round(size * 0.18);
  const ls = size - pad * 2;
  const logo = await sharp(logoSvg).resize(ls, ls).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, top: pad, left: pad }])
    .png()
    .toFile(path.join(publicDir, file));
  console.log("✅", file);
}

async function makeSplash(w, h, file) {
  const ls = Math.round(Math.min(w, h) * 0.22);
  const logo = await sharp(logoSvg).resize(ls, ls).png().toBuffer();
  const lt = Math.round(h * 0.36);
  const ll = Math.round((w - ls) / 2);
  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([{ input: logo, top: lt, left: ll }])
    .png()
    .toFile(path.join(publicDir, file));
  console.log("✅", file);
}

(async () => {
  console.log("🎨 Generando íconos PWA con el logo del sistema...\n");
  await makeIcon(192, "icon-192.png");
  await makeIcon(512, "icon-512.png");
  await makeSplash(1170, 2532, "splash-1170x2532.png");
  console.log("\n🚀 Listo. Reinstalá la PWA para ver los nuevos íconos.");
})().catch((e) => console.error("❌", e.message));
