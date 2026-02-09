/**
 * Script para actualizar todos los permisos en las APIs
 * de strings literales a constantes PERMISSIONS
 *
 * Ejecutar: npx tsx scripts/update-permissions-to-constants.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Mapeo de strings literales a constantes PERMISSIONS
const PERMISSION_MAPPINGS: Record<string, string> = {
  ventas: "PERMISSIONS.VENTAS",
  "ventas:admin": "PERMISSIONS.VENTAS_ADMIN",
  caja: "PERMISSIONS.CAJA",
  "caja:admin": "PERMISSIONS.CAJA_ADMIN",
  productos: "PERMISSIONS.PRODUCTOS",
  "productos:admin": "PERMISSIONS.PRODUCTOS_ADMIN",
  empleados: "PERMISSIONS.EMPLEADOS",
  "empleados:admin": "PERMISSIONS.EMPLEADOS_ADMIN",
  clientes: "PERMISSIONS.CLIENTES",
  "clientes:admin": "PERMISSIONS.CLIENTES_ADMIN",
  reportes: "PERMISSIONS.REPORTES",
  "reportes:admin": "PERMISSIONS.REPORTES_ADMIN",
  configuracion: "PERMISSIONS.CONFIGURACION",
  "configuracion:admin": "PERMISSIONS.CONFIGURACION_ADMIN",
  sucursales: "PERMISSIONS.SUCURSALES",
  "sucursales:admin": "PERMISSIONS.SUCURSALES_ADMIN",
  auditoria: "PERMISSIONS.AUDITORIA",
  "auditoria:admin": "PERMISSIONS.AUDITORIA_ADMIN",
  analiticas: "PERMISSIONS.ANALITICAS",
  "analiticas:admin": "PERMISSIONS.ANALITICAS_ADMIN",
};

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith(".ts")) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function updatePermissions() {
  console.log("🔄 Actualizando permisos a constantes PERMISSIONS...\n");

  // Buscar todos los archivos TypeScript en /src/app/api
  const apiDir = join(process.cwd(), "src", "app", "api");
  const apiFiles = getAllFiles(apiDir);

  let updatedFiles = 0;
  let totalReplacements = 0;

  for (const file of apiFiles) {
    let content = readFileSync(file, "utf-8");
    const originalContent = content;
    let hasChanges = false;
    let fileReplacements = 0;

    // Verificar si ya tiene el import de PERMISSIONS
    const hasPermissionsImport = content.includes(
      'from "@/lib/auth/permissions"',
    );
    const hasGetAuthContextImport = content.includes(
      'from "@/lib/auth/getAuthUser"',
    );

    // Reemplazar cada permiso string literal por su constante
    for (const [literal, constant] of Object.entries(PERMISSION_MAPPINGS)) {
      // Buscar patrones como: permission: "productos"
      const regex = new RegExp(
        `permission:\\s*["']${literal.replace(/:/g, ":")}["']`,
        "g",
      );

      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, `permission: ${constant}`);
        fileReplacements += matches.length;
        hasChanges = true;
      }
    }

    // Si hubo cambios y no tiene el import, agregarlo
    if (hasChanges && !hasPermissionsImport && hasGetAuthContextImport) {
      // Buscar la línea del import de getAuthUser
      const importRegex = /import.*from "@\/lib\/auth\/getAuthUser";/;
      const match = content.match(importRegex);

      if (match) {
        const importLine = match[0];
        // Agregar import de PERMISSIONS después
        const newImport = `${importLine}\nimport { PERMISSIONS } from "@/lib/constants/comprobantes";`;
        content = content.replace(importRegex, newImport);
      }
    }

    // Si hubo cambios, guardar el archivo
    if (content !== originalContent) {
      writeFileSync(file, content, "utf-8");
      updatedFiles++;
      totalReplacements += fileReplacements;

      const relPath = file.replace(process.cwd(), "").replace(/\\/g, "/");
      console.log(`✅ ${relPath} - ${fileReplacements} reemplazo(s)`);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Archivos actualizados: ${updatedFiles}`);
  console.log(`   ✅ Reemplazos totales: ${totalReplacements}`);
  console.log(`\n✨ ¡Actualización completada!\n`);
}

updatePermissions();
