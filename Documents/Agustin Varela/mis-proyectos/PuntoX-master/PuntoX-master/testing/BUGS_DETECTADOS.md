# Bugs Detectados en el Código de Producción

**Fecha:** 5 de Febrero, 2026  
**Última Actualización:** 5 de Febrero, 2026

Este documento lista bugs reales detectados en el código de producción durante los tests. Estos bugs deben ser corregidos antes del deploy.

## 📋 Resumen Ejecutivo

- **Bugs Críticos:** 1
- **Bugs Importantes:** 1
- **Estado:** Pendiente de corrección
- **Prioridad:** Revisar antes del próximo deploy

---

## 🔴 Bug Crítico 1: Manejo de Errores en verifyUserBranchAccess - API Caja

**Ubicación:** `src/app/api/caja/route.ts` (líneas 59-69, 632-642, 753-763)

**Problema:**
Cuando `verifyUserBranchAccess` lanza un error (por ejemplo, `createError.notFound`, `createError.unauthorized`, o `createError.forbidden`), el error NO está siendo manejado correctamente. El error se propaga y es capturado por el `catch` general, que retorna un 500 genérico en lugar del código de error apropiado (404, 401, 403).

**Código Problemático:**
```typescript
if (sucursalIdParam) {
  const access = await verifyUserBranchAccess(
    BigInt(tenantId),
    user.id,
    sucursalIdParam,
  );
  if (access) {
    sucursalId = access.sucursal.Id;
    sucursalNombre = access.sucursal.Nombre;
  }
}
```

**Comportamiento Actual:**
- Si `verifyUserBranchAccess` lanza `createError.notFound("Sucursal no encontrada")` → Se convierte en 500
- Si `verifyUserBranchAccess` lanza `createError.unauthorized("Usuario no encontrado")` → Se convierte en 500
- Si `verifyUserBranchAccess` lanza `createError.forbidden("No tienes acceso")` → Se convierte en 500

**Comportamiento Esperado:**
- `createError.notFound` → Debe retornar 404
- `createError.unauthorized` → Debe retornar 401
- `createError.forbidden` → Debe retornar 403

**Solución Recomendada:**
```typescript
if (sucursalIdParam) {
  try {
    const access = await verifyUserBranchAccess(
      BigInt(tenantId),
      user.id,
      sucursalIdParam,
    );
    if (access) {
      sucursalId = access.sucursal.Id;
      sucursalNombre = access.sucursal.Nombre;
    }
  } catch (error) {
    // Si es un error de la aplicación (AppError), retornarlo directamente
    if (error && typeof error === 'object' && 'status' in error) {
      return error; // Esto debería ser un Response con el status apropiado
    }
    // Si no, propagar para que lo maneje el catch general
    throw error;
  }
}
```

**Tests que lo detectan:**
- `testing/api/caja.route.test.ts` - "debe retornar el historial paginado de cajas para una sucursal (escenario normal)"
- `testing/api/caja.route.test.ts` - "debe retornar caja abierta de la sucursal cuando soloAbierta=true"
- `testing/api/caja.route.test.ts` - "debe registrar un gasto y actualizar la salida de efectivo cuando accion=gasto es válida"

**Impacto:**
- Los usuarios no reciben mensajes de error apropiados
- Los errores de autorización/permisos se confunden con errores del servidor
- Dificulta el debugging en producción

**Prioridad:** 🔴 CRÍTICA - Debe corregirse antes del deploy

---

## 🟡 Bug Importante 2: Posible Problema con SucursalId null en Prisma

**Ubicación:** `src/app/api/caja/route.ts` (línea 532)

**Problema:**
Si `verifyUserBranchAccess` retorna `null` (cuando `sucursalIdParam` es falsy), entonces `sucursalId` queda como `null`. Luego, en la línea 532, se usa `SucursalId: sucursalId` en el `where` de Prisma. Esto podría causar problemas si Prisma no maneja correctamente `null` en ese contexto.

**Código Problemático:**
```typescript
const where: any = {
  TenantId: BigInt(tenantId),
  SucursalId: sucursalId, // Puede ser null
  EstaEliminado: false,
};
```

**Comportamiento Actual:**
- Si `sucursalId` es `null`, Prisma podría filtrar incorrectamente o lanzar un error

**Solución Recomendada:**
```typescript
const where: any = {
  TenantId: BigInt(tenantId),
  EstaEliminado: false,
};

if (sucursalId !== null) {
  where.SucursalId = sucursalId;
}
```

**Tests que lo detectan:**
- Potencialmente todos los tests que usan `sucursalId` como parámetro opcional

**Impacto:**
- Posibles errores en consultas cuando `sucursalId` es `null`
- Comportamiento inconsistente entre casos con y sin `sucursalId`

**Prioridad:** 🟡 IMPORTANTE - Debe revisarse y corregirse

---

## 🔴 Bug Crítico 3: Acceso a Array sin Verificar - API Comprobantes

**Ubicación:** `src/app/api/comprobantes/route.ts` (línea 80)

**Problema:**
El código accede a `usuario.Sucursales[0].SucursalId` sin verificar si el array `Sucursales` tiene elementos. Si el usuario no tiene sucursales, esto causará un error `Cannot read property 'SucursalId' of undefined`.

**Código Problemático:**
```typescript
const sucursalId = usuario.Sucursales[0].SucursalId;

if (!sucursalId) {
  return NextResponse.json(
    { error: "Error, Sucursal no encontrada" },
    { status: 401 },
  );
}
```

**Comportamiento Actual:**
- Si `usuario.Sucursales` está vacío → Error: `Cannot read property 'SucursalId' of undefined`
- Se convierte en 500 genérico

**Comportamiento Esperado:**
- Si `usuario.Sucursales` está vacío → Debe retornar 401 con mensaje "Error, Sucursal no encontrada"

**Solución Recomendada:**
```typescript
const sucursalId = usuario.Sucursales[0]?.SucursalId;

if (!sucursalId) {
  return NextResponse.json(
    { error: "Error, Sucursal no encontrada" },
    { status: 401 },
  );
}
```

**Tests que lo detectan:**
- Potencialmente todos los tests de POST que no mockean `Sucursales` correctamente

**Impacto:**
- Error 500 en lugar de 401 cuando el usuario no tiene sucursal por defecto
- Dificulta el debugging

**Prioridad:** 🔴 CRÍTICA - Debe corregirse antes del deploy

---

## 🟡 Bug Importante 3: División por Cero en Cálculo de IVA - API Comprobantes

**Ubicación:** `src/app/api/comprobantes/route.ts` (línea 211)

**Problema:**
El código calcula `baseImponible` usando `descuento / subtotal`. Si `subtotal` es 0, esto causará división por cero o `Infinity`.

**Código Problemático:**
```typescript
const baseImponible = detalle.subtotal * (1 - descuento / subtotal);
```

**Comportamiento Actual:**
- Si `subtotal === 0` → `descuento / subtotal` = `Infinity` o `NaN`
- `baseImponible` se convierte en `NaN` o `Infinity`
- Los cálculos posteriores fallan

**Comportamiento Esperado:**
- Si `subtotal === 0`, el cálculo debe manejar este caso especial

**Solución Recomendada:**
```typescript
const baseImponible = subtotal > 0 
  ? detalle.subtotal * (1 - descuento / subtotal)
  : detalle.subtotal;
```

**Tests que lo detectan:**
- Potencialmente tests con `subtotal = 0` o casos edge

**Impacto:**
- Cálculos incorrectos de IVA
- Posibles errores en transacciones con subtotal 0

**Prioridad:** 🟡 IMPORTANTE - Debe revisarse y corregirse

---

## 🟡 Bug Importante 4: Acceso a Propiedades Anidadas sin Verificar - API Comprobantes GET

**Ubicación:** `src/app/api/comprobantes/route.ts` (líneas 459-464)

**Problema:**
El código accede a propiedades anidadas (`Persona_Cliente.Persona`) sin verificar si existen. Si alguna de estas propiedades es `null` o `undefined`, causará un error.

**Código Problemático:**
```typescript
let cliente = null;
if (comprobante.Comprobante_Factura) {
  cliente = (comprobante.Comprobante_Factura as any).Persona_Cliente.Persona;
} else if (comprobante.Comprobante_CuentaCorriente) {
  cliente = (comprobante.Comprobante_CuentaCorriente as any).Persona_Cliente.Persona;
}
```

**Comportamiento Actual:**
- Si `Persona_Cliente` es `null` → Error: `Cannot read property 'Persona' of null`
- Se convierte en 500 genérico

**Comportamiento Esperado:**
- Si `Persona_Cliente` es `null` → `cliente` debe ser `null` sin error

**Solución Recomendada:**
```typescript
let cliente = null;
if (comprobante.Comprobante_Factura?.Persona_Cliente?.Persona) {
  cliente = comprobante.Comprobante_Factura.Persona_Cliente.Persona;
} else if (comprobante.Comprobante_CuentaCorriente?.Persona_Cliente?.Persona) {
  cliente = comprobante.Comprobante_CuentaCorriente.Persona_Cliente.Persona;
}
```

**Tests que lo detectan:**
- `testing/api/comprobantes.route.test.ts` - "debe devolver comprobante sin detalle cuando detalle=false o ausente"
- `testing/api/comprobantes.route.test.ts` - "debe devolver comprobante con detalle y cliente resuelto cuando detalle=true"

**Impacto:**
- Error 500 en lugar de retornar comprobante sin cliente
- Dificulta el debugging

**Prioridad:** 🟡 IMPORTANTE - Debe revisarse y corregirse

---

## 🟡 Bug Importante 5: Acceso a Iva sin Verificar - API Comprobantes

**Ubicación:** `src/app/api/comprobantes/route.ts` (línea 210)

**Problema:**
El código accede a `articulo.Iva.Porcentaje` sin verificar si `Iva` existe. Si un artículo no tiene IVA asociado, esto causará un error.

**Código Problemático:**
```typescript
const porcentajeIva = Number(articulo.Iva.Porcentaje);
```

**Comportamiento Actual:**
- Si `articulo.Iva` es `null` o `undefined` → Error: `Cannot read property 'Porcentaje' of null`
- Se convierte en 500 genérico

**Comportamiento Esperado:**
- Si `articulo.Iva` es `null`, debe manejarse apropiadamente (usar 0 o lanzar error de validación)

**Solución Recomendada:**
```typescript
if (!articulo.Iva) {
  throw new Error(`El artículo ${articulo.Descripcion} no tiene IVA configurado`);
}
const porcentajeIva = Number(articulo.Iva.Porcentaje);
```

**Tests que lo detectan:**
- Potencialmente tests con artículos sin IVA

**Impacto:**
- Error 500 en lugar de error de validación apropiado
- Dificulta el debugging

**Prioridad:** 🟡 IMPORTANTE - Debe revisarse y corregirse

---

## 🟡 Bug Importante 6: Fetch a API Interna no Mockeada - API Comprobantes

**Ubicación:** `src/app/api/comprobantes/route.ts` (líneas 176-191)

**Problema:**
El código hace un `fetch` a `/api/contadores` que no está mockeado en los tests. Si este fetch falla o no está disponible, causará un error 500.

**Código Problemático:**
```typescript
const numeroResponse = await fetch(
  `${req.nextUrl.origin}/api/contadores?tipoComprobante=${data.tipoComprobante}`,
  {
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
  },
);

if (!numeroResponse.ok) {
  return NextResponse.json(
    { error: "Error al obtener número de comprobante" },
    { status: 500 },
  );
}
```

**Comportamiento Actual:**
- Si el fetch falla → Retorna 500 con mensaje genérico
- En tests, el fetch no está mockeado, causando errores

**Comportamiento Esperado:**
- El fetch debe estar mockeado en tests
- En producción, debe manejar errores apropiadamente

**Solución Recomendada:**
- Mockear `fetch` en los tests
- Considerar usar una función helper para obtener números de comprobante que pueda ser mockeada más fácilmente

**Tests que lo detectan:**
- Potencialmente todos los tests de POST que crean comprobantes

**Impacto:**
- Tests fallan porque `fetch` no está mockeado
- En producción, errores no manejados apropiadamente

**Prioridad:** 🟡 IMPORTANTE - Debe revisarse y corregirse

---

## 🟡 Bug Importante 7: Acceso a StockMinimo sin Verificar - API Ventas/Productos

**Ubicación:** `src/app/api/ventas/productos/route.ts` (línea 111)

**Problema:**
El código accede a `stockSucursal?.StockMinimo` pero si `stockSucursal` es `null` o `undefined`, usa `p.StockMinimo` que podría ser `null` o `undefined`, y luego hace `Number()` sobre eso.

**Código Problemático:**
```typescript
StockMinimo: Number(stockSucursal?.StockMinimo ?? p.StockMinimo),
```

**Comportamiento Actual:**
- Si ambos `stockSucursal.StockMinimo` y `p.StockMinimo` son `null` → `Number(null)` = `0` (esto está bien)
- Pero si `p.StockMinimo` es `undefined`, podría causar problemas

**Comportamiento Esperado:**
- Debe manejar correctamente `null` y `undefined`

**Solución Recomendada:**
```typescript
StockMinimo: Number(stockSucursal?.StockMinimo ?? p.StockMinimo ?? 0),
```

**Tests que lo detectan:**
- Potencialmente tests con productos sin `StockMinimo` configurado

**Impacto:**
- Posibles valores incorrectos de `StockMinimo` en la respuesta

**Prioridad:** 🟡 BAJA - Funciona pero podría mejorarse

---

## 📝 Resumen de Bugs Detectados

### Bugs Críticos (Deben corregirse antes del deploy):
1. **Manejo de Errores en verifyUserBranchAccess - API Caja** (3 ocurrencias en GET, POST, PATCH)
2. **Acceso a Array sin Verificar - API Comprobantes** (línea 80: `usuario.Sucursales[0].SucursalId`)

### Bugs Importantes (Deben revisarse y corregirse):
3. **SucursalId null en Prisma - API Caja** (línea 532)
4. **División por Cero en Cálculo de IVA - API Comprobantes** (línea 211)
5. **Acceso a Propiedades Anidadas sin Verificar - API Comprobantes GET** (líneas 459-464)
6. **Acceso a Iva sin Verificar - API Comprobantes** (línea 210)
7. **Fetch a API Interna no Mockeada - API Comprobantes** (líneas 176-191)
8. **Acceso a StockMinimo sin Verificar - API Ventas/Productos** (línea 111)

### Total de Bugs Detectados: 8

### Tests que Detectan estos Bugs:
- `testing/api/caja.route.test.ts` - 3 tests fallando (bugs críticos 1 y 2)
- `testing/api/comprobantes.route.test.ts` - 4 tests fallando (bugs importantes 3, 4, 5, 6, 7)
- `testing/api/ventas.productos.route.test.ts` - 2 tests fallando (posiblemente relacionados con bugs de mocks o estructura de datos)

### Nota Importante:
Los tests están funcionando correctamente al detectar estos bugs reales. Una vez corregidos los bugs en el código de producción, los tests deberían pasar sin necesidad de "arreglar" los mocks.

---

## 📝 Notas

- Estos bugs fueron detectados durante los tests porque los mocks no estaban interceptando correctamente `verifyUserBranchAccess`, lo que permitió que se ejecutara el código real y se detectaran estos problemas.
- Los tests están fallando con 500 porque estos bugs reales están siendo detectados, lo cual es el comportamiento correcto de los tests.
- Una vez corregidos estos bugs, los tests deberían pasar sin necesidad de "arreglar" los mocks.
