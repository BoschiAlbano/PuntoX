// @ts-nocheck — Script obsoleto: Permiso ya no tiene TenantId (catálogo global desde v2)
import { PrismaClient } from "../prisma/generated/prisma";

const prisma = new PrismaClient();

/**
 * Script para verificar y corregir permisos faltantes en todos los tenants
 * Especialmente el permiso "empleados:admin" que parece no estar creándose
 */
async function main() {
  console.log("🔍 Verificando permisos en todos los tenants...\n");

  // Obtener todos los tenants activos
  const tenants = await prisma.tenant.findMany({
    where: { EstaEliminado: false },
    select: { Id: true, Nombre: true },
  });

  console.log(`📊 Encontrados ${tenants.length} tenants activos\n`);

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

  for (const tenant of tenants) {
    console.log(`\n🏢 Procesando tenant: ${tenant.Nombre} (ID: ${tenant.Id})`);

    // Buscar el perfil de administrador
    const perfilAdmin = await prisma.perfiles.findFirst({
      where: {
        TenantId: tenant.Id,
        Descripcion: "Administrador",
        EstaEliminado: false,
      },
    });

    if (!perfilAdmin) {
      console.log(
        `  ⚠️  No se encontró perfil "Administrador" para este tenant`,
      );
      continue;
    }

    console.log(`  ✅ Perfil Administrador encontrado (ID: ${perfilAdmin.Id})`);

    let permisosCreados = 0;
    let permisosAsignados = 0;

    for (const permisoData of permisosBasicos) {
      try {
        // Verificar si el permiso existe
        const permisoExistente = await prisma.permiso.findFirst({
          where: {
            Clave: permisoData.clave,
            TenantId: tenant.Id,
          },
        });

        let permiso;
        if (permisoExistente) {
          // Actualizar si está eliminado
          if (permisoExistente.EstaEliminado) {
            permiso = await prisma.permiso.update({
              where: { Id: permisoExistente.Id },
              data: { EstaEliminado: false },
            });
            console.log(`  🔄 Permiso "${permisoData.clave}" reactivado`);
          } else {
            permiso = permisoExistente;
          }
        } else {
          // Crear el permiso si no existe
          permiso = await prisma.permiso.create({
            data: {
              Clave: permisoData.clave,
              Descripcion: permisoData.descripcion,
              TenantId: tenant.Id,
              EstaEliminado: false,
            },
          });
          console.log(`  ➕ Permiso "${permisoData.clave}" creado`);
          permisosCreados++;
        }

        // Verificar si el permiso está asignado al perfil
        const permisoAsignado = await prisma.perfilPermiso.findFirst({
          where: {
            PerfilId: perfilAdmin.Id,
            PermisoId: permiso.Id,
          },
        });

        if (!permisoAsignado) {
          // Asignar el permiso al perfil
          await prisma.perfilPermiso.create({
            data: {
              PerfilId: perfilAdmin.Id,
              PermisoId: permiso.Id,
              TenantId: tenant.Id,
            },
          });
          console.log(
            `  🔗 Permiso "${permisoData.clave}" asignado al perfil Administrador`,
          );
          permisosAsignados++;
        }
      } catch (error) {
        console.error(
          `  ❌ Error procesando permiso "${permisoData.clave}":`,
          error,
        );
      }
    }

    console.log(
      `  📈 Resumen: ${permisosCreados} permisos creados, ${permisosAsignados} permisos asignados`,
    );

    // Actualizar permisos en JWT de todos los usuarios con este perfil
    const usuariosConPerfil = await prisma.perfilUsuario.findMany({
      where: {
        Perfil_Id: perfilAdmin.Id,
        TenantId: tenant.Id,
      },
      include: {
        Usuario: {
          select: {
            AuthUserId: true,
          },
        },
      },
    });

    if (usuariosConPerfil.length > 0) {
      console.log(
        `  🔄 Se encontraron ${usuariosConPerfil.length} usuario(s) con este perfil`,
      );
      console.log(
        `  💡 Nota: Los usuarios necesitarán cerrar sesión y volver a iniciar sesión para actualizar sus permisos en el JWT`,
      );
    }
  }

  console.log("\n✅ Verificación completada");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
