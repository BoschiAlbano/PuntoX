import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

// Este endpoint puede ser llamado diariamente por un CRON job (ej. Vercel Cron, EasyCron, etc)
// o de manera manual/oculta desde el frontend del superadmin al iniciar sesión por primera vez en el día.
export async function GET() {
  try {
    const today = new Date();

    // Buscar todos los tenants activos que ya tengan la fecha de vencimiento cumplida
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        EstaActivo: true,
        FechaVencimiento: {
          lte: today,
        },
      },
      select: {
        Id: true,
        Nombre: true,
        FechaVencimiento: true,
      },
    });

    if (expiredTenants.length === 0) {
      return NextResponse.json({ message: "No hay tiendas vencidas" });
    }

    // Obtener el TenantId del SuperAdmin (buscando un perfil SUPERADMIN)
    const superAdminProfile = await prisma.perfiles.findFirst({
      where: {
        Tipo: "SUPERADMIN" as any,
        EstaEliminado: false,
      },
      select: {
        TenantId: true,
      },
    });

    if (!superAdminProfile) {
      return NextResponse.json(
        { error: "No se encontró un perfil SuperAdmin" },
        { status: 500 }
      );
    }

    const superAdminTenantId = superAdminProfile.TenantId;
    let notificationsCreated = 0;

    for (const tenant of expiredTenants) {
      // Verificar si ya existe una notificación pendiente (no leída) para esta tienda
      const existingNotification = await prisma.notificacion.findFirst({
        where: {
          TenantId: superAdminTenantId,
          EntidadTipo: "TENANT",
          EntidadId: tenant.Id.toString(),
          Titulo: "Suscripción Vencida",
          Leida: false,
        },
      });

      if (!existingNotification) {
        await prisma.notificacion.create({
          data: {
            TenantId: superAdminTenantId,
            Tipo: "WARNING",
            Titulo: "Suscripción Vencida",
            Mensaje: `La suscripción de la tienda "${tenant.Nombre}" ha vencido el ${tenant.FechaVencimiento?.toLocaleDateString("es-AR")}. Revise su estado.`,
            EntidadTipo: "TENANT",
            EntidadId: tenant.Id.toString(),
            AccionUrl: `/admin/tenants/${tenant.Id}`,
          },
        });
        notificationsCreated++;
      }
    }

    return NextResponse.json({
      message: "Proceso completado",
      tenantsVencidos: expiredTenants.length,
      nuevasNotificaciones: notificationsCreated,
    });
  } catch (error) {
    return handleError(error);
  }
}
