import { cookies } from "next/headers";

/** Prefijo con que @supabase/ssr (>= 0.6, cookieEncoding "base64url") guarda la sesión. */
const BASE64_PREFIX = "base64-";

/**
 * Lee el session_id de Supabase desde las cookies de autenticación
 * (sb-<ref>-auth-token, posiblemente partida en .0, .1, ...).
 *
 * Soporta los dos formatos de @supabase/ssr: JSON plano (versiones viejas) y
 * "base64-<base64url(JSON)>" (default desde 0.6). Antes solo se leía el JSON
 * plano, así que el session_id nunca se encontraba.
 *
 * No llama a getSession(): no refresca el token ni escribe cookies.
 */
export function sessionIdDesdeCookies(
  todas: Array<{ name: string; value: string }>,
): string | null {
  const partes = todas
    .filter((c) => c.name.startsWith("sb-") && /-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => {
      // "...-auth-token" (sin sufijo) primero, después .0, .1, .2 ...
      const n = (s: string) => Number(s.match(/\.(\d+)$/)?.[1] ?? -1);
      return n(a.name) - n(b.name);
    });
  if (partes.length === 0) return null;

  let valor = partes.map((c) => c.value).join("");
  try {
    if (valor.startsWith(BASE64_PREFIX)) {
      valor = Buffer.from(valor.slice(BASE64_PREFIX.length), "base64url").toString("utf8");
    }
    const sesion = JSON.parse(valor);
    const accessToken: unknown = sesion?.access_token ?? sesion?.[0]?.access_token;
    if (typeof accessToken !== "string") return null;
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
    );
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

/** session_id de Supabase de la sesión que hace el pedido (Route Handlers). */
export async function supabaseSessionIdActual(): Promise<string | null> {
  try {
    const store = await cookies();
    return sessionIdDesdeCookies(store.getAll());
  } catch {
    return null;
  }
}

/** EntidadId del aviso de dispositivo nuevo generado por una sesión. */
export const entidadAvisoNuevoDispositivo = (supabaseSessionId: string) =>
  `NUEVO_DISPOSITIVO:${supabaseSessionId}`;
