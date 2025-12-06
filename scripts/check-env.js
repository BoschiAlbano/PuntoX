#!/usr/bin/env node

/**
 * Script para verificar la configuracion de variables de entorno.
 * Útil antes de levantar el proyecto para evitar fallas por secretos faltantes.
 * Ejecuta: node scripts/check-env.js
 */

require("dotenv").config({ path: ".env.local" });

console.log("[check-env] Verificando configuracion de variables de entorno...\n");

const requiredVars = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  // NEXTAUTH_JWT_SECRET se permite igual a NEXTAUTH_SECRET, no se exige valor distinto
  NEXTAUTH_JWT_SECRET: process.env.NEXTAUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  DEFAULT_TENANT_ID: process.env.DEFAULT_TENANT_ID,
};

let hasErrors = false;

console.log("Variables REQUERIDAS:");
Object.entries(requiredVars).forEach(([key, value]) => {
  if (value) {
    console.log(
      `  OK ${key}: ${key.includes("SECRET") ? "***" + value.slice(-4) : value}`
    );
  } else {
    console.log(`  FALTA ${key}: NO CONFIGURADA`);
    hasErrors = true;
  }
});

console.log("\nVerificaciones adicionales:");

if (process.env.NEXTAUTH_SECRET) {
  if (process.env.NEXTAUTH_SECRET.length < 32) {
    console.log("  ERROR: NEXTAUTH_SECRET es muy corta (minimo 32 caracteres)");
    hasErrors = true;
  } else {
    console.log("  OK: NEXTAUTH_SECRET tiene longitud adecuada");
  }
}

if (process.env.NEXTAUTH_JWT_SECRET) {
  if (process.env.NEXTAUTH_JWT_SECRET.length < 32) {
    console.log(
      "  ERROR: NEXTAUTH_JWT_SECRET es muy corta (minimo 32 caracteres)"
    );
    hasErrors = true;
  } else {
    console.log("  OK: NEXTAUTH_JWT_SECRET tiene longitud adecuada");
  }
}

if (process.env.DEFAULT_TENANT_ID) {
  console.log("  OK: DEFAULT_TENANT_ID definido");
} else {
  console.log("  ADVERTENCIA: DEFAULT_TENANT_ID no esta definido");
  hasErrors = true;
}

if (process.env.DATABASE_URL) {
  if (
    process.env.DATABASE_URL.includes("sqlserver://") ||
    process.env.DATABASE_URL.includes("Server=")
  ) {
    console.log("  OK: DATABASE_URL parece apuntar a SQL Server");
  } else {
    console.log("  ADVERTENCIA: DATABASE_URL puede tener formato incorrecto para SQL Server");
  }
}

console.log("\nRESUMEN:");
if (hasErrors) {
  console.log("  Hay errores de configuracion que deben solucionarse");
  console.log("  Revisa tu archivo .env.local o .env");
} else {
  console.log("  Configuracion correcta");
  console.log("  Puedes iniciar el servidor con: npm run dev");
}

console.log("\nCONSEJOS:");
console.log("  - Asegurate de que el archivo .env.local este en la raiz del proyecto");
console.log("  - Reinicia el servidor despues de cambiar variables de entorno");
console.log("  - Las claves secretas deben ser diferentes y seguras");
console.log("  - Para desarrollo, puedes usar claves temporales pero no en produccion");

if (hasErrors) {
  process.exit(1);
}
