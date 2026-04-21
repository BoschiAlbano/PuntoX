/**
 * =====================================================
 * SEED DE CATÁLOGO POR TENANT
 * =====================================================
 *
 * Carga masiva de:
 *   - Marcas        (prisma/json/marcas.json)
 *   - Rubros        (prisma/json/rubros.json)
 *   - Unidades de Medida (prisma/json/unidadesMedidas.json)
 *
 * Solo inserta registros que NO existan ya (por Descripcion + TenantId).
 * Los registros ya existentes se omiten sin error.
 *
 * Uso:
 *   npx tsx scripts/prisma/seed-catalogo-tenant.ts --tenantId=<ID>
 *
 * Ejemplos:
 *   npx tsx scripts/prisma/seed-catalogo-tenant.ts --tenantId=1
 *   npx tsx scripts/prisma/seed-catalogo-tenant.ts --tenantId=3 --solo=marcas
 *   npx tsx scripts/prisma/seed-catalogo-tenant.ts --tenantId=3 --solo=rubros
 *   npx tsx scripts/prisma/seed-catalogo-tenant.ts --tenantId=3 --solo=unidades
 *
 * =====================================================
 */

import { PrismaClient } from "../../prisma/generated/prisma/index.js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CatalogoItem {
  Descripcion: string;
  EstaEliminado: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJson(relativePath: string): CatalogoItem[] {
  const absolutePath = resolve(process.cwd(), relativePath);
  const raw = readFileSync(absolutePath, "utf-8");
  return JSON.parse(raw) as CatalogoItem[];
}

function parseArgs(): { tenantId: bigint; solo: string | null } {
  const args = process.argv.slice(2);

  const tenantArg = args.find((a) => a.startsWith("--tenantId="));
  const soloArg = args.find((a) => a.startsWith("--solo="));

  if (!tenantArg) {
    console.error("❌  Falta el argumento --tenantId=<ID>");
    console.error(
      "   Ejemplo: npx tsx scripts/prisma/seed-catalogo-tenant.ts --tenantId=1",
    );
    process.exit(1);
  }

  const rawId = tenantArg.split("=")[1];
  const parsedId = BigInt(rawId);
  if (parsedId <= 0) {
    console.error("❌  TenantId debe ser un número positivo.");
    process.exit(1);
  }

  const solo = soloArg ? soloArg.split("=")[1].toLowerCase() : null;
  const valoresSolo = ["marcas", "rubros", "unidades"];
  if (solo && !valoresSolo.includes(solo)) {
    console.error(
      `❌  Valor de --solo inválido: "${solo}". Valores válidos: ${valoresSolo.join(", ")}`,
    );
    process.exit(1);
  }

  return { tenantId: parsedId, solo };
}

// ─── Seeding functions ────────────────────────────────────────────────────────

async function seedMarcas(
  prisma: PrismaClient,
  tenantId: bigint,
  items: CatalogoItem[],
) {
  console.log(`\n🏷️  Cargando Marcas (${items.length} registros)...`);

  // Traer las que ya existen para este tenant
  const existentes = await prisma.marca.findMany({
    where: { TenantId: tenantId, EstaEliminado: false },
    select: { Descripcion: true },
  });
  const setExistentes = new Set(
    existentes.map((m) => m.Descripcion.toLowerCase()),
  );

  const nuevas = items.filter(
    (item) => !setExistentes.has(item.Descripcion.toLowerCase()),
  );

  if (nuevas.length === 0) {
    console.log(
      "  ⚠️  Todas las marcas ya existen. No se insertaron nuevos registros.",
    );
    return { insertadas: 0, omitidas: items.length };
  }

  const result = await prisma.marca.createMany({
    data: nuevas.map((item) => ({
      Descripcion: item.Descripcion,
      EstaEliminado: item.EstaEliminado,
      TenantId: tenantId,
    })),
    skipDuplicates: true,
  });

  const omitidas = items.length - result.count;
  console.log(
    `  ✅ Insertadas: ${result.count} | Omitidas (ya existían): ${omitidas}`,
  );
  return { insertadas: result.count, omitidas };
}

async function seedRubros(
  prisma: PrismaClient,
  tenantId: bigint,
  items: CatalogoItem[],
) {
  console.log(`\n📂  Cargando Rubros (${items.length} registros)...`);

  const existentes = await prisma.rubro.findMany({
    where: { TenantId: tenantId, EstaEliminado: false },
    select: { Descripcion: true },
  });
  const setExistentes = new Set(
    existentes.map((r) => r.Descripcion.toLowerCase()),
  );

  const nuevos = items.filter(
    (item) => !setExistentes.has(item.Descripcion.toLowerCase()),
  );

  if (nuevos.length === 0) {
    console.log(
      "  ⚠️  Todos los rubros ya existen. No se insertaron nuevos registros.",
    );
    return { insertadas: 0, omitidas: items.length };
  }

  const result = await prisma.rubro.createMany({
    data: nuevos.map((item) => ({
      Descripcion: item.Descripcion,
      EstaEliminado: item.EstaEliminado,
      TenantId: tenantId,
    })),
    skipDuplicates: true,
  });

  const omitidas = items.length - result.count;
  console.log(
    `  ✅ Insertados: ${result.count} | Omitidos (ya existían): ${omitidas}`,
  );
  return { insertadas: result.count, omitidas };
}

async function seedUnidades(
  prisma: PrismaClient,
  tenantId: bigint,
  items: CatalogoItem[],
) {
  console.log(
    `\n📏  Cargando Unidades de Medida (${items.length} registros)...`,
  );

  const existentes = await prisma.unidadMedida.findMany({
    where: { TenantId: tenantId, EstaEliminado: false },
    select: { Descripcion: true },
  });
  const setExistentes = new Set(
    existentes.map((u) => u.Descripcion.toLowerCase()),
  );

  const nuevas = items.filter(
    (item) => !setExistentes.has(item.Descripcion.toLowerCase()),
  );

  if (nuevas.length === 0) {
    console.log(
      "  ⚠️  Todas las unidades de medida ya existen. No se insertaron nuevos registros.",
    );
    return { insertadas: 0, omitidas: items.length };
  }

  const result = await prisma.unidadMedida.createMany({
    data: nuevas.map((item) => ({
      Descripcion: item.Descripcion,
      EstaEliminado: item.EstaEliminado,
      TenantId: tenantId,
    })),
    skipDuplicates: true,
  });

  const omitidas = items.length - result.count;
  console.log(
    `  ✅ Insertadas: ${result.count} | Omitidas (ya existían): ${omitidas}`,
  );
  return { insertadas: result.count, omitidas };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

async function main() {
  const { tenantId, solo } = parseArgs();

  console.log("====================================================");
  console.log(" 🚀  SEED DE CATÁLOGO POR TENANT");
  console.log("====================================================");
  console.log(`  TenantId : ${tenantId}`);
  console.log(`  Tablas   : ${solo ?? "marcas, rubros, unidades"}`);
  console.log("====================================================");

  // Verificar que el tenant exista
  const tenant = await prisma.tenant.findUnique({
    where: { Id: tenantId },
    select: { Id: true, Nombre: true, EstaEliminado: true },
  });

  if (!tenant) {
    console.error(`\n❌  No se encontró el Tenant con Id=${tenantId}`);
    process.exit(1);
  }

  if (tenant.EstaEliminado) {
    console.error(
      `\n❌  El Tenant "${tenant.Nombre}" (Id=${tenantId}) está eliminado.`,
    );
    process.exit(1);
  }

  console.log(`\n✅  Tenant encontrado: "${tenant.Nombre}" (Id=${tenantId})`);

  // Cargar JSONs
  const marcasData = loadJson("prisma/json/marcas.json");
  const rubrosData = loadJson("prisma/json/rubros.json");
  const unidadesData = loadJson("prisma/json/unidadesMedidas.json");

  // Resumen acumulado
  let totalInsertadas = 0;
  let totalOmitidas = 0;

  // Ejecutar según filtro --solo
  if (!solo || solo === "marcas") {
    const r = await seedMarcas(prisma, tenantId, marcasData);
    totalInsertadas += r.insertadas;
    totalOmitidas += r.omitidas;
  }

  if (!solo || solo === "rubros") {
    const r = await seedRubros(prisma, tenantId, rubrosData);
    totalInsertadas += r.insertadas;
    totalOmitidas += r.omitidas;
  }

  if (!solo || solo === "unidades") {
    const r = await seedUnidades(prisma, tenantId, unidadesData);
    totalInsertadas += r.insertadas;
    totalOmitidas += r.omitidas;
  }

  // Resumen final
  console.log("\n====================================================");
  console.log(" 📊  RESUMEN FINAL");
  console.log("====================================================");
  console.log(`  Total insertados : ${totalInsertadas}`);
  console.log(`  Total omitidos   : ${totalOmitidas}`);
  console.log("====================================================");
  console.log("\n✅  Seed completado exitosamente.\n");
}

main()
  .catch((e) => {
    console.error("\n❌  Error fatal durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
