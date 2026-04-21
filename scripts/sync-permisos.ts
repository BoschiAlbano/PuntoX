/**
 * sync-permisos.ts
 *
 * Sincroniza el catálogo global de permisos con las constantes definidas en
 * src/lib/constants/permissions.ts. Idempotente: se puede correr múltiples
 * veces sin riesgo.
 *
 * Casos de uso:
 *  - Primera vez tras la migración (crea los 33 permisos globales)
 *  - Cuando se agrega un módulo nuevo a permissions.ts
 *  - Como verificación de integridad
 *
 * Uso: npx tsx scripts/sync-permisos.ts
 */

import prisma from "@/DB/prisma";
import {
  ALL_PERMISSIONS,
  getPermissionDescription,
} from "@/lib/constants/permissions";

async function syncPermisos() {
  console.log("🔄 Sincronizando catálogo global de permisos...\n");

  const todasLasClaves = ALL_PERMISSIONS;

  console.log(
    `📋 Total de claves en constants/permissions.ts: ${todasLasClaves.length}`,
  );

  // Obtener claves existentes antes del upsert para calcular cuántas son nuevas
  const existentesAntes = await prisma.permiso.findMany({
    select: { Clave: true },
  });
  const clavesExistentes = new Set(existentesAntes.map((p) => p.Clave));

  for (const clave of todasLasClaves) {
    const descripcion = getPermissionDescription(clave);
    await prisma.permiso.upsert({
      where: { Clave: clave },
      update: { EstaEliminado: false, Descripcion: descripcion },
      create: { Clave: clave, Descripcion: descripcion, EstaEliminado: false },
    });
  }

  const creadas = todasLasClaves.filter((c) => !clavesExistentes.has(c)).length;
  const actualizadas = todasLasClaves.length - creadas;

  console.log("\n✅ Sincronización completada:");
  console.log(`   Nuevas: ${creadas}`);
  console.log(`   Ya existían (actualizadas): ${actualizadas}`);

  // Verificar si hay permisos en DB que ya no están en constants (obsoletos)
  const todosEnDB = await prisma.permiso.findMany({
    select: { Clave: true, EstaEliminado: true },
    orderBy: { Clave: "asc" },
  });

  const clavesSet = new Set<string>(todasLasClaves);
  const obsoletos = todosEnDB.filter((p) => !clavesSet.has(p.Clave));

  console.log("\n📊 Estado del catálogo:");
  console.log(`   Total en DB: ${todosEnDB.length}`);
  console.log(`   Del sistema (en constants): ${todasLasClaves.length}`);

  if (obsoletos.length > 0) {
    console.log(
      `\n⚠️  Permisos en DB que ya NO están en constants/permissions.ts (obsoletos):`,
    );
    for (const obs of obsoletos) {
      console.log(`   - "${obs.Clave}" (EstaEliminado: ${obs.EstaEliminado})`);
    }
    console.log("\n   Estos permisos NO se eliminan automáticamente.");
    console.log(
      "   Si querés eliminarlos, ejecutalos manualmente o actualiza constants/permissions.ts.",
    );
  }

  console.log("\n🔍 Claves activas del sistema:");
  for (const clave of todasLasClaves.sort()) {
    console.log(`   ✓ ${clave}`);
  }
}

syncPermisos()
  .catch((e) => {
    console.error("❌ Error sincronizando permisos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
