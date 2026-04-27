/**
 * =====================================================
 * SEED DE CATÁLOGO POR TENANT
 * =====================================================
 *
 * Carga masiva de:
 *   - Marcas        (prisma/json/marcas.json)
 *   - Rubros        (prisma/json/rubros.json)
 *   - Unidades de Medida (prisma/json/unidadesMedidas.json)
 *   - Artículos     (prisma/json/articulos.json)
 *     Los 50 artículos más vendidos en negocios de Argentina.
 *     Se crean con precio 0 y stock 0 como plantilla de inicio.
 *     Para cada artículo se genera un PrecioLista en cada lista de
 *     precios activa del tenant (PrecioFinal = 0, PorcentajeGanancia = 0).
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
 *   npx tsx scripts/prisma/seed-catalogo-tenant.ts --tenantId=3 --solo=articulos
 *
 * =====================================================
 */

import { PrismaClient, TiposVenta } from "../../prisma/generated/prisma/index.js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CatalogoItem {
  Descripcion: string;
  EstaEliminado: boolean;
}

interface ArticuloItem {
  Descripcion: string;
  CodigoBarra: string;
  Rubro: string;
  Marca: string;
  TipoVenta: "UNIDAD" | "PESO";
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
  const valoresSolo = ["marcas", "rubros", "unidades", "articulos"];
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

// ─── seedArticulos ────────────────────────────────────────────────────────────

async function seedArticulos(
  prisma: PrismaClient,
  tenantId: bigint,
  items: ArticuloItem[],
) {
  console.log(`\n📦  Cargando Artículos (${items.length} registros)...`);

  // ── 1. IVA global: preferir 21%, sino el primero disponible ──────────────
  let iva = await prisma.iva.findFirst({
    where: { Porcentaje: 21, EstaEliminado: false },
  });
  if (!iva) {
    iva = await prisma.iva.findFirst({ where: { EstaEliminado: false } });
  }
  if (!iva) {
    console.error("  ❌  No existe ningún registro en la tabla Iva. Creá al menos uno antes de correr este seed.");
    return { insertadas: 0, omitidas: items.length };
  }
  console.log(`  ℹ️  Usando IVA: "${iva.Descripcion}" (${iva.Porcentaje}%)`);

  // ── 2. Listas de precios activas del tenant ───────────────────────────────
  const listasPrecios = await prisma.listaPrecio.findMany({
    where: { TenantId: tenantId, EstaEliminado: false, Activa: true },
    select: { Id: true, Nombre: true },
  });
  if (listasPrecios.length === 0) {
    console.warn("  ⚠️  El tenant no tiene listas de precios activas. Los artículos se crearán sin precios asociados.");
  } else {
    console.log(`  ℹ️  Listas de precios encontradas: ${listasPrecios.map((l) => l.Nombre).join(", ")}`);
  }

  // ── 3. Unidades de medida ─────────────────────────────────────────────────
  const getOrCreateUnidad = async (descripcion: string) => {
    let um = await prisma.unidadMedida.findFirst({
      where: { TenantId: tenantId, Descripcion: { equals: descripcion, mode: "insensitive" }, EstaEliminado: false },
    });
    if (!um) {
      um = await prisma.unidadMedida.create({
        data: { Descripcion: descripcion, EstaEliminado: false, TenantId: tenantId },
      });
      console.log(`  ➕  Unidad de medida creada: "${descripcion}"`);
    }
    return um;
  };

  const umUnidad = await getOrCreateUnidad("Unidad");
  const umKilogramo = await getOrCreateUnidad("Kilogramo");

  // ── 4. Cache de Marcas y Rubros del tenant ────────────────────────────────
  const marcasDB = await prisma.marca.findMany({
    where: { TenantId: tenantId, EstaEliminado: false },
    select: { Id: true, Descripcion: true },
  });
  const marcaMap = new Map(marcasDB.map((m) => [m.Descripcion.toLowerCase(), m.Id]));

  const getOrCreateMarca = async (descripcion: string): Promise<bigint> => {
    const key = descripcion.toLowerCase();
    if (marcaMap.has(key)) return marcaMap.get(key)!;
    const nueva = await prisma.marca.create({
      data: { Descripcion: descripcion, EstaEliminado: false, TenantId: tenantId },
    });
    marcaMap.set(key, nueva.Id);
    console.log(`  ➕  Marca creada: "${descripcion}"`);
    return nueva.Id;
  };

  const rubrosDB = await prisma.rubro.findMany({
    where: { TenantId: tenantId, EstaEliminado: false },
    select: { Id: true, Descripcion: true },
  });
  const rubroMap = new Map(rubrosDB.map((r) => [r.Descripcion.toLowerCase(), r.Id]));

  const getOrCreateRubro = async (descripcion: string): Promise<bigint> => {
    const key = descripcion.toLowerCase();
    if (rubroMap.has(key)) return rubroMap.get(key)!;
    const nuevo = await prisma.rubro.create({
      data: { Descripcion: descripcion, EstaEliminado: false, TenantId: tenantId },
    });
    rubroMap.set(key, nuevo.Id);
    console.log(`  ➕  Rubro creado: "${descripcion}"`);
    return nuevo.Id;
  };

  // ── 5. Artículos ya existentes para este tenant ───────────────────────────
  const artExistentes = await prisma.articulo.findMany({
    where: { TenantId: tenantId, EstaEliminado: false },
    select: { Descripcion: true },
  });
  const setExistentes = new Set(artExistentes.map((a) => a.Descripcion.toLowerCase()));

  // ── 6. Próximo Código disponible ──────────────────────────────────────────
  const maxCodigo = await prisma.articulo.aggregate({
    where: { TenantId: tenantId },
    _max: { Codigo: true },
  });
  let proximoCodigo = (maxCodigo._max.Codigo ?? 0) + 1;

  // ── 7. Fecha placeholder para campos DateTime requeridos ──────────────────
  const fechaDefault = new Date("2000-01-01T00:00:00.000Z");

  // ── 8. Insertar artículos nuevos ──────────────────────────────────────────
  let insertadas = 0;
  let omitidas = 0;

  for (const item of items) {
    if (setExistentes.has(item.Descripcion.toLowerCase())) {
      omitidas++;
      continue;
    }

    const marcaId = await getOrCreateMarca(item.Marca);
    const rubroId = await getOrCreateRubro(item.Rubro);
    const unidadMedidaId = item.TipoVenta === "PESO" ? umKilogramo.Id : umUnidad.Id;

    const articulo = await prisma.articulo.create({
      data: {
        TenantId:             tenantId,
        MarcaId:              marcaId,
        RubroId:              rubroId,
        UnidadMedidaId:       unidadMedidaId,
        IvaId:                iva.Id,
        Codigo:               proximoCodigo++,
        CodigoBarra:          item.CodigoBarra,
        Descripcion:          item.Descripcion,
        PrecioCosto:          0,
        Stock:                0,
        StockMinimo:          0,
        ActivarLimiteVenta:   false,
        LimiteVenta:          0,
        ActivarHoraVenta:     false,
        HoraLimiteVentaDesde: fechaDefault,
        HoraLimiteVentaHasta: fechaDefault,
        PermiteStockNegativo: false,
        DescuentaStock:       true,
        VencimientoDias:      0,
        TipoVenta:            item.TipoVenta as TiposVenta,
        EstaEliminado:        false,
      },
    });

    // ── 9. Crear PrecioLista en cada lista activa del tenant ────────────────
    if (listasPrecios.length > 0) {
      await prisma.precioLista.createMany({
        data: listasPrecios.map((lista) => ({
          TenantId:           tenantId,
          ArticuloId:         articulo.Id,
          ListaPrecioId:      lista.Id,
          PorcentajeGanancia: 0,
          PrecioFinal:        0,
        })),
        skipDuplicates: true,
      });
    }

    insertadas++;
  }

  console.log(
    `  ✅ Insertados: ${insertadas} | Omitidos (ya existían): ${omitidas}`,
  );
  return { insertadas, omitidas };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

async function main() {
  const { tenantId, solo } = parseArgs();

  console.log("====================================================");
  console.log(" 🚀  SEED DE CATÁLOGO POR TENANT");
  console.log("====================================================");
  console.log(`  TenantId : ${tenantId}`);
  console.log(`  Tablas   : ${solo ?? "marcas, rubros, unidades, articulos"}`);
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
  const articulosData = loadJson("prisma/json/articulos.json") as unknown as ArticuloItem[];

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

  if (!solo || solo === "articulos") {
    const r = await seedArticulos(prisma, tenantId, articulosData);
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
