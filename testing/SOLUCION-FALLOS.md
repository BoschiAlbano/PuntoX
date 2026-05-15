# Solución de fallos de tests — Documentación

Este documento describe las correcciones realizadas para solucionar los **10 tests fallidos** documentados en [INFORME-FALLOS.md](INFORME-FALLOS.md). Todas las correcciones se aplicaron mediante **refactorización de schemas Zod** existentes, sin crear nuevas APIs ni modificar la estructura del proyecto.

---

## 1. Resumen de correcciones

| Archivo modificado | Cambio aplicado | Tests que pasan |
|-------------------|-----------------|-----------------|
| `src/app/api/caja/route.ts` | `.max(999_999_999_999)` en `montoInicial` y `montoCierre` | caja-validation (2) |
| `src/lib/validations/cliente.schema.ts` | `.max(999_999_999_999)` en `MontoMaximoCtaCte` (create/update) | cliente-validation (2) |
| `src/lib/services/comprobantes.ts` | Refinamiento: `descuento <= subtotal` | comprobantes-validation (1) |
| `src/app/api/gastos/route.ts` | `.max(999_999_999_999)` en `pagos[].monto` | gastos-validation (1) |
| `src/lib/validations/producto.schema.ts` | `.min(0)` en `PrecioPublico` y `PrecioPublico2` (create/update) | producto-validation (1) |
| `src/app/api/CtaCteCliente/route.ts` | `.max(999_999_999_999)` en `monto` de pago | ctacte-validation (1) |
| `src/app/api/roles/route.ts` | `.max(250)` en `nombre` de rol | roles-validation (1) |
| `src/lib/validations/usuario.schema.ts` | `.max(100)` en `nombreUsuario` | usuario-validation (1) |

**Total: 8 archivos modificados, 10 tests corregidos.**

---

## 2. Detalle de cada corrección

### 2.1. Caja — Monto inicial y monto de cierre excesivos

**Problema:** `abrirCajaSchema` y `cerrarCajaSchema` aceptaban `1e12` sin límite máximo.

**Solución:** Se añadió una constante `MONTO_CAJA_MAX = 999_999_999_999` y `.max()` en ambos schemas.

```ts
// src/app/api/caja/route.ts
const MONTO_CAJA_MAX = 999_999_999_999;

export const abrirCajaSchema = z.object({
  montoInicial: z.number().min(0).max(MONTO_CAJA_MAX),
});

export const cerrarCajaSchema = z.object({
  montoCierre: z.number().min(0).max(MONTO_CAJA_MAX),
});
```

---

### 2.2. Cliente — MontoMaximoCtaCte excesivo

**Problema:** `createClienteSchema` y `updateClienteSchema` aceptaban `1e15` en `MontoMaximoCtaCte`.

**Solución:** Se añadió `.max(999_999_999_999)` en ambos schemas.

```ts
// src/lib/validations/cliente.schema.ts
MontoMaximoCtaCte: z.number().min(0).max(999_999_999_999).optional().default(0);
// idem para update
```

---

### 2.3. Comprobantes — Descuento mayor que subtotal

**Problema:** El schema aceptaba `descuento: 999999` cuando el subtotal de los detalles era 100, permitiendo totales negativos.

**Solución:** Se añadió un refinamiento `.refine()` que exige `descuento <= subtotal`, donde `subtotal` se calcula como la suma de `detalles[].subtotal`.

```ts
// src/lib/services/comprobantes.ts
export const createComprobanteBaseSchema = z
  .object({ ... })
  .refine(
    (data) => {
      const subtotal = data.detalles.reduce((acc, d) => acc + d.subtotal, 0);
      const descuento = data.descuento ?? 0;
      return descuento <= subtotal;
    },
    {
      message: "El descuento no puede ser mayor que el subtotal de los detalles",
      path: ["descuento"],
    },
  );
```

---

### 2.4. Gastos — Monto de pago excesivo

**Problema:** `createGastoSchema` aceptaba `pagos[].monto: 1e15`.

**Solución:** Se añadió `.max(999_999_999_999)` al campo `monto` dentro del objeto de pago.

```ts
// src/app/api/gastos/route.ts
monto: z.number().min(0.01).max(999_999_999_999),
```

---

### 2.5. Producto — Precio público negativo

**Problema:** `createProductoSchema` y `updateProductoSchema` aceptaban `PrecioPublico: -1` y `PrecioPublico2: -1`.

**Solución:** Se añadió `.min(0, "El precio público no puede ser negativo")` a ambos campos en create y update.

```ts
// src/lib/validations/producto.schema.ts
PrecioPublico: z.number().min(0, "El precio público no puede ser negativo"),
PrecioPublico2: z.number().min(0, "El precio público no puede ser negativo"),
// idem en update con .optional()
```

---

### 2.6. CtaCte Cliente — Monto de pago excesivo

**Problema:** `pagoCtaCteSchema` aceptaba `monto: 1e15`.

**Solución:** Se añadió `.max(999_999_999_999)` al campo `monto`.

```ts
// src/app/api/CtaCteCliente/route.ts
monto: z.number().positive().max(999_999_999_999),
```

---

### 2.7. Roles — Nombre de longitud excesiva

**Problema:** `rolSchema` aceptaba `nombre` de 50001 caracteres.

**Solución:** Se añadió `.max(250)` al campo `nombre`.

```ts
// src/app/api/roles/route.ts
nombre: z.string().min(1).max(250, "El nombre no puede exceder 250 caracteres"),
```

---

### 2.8. Usuario — nombreUsuario de longitud excesiva

**Problema:** `createUsuarioSchema` aceptaba `nombreUsuario` de 501 caracteres.

**Solución:** Se añadió `.max(100)` al campo `nombreUsuario`.

```ts
// src/lib/validations/usuario.schema.ts
nombreUsuario: z.string().min(1).max(100, "El nombre de usuario no puede exceder 100 caracteres"),
```

---

## 3. Decisiones de diseño

### Límite numérico para montos

Se usó `999_999_999_999` (≈ 1 billón) como tope máximo en todos los campos monetarios. Este valor:
- Es suficiente para operaciones comerciales reales.
- Evita overflow en bases de datos y cálculos.
- Mitiga ataques DoS con valores extremos.
- Es consistente entre caja, gastos, cliente y CtaCte.

### Límites de longitud de texto

- **Rol nombre:** 250 caracteres (alineado con límites típicos de DB para descripciones).
- **Usuario nombreUsuario:** 100 caracteres (usernames suelen ser cortos).

---

## 4. Código no creado (según requisito)

- **APIs nuevas:** No se creó ninguna. Todas las correcciones modifican código existente.
- **VentaFooter.tsx:** El informe sugería `max={100}` en el input de descuento; la validación backend (descuento ≤ subtotal) ya cubre el caso. Si se desea UX adicional, se puede añadir `max={100}` en el componente de forma independiente.
- **Archivos permisos/empleados route.test.ts:** El INFORME-FALLOS los listaba como "no encontrados", pero en el estado actual del repo ya existen y pasan. No se requirió acción.

---

## 5. Cómo verificar

```bash
# Ejecutar toda la suite
pnpm test

# Solo tests de validación
npx vitest run src/test/validation --reporter=verbose
```

**Resultado esperado:** `Test Files 49 passed (49)` y `Tests 254 passed (254)`.

---

## 6. Referencias

- [INFORME-FALLOS.md](INFORME-FALLOS.md) — Listado original de fallos.
- [INFORME-VALIDACIONES.md](INFORME-VALIDACIONES.md) — Hallazgos de validación.
- API de referencia: `src/app/api/marcas/route.ts` (estructura respetada en modificaciones).

---

**Última actualización:** 2025-02-12 — Correcciones aplicadas y documentadas. Tests pasando.
