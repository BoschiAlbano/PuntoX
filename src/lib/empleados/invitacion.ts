/**
 * Invitaciones de empleados por email (Supabase Auth, plantilla "Invite user").
 *
 * El link del email apunta a /auth/confirm?type=invite, que abre
 * /restablecer-contrasena?modo=invitacion para que el empleado elija su
 * contraseña. `username` y `comercio` viajan en user_metadata y la plantilla
 * los muestra ({{ .Data.username }}, {{ .Data.comercio }}), porque el login
 * de PuntoX es por nombre de usuario.
 */
import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";

export interface DatosInvitacion {
  email: string;
  username: string;
  comercio: string;
}

function esEmailYaRegistrado(error: { code?: string; message?: string; status?: number }) {
  const msg = error.message?.toLowerCase() ?? "";
  return (
    error.code === "email_exists" ||
    error.status === 422 ||
    msg.includes("already been registered") ||
    msg.includes("email address has already")
  );
}

export type ResultadoInvitacion =
  | { ok: true; user: User }
  | { ok: false; motivo: "email_registrado" | "error"; mensaje?: string };

/** Crea el usuario de Auth y le envía el email de invitación. */
export async function invitarEmpleado({
  email,
  username,
  comercio,
}: DatosInvitacion): Promise<ResultadoInvitacion> {
  const { data, error } =
    await getSupabaseServiceClient().auth.admin.inviteUserByEmail(email, {
      data: { username, comercio },
    });

  if (error || !data?.user) {
    if (error && esEmailYaRegistrado(error)) {
      return { ok: false, motivo: "email_registrado" };
    }
    return { ok: false, motivo: "error", mensaje: error?.message };
  }
  return { ok: true, user: data.user };
}

export type ResultadoReenvio =
  | { ok: true; via: "invitacion" | "recuperacion" }
  | { ok: false; motivo: "ya_activo" | "sin_email" | "error"; mensaje?: string };

/**
 * Reenvía la invitación a un usuario que todavía no la aceptó.
 * Si Supabase rechaza la reinvitación (usuario ya existente), envía un link
 * para elegir contraseña por el flujo de recuperación, que también lleva a
 * /restablecer-contrasena.
 */
export async function reenviarInvitacionEmpleado(
  user: Pick<User, "email" | "email_confirmed_at">,
  datos: Omit<DatosInvitacion, "email">,
): Promise<ResultadoReenvio> {
  const email = user.email?.toLowerCase();
  if (!email) return { ok: false, motivo: "sin_email" };
  if (user.email_confirmed_at) return { ok: false, motivo: "ya_activo" };

  const invitacion = await invitarEmpleado({ email, ...datos });
  if (invitacion.ok) return { ok: true, via: "invitacion" };
  if (invitacion.motivo === "error") {
    return { ok: false, motivo: "error", mensaje: invitacion.mensaje };
  }

  // Fallback: link de recuperación (plantilla "Reset Password").
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { error } = await anon.auth.resetPasswordForEmail(email);
  if (error) return { ok: false, motivo: "error", mensaje: error.message };
  return { ok: true, via: "recuperacion" };
}
