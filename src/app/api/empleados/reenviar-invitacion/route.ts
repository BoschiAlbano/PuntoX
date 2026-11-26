import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { handleError } from "@/lib/errors/handler";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { esEmailInterno } from "@/lib/auth/generateInternalEmail";
import { reenviarInvitacionEmpleado } from "@/lib/empleados/invitacion";

const schema = z.object({
  usuarioId: z.union([z.number(), z.string()]).transform(Number),
});

/**
 * POST /api/empleados/reenviar-invitacion  { usuarioId }
 *
 * Reenvía el email para que el empleado elija su contraseña, si todavía no
 * activó su cuenta. Responde 409 si ya la activó (debe usar "¿Olvidaste tu
 * contraseña?") y 400 si no tiene un email real.
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioAccionId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS,
    });

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || !Number.isInteger(parsed.data.usuarioId)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const tenantIdBigInt = BigInt(tenantId);
    const usuario = await prisma.usuario.findFirst({
      where: {
        Id: BigInt(parsed.data.usuarioId),
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Nombre: true,
        AuthUserId: true,
        EmpleadoId: true,
        Tenant: { select: { Nombre: true } },
      },
    });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { data: authData } =
      await getSupabaseServiceClient().auth.admin.getUserById(usuario.AuthUserId);
    const authUser = authData?.user;
    if (!authUser || esEmailInterno(authUser.email)) {
      return NextResponse.json(
        { error: "El empleado no tiene un email real. Cambiale la contraseña desde la lista de empleados." },
        { status: 400 },
      );
    }

    const resultado = await reenviarInvitacionEmpleado(authUser, {
      username: usuario.Nombre,
      comercio: usuario.Tenant.Nombre,
    });

    if (!resultado.ok) {
      if (resultado.motivo === "ya_activo") {
        return NextResponse.json(
          { error: "El empleado ya activó su cuenta. Si olvidó la contraseña, puede usar \"¿Olvidaste tu contraseña?\" en el login." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "No se pudo enviar la invitación. Probá de nuevo en unos minutos." },
        { status: 502 },
      );
    }

    await registrarAuditoria({
      tenantId: tenantIdBigInt,
      usuarioId: usuarioAccionId,
      accion: "REENVIAR_INVITACION",
      empleadoId: usuario.EmpleadoId,
      usuarioAfectadoId: usuario.Id,
      detalle: `Invitación reenviada a ${usuario.Nombre} (${authUser.email})`,
      req,
    });

    return NextResponse.json({
      message: `Invitación reenviada a ${authUser.email}`,
      email: authUser.email,
    });
  } catch (error) {
    return handleError(error);
  }
}
