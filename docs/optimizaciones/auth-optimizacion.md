# Optimizaciones de Rendimiento - Sistema de Autenticación

## 📋 Resumen de Optimizaciones Implementadas

Este documento describe las optimizaciones implementadas para mejorar el rendimiento del sistema de autenticación y autorización de la aplicación.

### 🎯 Problema Original

El endpoint `getAuthContext` realizaba múltiples consultas en cada request:

1. Verificación de JWT en Supabase (~50-100ms)
2. Consulta a tabla Usuario (~20-50ms)
3. Consulta a tabla UsuarioSucursal (~20-50ms)
4. Consulta a tabla PerfilUsuario (~20-50ms)

**Total por request: ~110-250ms de overhead de seguridad**

### ✨ Solución Implementada

Se implementaron 4 niveles de optimización:

#### 1. 🚀 JWT Caching (60 segundos)

- **Archivo**: `src/lib/auth/getAuthUser.ts` - función `getCachedUser()`
- **Mejora**: Evita llamadas de red a Supabase
- **Impacto**: Reduce de ~50-100ms a <1ms en requests cacheados
- **TTL**: 60 segundos (configurable en `JWT_CACHE_TTL`)

#### 2. 🔄 Request-Level Context Caching

- **Archivos**:
  - `src/lib/auth/requestContext.ts`
  - `src/lib/auth/getAuthUser.ts` - uso de `getRequestAuthContext()`
- **Mejora**: Evita múltiples validaciones en el mismo request HTTP
- **Impacto**: 0 overhead adicional si se llama `getAuthContext` múltiples veces en un request
- **Ejemplo**: Si un middleware y un route handler llaman a `getAuthContext`, solo se ejecuta una vez

#### 3. 💾 Database Query Caching (30 segundos)

- **Caches implementados**:
  - `userContextCache`: Datos de usuario (ID, estado de bloqueo, perfiles)
  - `branchAccessCache`: Validación de acceso a sucursales
  - `sessionCache`: Sesiones activas (solo si `checkActiveSession=true`)
- **Mejora**: Reduce queries repetitivas a la base de datos
- **Impacto**: Reduce cada query de ~20-50ms a <1ms
- **TTL**: 30 segundos (configurable en `DB_CACHE_TTL`)

#### 4. 🗄️ Database Indexes

- **Archivo**: `scripts/migrations/add-auth-indexes.sql`
- **Script**: `scripts/apply-auth-indexes.ts`
- **Índices creados**: 15+ índices en tablas críticas
- **Mejora**: Optimiza queries que no están en cache
- **Impacto**: Reduce queries de DB de ~20-50ms a ~5-10ms

### 📊 Resultados Esperados

| Escenario                             | Antes      | Después  | Mejora                    |
| ------------------------------------- | ---------- | -------- | ------------------------- |
| Primer request (cache frío)           | ~110-250ms | ~20-50ms | **80-200ms más rápido**   |
| Request cacheado (mismo usuario)      | ~110-250ms | **<5ms** | **~105-245ms más rápido** |
| Request repetido (mismo HTTP request) | ~220-500ms | **<5ms** | **~215-495ms más rápido** |

### 🛠️ Aplicar las Optimizaciones

#### Paso 1: Aplicar Índices de Base de Datos

```bash
# Ejecutar el script de migración
npx tsx scripts/apply-auth-indexes.ts
```

Este comando:

- Crea 15+ índices en las tablas de seguridad
- Actualiza estadísticas del optimizador de PostgreSQL
- Es idempotente (se puede ejecutar múltiples veces sin problemas)

#### Paso 2: Verificar Funcionamiento

El código ya está actualizado en `src/lib/auth/getAuthUser.ts`. Para verificar:

```typescript
import { getAuthContext } from "@/lib/auth/getAuthUser";

// En tus API routes
export async function GET(req: NextRequest) {
  const { tenantId, usuarioId, sucursalId, permissions } = await getAuthContext(
    {
      req,
      permission: "ventas", // Ahora con type-safety!
    },
  );

  // ... tu lógica
}
```

### 🔒 Seguridad

Las optimizaciones **NO comprometen la seguridad**:

1. **JWT Caching**: El JWT se valida en Supabase al menos cada 60 segundos
2. **DB Caching**: Los datos de usuario se refrescan cada 30 segundos
3. **Invalidación de Cache**: Funciones disponibles para invalidar cuando sea necesario:

```typescript
import {
  invalidateUserCache,
  invalidateBranchCache,
} from "@/lib/auth/getAuthUser";

// Cuando cambien permisos de un usuario
invalidateUserCache(authUserId, tenantId);

// Cuando cambien asignaciones de sucursales
invalidateBranchCache(usuarioId);
```

### 📝 Mejores Prácticas

#### Usar Tipos Estrictos de Permisos

```typescript
import { PERMISSIONS } from "@/lib/constants/comprobantes";

// ✅ Correcto - Type-safe
const ctx = await getAuthContext({
  permission: PERMISSIONS.VENTAS_ADMIN,
});

// ❌ Evitar - String literal propenso a errores
const ctx = await getAuthContext({
  permission: "ventas:admin",
});
```

#### Invalidar Cache Cuando Sea Necesario

```typescript
// Después de actualizar permisos de un usuario
await actualizarPermisosEnJWT(authUserId);
invalidateUserCache(authUserId, tenantId);

// Después de cambiar asignación de sucursales
await asignarSucursal(usuarioId, sucursalId);
invalidateBranchCache(usuarioId);
```

#### Monitorear Rendimiento

```typescript
// En desarrollo, puedes medir el impacto
const start = Date.now();
const ctx = await getAuthContext({ req, permission: "ventas" });
console.log(`getAuthContext tardó: ${Date.now() - start}ms`);
```

### 🔧 Configuración

Puedes ajustar los TTL de cache en `src/lib/auth/getAuthUser.ts`:

```typescript
// JWT cache - Recomendado: 60 segundos
const JWT_CACHE_TTL = 60 * 1000;

// DB cache - Recomendado: 30 segundos
const DB_CACHE_TTL = 30 * 1000;
```

**⚠️ Consideraciones**:

- TTL más bajo = Más seguro pero menos rendimiento
- TTL más alto = Mejor rendimiento pero cambios tardan más en propagarse
- Los valores recomendados son un buen balance

### 📈 Monitoreo

Para verificar que las optimizaciones funcionan:

1. **Logs de cache**:

```typescript
// Agregar temporalmente en getAuthContext
console.log(`🎯 Cache hit: ${cachedContext ? "YES" : "NO"}`);
```

2. **Métricas de base de datos**:

```sql
-- Verificar uso de índices
EXPLAIN ANALYZE
SELECT * FROM "Usuario"
WHERE "AuthUserId" = 'xxx' AND "TenantId" = 2;
```

3. **Network tab**: Las llamadas a Supabase deberían reducirse significativamente

### 🐛 Troubleshooting

#### Cache no se invalida correctamente

```typescript
// Forzar limpieza manual de todos los caches
import { invalidateUserCache } from "@/lib/auth/getAuthUser";
invalidateUserCache(authUserId); // Sin tenantId limpia todo
```

#### Índices no se aplican

```bash
# Verificar índices creados
psql -U usuario -d database -c "\d Usuario"

# Recrear índices manualmente
psql -U usuario -d database -f scripts/migrations/add-auth-indexes.sql
```

#### Permisos desactualizados en cache

```typescript
// Asegúrate de invalidar después de actualizar
await actualizarPermisosEnJWT(authUserId);
invalidateUserCache(authUserId, tenantId); // ← No olvidar esto
```

### 📚 Referencias

- **Archivos modificados**:
  - `src/lib/auth/getAuthUser.ts` - Core optimizado
  - `src/lib/auth/permissions.ts` - Tipos estrictos de permisos
  - `src/lib/auth/requestContext.ts` - Request-level caching
  - `scripts/migrations/add-auth-indexes.sql` - Índices de DB
  - `scripts/apply-auth-indexes.ts` - Script de aplicación

- **Herramientas útiles**:
  - [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)
  - [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
  - [Supabase Auth](https://supabase.com/docs/guides/auth)

---

**Última actualización**: 2026-01-30  
**Autor**: Optimización implementada por Antigravity AI
