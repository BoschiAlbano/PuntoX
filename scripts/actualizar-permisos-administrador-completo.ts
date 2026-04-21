// @ts-nocheck — Script obsoleto: Permiso ya no tiene TenantId (catálogo global desde v2)
/**
 * Script para REMPLAZAR los permisos de todos los roles ADMINISTRADOR existentes
 * con la lista completa de permisos definida en PERMISSIONS.
 *
 * Uso: npx tsx scripts/actualizar-permisos-administrador-completo.ts [tenantId]
 */

import prisma from "../src/DB/prisma";
import { PerfilTipo } from "../prisma/generated/prisma";
import { PERMISSIONS } from "../src/lib/constants/comprobantes";

async function actualizarPermisosAdmin(tenantId?: number) {
  try {
    const whereClause = tenantId
      ? {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          Tipo: "ADMINISTRADOR" as PerfilTipo,
        }
      : { EstaEliminado: false, Tipo: "ADMINISTRADOR" as PerfilTipo };

    // Buscar todos los perfiles Administrador
    const perfilesAdmin = await prisma.perfiles.findMany({
      where: whereClause,
      include: {
        PerfilPermiso: true,
      },
    });

    console.log(
      `Encontrados ${perfilesAdmin.length} perfil(es) Administrador para actualizar.`,
    );

    // Obtener la lista completa de permisos nuevos
    const nuevosPermisos = Object.values(PERMISSIONS);
    console.log(`Se aplicarán ${nuevosPermisos.length} permisos a cada rol.`);

    for (const perfil of perfilesAdmin) {
      console.log(
        `\nProcesando rol "${perfil.Descripcion}" (Id: ${perfil.Id}, Tenant: ${perfil.TenantId})...`,
      );

      // Usar transacción para asegurar atomicidad por rol
      await prisma.$transaction(async (tx) => {
        const permisoIds: bigint[] = [];

        // 1. Asegurar que todos los permisos existan en la tabla Permiso para este Tenant
        for (const clavePermiso of nuevosPermisos) {
          const permiso = await tx.permiso.upsert({
            where: {
              Clave_TenantId: {
                Clave: clavePermiso,
                TenantId: perfil.TenantId,
              },
            },
            update: { EstaEliminado: false }, // Asegurar que no esté marcado como eliminado
            create: {
              Clave: clavePermiso,
              Descripcion: `Acceso a ${clavePermiso}`, // Descripción genérica, se puede mejorar
              TenantId: perfil.TenantId,
              EstaEliminado: false,
            },
          });
          permisoIds.push(permiso.Id);
        }

        // 2. Eliminar todas las relaciones existentes en PerfilPermiso para este rol
        const deleted = await tx.perfilPermiso.deleteMany({
          where: {
            PerfilId: perfil.Id,
            TenantId: perfil.TenantId,
          },
        });
        console.log(`  - Eliminados ${deleted.count} permisos anteriores.`);

        // 3. Crear las nuevas relaciones
        const datosCreacion = permisoIds.map((permisoId) => ({
          PerfilId: perfil.Id,
          PermisoId: permisoId,
          TenantId: perfil.TenantId,
        }));

        await tx.perfilPermiso.createMany({
          data: datosCreacion,
        });
        console.log(`  - Asignados ${datosCreacion.length} permisos nuevos.`);
      });
    }

    console.log("\n✅ Actualización de permisos completada exitosamente.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
const tenantIdArg = process.argv[2];
const tenantId = tenantIdArg ? Number(tenantIdArg) : undefined;

if (tenantIdArg && isNaN(Number(tenantIdArg))) {
  console.error("❌ El tenantId debe ser un número");
  process.exit(1);
}

actualizarPermisosAdmin(tenantId);
