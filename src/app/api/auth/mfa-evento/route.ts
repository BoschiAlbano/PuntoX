import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { handleError } from "@/lib/errors/handler";
import { notificarCambio2FA } from "@/lib/notificaciones/seguridad";

const schema = z.object({ evento: z.enum(["activado", "desactivado"]) });

/**
 * POST /api/auth/mfa-evento  { evento: "activado" | "desactivado" }
 *
 * El 2FA se activa/desactiva desde el navegador (MfaSetup, Supabase MFA).
 * Después, MfaSetup avisa acá para crear la notificación. Antes de notificar
 * se verifica en Supabase el estado real de los factores del usuario, así no
 * se pueden generar avisos falsos.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: factores } = await supabase.auth.mfa.listFactors();
    const tiene2FA = (factores?.totp ?? []).length > 0; // solo factores verificados
    const activado = parsed.data.evento === "activado";
    if (activado !== tiene2FA) {
      return NextResponse.json(
        { error: "El estado de la verificación en dos pasos no coincide" },
        { status: 409 },
      );
    }

    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: { Id: true, TenantId: true, Nombre: true },
    });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    await notificarCambio2FA({
      tenantId: usuario.TenantId,
      usuarioId: usuario.Id,
      username: usuario.Nombre,
      activado,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
