import { PrismaClient } from "../prisma/generated/prisma";
import { actualizarPermisosEnJWT } from "../src/lib/auth/updateUserPermissions";

const prisma = new PrismaClient();

/**
 * Script para actualizar los permisos en el JWT de todos los administradores
 * Esto es útil cuando se crean nuevos permisos o se modifican roles
 */
async function main() {
  console.log("🔍 Actualizando permisos en JWT de administradores...\n");

  // Obtener todos los perfiles de administrador
  const perfilesAdmin = await prisma.perfiles.findMany({
    where: {
      Descripcion: "Administrador",
      EstaEliminado: false,
    },
    include: {
      PerfilUsuario: {
        include: {
          Usuario: {
            select: {
              Id: true,
              AuthUserId: true,
              Nombre: true,
              TenantId: true,
            },
          },
        },
      },
      Tenant: {
        select: {
          Id: true,
          Nombre: true,
        },
      },
    },
  });

  console.log(
    `📊 Encontrados ${perfilesAdmin.length} perfiles de Administrador\n`
  );

  let usuariosActualizados = 0;
  let errores = 0;

  for (const perfil of perfilesAdmin) {
    console.log(
      `\n🏢 Tenant: ${perfil.Tenant.Nombre} (ID: ${perfil.Tenant.Id})`
    );
    console.log(
      `  👥 Usuarios con este perfil: ${perfil.PerfilUsuario.length}`
    );

    for (const perfilUsuario of perfil.PerfilUsuario) {
      const usuario = perfilUsuario.Usuario;

      if (!usuario.AuthUserId) {
        console.log(
          `  ⚠️  Usuario ${usuario.Nombre} (ID: ${usuario.Id}) no tiene AuthUserId`
        );
        continue;
      }

      try {
        console.log(
          `  🔄 Actualizando permisos para usuario: ${usuario.Nombre} (AuthUserId: ${usuario.AuthUserId})`
        );
        await actualizarPermisosEnJWT(usuario.AuthUserId);
        usuariosActualizados++;
        console.log(`  ✅ Permisos actualizados correctamente`);
      } catch (error) {
        errores++;
        console.error(`  ❌ Error actualizando permisos:`, error);
      }
    }
  }

  console.log(`\n📈 Resumen:`);
  console.log(`  ✅ Usuarios actualizados: ${usuariosActualizados}`);
  console.log(`  ❌ Errores: ${errores}`);
  console.log(
    `\n💡 Nota: Los usuarios pueden necesitar cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto completamente`
  );
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
