// @ts-nocheck — Script obsoleto: Permiso ya no tiene TenantId (catálogo global desde v2)
/**
 * Script para asignar todos los permisos básicos a perfiles Administrador existentes
 * que no los tengan asignados.
 *
 * Permisos que se asignan:
 * - empleados:admin
 * - ventas
 * - caja
 * - clientes
 * - productos
 * - analiticas
 * - configuracion
 *
 * Uso: npx tsx scripts/asignar-permiso-admin.ts [tenantId]
 * Si no se especifica tenantId, se procesan todos los tenants.
 */

import prisma from "../src/DB/prisma";
import { PerfilTipo } from "../prisma/generated/prisma";

async function asignarPermisoAdmin(tenantId?: number) {
  try {
    const whereClause = tenantId
      ? {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          Tipo: PerfilTipo.ADMINISTRADOR,
        }
      : { EstaEliminado: false, Tipo: PerfilTipo.ADMINISTRADOR };

    // Buscar todos los perfiles Administrador
    const perfilesAdmin = await prisma.perfiles.findMany({
      where: whereClause,
      include: {
        PerfilPermiso: {
          include: {
            Permiso: true,
          },
        },
      },
    });

    console.log(`Encontrados ${perfilesAdmin.length} perfil(es) Administrador`);

    // Definir los permisos básicos que debe tener un administrador
    const permisosBasicos = [
      {
        clave: "empleados:admin",
        descripcion: "Administración completa de empleados",
      },
      { clave: "ventas", descripcion: "Acceso a ventas" },
      { clave: "caja", descripcion: "Acceso a caja" },
      { clave: "clientes", descripcion: "Acceso a clientes" },
      { clave: "productos", descripcion: "Acceso a productos" },
      { clave: "analiticas", descripcion: "Acceso a analíticas" },
      { clave: "configuracion", descripcion: "Acceso a configuración" },
    ];

    for (const perfil of perfilesAdmin) {
      console.log(
        `\nProcesando perfil "${perfil.Descripcion}" (Id: ${perfil.Id}, Tenant: ${perfil.TenantId})`,
      );

      let permisosAsignados = 0;
      let permisosYaExistentes = 0;

      // Procesar cada permiso básico
      for (const permisoData of permisosBasicos) {
        // Verificar si ya tiene el permiso
        const tienePermiso = perfil.PerfilPermiso.some(
          (pp: { Permiso: { Clave: string; EstaEliminado: boolean } }) =>
            pp.Permiso.Clave === permisoData.clave && !pp.Permiso.EstaEliminado,
        );

        if (tienePermiso) {
          permisosYaExistentes++;
          continue;
        }

        // Crear o buscar el permiso
        const permiso = await prisma.permiso.upsert({
          where: {
            Clave_TenantId: {
              Clave: permisoData.clave,
              TenantId: perfil.TenantId,
            },
          },
          update: { EstaEliminado: false },
          create: {
            Clave: permisoData.clave,
            Descripcion: permisoData.descripcion,
            TenantId: perfil.TenantId,
            EstaEliminado: false,
          },
        });

        // Verificar si el permiso ya está asignado al perfil
        const permisoAsignado = await prisma.perfilPermiso.findFirst({
          where: {
            PerfilId: perfil.Id,
            PermisoId: permiso.Id,
          },
        });

        // Asignar el permiso al perfil si no está asignado
        if (!permisoAsignado) {
          await prisma.perfilPermiso.create({
            data: {
              PerfilId: perfil.Id,
              PermisoId: permiso.Id,
              TenantId: perfil.TenantId,
            },
          });
          permisosAsignados++;
          console.log(`  ✓ Permiso "${permisoData.clave}" asignado`);
        }
      }

      if (
        permisosAsignados === 0 &&
        permisosYaExistentes === permisosBasicos.length
      ) {
        console.log(`  ✓ Todos los permisos ya estaban asignados`);
      } else {
        console.log(
          `  ✓ Asignados ${permisosAsignados} permiso(s) nuevo(s), ${permisosYaExistentes} ya existían`,
        );
      }
    }

    console.log("\n✅ Proceso completado");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
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

asignarPermisoAdmin(tenantId)
  .then(() => {
    console.log("Script ejecutado correctamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error ejecutando el script:", error);
    process.exit(1);
  });
