import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { esEmailInterno } from "@/lib/auth/generateInternalEmail";

const bodySchema = z.object({
  username: z.string().trim().min(2).max(100),
});

/**
 * Respuesta única para todos los casos válidos: no revela si el usuario
 * existe, si tiene email real o si está bloqueado (anti-enumeración).
 */
const GENERIC_RESPONSE = {
  ok: true,
  message:
    "Si el usuario existe y tiene un email registrado, te enviamos un link para restablecer la contraseña.",
};

/**
 * POST /api/auth/recuperar-contrasena
 * Body: { username }
 *
 * Busca el email real del usuario (en Supabase Auth, fuente de verdad) y pide
 * a Supabase que envíe el email de recuperación (plantilla "Reset Password").
 * El link de la plantilla apunta a /auth/confirm (verifyOtp con token_hash).
 *
 * No envía nada si: el usuario no existe, está eliminado o bloqueado, no tiene
 * cuenta de Auth, o su email es interno (@puntox.com).
 */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ingresá tu nombre de usuario" },
      { status: 400 },
    );
  }

  const username = parsed.data.username.toLowerCase();

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { Nombre: username, EstaEliminado: false },
      select: { AuthUserId: true, EstaBloqueado: true },
    });

    if (!usuario?.AuthUserId || usuario.EstaBloqueado) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const { data: authUser, error: authError } =
      await getSupabaseServiceClient().auth.admin.getUserById(
        usuario.AuthUserId,
      );
    const email = authUser?.user?.email?.toLowerCase();

    if (authError || !email || esEmailInterno(email)) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // Cliente anónimo sin sesión: solo dispara el envío del email.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
      // Ej.: límite de envíos. Se registra pero no se expone al cliente.
      console.error(
        "[recuperar-contrasena] Supabase no pudo enviar el email:",
        resetError.message,
      );
    }
  } catch (error) {
    console.error("[recuperar-contrasena] Error inesperado:", error);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
