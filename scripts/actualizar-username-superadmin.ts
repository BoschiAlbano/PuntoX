import prisma from "@/DB/prisma";

/**
 * Script para actualizar el username del SuperAdmin
 * Uso: npx tsx scripts/actualizar-username-superadmin.ts <nuevo-username>
 *
 * Si no se proporciona username, se generará uno desde el email
 */
async function main() {
  const nuevoUsername = process.argv[2];

  if (!nuevoUsername) {
    console.log("❌ Error: Debes proporcionar un nuevo username");
    console.log(
      "\nUso: npx tsx scripts/actualizar-username-superadmin.ts <nuevo-username>"
    );
    console.log(
      "\nEjemplo: npx tsx scripts/actualizar-username-superadmin.ts superadmin"
    );
    process.exit(1);
  }

  const usernameNormalized = nuevoUsername
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");

  if (usernameNormalized.length < 2) {
    console.log("❌ Error: El username debe tener al menos 2 caracteres");
    process.exit(1);
  }

  console.log("🔍 Buscando SuperAdmin...\n");

  try {
    // Buscar SuperAdmin
    const superAdmin = await prisma.usuario.findFirst({
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
                Mail: true,
              },
            },
          },
        },
      },
    });

    if (!superAdmin) {
      console.log("❌ No se encontró ningún SuperAdmin en la base de datos.");
      process.exit(1);
    }

    // Verificar si el nuevo username ya está en uso
    const existingUser = await prisma.usuario.findFirst({
      where: {
        Nombre: usernameNormalized,
        EstaEliminado: false,
        Id: {
          not: superAdmin.Id,
        },
      },
    });

    if (existingUser) {
      console.log(
        `❌ Error: El username "${usernameNormalized}" ya está en uso por otro usuario.`
      );
      process.exit(1);
    }

    console.log(`📝 Información actual:`);
    console.log(`   - Username actual: ${superAdmin.Nombre}`);
    console.log(
      `   - Email: ${superAdmin.Persona_Empleado?.Persona?.Mail || "Sin email"}`
    );
    console.log(`\n🔄 Actualizando username a: ${usernameNormalized}...\n`);

    // Actualizar username
    await prisma.usuario.update({
      where: {
        Id: superAdmin.Id,
      },
      data: {
        Nombre: usernameNormalized,
      },
    });

    console.log("✅ Username actualizado correctamente!");
    console.log(`\n📝 Para hacer login:`);
    console.log(`   Username: ${usernameNormalized}`);
    console.log(`   (El sistema buscará el email automáticamente)`);
  } catch (error) {
    console.error("❌ Error al actualizar username:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
