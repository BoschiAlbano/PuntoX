/**
 * =====================================================
 * SCRIPT DE MIGRACIÓN MULTI-SUCURSAL
 * =====================================================
 * 
 * Ejecuta las migraciones SQL para multi-sucursal
 * directamente usando Prisma Client.
 * 
 * Ejecutar: npx tsx scripts/migrate-multi-sucursal.ts
 * 
 * =====================================================
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function executeSqlFile(filename: string) {
  console.log(`\n📄 Ejecutando: ${filename}`);
  try {
    const sqlPath = join(process.cwd(), "prisma", "migrations", "multi_sucursal", filename);
    const sql = readFileSync(sqlPath, "utf-8");
    
    // Dividir el SQL en statements individuales (ignorando comentarios)
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => {
        // Ignorar comentarios y líneas vacías
        if (!s) return false;
        if (s.startsWith("--")) return false;
        // Ignorar líneas que solo tienen comentarios
        const lines = s.split("\n").filter((l) => {
          const trimmed = l.trim();
          return trimmed && !trimmed.startsWith("--");
        });
        return lines.length > 0;
      });

    console.log(`  Ejecutando ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt) {
        try {
          await prisma.$executeRawUnsafe(stmt);
        } catch (error: any) {
          // Ignorar errores de objetos que ya existen
          if (error?.code === "P2010" && error?.meta?.code === "42P07") {
            console.log(`  ⚠️  Statement ${i + 1} ya existe, continuando...`);
          } else if (error?.meta?.message?.includes("already exists")) {
            console.log(`  ⚠️  Statement ${i + 1} ya existe, continuando...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log(`✅ ${filename} ejecutado exitosamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${filename}:`, error);
    return false;
  }
}

async function main() {
  console.log("🏢 Iniciando migración multi-sucursal...\n");

  // Paso 1: Crear tablas
  const step1 = await executeSqlFile("01_create_sucursal_tables.sql");
  if (!step1) {
    console.error("\n❌ Falló el paso 1. Abortando migración.");
    process.exit(1);
  }

  // Paso 2: Agregar columnas
  const step2 = await executeSqlFile("02_add_sucursal_columns.sql");
  if (!step2) {
    console.error("\n❌ Falló el paso 2. Abortando migración.");
    process.exit(1);
  }

  // Paso 3: Backfill
  const step3 = await executeSqlFile("03_backfill_sucursales.sql");
  if (!step3) {
    console.error("\n❌ Falló el paso 3. Abortando migración.");
    process.exit(1);
  }

  // Verificación
  console.log("\n📊 Verificando migración...");
  try {
    const tenants = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "Tenant" WHERE "EstaEliminado" = false
    `;
    const sucursales = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "Sucursal"
    `;
    const usuarioSucursales = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "UsuarioSucursal"
    `;
    const articuloStock = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "ArticuloStock"
    `;
    const cajasSinSucursal = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "Caja" WHERE "SucursalId" IS NULL
    `;

    console.log("\n📈 Resultados:");
    console.log(`  - Tenants activos: ${tenants[0]?.count}`);
    console.log(`  - Sucursales creadas: ${sucursales[0]?.count}`);
    console.log(`  - Asignaciones usuario-sucursal: ${usuarioSucursales[0]?.count}`);
    console.log(`  - Registros de stock: ${articuloStock[0]?.count}`);
    console.log(`  - Cajas sin sucursal: ${cajasSinSucursal[0]?.count}`);

    if (Number(cajasSinSucursal[0]?.count) > 0) {
      console.log("\n⚠️  Hay cajas sin sucursal. Revisar backfill.");
    } else {
      console.log("\n✅ Migración completada exitosamente!");
    }
  } catch (error) {
    console.error("\n❌ Error en verificación:", error);
  }

  console.log("\n💡 Próximos pasos opcionales:");
  console.log("  1. Ejecutar: npx tsx scripts/migrate-multi-sucursal.ts --make-required");
  console.log("     (Hace SucursalId NOT NULL en tablas críticas)");
  console.log("  2. Aplicar políticas RLS manualmente si usas Supabase RLS");
}

main()
  .catch((e) => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

