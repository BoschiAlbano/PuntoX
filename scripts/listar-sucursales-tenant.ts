/**
 * =====================================================
 * SCRIPT PARA LISTAR SUCURSALES DE UN TENANT
 * =====================================================
 * 
 * Ejecutar: npx tsx scripts/listar-sucursales-tenant.ts [tenantId]
 * Ejemplo: npx tsx scripts/listar-sucursales-tenant.ts 3
 * 
 * =====================================================
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log("📝 Uso: npx tsx scripts/listar-sucursales-tenant.ts [tenantId]");
    console.log("\nEjemplo: npx tsx scripts/listar-sucursales-tenant.ts 3\n");
    process.exit(1);
  }

  const tenantId = BigInt(args[0]);

  console.log(`🏢 Sucursales del tenant ${tenantId}:\n`);

  try {
    // Verificar que el tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { Id: tenantId },
      select: { Id: true, Nombre: true },
    });

    if (!tenant) {
      console.error(`❌ Tenant con ID ${tenantId} no encontrado`);
      process.exit(1);
    }

    console.log(`Tenant: ${tenant.Nombre} (ID: ${tenantId})\n`);

    // Obtener todas las sucursales del tenant
    const sucursales = await prisma.sucursal.findMany({
      where: {
        TenantId: tenantId,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Nombre: true,
        Direccion: true,
        Telefono: true,
        EsPrincipal: true,
        EstaActiva: true,
        FechaCreacion: true,
        _count: {
          select: {
            UsuariosSucursales: true,
          },
        },
      },
      orderBy: [
        { EsPrincipal: "desc" },
        { FechaCreacion: "desc" },
      ],
    });

    if (sucursales.length === 0) {
      console.log("⚠️  No hay sucursales en este tenant");
      process.exit(0);
    }

    console.log(`Total de sucursales: ${sucursales.length}\n`);

    sucursales.forEach((sucursal, index) => {
      const marcadores = [];
      if (sucursal.EsPrincipal) marcadores.push("🏠 Principal");
      if (!sucursal.EstaActiva) marcadores.push("❌ Inactiva");

      console.log(`${index + 1}. ${sucursal.Nombre} (ID: ${sucursal.Id})`);
      if (marcadores.length > 0) console.log(`   ${marcadores.join(", ")}`);
      if (sucursal.Direccion) console.log(`   📍 ${sucursal.Direccion}`);
      if (sucursal.Telefono) console.log(`   📞 ${sucursal.Telefono}`);
      console.log(`   👥 Usuarios asignados: ${sucursal._count.UsuariosSucursales}`);
      console.log(`   📅 Creada: ${sucursal.FechaCreacion.toLocaleDateString()}`);
      console.log();
    });

  } catch (error) {
    console.error("❌ Error:", error);
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

