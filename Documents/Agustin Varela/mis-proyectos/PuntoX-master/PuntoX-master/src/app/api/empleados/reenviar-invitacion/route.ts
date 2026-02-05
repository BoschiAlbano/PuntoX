import { NextRequest, NextResponse } from "next/server";
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import prisma from "@/DB/prisma";
import { z } from "zod";
import { handleError } from "@/lib/errors/handler";

const reenviarInvitacionSchema = z.object({
  email: z.string().email(),
  personaId: z.number(),
  usuarioId: z.number().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");

    const json = await req.json().catch(() => null);
    const parsed = reenviarInvitacionSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, personaId, usuarioId: usuarioAfectadoId } = parsed.data;
    const tenantIdBigInt = BigInt(tenantId);

    // Verificar que la persona existe y pertenece al tenant
    const persona = await prisma.persona.findFirst({
      where: {
        Id: BigInt(personaId),
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      include: {
        Persona_Empleado: {
          include: {
            Usuario: {
              where: { EstaEliminado: false },
              take: 1,
            },
          },
        },
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona no encontrada o no pertenece a este tenant" },
        { status: 404 }
      );
    }

    const empleado = persona.Persona_Empleado;
    if (!empleado) {
      return NextResponse.json(
        { error: "No se encontró información de empleado" },
        { status: 404 }
      );
    }

    // TODO: Aquí se implementaría el envío real del email de invitación
    // Por ahora, solo registramos la auditoría
    // Ejemplo de implementación futura:
    // const supabase = getSupabaseServiceClient();
    // await supabase.auth.admin.inviteUserByEmail(email, {
    //   data: { tenant_id: tenantId.toString() }
    // });

    // Registrar auditoría de reenvío
    await registrarAuditoria({
      tenantId: tenantIdBigInt,
      usuarioId,
      accion: "REENVIAR_INVITACION",
      empleadoId: empleado.Id,
      usuarioAfectadoId: usuarioAfectadoId ? BigInt(usuarioAfectadoId) : null,
      detalle: `Invitación reenviada a: ${persona.Nombre} ${persona.Apellido} (${email})`,
      req,
    });

    return NextResponse.json(
      { 
        message: "Invitación reenviada exitosamente",
        email,
        personaId: Number(persona.Id),
      },
      { status: 200 }
    );
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

