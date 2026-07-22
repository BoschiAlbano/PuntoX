/**
 * =====================================================
 * MIGRACIÓN DE DATOS — Normalizar PlanSaaS.Caracteristicas
 * =====================================================
 *
 * Normaliza el JSON libre de `Caracteristicas` de los 3 planes existentes
 * al esquema fijo `PlanFeatures` (ver PLANES-SAAS.md / src/lib/planes/features.ts).
 * No cambia el schema (sigue siendo un string), solo el contenido.
 *
 * Cambio de negocio: el Plan Básico pasa a NO incluir Facturación Electrónica
 * (antes `incluyeAFIP:true`) y se agrega el límite de artículos.
 *
 * Ejecutar: npx tsx scripts/migrar-planes-features.ts
 * =====================================================
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

const NUEVAS_CARACTERISTICAS: Record<string, object> = {
  "Plan Ilimitado": {
    maxSucursales: null,
    maxUsuarios: null,
    maxArticulos: null,
    incluyeAFIP: true,
  },
  "Plan Básico": {
    maxSucursales: 1,
    maxUsuarios: 3,
    maxArticulos: 100,
    incluyeAFIP: false,
  },
  "Plan Premium": {
    maxSucursales: 3,
    maxUsuarios: 10,
    maxArticulos: null,
    incluyeAFIP: true,
  },
};

async function main() {
  for (const [nombre, caracteristicas] of Object.entries(
    NUEVAS_CARACTERISTICAS,
  )) {
    const plan = await prisma.planSaaS.findUnique({ where: { Nombre: nombre } });
    if (!plan) {
      console.warn(`⚠ Plan "${nombre}" no encontrado, se omite.`);
      continue;
    }

    const nuevoJson = JSON.stringify(caracteristicas);
    if (plan.Caracteristicas === nuevoJson) {
      console.log(`= "${nombre}" ya está actualizado.`);
      continue;
    }

    console.log(`→ "${nombre}"`);
    console.log(`  antes:  ${plan.Caracteristicas}`);
    console.log(`  después: ${nuevoJson}`);

    await prisma.planSaaS.update({
      where: { Id: plan.Id },
      data: { Caracteristicas: nuevoJson },
    });
  }

  console.log("Migración completa.");
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
