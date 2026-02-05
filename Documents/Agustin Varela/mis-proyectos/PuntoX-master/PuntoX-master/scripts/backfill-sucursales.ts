/**
 * =====================================================
 * SCRIPT DE BACKFILL MULTI-SUCURSAL
 * =====================================================
 * 
 * Este script:
 * 1. Crea "Casa Central" para cada tenant
 * 2. Asigna usuarios a sucursal principal
 * 3. Migra stock a ArticuloStock
 * 4. Actualiza registros con SucursalId
 * 
 * Ejecutar: npx tsx scripts/backfill-sucursales.ts
 * 
 * =====================================================
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🏢 Iniciando backfill multi-sucursal...\n");

  try {
    // ========================================
    // PASO 1: Crear sucursal "Casa Central"
    // ========================================
    console.log("📍 Paso 1: Creando sucursales principales...");
    
    const tenants = await prisma.tenant.findMany({
      where: { EstaEliminado: false },
      select: { Id: true, Nombre: true },
    });

    console.log(`  Encontrados ${tenants.length} tenants`);

    for (const tenant of tenants) {
      const existeSucursal = await prisma.sucursal.findFirst({
        where: { TenantId: tenant.Id },
      });

      if (!existeSucursal) {
        await prisma.sucursal.create({
          data: {
            TenantId: tenant.Id,
            Nombre: "Casa Central",
            EsPrincipal: true,
            EstaActiva: true,
            EstaEliminado: false,
          },
        });
        console.log(`  ✅ Sucursal creada para: ${tenant.Nombre}`);
      } else {
        console.log(`  ⚠️  ${tenant.Nombre} ya tiene sucursal`);
      }
    }

    // ========================================
    // PASO 2: Asignar usuarios a sucursales
    // ========================================
    console.log("\n👥 Paso 2: Asignando usuarios a sucursales...");
    
    const usuarios = await prisma.usuario.findMany({
      where: { EstaEliminado: false },
      select: { Id: true, TenantId: true, Nombre: true },
    });

    console.log(`  Encontrados ${usuarios.length} usuarios`);

    for (const usuario of usuarios) {
      const sucursalPrincipal = await prisma.sucursal.findFirst({
        where: {
          TenantId: usuario.TenantId,
          EsPrincipal: true,
        },
      });

      if (sucursalPrincipal) {
        const existeAsignacion = await prisma.usuarioSucursal.findUnique({
          where: {
            UsuarioId_SucursalId: {
              UsuarioId: usuario.Id,
              SucursalId: sucursalPrincipal.Id,
            },
          },
        });

        if (!existeAsignacion) {
          await prisma.usuarioSucursal.create({
            data: {
              UsuarioId: usuario.Id,
              SucursalId: sucursalPrincipal.Id,
              TenantId: usuario.TenantId,
              EsDefault: true,
            },
          });
          console.log(`  ✅ Usuario asignado: ${usuario.Nombre}`);
        }
      }
    }

    // ========================================
    // PASO 3: Migrar stock a ArticuloStock
    // ========================================
    console.log("\n📦 Paso 3: Migrando stock a ArticuloStock...");
    
    const articulos = await prisma.articulo.findMany({
      where: { EstaEliminado: false },
      select: {
        Id: true,
        TenantId: true,
        Stock: true,
        StockMinimo: true,
        Ubicacion: true,
        Descripcion: true,
      },
    });

    console.log(`  Encontrados ${articulos.length} artículos`);

    for (const articulo of articulos) {
      const sucursalPrincipal = await prisma.sucursal.findFirst({
        where: {
          TenantId: articulo.TenantId,
          EsPrincipal: true,
        },
      });

      if (sucursalPrincipal) {
        const existeStock = await prisma.articuloStock.findUnique({
          where: {
            ArticuloId_SucursalId: {
              ArticuloId: articulo.Id,
              SucursalId: sucursalPrincipal.Id,
            },
          },
        });

        if (!existeStock) {
          await prisma.articuloStock.create({
            data: {
              ArticuloId: articulo.Id,
              SucursalId: sucursalPrincipal.Id,
              TenantId: articulo.TenantId,
              Stock: articulo.Stock,
              StockMinimo: articulo.StockMinimo,
              Ubicacion: articulo.Ubicacion,
            },
          });
        }
      }
    }
    console.log(`  ✅ Stock migrado para todos los artículos`);

    // ========================================
    // PASO 4: Actualizar registros existentes
    // ========================================
    console.log("\n🔄 Paso 4: Actualizando registros existentes...");

    // Actualizar Caja
    const cajasSinSucursal = await prisma.caja.count({
      where: { SucursalId: null },
    });
    console.log(`  Cajas sin sucursal: ${cajasSinSucursal}`);

    if (cajasSinSucursal > 0) {
      await prisma.$executeRaw`
        UPDATE "Caja" c
        SET "SucursalId" = (
          SELECT s."Id" FROM "Sucursal" s 
          WHERE s."TenantId" = c."TenantId" AND s."EsPrincipal" = true
          LIMIT 1
        )
        WHERE c."SucursalId" IS NULL
      `;
      console.log(`  ✅ Cajas actualizadas`);
    }

    // Actualizar Gasto (hereda de Caja)
    const gastosSinSucursal = await prisma.gasto.count({
      where: { SucursalId: null },
    });
    if (gastosSinSucursal > 0) {
      await prisma.$executeRaw`
        UPDATE "Gasto" g
        SET "SucursalId" = (
          SELECT c."SucursalId" FROM "Caja" c 
          WHERE c."Id" = g."CajaId"
        )
        WHERE g."SucursalId" IS NULL
      `;
      console.log(`  ✅ Gastos actualizados (${gastosSinSucursal})`);
    }

    // Actualizar Movimiento (hereda de Caja)
    const movimientosSinSucursal = await prisma.movimiento.count({
      where: { SucursalId: null },
    });
    if (movimientosSinSucursal > 0) {
      await prisma.$executeRaw`
        UPDATE "Movimiento" m
        SET "SucursalId" = (
          SELECT c."SucursalId" FROM "Caja" c 
          WHERE c."Id" = m."CajaId"
        )
        WHERE m."SucursalId" IS NULL
      `;
      console.log(`  ✅ Movimientos actualizados (${movimientosSinSucursal})`);
    }

    // Actualizar Comprobante
    const comprobantesSinSucursal = await prisma.comprobante.count({
      where: { SucursalId: null },
    });
    if (comprobantesSinSucursal > 0) {
      await prisma.$executeRaw`
        UPDATE "Comprobante" cp
        SET "SucursalId" = (
          SELECT s."Id" FROM "Sucursal" s 
          WHERE s."TenantId" = cp."TenantId" AND s."EsPrincipal" = true
          LIMIT 1
        )
        WHERE cp."SucursalId" IS NULL
      `;
      console.log(`  ✅ Comprobantes actualizados (${comprobantesSinSucursal})`);
    }

    // Actualizar Contador
    const contadoresSinSucursal = await prisma.contador.count({
      where: { SucursalId: null },
    });
    if (contadoresSinSucursal > 0) {
      await prisma.$executeRaw`
        UPDATE "Contador" ct
        SET "SucursalId" = (
          SELECT s."Id" FROM "Sucursal" s 
          WHERE s."TenantId" = ct."TenantId" AND s."EsPrincipal" = true
          LIMIT 1
        )
        WHERE ct."SucursalId" IS NULL
      `;
      console.log(`  ✅ Contadores actualizados (${contadoresSinSucursal})`);
    }

    // ========================================
    // VERIFICACIÓN FINAL
    // ========================================
    console.log("\n📊 Verificación final:");
    
    const sucursales = await prisma.sucursal.count();
    const usuarioSucursales = await prisma.usuarioSucursal.count();
    const articuloStock = await prisma.articuloStock.count();
    const cajasActualizadas = await prisma.caja.count({
      where: { SucursalId: { not: null } },
    });

    console.log(`  - Sucursales: ${sucursales}`);
    console.log(`  - Asignaciones usuario-sucursal: ${usuarioSucursales}`);
    console.log(`  - Registros de stock: ${articuloStock}`);
    console.log(`  - Cajas con sucursal: ${cajasActualizadas}`);

    const cajasPendientes = await prisma.caja.count({
      where: { SucursalId: null },
    });
    
    if (cajasPendientes === 0) {
      console.log("\n✅ ¡Backfill completado exitosamente!");
    } else {
      console.log(`\n⚠️  Quedan ${cajasPendientes} cajas sin sucursal`);
    }

  } catch (error) {
    console.error("\n❌ Error durante el backfill:", error);
    throw error;
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

