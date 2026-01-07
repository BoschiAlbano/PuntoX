/**
 * =====================================================
 * SCRIPT PARA ASIGNAR SUCURSAL A USUARIO
 * =====================================================
 * 
 * Ejecutar: npx tsx scripts/asignar-sucursal-usuario.ts [usuarioId] [sucursalId]
 * Ejemplo: npx tsx scripts/asignar-sucursal-usuario.ts 1 4
 * 
 * =====================================================
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("📝 Uso: npx tsx scripts/asignar-sucursal-usuario.ts [usuarioId] [sucursalId]");
    console.log("\nEjemplo: npx tsx scripts/asignar-sucursal-usuario.ts 1 4");
    console.log("\n💡 Primero ejecuta: npx tsx scripts/verificar-sucursales-usuario.ts");
    console.log("   para ver los IDs de usuarios y sucursales disponibles\n");
    process.exit(1);
  }

  const usuarioId = BigInt(args[0]);
  const sucursalId = BigInt(args[1]);

  console.log(`🔗 Asignando sucursal ${sucursalId} al usuario ${usuarioId}...\n`);

  try {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { Id: usuarioId },
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

    if (!usuario) {
      console.error(`❌ Usuario con ID ${usuarioId} no encontrado`);
      process.exit(1);
    }

    // Verificar que la sucursal existe
    const sucursal = await prisma.sucursal.findUnique({
      where: { Id: sucursalId },
      select: {
        Id: true,
        Nombre: true,
        TenantId: true,
        EstaActiva: true,
      },
    });

    if (!sucursal) {
      console.error(`❌ Sucursal con ID ${sucursalId} no encontrada`);
      process.exit(1);
    }

    // Verificar que pertenecen al mismo tenant
    if (usuario.TenantId !== sucursal.TenantId) {
      console.error(`❌ Error: El usuario pertenece al tenant ${usuario.TenantId} pero la sucursal pertenece al tenant ${sucursal.TenantId}`);
      console.error(`   Los usuarios solo pueden tener acceso a sucursales de su propio tenant`);
      process.exit(1);
    }

    const nombreUsuario = usuario.Persona_Empleado?.[0]?.Persona
      ? `${usuario.Persona_Empleado[0].Persona.Nombre} ${usuario.Persona_Empleado[0].Persona.Apellido}`
      : usuario.Nombre;

    // Verificar si ya está asignado
    const existeAsignacion = await prisma.usuarioSucursal.findUnique({
      where: {
        UsuarioId_SucursalId: {
          UsuarioId: usuarioId,
          SucursalId: sucursalId,
        },
      },
    });

    if (existeAsignacion) {
      console.log(`⚠️  El usuario ${nombreUsuario} ya tiene acceso a la sucursal "${sucursal.Nombre}"`);
      process.exit(0);
    }

    // Crear la asignación
    await prisma.usuarioSucursal.create({
      data: {
        UsuarioId: usuarioId,
        SucursalId: sucursalId,
        TenantId: usuario.TenantId,
        EsDefault: false, // No marcar como default automáticamente
      },
    });

    console.log(`✅ ¡Asignación exitosa!`);
    console.log(`   Usuario: ${nombreUsuario} (ID: ${usuarioId})`);
    console.log(`   Sucursal: ${sucursal.Nombre} (ID: ${sucursalId})`);
    console.log(`\n💡 Ahora el usuario tiene acceso a ${await prisma.usuarioSucursal.count({ where: { UsuarioId: usuarioId } })} sucursal(es)`);
    console.log(`   Cierra sesión y vuelve a iniciar para ver el selector de sucursal\n`);

  } catch (error: any) {
    if (error.code === "P2002") {
      console.error(`❌ Ya existe una asignación entre este usuario y esta sucursal`);
    } else {
      console.error("❌ Error:", error.message || error);
    }
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

