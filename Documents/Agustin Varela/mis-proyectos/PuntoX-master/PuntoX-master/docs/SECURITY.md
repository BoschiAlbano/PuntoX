# 🔒 Seguridad - PuntoX

Documentación sobre correcciones de seguridad, mejores prácticas y recomendaciones.

> 📖 **Ver también**: [Documentación completa de CSRF](./CSRF_IMPLEMENTATION.md) - Guía detallada sobre implementación de tokens CSRF

---

## ✅ Correcciones Implementadas

### 1. Eliminación de Fallbacks Peligrosos de TenantId

**Problema:** Fallbacks `Number(tenantId) || 1` permitían fuga de datos entre tenants.

**Solución:**
- ✅ Validación estricta de `tenantId` antes de usar
- ✅ Eliminados todos los fallbacks peligrosos
- ✅ Validación de pertenencia de recursos al tenant

**Archivos corregidos:**
- `src/app/api/productos/route.ts`

**Código seguro:**
```typescript
if (!tenantId || tenantId <= 0) {
  throw createError.unauthorized("TenantId inválido o no proporcionado");
}
const tenantIdBigInt = BigInt(tenantId);
```

---

### 2. Sistema Centralizado de Manejo de Errores

**Problema:** 102 `console.log/error` en 38 archivos, manejo inconsistente.

**Solución:**
- ✅ Sistema centralizado con `handleError()`
- ✅ Códigos de error estandarizados
- ✅ Eliminados ~15 `console.log/error` redundantes

**Archivos migrados:**
- 9+ endpoints API migrados a `handleError`

---

## 🔴 Mejoras Críticas Pendientes

### 1. Rate Limiting en Login

**Impacto:** 🔴 CRÍTICO  
**Tiempo:** 2-3 horas

**Problema:** Sin protección contra fuerza bruta.

**Solución recomendada:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
});
```

---

### 2. Logging de Intentos de Login

**Impacto:** 🔴 ALTO  
**Tiempo:** 2-3 horas

**Problema:** No se registran intentos fallidos.

**Solución:** Implementar tabla de auditoría para intentos de login.

---

### 3. Validación de Permisos Completa

**Impacto:** 🟡 MEDIO  
**Tiempo:** 4-6 horas

**Problema:** Algunos endpoints no validan permisos.

**Solución:** Revisar y agregar `requirePermiso()` donde falte.

---

## 🛡️ Mejores Prácticas

### Validación de TenantId

```typescript
// ✅ CORRECTO
if (!tenantId || tenantId <= 0) {
  throw createError.unauthorized("TenantId inválido");
}
const tenantIdBigInt = BigInt(tenantId);

// ❌ INCORRECTO
TenantId: Number(tenantId) || 1
```

### Validación de Permisos

```typescript
// ✅ CORRECTO
const { tenantId } = await requirePermiso("productos:crear");

// ❌ INCORRECTO
// Asumir permisos sin verificar
```

### Manejo de Errores

```typescript
// ✅ CORRECTO
try {
  // código
} catch (error) {
  return handleError(error);
}

// ❌ INCORRECTO
catch (error) {
  console.error("Error:", error);
  return NextResponse.json({ error: "Error" }, { status: 500 });
}
```

---

## 📊 Estado Actual

- ✅ **Multi-tenancy:** Aislamiento completo por `TenantId`
- ✅ **Autenticación:** Supabase Auth con JWT
- ✅ **Permisos:** Sistema granular implementado
- ✅ **Rate limiting:** Implementado en servidor (ver `src/lib/security/rateLimiter.ts`)
- ✅ **CSRF Protection:** Implementado, pendiente de integración (ver [CSRF_IMPLEMENTATION.md](./CSRF_IMPLEMENTATION.md))
- ✅ **Detección de actividad sospechosa:** Implementado (ver `src/lib/security/suspiciousActivity.ts`)
- ✅ **Logging de seguridad:** Implementado (tablas `IntentoLogin`, `AlertaSeguridad`)
- ⚠️ **Validación completa:** En progreso

---

## 🔍 Auditoría Recomendada

1. Buscar todos los `tenantId || 1` en el código
2. Verificar que todas las operaciones validen pertenencia al tenant
3. Revisar endpoints sin validación de permisos
4. Implementar logging estructurado

---

---

## 🔐 Protección CSRF

**Estado:** ✅ Implementado, pendiente de integración

La protección CSRF está completamente implementada y lista para usar. Ver documentación completa en [CSRF_IMPLEMENTATION.md](./CSRF_IMPLEMENTATION.md).

**Componentes implementados:**
- ✅ Tabla `TokenCsrf` en base de datos
- ✅ Funciones de generación y validación (`src/lib/security/csrf.ts`)
- ✅ Limpieza automática de tokens expirados

**Pendiente:**
- ⚠️ Crear endpoint `/api/csrf-token` para generar tokens
- ⚠️ Integrar en formularios críticos (configuración, empleados)
- ⚠️ Validar tokens en endpoints que modifiquen datos

---

**Última actualización:** Enero 2025

