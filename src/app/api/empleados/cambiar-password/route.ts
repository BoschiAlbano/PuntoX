import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { PERMISSIONS } from "@/lib/constants/comprobantes";

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
    } = await getAuthContext({
      req,
      permission: PERMISSIONS.EMPLEADOS,
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
    // Permitir si es el mismo usuario O si tiene permiso de admin
    const isSelf = currentUserIdBig === targetUserIdBig;
    const canChangeOthers =
      isSuperAdmin || permissions.includes(PERMISSIONS.EMPLEADOS);

    const hasPermission = isSelf || canChangeOthers;

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "No tiene permisos para cambiar la contraseña de otro usuario",
        },
        { status: 403 },
      );
    }

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

    return NextResponse.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    return handleError(error);
  }
}
