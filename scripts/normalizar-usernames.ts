import { prisma } from "../src/lib/prisma";

/**
 * Script para normalizar todos los usernames a minúsculas
 * Ejecutar con: npx tsx scripts/normalizar-usernames.ts
 */
async function main() {
  console.log("🔍 Buscando usernames con mayúsculas...\n");

  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Nombre: true,
        TenantId: true,
        Persona_Empleado: {
          select: {
            Persona: {
              select: {
                Nombre: true,
                Apellido: true,
              },
            },
          },
        },
      },
    });

    const usuariosConMayusculas = usuarios.filter(u => /[A-Z]/.test(u.Nombre));

    if (usuariosConMayusculas.length === 0) {
      console.log("✅ Todos los usernames ya están en minúsculas.");
      return;
    }

    console.log(`⚠️  Se encontraron ${usuariosConMayusculas.length} usuario(s) con mayúsculas:\n`);

    for (const usuario of usuariosConMayusculas) {
      const usernameNormalizado = usuario.Nombre.toLowerCase();
      const persona = usuario.Persona_Empleado?.Persona;
      
      console.log(`   - "${usuario.Nombre}" → "${usernameNormalizado}"`);
      console.log(`     Nombre: ${persona?.Nombre || "N/A"} ${persona?.Apellido || "N/A"}`);

      // Verificar si el username normalizado ya existe
      const existingUser = await prisma.usuario.findFirst({
        where: {
          Nombre: usernameNormalizado,
          EstaEliminado: false,
          Id: {
            not: usuario.Id,
          },
        },
      });

      if (existingUser) {
        console.log(`     ⚠️  ERROR: El username "${usernameNormalizado}" ya está en uso.`);
        console.log(`     No se puede normalizar este usuario automáticamente.\n`);
        continue;
      }

      // Normalizar el username
      await prisma.usuario.update({
        where: {
          Id: usuario.Id,
        },
        data: {
          Nombre: usernameNormalizado,
        },
      });

      console.log(`     ✅ Normalizado correctamente\n`);
    }

    console.log("✨ Proceso completado!");
  } catch (error) {
    console.error("❌ Error al normalizar usernames:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

