/**
 * =====================================================
 * SCRIPT PARA VERIFICAR SUCURSALES DEL USUARIO
 * =====================================================
 *
 * Ejecutar: npx tsx scripts/verificar-sucursales-usuario.ts
 *
 * =====================================================
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando sucursales por usuario...\n");

  try {
    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany({
      where: { EstaEliminado: false },
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

    console.log(`📊 Total de usuarios: ${usuarios.length}\n`);

    for (const usuario of usuarios) {
      const nombreCompleto = usuario.Nombre;

      // Obtener sucursales asignadas al usuario
      const usuarioSucursales = await prisma.usuarioSucursal.findMany({
        where: {
          UsuarioId: usuario.Id,
        },
        include: {
          Sucursal: {
            select: {
              Id: true,
              Nombre: true,
              EsPrincipal: true,
              EstaActiva: true,
            },
          },
        },
      });

      console.log(`👤 Usuario: ${nombreCompleto} (ID: ${usuario.Id})`);
      console.log(`   Tenant ID: ${usuario.TenantId}`);
      console.log(`   Sucursales asignadas: ${usuarioSucursales.length}`);

      if (usuarioSucursales.length === 0) {
        console.log(`   ⚠️  NO tiene sucursales asignadas\n`);
      } else {
        usuarioSucursales.forEach((us, index) => {
          const marcadores = [];
          if (us.EsDefault) marcadores.push("⭐ Por defecto");
          if (us.Sucursal.EsPrincipal) marcadores.push("🏠 Principal");
          if (!us.Sucursal.EstaActiva) marcadores.push("❌ Inactiva");

          console.log(
            `   ${index + 1}. ${us.Sucursal.Nombre} (ID: ${us.Sucursal.Id}) ${
              marcadores.length > 0 ? marcadores.join(", ") : ""
            }`
          );
        });
        console.log();
      }
    }

    // Resumen de sucursales
    console.log("\n📈 Resumen de sucursales:\n");
    const sucursales = await prisma.sucursal.findMany({
      where: { EstaEliminado: false },
      select: {
        Id: true,
        Nombre: true,
        TenantId: true,
        EsPrincipal: true,
        EstaActiva: true,
        _count: {
          select: {
            UsuariosSucursales: true,
          },
        },
      },
      orderBy: [
        { TenantId: "asc" },
        { EsPrincipal: "desc" },
        { Nombre: "asc" },
      ],
    });

    console.log(`Total de sucursales: ${sucursales.length}\n`);

    for (const sucursal of sucursales) {
      const tenant = await prisma.tenant.findUnique({
        where: { Id: sucursal.TenantId },
        select: { Nombre: true },
      });

      console.log(
        `🏢 ${sucursal.Nombre} (ID: ${sucursal.Id}) - Tenant: ${
          tenant?.Nombre || sucursal.TenantId
        }`
      );
      console.log(
        `   Usuarios asignados: ${sucursal._count.UsuariosSucursales}`
      );
      if (sucursal.EsPrincipal) console.log(`   ⭐ Sucursal Principal`);
      if (!sucursal.EstaActiva) console.log(`   ⚠️  Inactiva`);
      console.log();
    }
  } catch (error) {
    console.error("❌ Error:", error);
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
