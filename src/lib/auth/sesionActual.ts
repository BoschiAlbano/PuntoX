import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/**
 * session_id de Supabase de la sesión que hace el pedido (claim del access
 * token). Es estable durante toda la sesión: no cambia al refrescar el token.
 * Devuelve null si no hay sesión o el token no se puede leer.
 */
export async function supabaseSessionIdActual(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

/** EntidadId del aviso de dispositivo nuevo generado por una sesión. */
export const entidadAvisoNuevoDispositivo = (supabaseSessionId: string) =>
  `NUEVO_DISPOSITIVO:${supabaseSessionId}`;
