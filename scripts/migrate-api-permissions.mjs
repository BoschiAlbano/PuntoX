/**
 * Migra todos los API routes al nuevo sistema de 3 niveles de permisos.
 *
 * Reglas:
 *  - GET  handlers → GET_PERMISSIONS.X
 *  - POST/PATCH/PUT/DELETE handlers → SET_PERMISSIONS.X
 *  - Correcciones de módulo:
 *      compras/productos/route.ts: PROVEEDORES → COMPRAS (GET)
 *      sucursales/**:  EMPLEADOS → SUCURSALES
 *      auditoria-empleados: EMPLEADOS → AUDITORIA
 *        (GET → GET, POST → GET también, es solo logging)
 *  - Reemplaza "empleados:admin" → SET_PERMISSIONS.EMPLEADOS
 *
 * Importaciones: agrega GET_PERMISSIONS y SET_PERMISSIONS si hacen falta.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = join(__dirname, "../src/app/api");

// ---------------------------------------------------------------------------
// Archivos y sus mapeos [ruta relativa desde API_ROOT, { METHOD → permiso }]
// ---------------------------------------------------------------------------
const FILE_CONFIGS = [
  // --- Analíticas (solo GET) ---
  { rel: "analiticas/kpis/route.ts", map: { GET: "ANALITICAS" } },
  { rel: "analiticas/graficas/route.ts", map: { GET: "ANALITICAS" } },
  { rel: "analiticas/complementarios/route.ts", map: { GET: "ANALITICAS" } },
  { rel: "analiticas/alertas/route.ts", map: { GET: "ANALITICAS" } },
  // --- Dashboard (solo GET) ---
  { rel: "dashboard/summary/route.ts", map: { GET: "ANALITICAS" } },
  { rel: "dashboard/top-products/route.ts", map: { GET: "ANALITICAS" } },
  { rel: "dashboard/low-stock/route.ts", map: { GET: "ANALITICAS" } },
  { rel: "dashboard/payment-methods/route.ts", map: { GET: "ANALITICAS" } },
  // --- Productos ---
  {
    rel: "productos/route.ts",
    map: {
      GET: "PRODUCTOS",
      POST: "PRODUCTOS",
      PATCH: "PRODUCTOS",
      DELETE: "PRODUCTOS",
    },
  },
  { rel: "productos/[id]/route.ts", map: { GET: "PRODUCTOS" } },
  { rel: "productos/ultimo-codigo/route.ts", map: { GET: "PRODUCTOS" } },
  // --- Marcas / Rubros / Unidades ---
  {
    rel: "marcas/route.ts",
    map: {
      GET: "PRODUCTOS",
      POST: "PRODUCTOS",
      PATCH: "PRODUCTOS",
      DELETE: "PRODUCTOS",
    },
  },
  {
    rel: "rubros/route.ts",
    map: {
      GET: "PRODUCTOS",
      POST: "PRODUCTOS",
      PATCH: "PRODUCTOS",
      DELETE: "PRODUCTOS",
    },
  },
  {
    rel: "unidades-medidas/route.ts",
    map: {
      GET: "PRODUCTOS",
      POST: "PRODUCTOS",
      PATCH: "PRODUCTOS",
      DELETE: "PRODUCTOS",
    },
  },
  // --- Ventas ---
  { rel: "ventas/productos/route.ts", map: { GET: "VENTAS" } },
  // --- Clientes ---
  {
    rel: "clientes/route.ts",
    map: {
      GET: "CLIENTES",
      POST: "CLIENTES",
      PATCH: "CLIENTES",
      DELETE: "CLIENTES",
    },
  },
  { rel: "ventas/clientes/route.ts", map: { GET: "CLIENTES" } },
  { rel: "CtaCteCliente/route.ts", map: { GET: "CLIENTES", POST: "CLIENTES" } },
  // --- Caja ---
  { rel: "cajas/route.ts", map: { GET: "CAJA" } },
  { rel: "conceptos-gastos/route.ts", map: { GET: "CAJA", POST: "CAJA" } },
  {
    rel: "gastos/route.ts",
    map: { GET: "CAJA", POST: "CAJA", PUT: "CAJA", DELETE: "CAJA" },
  },
  // --- Compras (corrección de módulo) ---
  { rel: "compras/productos/route.ts", map: { GET: "COMPRAS" } }, // era PROVEEDORES
  // --- Proveedores ---
  {
    rel: "proveedores/route.ts",
    map: {
      GET: "PROVEEDORES",
      POST: "PROVEEDORES",
      PATCH: "PROVEEDORES",
      DELETE: "PROVEEDORES",
    },
  },
  {
    rel: "proveedores/cta-cte/route.ts",
    map: { GET: "PROVEEDORES", POST: "PROVEEDORES" },
  },
  // --- Empleados ---
  {
    rel: "empleados/route.ts",
    map: {
      GET: "EMPLEADOS",
      POST: "EMPLEADOS",
      PUT: "EMPLEADOS",
      PATCH: "EMPLEADOS",
      DELETE: "EMPLEADOS",
    },
  },
  { rel: "empleados/cambiar-password/route.ts", map: { PUT: "EMPLEADOS" } },
  // reenviar-invitacion manejado aparte (usa requirePermiso con string literal)
  {
    rel: "empleados/reenviar-invitacion/route.ts",
    map: { POST: "EMPLEADOS" },
    fixOldString: true,
  },
  // --- Roles ---
  {
    rel: "roles/route.ts",
    map: {
      GET: "EMPLEADOS",
      POST: "EMPLEADOS",
      PATCH: "EMPLEADOS",
      DELETE: "EMPLEADOS",
    },
    fixOldString: true,
  },
  // --- Auditoría (módulo propio) ---
  {
    rel: "auditoria-empleados/route.ts",
    map: { GET: "AUDITORIA", POST: "AUDITORIA" },
  },
  // --- Sucursales (módulo propio) ---
  {
    rel: "sucursales/route.ts",
    map: { GET: "SUCURSALES", POST: "SUCURSALES", DELETE: "SUCURSALES" },
  },
  {
    rel: "sucursales/[id]/route.ts",
    map: { GET: "SUCURSALES", PATCH: "SUCURSALES", DELETE: "SUCURSALES" },
  },
  // --- Configuración ---
  {
    rel: "configuracion/route.ts",
    map: { GET: "CONFIGURACION", PUT: "CONFIGURACION" },
  },
  {
    rel: "configuracion/preferencias/route.ts",
    map: { GET: "CONFIGURACION", PUT: "CONFIGURACION" },
  },
  {
    rel: "configuracion/fiscal/route.ts",
    map: { GET: "CONFIGURACION", PUT: "CONFIGURACION" },
  },
  {
    rel: "configuracion/branding/route.ts",
    map: { GET: "CONFIGURACION", PUT: "CONFIGURACION" },
  },
  {
    rel: "configuracion/notificaciones/route.ts",
    map: { GET: "CONFIGURACION", PUT: "CONFIGURACION" },
  },
  {
    rel: "configuracion/seguridad/route.ts",
    map: { GET: "CONFIGURACION", PUT: "CONFIGURACION" },
  },
  {
    rel: "configuracion/seguridad/sesiones/route.ts",
    map: { GET: "CONFIGURACION", DELETE: "CONFIGURACION" },
  },
  {
    rel: "configuracion/seguridad/dispositivos/route.ts",
    map: { GET: "CONFIGURACION", DELETE: "CONFIGURACION" },
  },
  {
    rel: "configuracion/seguridad/auditoria/route.ts",
    map: { GET: "CONFIGURACION" },
  },
  {
    rel: "configuracion/seguridad/intentos-sospechosos/route.ts",
    map: { GET: "CONFIGURACION" },
  },
  {
    rel: "configuracion/seguridad/estadisticas/route.ts",
    map: { GET: "CONFIGURACION" },
  },
];

const WRITE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/** Devuelve el identificador del objeto de permisos según el método HTTP */
function permObjForMethod(method, module) {
  return WRITE_METHODS.has(method)
    ? `SET_PERMISSIONS.${module}`
    : `GET_PERMISSIONS.${module}`;
}

/**
 * Transforma el contenido del archivo.
 * Estrategia: parsear las funciones exportadas y reemplazar el primer
 * `permission: PERMISSIONS.X` (o `requirePermiso("...")`) dentro de cada una.
 */
function transform(content, fileConfig) {
  let result = content;
  const { map, fixOldString } = fileConfig;

  // 1. Arreglar "empleados:admin" string literal en requirePermiso
  if (fixOldString) {
    result = result.replace(
      /requirePermiso\(["']empleados:admin["']\)/g,
      "requirePermiso(SET_PERMISSIONS.EMPLEADOS)",
    );
    // También el array ["empleados:admin"] en roles/route.ts
    result = result.replace(
      /\["empleados:admin"\]/g,
      '[] /* "empleados:admin" eliminado — redundante con bypass Administrador */',
    );
  }

  // 2. Para cada método HTTP definido en el mapa, reemplazar
  //    el primer `permission: PERMISSIONS.<algo>` dentro de ese handler.
  //
  //    Estrategia: encontrar `export async function METHOD(` y desde ahí
  //    reemplazar la primera ocurrencia de `permission: PERMISSIONS.<ALGO>`.
  //    Como los archivos son lineales y los métodos no se anidan, esto es seguro.

  for (const [method, module] of Object.entries(map)) {
    const target = permObjForMethod(method, module);

    // Dividir en secciones por handler usando un regex que localiza el inicio
    // de cada handler exportado
    const handlerRx = new RegExp(
      `(export\\s+async\\s+function\\s+${method}\\b[\\s\\S]*?)` +
        // Hasta el próximo export function o fin de archivo
        `(?=export\\s+async\\s+function\\s+(?:GET|POST|PATCH|PUT|DELETE)\\b|$)`,
      "g",
    );

    result = result.replace(handlerRx, (handlerBlock) => {
      // Dentro del bloque, reemplazar la primera ocurrencia de
      // permission: PERMISSIONS.<ALGO>  o  permission: GET_PERMISSIONS.<ALGO>
      // o  permission: SET_PERMISSIONS.<ALGO>
      return handlerBlock.replace(
        /permission:\s*(?:PERMISSIONS|GET_PERMISSIONS|SET_PERMISSIONS)\.\w+/,
        `permission: ${target}`,
      );
    });
  }

  // 3. Actualizar imports
  result = updateImports(result, fileConfig);

  return result;
}

function updateImports(content, fileConfig) {
  const { map, fixOldString } = fileConfig;
  const methods = Object.keys(map);
  const needsGet = methods.some((m) => !WRITE_METHODS.has(m));
  const needsSet = methods.some((m) => WRITE_METHODS.has(m)) || fixOldString;

  // Encontrar la línea de import de comprobantes
  const importRx =
    /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/constants\/comprobantes["']/;
  const match = content.match(importRx);
  if (!match) return content;

  // Comprobar solo dentro de la línea de import (no en el resto del archivo)
  const importLine = match[0];
  const alreadyHasGet = /GET_PERMISSIONS/.test(importLine);
  const alreadyHasSet = /SET_PERMISSIONS/.test(importLine);

  const existingImports = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const toAdd = [];
  if (needsGet && !alreadyHasGet) toAdd.push("GET_PERMISSIONS");
  if (needsSet && !alreadyHasSet) toAdd.push("SET_PERMISSIONS");
  if (toAdd.length === 0) return content;

  // Insertar después de PERMISSIONS si existe, sino al final
  const permIdx = existingImports.findIndex((i) => i === "PERMISSIONS");
  if (permIdx !== -1) {
    existingImports.splice(permIdx + 1, 0, ...toAdd);
  } else {
    existingImports.push(...toAdd);
  }

  const newImport = `import { ${existingImports.join(", ")} } from "@/lib/constants/comprobantes"`;
  return content.replace(importRx, newImport);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let successCount = 0;
let errorCount = 0;

for (const fileConfig of FILE_CONFIGS) {
  const filePath = join(API_ROOT, fileConfig.rel);
  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (e) {
    console.warn(`[SKIP] No existe: ${fileConfig.rel}`);
    continue;
  }

  const transformed = transform(content, fileConfig);
  if (transformed === content) {
    console.log(`[UNCHANGED] ${fileConfig.rel}`);
  } else {
    writeFileSync(filePath, transformed, "utf-8");
    console.log(`[UPDATED]   ${fileConfig.rel}`);
    successCount++;
  }
}

console.log(`\nDone. ${successCount} files updated, ${errorCount} errors.`);
