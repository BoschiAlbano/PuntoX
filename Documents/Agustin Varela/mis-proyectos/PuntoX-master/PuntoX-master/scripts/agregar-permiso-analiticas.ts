/**
 * Script para agregar el permiso "analiticas" a tenants existentes
 * 
 * Ejecutar con: npx tsx src/scripts/agregar-permiso-analiticas.ts
 */

import prisma from "@/DB/prisma";

async function agregarPermisoAnaliticas() {
  try {
    console.log("Buscando tenants...");

    // Obtener todos los tenants activos
    const tenants = await prisma.tenant.findMany({
      where: {
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Nombre: true,
      },
    });

    console.log(`Encontrados ${tenants.length} tenants`);

    for (const tenant of tenants) {
      const tenantIdBigInt = BigInt(tenant.Id);

      // Verificar si el permiso ya existe
      const permisoExistente = await prisma.permiso.findUnique({
        where: {
          Clave_TenantId: {
            Clave: "analiticas",
            TenantId: tenantIdBigInt,
          },
        },
      });

      if (permisoExistente) {
        console.log(`✓ Tenant "${tenant.Nombre}" (${tenant.Id}) ya tiene el permiso "analiticas"`);
        continue;
      }

      // Crear el permiso
      const permiso = await prisma.permiso.create({
        data: {
          Clave: "analiticas",
          Descripcion: "Acceso a analíticas",
          EstaEliminado: false,
          TenantId: tenantIdBigInt,
        },
      });

      console.log(`✓ Permiso "analiticas" creado para tenant "${tenant.Nombre}" (${tenant.Id})`);

      // Opcional: Agregar el permiso a todos los roles ADMINISTRADOR
      const rolesAdmin = await prisma.perfiles.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          Tipo: "ADMINISTRADOR",
        },
        select: {
          Id: true,
          Descripcion: true,
        },
      });

      for (const rol of rolesAdmin) {
        // Verificar si ya tiene el permiso
        const tienePermiso = await prisma.perfilPermiso.findUnique({
          where: {
            PerfilId_PermisoId: {
              PerfilId: rol.Id,
              PermisoId: permiso.Id,
            },
          },
        });

        if (!tienePermiso) {
          await prisma.perfilPermiso.create({
            data: {
              PerfilId: rol.Id,
              PermisoId: permiso.Id,
              TenantId: tenantIdBigInt,
            },
          });
          console.log(`  → Permiso agregado al rol "${rol.Descripcion}"`);
        }
      }
    }

    console.log("\n✓ Proceso completado");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
agregarPermisoAnaliticas();

