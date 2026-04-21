// @ts-nocheck — Script obsoleto: Permiso ya no tiene TenantId (catálogo global desde v2)
/**
 * Normaliza las claves de permisos en la DB:
 *   "ventas-page"  →  "ventas:page"
 *   "ventas-get"   →  "ventas:get"
 *   "ventas-set"   →  "ventas:set"
 *
 * Ejecutar: npx tsx scripts/normalizar-permisos-clave.ts
 */

import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // Buscar todas las claves con guión
  const permisos = await prisma.permiso.findMany({
    where: {
      EstaEliminado: false,
      OR: [
        { Clave: { contains: "-page" } },
        { Clave: { contains: "-get" } },
        { Clave: { contains: "-set" } },
      ],
    },
  });

  if (permisos.length === 0) {
    console.log("✅ No hay permisos con guión — la DB ya está normalizada.");
    return;
  }

  console.log(`🔧 Normalizando ${permisos.length} permiso(s)...\n`);

  for (const permiso of permisos) {
    const claveCorregida = permiso.Clave.replace(/-(page|get|set)$/, ":$1");

    // Verificar si ya existe un Permiso con la clave corregida en el mismo tenant
    const existente = await prisma.permiso.findFirst({
      where: {
        Clave: claveCorregida,
        TenantId: permiso.TenantId,
        EstaEliminado: false,
      },
    });

    if (existente) {
      // Ya existe el permiso con dos puntos: reasignar relaciones y borrar el duplicado
      console.log(
        `  ⚠️  Duplicado — reasignando "${permiso.Clave}" → "${claveCorregida}" (Id=${existente.Id})`,
      );

      // Mover PerfilPermiso al permiso correcto (ignorar conflictos únicos)
      const relaciones = await prisma.perfilPermiso.findMany({
        where: { PermisoId: permiso.Id },
      });

      for (const rel of relaciones) {
        const yaExiste = await prisma.perfilPermiso.findFirst({
          where: { PerfilId: rel.PerfilId, PermisoId: existente.Id },
        });
        if (!yaExiste) {
          await prisma.perfilPermiso.create({
            data: { PerfilId: rel.PerfilId, PermisoId: existente.Id },
          } as Parameters<typeof prisma.perfilPermiso.create>[0]);
        }
      }

      // Eliminar relaciones del permiso con guión
      await prisma.perfilPermiso.deleteMany({
        where: { PermisoId: permiso.Id },
      });

      // Marcar como eliminado el permiso con guión
      await prisma.permiso.update({
        where: { Id: permiso.Id },
        data: { EstaEliminado: true },
      } as Parameters<typeof prisma.permiso.update>[0]);
    } else {
      // No existe duplicado: renombrar directamente
      await prisma.permiso.update({
        where: { Id: permiso.Id },
        data: { Clave: claveCorregida },
      } as Parameters<typeof prisma.permiso.update>[0]);
      console.log(`  ✓  "${permiso.Clave}"  →  "${claveCorregida}"`);
    }
  }

  console.log("\n✅ Normalización completada.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
