/**
 * Layout HTML de los emails propios de la app (mismo diseño que las
 * plantillas de Supabase Auth en docs/email-templates/).
 * HTML con tablas y estilos inline para compatibilidad con clientes de correo.
 */

const FONT_TITULO = "'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif";
const FONT_TEXTO = "Inter,'Segoe UI',Helvetica,Arial,sans-serif";
const SITE_URL = "https://www.puntox.com.ar";

/** Escapa texto dinámico antes de insertarlo en el HTML. */
export function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailLayoutOptions {
  /** Texto oculto que muestran los clientes de correo junto al asunto. */
  preheader: string;
  titulo: string;
  /** Párrafos ya escapados (pueden incluir <strong>). */
  parrafosHtml: string[];
  /** Tabla de datos etiqueta/valor (texto plano, se escapan). */
  datos?: DatoEmail[];
  cta?: { label: string; url: string };
  /** Notas al pie de la tarjeta (texto plano, se escapan). */
  notas?: string[];
}

export interface DatoEmail {
  label: string;
  valor: string;
  /** Resalta el valor: "alerta" en rojo, "ok" en verde. */
  tono?: "alerta" | "ok";
  /** Fila separadora con el label como subtítulo (sin valor). */
  seccion?: boolean;
}

const COLOR_TONO = { alerta: "#ba1a1a", ok: "#047857" } as const;

function renderDatos(datos: DatoEmail[]): string {
  if (datos.length === 0) return "";
  const filas = datos
    .map((d) =>
      d.seccion
        ? `<tr><td colspan="2" style="padding:14px 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#5f6371;">${escapeHtml(d.label)}</td></tr>`
        : `<tr>
  <td style="padding:8px 0;border-bottom:1px solid #ebeef2;font-size:14px;line-height:20px;color:#424656;">${escapeHtml(d.label)}</td>
  <td align="right" style="padding:8px 0;border-bottom:1px solid #ebeef2;font-size:14px;line-height:20px;font-weight:700;color:${d.tono ? COLOR_TONO[d.tono] : "#181c1f"};white-space:nowrap;">${escapeHtml(d.valor)}</td>
</tr>`,
    )
    .join("\n");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">${filas}</table>`;
}

export function renderEmailLayout({
  preheader,
  titulo,
  parrafosHtml,
  datos = [],
  cta,
  notas = [],
}: EmailLayoutOptions): string {
  const parrafos = parrafosHtml
    .map(
      (p, i) =>
        `<p style="margin:0 0 ${i === parrafosHtml.length - 1 ? 24 : 12}px 0;font-size:15px;line-height:24px;color:#424656;">${p}</p>`,
    )
    .join("\n");

  const boton = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
  <tr>
    <td align="center" bgcolor="#0050cb" style="border-radius:10px;">
      <a href="${escapeHtml(cta.url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_TITULO};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(cta.label)}</a>
    </td>
  </tr>
</table>`
    : "";

  const notasHtml = notas
    .map(
      (n) =>
        `<p style="margin:0 0 8px 0;font-size:13px;line-height:20px;color:#5f6371;">${escapeHtml(n)}</p>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f4f8;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f4f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 20px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${SITE_URL}/icon-192.png" width="36" height="36" alt="" style="display:block;border:0;">
                  </td>
                  <td style="vertical-align:middle;font-family:${FONT_TITULO};font-size:22px;font-weight:800;color:#181c1f;letter-spacing:-0.3px;">PuntoX</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e0e3e7;border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;line-height:4px;font-size:0;background-color:#FF6100;border-radius:16px 16px 0 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:36px 40px 32px 40px;font-family:${FONT_TEXTO};">
                    <h1 style="margin:0 0 12px 0;font-family:${FONT_TITULO};font-size:24px;line-height:32px;font-weight:700;color:#181c1f;">${escapeHtml(titulo)}</h1>
                    ${parrafos}
                    ${renderDatos(datos)}
                    ${boton}
                    ${notasHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 16px 0 16px;font-family:${FONT_TEXTO};font-size:12px;line-height:18px;color:#5f6371;">
              Este es un email automático de PuntoX, por favor no lo respondas.<br>
              <a href="${SITE_URL}" target="_blank" style="color:#5f6371;text-decoration:underline;">www.puntox.com.ar</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
