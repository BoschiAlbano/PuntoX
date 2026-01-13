import prisma from "@/DB/prisma";

/**
 * Script para consultar todos los usernames de usuarios
 * Ejecutar con: npx tsx scripts/consultar-usuarios-username.ts
 */
async function main() {
  console.log("🔍 Consultando todos los usernames en la base de datos...\n");

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
                Mail: true,
              },
            },
          },
        },
        PerfilUsuario: {
          select: {
            Perfiles: {
              select: {
                Descripcion: true,
              },
            },
          },
        },
      },
      orderBy: {
        Id: "asc",
      },
    });

    if (usuarios.length === 0) {
      console.log("❌ No se encontraron usuarios en la base de datos.");
      return;
    }

    console.log(`✅ Se encontraron ${usuarios.length} usuario(s):\n`);

    // Agrupar por si tienen mayúsculas o no
    const conMayusculas: typeof usuarios = [];
    const soloMinusculas: typeof usuarios = [];

    usuarios.forEach((usuario) => {
      const tieneMayusculas = /[A-Z]/.test(usuario.Nombre);
      if (tieneMayusculas) {
        conMayusculas.push(usuario);
      } else {
        soloMinusculas.push(usuario);
      }
    });

    if (conMayusculas.length > 0) {
      console.log(`⚠️  Usuarios con MAYÚSCULAS (${conMayusculas.length}):\n`);
      conMayusculas.forEach((usuario, index) => {
        const persona = usuario.Persona_Empleado?.Persona;
        const perfiles = usuario.PerfilUsuario.map(
          (p) => p.Perfiles.Descripcion
        ).join(", ");
        console.log(`   ${index + 1}. Username: "${usuario.Nombre}"`);
        console.log(
          `      - Nombre: ${persona?.Nombre || "N/A"} ${
            persona?.Apellido || "N/A"
          }`
        );
        console.log(`      - Email: ${persona?.Mail || "Sin email"}`);
        console.log(`      - Perfiles: ${perfiles || "Sin perfiles"}`);
        console.log(`      - TenantId: ${usuario.TenantId || "N/A"}`);
        console.log("");
      });
    }

    if (soloMinusculas.length > 0) {
      console.log(
        `✅ Usuarios solo con minúsculas (${soloMinusculas.length}):\n`
      );
      soloMinusculas.forEach((usuario, index) => {
        const persona = usuario.Persona_Empleado?.Persona;
        const perfiles = usuario.PerfilUsuario.map(
          (p) => p.Perfiles.Descripcion
        ).join(", ");
        console.log(`   ${index + 1}. Username: "${usuario.Nombre}"`);
        console.log(
          `      - Nombre: ${persona?.Nombre || "N/A"} ${
            persona?.Apellido || "N/A"
          }`
        );
        console.log(`      - Email: ${persona?.Mail || "Sin email"}`);
        console.log(`      - Perfiles: ${perfiles || "Sin perfiles"}`);
        console.log("");
      });
    }

    console.log("\n📊 Resumen:");
    console.log(`   - Total usuarios: ${usuarios.length}`);
    console.log(`   - Con mayúsculas: ${conMayusculas.length}`);
    console.log(`   - Solo minúsculas: ${soloMinusculas.length}`);

    if (conMayusculas.length > 0) {
      console.log(
        "\n⚠️  NOTA: Los usuarios con mayúsculas pueden tener problemas al hacer login."
      );
      console.log(
        "   El sistema normaliza los usernames a minúsculas durante el login."
      );
      console.log(
        "   Ejemplo: Si el username es 'Juan', debes ingresar 'juan' para hacer login."
      );
    }
  } catch (error) {
    console.error("❌ Error al consultar usuarios:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
