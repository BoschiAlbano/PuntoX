import { NextRequest, NextResponse } from "next/server";
import { notificarPasswordCambiadaPorAdmin } from "@/lib/notificaciones/seguridad";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import { assertPuedeActuarSobreDueno } from "@/lib/tenant/dueno";

const cambiarPasswordSchema = z.object({
  usuarioId: z.union([z.number(), z.string()]),
  nuevaPassword: z.string().min(8),
});

export async function PUT(req: NextRequest) {
  try {
    const {
      tenantId,
      usuarioId: currentUserId,
      permissions,
      isSuperAdmin,
      isAdministrador,
    } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS,
    });

    const json = await req.json().catch(() => null);
    const parsed = cambiarPasswordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const { usuarioId, nuevaPassword } = parsed.data;
    const targetUserId = Number(usuarioId);
    if (!Number.isInteger(targetUserId)) {
      return NextResponse.json({ error: "Usuario invalido" }, { status: 400 });
    }

    const tenantIdBig = BigInt(tenantId);
    const targetUserIdBig = BigInt(targetUserId);
    const currentUserIdBig = BigInt(currentUserId);

    // Verificar permisos
    // Permitir si es el mismo usuario, o si puede escribir sobre empleados.
    // El Administrador tiene acceso completo por su Tipo y su perfil NO lleva
    // permisos explícitos (ver register-tenant.ts), por eso se chequea aparte.
    const isSelf = currentUserIdBig === targetUserIdBig;
    const canChangeOthers =
      isSuperAdmin ||
      isAdministrador ||
      permissions.includes(SET_PERMISSIONS.EMPLEADOS);

    const hasPermission = isSelf || canChangeOthers;

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "No tiene permisos para cambiar la contraseña de otro usuario",
        },
        { status: 403 },
      );
    }

    // La contraseña del dueño solo la cambia él mismo (o el superadmin)
    await assertPuedeActuarSobreDueno({
      tenantId,
      usuarioAfectadoId: targetUserIdBig,
      actorId: currentUserIdBig,
      isSuperAdmin,
      accion: "cambiarle la contraseña",
    });

    const usuario = await prisma.usuario.findFirst({
      where: {
        Id: targetUserIdBig,
        TenantId: tenantIdBig,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        AuthUserId: true,
        Persona_Empleado: {
          select: {
            Id: true,
            Persona: {
              select: {
                Nombre: true,
                Apellido: true,
                Mail: true,
              },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.AuthUserId) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const supabase = getSupabaseServiceClient();
    const { error: authError } = await supabase.auth.admin.updateUserById(
      usuario.AuthUserId,
      {
        password: nuevaPassword,
      },
    );

    if (authError) {
      return NextResponse.json(
        {
          error: "No se pudo actualizar la contraseña",
          details: authError.message,
        },
        { status: 500 },
      );
    }

    await registrarAuditoria({
      tenantId: tenantIdBig,
      usuarioId: currentUserId,
      accion: "CAMBIAR_PASSWORD",
      empleadoId: usuario.Persona_Empleado?.Id || null,
      usuarioAfectadoId: usuario.Id,
      detalle: isSelf
        ? "El usuario cambió su propia contraseña"
        : `Cambio de contraseña realizado por usuario ${currentUserId} para usuario ${targetUserId}`,
      req,
    });

    // Si la cambió otra persona (admin), se le avisa al usuario afectado.
    if (!isSelf) {
      const quien = await prisma.usuario.findFirst({
        where: { Id: currentUserIdBig, TenantId: tenantIdBig },
        select: { Nombre: true },
      });
      await notificarPasswordCambiadaPorAdmin({
        tenantId: tenantIdBig,
        usuarioAfectadoId: usuario.Id,
        cambiadaPor: quien?.Nombre ? `El administrador "${quien.Nombre}"` : "Un administrador",
      });
    }

    return NextResponse.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    return handleError(error);
  }
}
