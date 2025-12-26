import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";
import { handleError } from "@/lib/errors/handler";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";

const cambiarPasswordSchema = z.object({
  usuarioId: z.union([z.number(), z.string()]),
  nuevaPassword: z.string().min(8),
});

export async function PUT(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioIdAccion } = await requirePermiso("empleados:admin");

    const json = await req.json().catch(() => null);
    const parsed = cambiarPasswordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const usuarioIdNum = Number(parsed.data.usuarioId);
    if (!Number.isInteger(usuarioIdNum)) {
      return NextResponse.json({ error: "Usuario invalido" }, { status: 400 });
    }

    const tenantIdBig = BigInt(tenantId);
    const usuarioIdBig = BigInt(usuarioIdNum);

    // Obtener usuario y empleado para auditoría
    const usuario = await prisma.usuario.findFirst({
      where: { Id: usuarioIdBig, TenantId: tenantIdBig, EstaEliminado: false },
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
        { status: 404 }
      );
    }

    // Actualizar contraseña en Supabase Auth
    const supabase = getSupabaseServiceClient();
    const { error: authError } = await supabase.auth.admin.updateUserById(
      usuario.AuthUserId,
      {
        password: parsed.data.nuevaPassword,
      }
    );

    if (authError) {
      console.error("Error al actualizar contraseña en Supabase:", authError);
      return NextResponse.json(
        { error: "No se pudo actualizar la contraseña" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    await registrarAuditoria({
      tenantId,
      usuarioId: usuarioIdAccion,
      accion: "CAMBIAR_PASSWORD",
      empleadoId: usuario.Persona_Empleado?.Id || null,
      usuarioAfectadoId: usuario.Id,
      detalle: `Contraseña cambiada para: ${usuario.Persona_Empleado?.Persona.Nombre || ""} ${usuario.Persona_Empleado?.Persona.Apellido || ""}`,
      req,
    });

    return NextResponse.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return handleError(error);
  }
}





