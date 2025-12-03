#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 * Ejecuta: node scripts/check-env.js
 */

require("dotenv").config({ path: ".env.local" });

console.log("🔍 Verificando configuración de variables de entorno...\n");

const requiredVars = {
	NEXTAUTH_URL: process.env.NEXTAUTH_URL,
	NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
	NEXTAUTH_JWT_SECRET: process.env.NEXTAUTH_JWT_SECRET,
	DATABASE_URL: process.env.DATABASE_URL,
};

const optionalVars = {
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

let hasErrors = false;

// Verificar variables requeridas
console.log("📋 Variables REQUERIDAS:");
Object.entries(requiredVars).forEach(([key, value]) => {
	if (value) {
		console.log(
			`  ✅ ${key}: ${key.includes("SECRET") ? "***" + value.slice(-4) : value}`
		);
	} else {
		console.log(`  ❌ ${key}: NO CONFIGURADA`);
		hasErrors = true;
	}
});

console.log("\n🌐 Variables OPCIONALES:");
Object.entries(optionalVars).forEach(([key, value]) => {
	if (value) {
		console.log(
			`  ✅ ${key}: ${key.includes("SECRET") ? "***" + value.slice(-4) : value}`
		);
	} else {
		console.log(`  ⚠️  ${key}: NO CONFIGURADA (Google OAuth no funcionará)`);
	}
});

console.log("\n🔧 Verificaciones adicionales:");

// Verificar que las claves secretas sean diferentes
if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_JWT_SECRET) {
	if (process.env.NEXTAUTH_SECRET === process.env.NEXTAUTH_JWT_SECRET) {
		console.log("  ❌ NEXTAUTH_SECRET y NEXTAUTH_JWT_SECRET son iguales");
		hasErrors = true;
	} else {
		console.log("  ✅ NEXTAUTH_SECRET y NEXTAUTH_JWT_SECRET son diferentes");
	}
}

// Verificar longitud de claves secretas
if (process.env.NEXTAUTH_SECRET) {
	if (process.env.NEXTAUTH_SECRET.length < 32) {
		console.log("  ⚠️  NEXTAUTH_SECRET es muy corta (mínimo 32 caracteres)");
	} else {
		console.log("  ✅ NEXTAUTH_SECRET tiene longitud adecuada");
	}
}

if (process.env.NEXTAUTH_JWT_SECRET) {
	if (process.env.NEXTAUTH_JWT_SECRET.length < 32) {
		console.log(
			"  ⚠️  NEXTAUTH_JWT_SECRET es muy corta (mínimo 32 caracteres)"
		);
	} else {
		console.log("  ✅ NEXTAUTH_JWT_SECRET tiene longitud adecuada");
	}
}

// Verificar formato de DATABASE_URL
if (process.env.DATABASE_URL) {
	if (
		process.env.DATABASE_URL.includes("postgresql://") ||
		process.env.DATABASE_URL.includes("mysql://") ||
		process.env.DATABASE_URL.includes("sqlite://")
	) {
		console.log("  ✅ DATABASE_URL tiene formato válido");
	} else {
		console.log("  ⚠️  DATABASE_URL puede tener formato incorrecto");
	}
}

console.log("\n📊 RESUMEN:");
if (hasErrors) {
	console.log("  ❌ Hay errores de configuración que deben solucionarse");
	console.log("  📖 Revisa el archivo ENV_SETUP.md para instrucciones");
} else {
	console.log("  ✅ Configuración correcta");
	console.log("  🚀 Puedes iniciar el servidor con: npm run dev");
}

console.log("\n💡 CONSEJOS:");
console.log(
	"  • Asegúrate de que el archivo .env.local esté en la raíz del proyecto"
);
console.log("  • Reinicia el servidor después de cambiar variables de entorno");
console.log("  • Las claves secretas deben ser diferentes y seguras");
console.log("  • Para desarrollo, puedes usar claves temporales");

if (hasErrors) {
	process.exit(1);
}
