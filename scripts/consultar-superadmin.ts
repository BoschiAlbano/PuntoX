import { prisma } from "../src/lib/prisma";

/**
 * Script para consultar información del SuperAdmin
 * Ejecutar con: npx tsx scripts/consultar-superadmin.ts
 */
async function main() {
  console.log("🔍 Buscando SuperAdmin en la base de datos...\n");

  try {
    // Buscar usuarios con perfil SuperAdmin
    const superAdmins = await prisma.usuario.findMany({
      where: {
        EstaEliminado: false,
        PerfilUsuario: {
          some: {
            Perfiles: {
              Descripcion: "SuperAdmin",
            },
          },
        },
      },
      include: {
        Persona_Empleado: {
          include: {
            Persona: {
              select: {
                Nombre: true,
                Apellido: true,
                Mail: true,
              },
            },
          },
        },
        PerfilUsuario: {
          include: {
            Perfiles: {
              select: {
                Descripcion: true,
              },
            },
          },
        },
      },
    });

    if (superAdmins.length === 0) {
      console.log("❌ No se encontró ningún SuperAdmin en la base de datos.");
      console.log("\n💡 Para crear un SuperAdmin, necesitas:");
      console.log("   1. Crear un Usuario con un Perfil llamado 'SuperAdmin'");
      console.log("   2. Asignar ese perfil al usuario en la tabla PerfilUsuario");
      return;
    }

    console.log(`✅ Se encontraron ${superAdmins.length} SuperAdmin(s):\n`);

    superAdmins.forEach((admin, index) => {
      const persona = admin.Persona_Empleado?.Persona;
      const email = persona?.Mail || "Sin email";
      
      console.log(`\n${index + 1}. SuperAdmin:`);
      console.log(`   - ID Usuario: ${admin.Id}`);
      console.log(`   - Username: ${admin.Nombre}`);
      console.log(`   - Nombre: ${persona?.Nombre || "N/A"} ${persona?.Apellido || "N/A"}`);
      console.log(`   - Email: ${email}`);
      console.log(`   - AuthUserId: ${admin.AuthUserId}`);
      console.log(`   - TenantId: ${admin.TenantId || "N/A"}`);
      console.log(`   - Perfiles: ${admin.PerfilUsuario.map(p => p.Perfiles.Descripcion).join(", ")}`);
      
      console.log(`\n   📝 Para hacer login:`);
      console.log(`      Username: ${admin.Nombre}`);
      console.log(`      (El sistema buscará el email automáticamente)`);
    });

    console.log("\n\n💡 Si el username es un email, puedes:");
    console.log("   1. Usar ese email como username para login");
    console.log("   2. O actualizar el username con el script: scripts/actualizar-username-superadmin.ts");
  } catch (error) {
    console.error("❌ Error al consultar SuperAdmin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

