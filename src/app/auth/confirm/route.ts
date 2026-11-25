import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

/** Tipos de link de email que acepta esta ruta y su destino por defecto. */
const DEFAULT_NEXT: Partial<Record<EmailOtpType, string>> = {
  recovery: "/restablecer-contrasena",
  invite: "/restablecer-contrasena",
  signup: "/dashboard",
  email_change: "/dashboard",
  email: "/dashboard",
};

/** Solo rutas internas: evita redirecciones abiertas a otros dominios. */
function safeNext(next: string | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}

/**
 * GET /auth/confirm?token_hash=...&type=recovery&next=/restablecer-contrasena
 *
 * Destino de los links de las plantillas de email de Supabase. Valida el
 * token con verifyOtp (funciona aunque el email se abra en otro dispositivo),
 * guarda la sesión en cookies y redirige a `next`.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const fallbackError = "/recuperar-contrasena?error=link_invalido";

  if (!tokenHash || !type || !(type in DEFAULT_NEXT)) {
    redirect(fallbackError);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    redirect(fallbackError);
  }

  // redirect() de next/navigation: incluye las cookies de sesión que
  // verifyOtp escribió vía cookies() (patrón del ejemplo oficial de Supabase).
  redirect(safeNext(searchParams.get("next"), DEFAULT_NEXT[type]!));
}
