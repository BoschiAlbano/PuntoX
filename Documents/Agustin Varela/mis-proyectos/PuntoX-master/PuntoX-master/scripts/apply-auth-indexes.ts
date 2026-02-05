/**
 * Script para aplicar índices de optimización a la base de datos
 * Ejecutar con: npm run apply-auth-indexes
 * o: npx tsx scripts/apply-auth-indexes.ts
 */

import prisma from "../src/DB/prisma";
import { readFileSync } from "fs";
import { join } from "path";

async function applyAuthIndexes() {
  console.log("🚀 Aplicando índices de optimización para autenticación...\n");

  try {
    // Leer el archivo SQL con los índices
    const sqlPath = join(__dirname, "migrations", "add-auth-indexes.sql");
    const sqlContent = readFileSync(sqlPath, "utf-8");

    // Remover comentarios y líneas vacías primero
    const cleanedContent = sqlContent
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim())
      .join("\n");

    // Dividir por sentencias (separadas por ;)
    const statements = cleanedContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 20); // Filtrar statements muy cortos

    console.log(`📄 Ejecutando ${statements.length} sentencias SQL...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (!statement) continue;

      try {
        // Extraer el nombre del índice del statement (si existe)
        const match = statement.match(/idx_[\w_]+/);
        const indexName = match ? match[0] : "índice";

        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ ${indexName} creado exitosamente`);
        successCount++;
      } catch (error: any) {
        // Si el índice ya existe, no es un error crítico
        if (error.message?.includes("already exists")) {
          console.log(
            `⚠️  ${statement.match(/idx_[\w_]+/)?.[0] || "índice"} ya existe (saltando)`,
          );
        } else {
          console.error(`❌ Error al crear índice:`, error.message);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Índices creados: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    // Ejecutar ANALYZE para actualizar estadísticas del optimizador
    console.log(`\n🔍 Actualizando estadísticas del optimizador...\n`);

    const tables = [
      "Usuario",
      "UsuarioSucursal",
      "PerfilUsuario",
      "SesionActiva",
      "Persona",
      "Sucursal",
      "Perfiles",
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
        console.log(`✅ Estadísticas actualizadas para ${table}`);
      } catch (error: any) {
        console.log(`⚠️  No se pudieron actualizar estadísticas de ${table}`);
      }
    }

    console.log("\n✨ ¡Optimización completada con éxito!\n");
    console.log(
      "💡 Los índices mejorarán el rendimiento de getAuthContext significativamente.",
    );
  } catch (error) {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
applyAuthIndexes();
