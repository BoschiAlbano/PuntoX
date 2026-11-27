import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { aplicarLimites, ipDelCliente, LIMITES_AUTH } from "@/lib/rateLimit";
import {
  registrarIntentoFallido,
  selectUsuarioIntentos,
} from "@/lib/auth/intentosFallidos";

const bodySchema = z.object({
  username: z.string().trim().min(2).max(100),
  password: z.string().min(1).max(200),
});

const CREDENCIALES_INVALIDAS = "Nombre de usuario o contraseña incorrectos";
const CUENTA_BLOQUEADA =
  "Tu cuenta está bloqueada. Contactá al administrador para recuperar el acceso.";

const responder = (status: number, error: string, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status });

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Response 200: { access_token, refresh_token } (el navegador los guarda con
 * supabase.auth.setSession, que escribe las mismas cookies que antes).
 *
 * El login pasa por acá (y no directo del navegador a Supabase) para que:
 * - el bloqueo por intentos fallidos se aplique de verdad;
 * - el email de la cuenta nunca salga del servidor (antes había que
 *   pedirlo a una ruta pública con el nombre de usuario);
 * - haya límite de pedidos por IP y por usuario.
 *
 * Usuario inexistente y contraseña incorrecta responden lo mismo (401).
 * Una cuenta bloqueada solo se informa si la contraseña es correcta, o si
 * este mismo intento la bloqueó.
 */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return responder(400, "Ingresá tu nombre de usuario y contraseña");
  }
  const username = parsed.data.username.toLowerCase();
  const { password } = parsed.data;
  const ip = ipDelCliente(req);

  const limitado = await aplicarLimites([
    { regla: LIMITES_AUTH.loginIp, valor: ip },
    { regla: LIMITES_AUTH.loginUsuario, valor: username },
  ]);
  if (limitado) return limitado;

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { Nombre: username, EstaEliminado: false },
      select: { ...selectUsuarioIntentos, AuthUserId: true },
    });
    if (!usuario) return responder(401, CREDENCIALES_INVALIDAS);

    // Supabase Auth es la fuente de verdad del email (real o interno).
    const admin = getSupabaseServiceClient();
    const { data: authUser } = await admin.auth.admin.getUserById(usuario.AuthUserId);
    const email = authUser?.user?.email;
    if (!email) return responder(401, CREDENCIALES_INVALIDAS);

    // Cliente sin sesión propia. Con la clave secreta, Supabase acepta la IP
    // real del usuario en Sb-Forwarded-For para sus propios límites (si está
    // habilitado en el proyecto); si no, ignora el header.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { "Sb-Forwarded-For": ip } },
      },
    );
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      if (error?.status === 429) {
        return responder(429, "Demasiados intentos. Probá de nuevo en unos minutos.");
      }
      if (error?.code === "invalid_credentials" || error?.message === "Invalid login credentials") {
        const { bloqueado } = await registrarIntentoFallido(usuario, username, req);
        return bloqueado
          ? responder(403, CUENTA_BLOQUEADA, { bloqueado: true })
          : responder(401, CREDENCIALES_INVALIDAS);
      }
      if (error?.code === "email_not_confirmed") {
        return responder(403, "Tu cuenta todavía no está activada. Revisá el email de invitación.");
      }
      console.error("[login] Error de Supabase Auth:", error?.code, error?.message);
      return responder(500, "No se pudo iniciar sesión. Probá de nuevo.");
    }

    if (usuario.EstaBloqueado) {
      // La contraseña es correcta pero la cuenta está bloqueada: se cierra la
      // sesión recién creada para que el token no quede vivo.
      await admin.auth.admin.signOut(data.session.access_token, "local").catch(() => {});
      return responder(403, CUENTA_BLOQUEADA, { bloqueado: true });
    }

    if (usuario.IntentosFallidos > 0) {
      await prisma.usuario.update({
        where: { Id: usuario.Id },
        data: { IntentosFallidos: 0, FechaUltimoIntento: null },
      });
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error("[login] Error inesperado:", error);
    return responder(500, "No se pudo iniciar sesión. Probá de nuevo.");
  }
}
