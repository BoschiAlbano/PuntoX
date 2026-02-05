import { PrismaClient } from "../prisma/generated/prisma";

const prisma = new PrismaClient();

/**
 * Script para verificar qué permisos tiene asignados el perfil de administrador
 */
async function main() {
  console.log("🔍 Verificando permisos del perfil Administrador...\n");

  // Obtener todos los tenants activos
  const tenants = await prisma.tenant.findMany({
    where: { EstaEliminado: false },
    select: { Id: true, Nombre: true },
  });

  for (const tenant of tenants) {
    console.log(`\n🏢 Tenant: ${tenant.Nombre} (ID: ${tenant.Id})`);
    
    // Buscar el perfil de administrador
    const perfilAdmin = await prisma.perfiles.findFirst({
      where: {
        TenantId: tenant.Id,
        Descripcion: "Administrador",
        EstaEliminado: false,
      },
      include: {
        PerfilPermiso: {
          include: {
            Permiso: {
              select: {
                Id: true,
                Clave: true,
                Descripcion: true,
                EstaEliminado: true,
              },
            },
          },
        },
      },
    });

    if (!perfilAdmin) {
      console.log(`  ⚠️  No se encontró perfil "Administrador"`);
      continue;
    }

    console.log(`  ✅ Perfil Administrador (ID: ${perfilAdmin.Id})`);
    console.log(`  📋 Permisos asignados (${perfilAdmin.PerfilPermiso.length}):`);

    if (perfilAdmin.PerfilPermiso.length === 0) {
      console.log(`     ⚠️  No hay permisos asignados`);
    } else {
      perfilAdmin.PerfilPermiso.forEach((pp) => {
        const estado = pp.Permiso.EstaEliminado ? "❌ ELIMINADO" : "✅";
        console.log(`     ${estado} ${pp.Permiso.Clave} - ${pp.Permiso.Descripcion || "Sin descripción"}`);
      });
    }

    // Verificar si falta el permiso empleados:admin
    const tieneEmpleadosAdmin = perfilAdmin.PerfilPermiso.some(
      (pp) => pp.Permiso.Clave === "empleados:admin" && !pp.Permiso.EstaEliminado
    );

    if (!tieneEmpleadosAdmin) {
      console.log(`  ⚠️  FALTA el permiso "empleados:admin"`);
      
      // Verificar si el permiso existe pero no está asignado
      const permisoEmpleados = await prisma.permiso.findFirst({
        where: {
          Clave: "empleados:admin",
          TenantId: tenant.Id,
        },
      });

      if (permisoEmpleados) {
        console.log(`  💡 El permiso existe pero no está asignado al perfil`);
      } else {
        console.log(`  💡 El permiso no existe en la base de datos`);
      }
    } else {
      console.log(`  ✅ Tiene el permiso "empleados:admin"`);
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

