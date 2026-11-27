import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Imagen que muestran WhatsApp, LinkedIn, X, etc. al compartir el link
 * (1200x630). Reemplaza a public/og-image.png, que era una captura chica
 * (634x353) declarada como 1200x630.
 */
export const alt =
  "Punto X — Sistema de gestión para comercios: ventas, stock, caja y facturación ARCA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AZUL_NOCHE = "#0f2233";
const ACENTO = "#0066ff";

const ETIQUETAS = ["Punto de venta", "Stock por sucursal", "Caja", "Facturación ARCA"];
const TITULO = ["Gestioná tu comercio", "en un solo lugar"];
const BAJADA =
  "Ventas, stock, caja, clientes y facturación electrónica para comercios de Argentina.";

/**
 * Fuente de Google en TTF, solo con los caracteres de `texto` (como la landing:
 * Plus Jakarta Sans en títulos, Inter en texto). Si falla, null: se usa la
 * fuente por defecto de next/og.
 */
async function fuenteGoogle(familia: string, peso: number, texto: string) {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${familia}:wght@${peso}&text=${encodeURIComponent(texto)}`,
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/puntox-isotipo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const textoTitulos = ["Punto X", ...TITULO, "puntox.com.ar"].join("");
  const textoCuerpo = [BAJADA, ...ETIQUETAS].join("");
  const [jakarta, inter] = await Promise.all([
    fuenteGoogle("Plus+Jakarta+Sans", 800, textoTitulos),
    fuenteGoogle("Inter", 400, textoCuerpo),
  ]);
  const fonts = [
    ...(jakarta ? [{ name: "Jakarta", data: jakarta, weight: 800 as const, style: "normal" as const }] : []),
    ...(inter ? [{ name: "Inter", data: inter, weight: 400 as const, style: "normal" as const }] : []),
  ];
  const titulos = jakarta ? "Jakarta" : undefined;
  const cuerpo = inter ? "Inter" : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: AZUL_NOCHE,
          backgroundImage:
            "radial-gradient(circle at 92% 8%, rgba(0,102,255,0.35), transparent 45%)",
          color: "#ffffff",
          fontFamily: cuerpo,
        }}
      >
        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={86} height={72} alt="" />
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: -1, fontFamily: titulos }}>
            Punto X
          </div>
        </div>

        {/* Mensaje */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 70,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -2,
              fontFamily: titulos,
            }}
          >
            {TITULO.map((linea) => (
              <div key={linea} style={{ display: "flex" }}>
                {linea}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#b9c6d8", maxWidth: 900 }}>
            {BAJADA}
          </div>
        </div>

        {/* Pie */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {ETIQUETAS.map((etiqueta) => (
              <div
                key={etiqueta}
                style={{
                  display: "flex",
                  fontSize: 22,
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#dbe4f0",
                }}
              >
                {etiqueta}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 800,
              fontFamily: titulos,
              padding: "12px 22px",
              borderRadius: 12,
              backgroundColor: ACENTO,
            }}
          >
            puntox.com.ar
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
