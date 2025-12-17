# Correcciones de Seguridad y Manejo de Errores

## Fecha: 2024

## Resumen

Este documento describe las correcciones críticas de seguridad y las mejoras en el manejo de errores implementadas en el proyecto.

---

## 1. Corrección de Fallback Peligroso de TenantId (ALTO - Seguridad)

### Problema Identificado

**Archivo:** `src/app/api/productos/route.ts` (líneas 139, 166, 270, 300)

**Riesgo:** Fuga de datos entre tenants debido a fallback `Number(tenantId) || 1`

Si `tenantId` era `null` o `0`, el sistema asignaba automáticamente el tenant 1, permitiendo potencialmente que usuarios accedan a datos de otros tenants.

### Solución Implementada

1. **Validación estricta de tenantId:**
   - Eliminados todos los fallbacks `|| 1`
   - Agregada validación: `if (!tenantId || tenantId <= 0)`
   - Lanzamiento de error 401 si el tenantId es inválido

2. **Validación de pertenencia en PATCH:**
   - En `PATCH /api/productos`, se valida que el producto pertenezca al tenant antes de actualizar
   - Uso de `findFirst` con filtro de `TenantId` en lugar de `findUnique`

3. **Uso consistente de BigInt:**
   - Conversión directa a `BigInt(tenantId)` sin fallbacks
   - Uso de `TenantId` directamente en lugar de `Tenant.connect`

### Archivos Modificados

- `src/app/api/productos/route.ts`
  - POST: Validación de tenantId + uso directo de `TenantId: BigInt(tenantId)`
  - PATCH: Validación de tenantId + validación de pertenencia + uso directo de `TenantId`

### Impacto

- **Seguridad:** Eliminado el riesgo de fuga de datos entre tenants
- **Confiabilidad:** Errores más claros cuando falta autenticación
- **Consistencia:** Manejo uniforme de tenantId en todas las operaciones

---

## 2. Migración de Manejo de Errores Inconsistente (MEDIO)

### Problema Identificado

- 102 `console.log/error` en 38 archivos
- Lógica duplicada para detección de errores de conexión
- Mensajes de error inconsistentes
- Dificultad para debugging y monitoreo

### Solución Implementada

#### 2.1 Centralización con `handleError`

Se migraron los archivos API más críticos a usar `handleError` de `@/lib/errors/handler`:

**Archivos migrados:**
- `src/app/api/productos/route.ts` - Eliminados 3 console.log/error
- `src/app/api/clientes/route.ts` - Eliminados 3 console.error con lógica duplicada
- `src/app/api/empleados/route.ts` - Eliminados 3 console.error
- `src/app/api/tenant/route.ts` - Eliminados 2 console.error con lógica duplicada
- `src/app/api/configuracion/route.ts` - Migrado GET y PUT a handleError
- `src/app/api/configuracion/seguridad/route.ts` - Eliminados 2 console.error
- `src/app/api/tarjetas/route.ts` - Migrado a handleError
- `src/app/api/puestos-trabajo/route.ts` - Migrado a handleError
- `src/app/api/contadores/route.ts` - Migrado a handleError

#### 2.2 Estructura de Errores Estandarizada

`handleError` devuelve errores en formato:
```typescript
{
  error: {
    code: ErrorCode,
    message: string,
    details?: unknown
  }
}
```

#### 2.3 Actualización del Frontend

**Archivo:** `src/app/(dashboard)/configuracion/page.tsx`

- Actualizado para manejar ambos formatos de error:
  - Nuevo: `{ error: { code, message } }`
  - Antiguo: `{ error: "mensaje" }` (compatibilidad)
- Eliminados `console.error` redundantes
- Mejorada la extracción de mensajes de error

### Beneficios

1. **Consistencia:** Todos los errores siguen el mismo formato
2. **Mantenibilidad:** Lógica de detección de errores centralizada
3. **Debugging:** Logging centralizado en `handleError` (solo para errores no manejados)
4. **Tipado:** Errores tipados con `ErrorCode` enum
5. **Mensajes claros:** Mensajes de error más descriptivos para el usuario

### Archivos de Soporte

- `src/lib/errors/types.ts` - Tipos y códigos de error
- `src/lib/errors/handler.ts` - Handler centralizado con detección de errores de Prisma

---

## 3. Corrección de Error de Prisma en Preferencias de Venta

### Problema Identificado

**Archivo:** `src/app/(dashboard)/configuracion/actions-preferencias-venta.ts`

**Error:** `Unknown field 'MostrarPreciosConIva' for select statement on model 'Configuracion'`

El cliente de Prisma generado no incluía los campos `MostrarPreciosConIva`, `AbrirCajonEfectivo`, y `NumerarPedidosPantalla` aunque existían en el schema.

### Solución

1. **Regeneración de Prisma:** Ejecutado `npx prisma generate` para sincronizar el cliente con el schema
2. **Código corregido:** Restaurado el uso correcto de `select` con los campos apropiados

### Archivos Modificados

- `src/app/(dashboard)/configuracion/actions-preferencias-venta.ts`
  - Restaurado `select` con campos correctos
  - Eliminado uso temporal de `as any`

---

## Resumen de Cambios

### Archivos Modificados

**Backend (API Routes):**
- `src/app/api/productos/route.ts`
- `src/app/api/clientes/route.ts`
- `src/app/api/empleados/route.ts`
- `src/app/api/tenant/route.ts`
- `src/app/api/configuracion/route.ts`
- `src/app/api/configuracion/seguridad/route.ts`
- `src/app/api/tarjetas/route.ts`
- `src/app/api/puestos-trabajo/route.ts`
- `src/app/api/contadores/route.ts`

**Frontend:**
- `src/app/(dashboard)/configuracion/page.tsx`
- `src/app/(dashboard)/configuracion/actions-preferencias-venta.ts`

**Librerías:**
- `src/lib/errors/types.ts` (ya existía)
- `src/lib/errors/handler.ts` (ya existía)
- `src/lib/requirePermiso.ts` (corrección de export duplicado)

### Estadísticas

- **Errores de seguridad corregidos:** 4 fallbacks peligrosos eliminados
- **Archivos API migrados:** 9 archivos
- **Console.log/error eliminados:** ~15 instancias
- **Líneas de código duplicado eliminadas:** ~100 líneas

---

## Próximos Pasos Recomendados

1. **Migrar archivos API restantes:**
   - `src/app/api/roles/route.ts`
   - `src/app/api/rubros/route.ts`
   - `src/app/api/marcas/route.ts`
   - Y otros archivos con `console.log/error`

2. **Auditoría de seguridad:**
   - Buscar otros fallbacks de `tenantId` en el código
   - Validar que todas las operaciones validen pertenencia al tenant

3. **Monitoreo:**
   - Considerar agregar logging estructurado (Winston, Pino)
   - Implementar alertas para errores críticos

4. **Testing:**
   - Agregar tests para validación de tenantId
   - Tests para manejo de errores en API routes

---

## Notas Técnicas

### Validación de TenantId

```typescript
// ❌ ANTES (PELIGROSO)
TenantId: Number(tenantId) || 1

// ✅ DESPUÉS (SEGURO)
if (!tenantId || tenantId <= 0) {
  throw createError.unauthorized("TenantId inválido o no proporcionado");
}
const tenantIdBigInt = BigInt(tenantId);
```

### Manejo de Errores

```typescript
// ❌ ANTES (INCONSISTENTE)
catch (error) {
  console.error("Error:", error);
  const isConnectionError = error?.code === "P1001" || ...;
  if (isConnectionError) {
    return NextResponse.json({ error: "..." }, { status: 503 });
  }
  return NextResponse.json({ error: "..." }, { status: 500 });
}

// ✅ DESPUÉS (CONSISTENTE)
catch (error) {
  return handleError(error);
}
```

---

## Referencias

- [MEJORAS_IMPLEMENTADAS.md](./MEJORAS_IMPLEMENTADAS.md) - Mejoras de backend anteriores
- [ACTUALIZACIONES_FRONTEND.md](./ACTUALIZACIONES_FRONTEND.md) - Mejoras de frontend anteriores

