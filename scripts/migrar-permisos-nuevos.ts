// @ts-nocheck — Script obsoleto: Permiso ya no tiene TenantId (catálogo global desde v2)
/**
 * =====================================================
 * MIGRACIÓN DE PERMISOS — Sistema 3 niveles
 * =====================================================
 *
 * Convierte permisos del formato antiguo (clave plana como "ventas", "caja")
 * al nuevo sistema de 3 niveles ({modulo}:page, {modulo}:get, {modulo}:set).
 *
 * Estrategia:
 *  - Para cada PerfilPermiso y PerfilUsuario que tenga una Clave antigua,
 *    expandir a los 3 niveles correspondientes (o 2 para módulos de solo lectura).
 *  - Las claves que ya son del nuevo formato se dejan intactas.
 *  - Las claves inválidas/legacy (ej: "ventas:eliminar", "empleados:admin") se eliminan.
 *
 * Ejecutar: npx tsx scripts/migrar-permisos-nuevos.ts
 * =====================================================
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

// Módulos válidos del nuevo sistema
const VALID_MODULES = [
  "ventas",
  "caja",
  "productos",
  "proveedores",
  "compras",
  "empleados",
  "clientes",
  "configuracion",
  "sucursales",
  "auditoria",
  "analiticas",
  "reportes",
] as const;

type ValidModule = (typeof VALID_MODULES)[number];

const WRITABLE_MODULES = new Set([
  "ventas",
  "caja",
  "productos",
  "proveedores",
  "compras",
  "empleados",
  "clientes",
  "configuracion",
  "sucursales",
]);

// Mapeo de claves antiguas a módulo válido (para renombres o correcciones)
const OLD_KEY_MAP: Record<string, ValidModule> = {
  // claves planas → misma clave como módulo
  ventas: "ventas",
  caja: "caja",
  productos: "productos",
  proveedores: "proveedores",
  compras: "compras",
  empleados: "empleados",
  clientes: "clientes",
  configuracion: "configuracion",
  sucursales: "sucursales",
  auditoria: "auditoria",
  analiticas: "analiticas",
  reportes: "reportes",
};

// Claves legacy que deben eliminarse (ya no son válidas en el nuevo sistema)
const LEGACY_KEYS_TO_REMOVE = new Set([
  "ventas:eliminar",
  "ventas:descuento",
  "caja:cerrar",
  "caja:retiro",
  "productos:eliminar",
  "productos:precio",
  "clientes:exportar",
  "empleados:admin",
]);

function expandModule(mod: ValidModule): string[] {
  const keys = [`${mod}:page`, `${mod}:get`];
  if (WRITABLE_MODULES.has(mod)) keys.push(`${mod}:set`);
  return keys;
}

/** Dado un Permiso con Clave antigua, devuelve las claves nuevas que debe tener */
function migrateKey(clave: string): string[] | null {
  // Normalizar guiones → dos puntos primero (formato legacy: "ventas-page")
  const normalized = clave.replace(/-(page|get|set)$/, ":$1");

  // Ya es del nuevo sistema → conservar (con clave normalizada)
  if (
    normalized.includes(":page") ||
    normalized.includes(":get") ||
    normalized.includes(":set")
  ) {
    return [normalized]; // retornar ya normalizada
  }
  // Clave legacy → eliminar
  if (LEGACY_KEYS_TO_REMOVE.has(normalized)) {
    return null; // null = eliminar
  }
  // Clave plana → expandir
  const mod = OLD_KEY_MAP[normalized];
  if (!mod) {
    console.warn(`  ⚠️  Clave desconocida ignorada: "${clave}"`);
    return null;
  }
  return expandModule(mod);
}

async function main() {
  console.log("🔑 Iniciando migración de permisos al sistema 3 niveles...\n");

  // ── 1. Obtener todos los Permisos existentes (por tenant) ──────────────────
  const todosPermisos = await prisma.permiso.findMany({
    where: { EstaEliminado: false },
    include: {
      PerfilPermisos: { include: { Perfil: true } },
    },
  });

  const tenants = await prisma.tenant.findMany({
    select: { Id: true, Nombre: true },
  });
  console.log(`Tenants encontrados: ${tenants.length}`);

  let totalCreados = 0;
  let totalEliminados = 0;

  for (const tenant of tenants) {
    const tid = tenant.Id;
    console.log(`\n📦 Tenant: ${tenant.Nombre} (Id=${tid})`);

    // Obtener todos los permisos de este tenant
    const permisosTenant = todosPermisos.filter((p) => p.TenantId === tid);

    // Mapa Clave → Permiso (para lookup rápido)
    const permisoMap = new Map(permisosTenant.map((p) => [p.Clave, p]));

    // Obtener todos los perfiles (roles) de este tenant
    const perfiles = await prisma.perfil.findMany({
      where: { TenantId: tid, EstaEliminado: false },
      include: {
        PerfilPermisos: {
          include: { Permiso: true },
        },
      },
    });

    for (const perfil of perfiles) {
      // Solo migrar roles de EMPLEADO (SUPERADMIN y ADMINISTRADOR tienen bypass)
      if (perfil.Tipo !== "EMPLEADO") continue;

      const clavesActuales = perfil.PerfilPermisos.filter(
        (pp) => !pp.Permiso.EstaEliminado,
      ).map((pp) => pp.Permiso.Clave);

      const clavesNuevas = new Set<string>();

      for (const clave of clavesActuales) {
        const expandidas = migrateKey(clave);
        if (expandidas) {
          for (const c of expandidas) clavesNuevas.add(c);
        }
      }

      const clavesActualesSet = new Set(clavesActuales);
      const toAdd = [...clavesNuevas].filter((c) => !clavesActualesSet.has(c));
      const toRemove = clavesActuales.filter(
        (c) =>
          LEGACY_KEYS_TO_REMOVE.has(c) || (!c.includes(":") && OLD_KEY_MAP[c]), // clave plana que ya fue expandida
      );

      if (toAdd.length === 0 && toRemove.length === 0) continue;

      console.log(
        `  Rol "${perfil.Nombre}" — +${toAdd.length} claves, -${toRemove.length} claves`,
      );

      // Crear nuevos Permiso records si no existen en el tenant
      for (const clave of toAdd) {
        let permiso = permisoMap.get(clave);
        if (!permiso) {
          permiso = await prisma.permiso.create({
            data: {
              Clave: clave,
              TenantId: tid,
              EstaEliminado: false,
            },
          } as Parameters<typeof prisma.permiso.create>[0]);
          permisoMap.set(clave, permiso);
          totalCreados++;
        }

        // Crear PerfilPermiso si no existe
        const exists = await prisma.perfilPermiso.findFirst({
          where: { PerfilId: perfil.Id, PermisoId: permiso!.Id },
        });
        if (!exists) {
          await prisma.perfilPermiso.create({
            data: { PerfilId: perfil.Id, PermisoId: permiso!.Id },
          } as Parameters<typeof prisma.perfilPermiso.create>[0]);
        }
      }

      // Eliminar PerfilPermiso de claves antiguas
      for (const clave of toRemove) {
        const permiso = permisoMap.get(clave);
        if (!permiso) continue;
        await prisma.perfilPermiso.deleteMany({
          where: { PerfilId: perfil.Id, PermisoId: permiso.Id },
        });
        totalEliminados++;
      }
    }
  }

  console.log(`\n✅ Migración completada.`);
  console.log(`   Permisos creados: ${totalCreados}`);
  console.log(`   Asociaciones eliminadas (claves legacy): ${totalEliminados}`);
}

main()
  .catch((e) => {
    console.error("Error durante la migración:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
