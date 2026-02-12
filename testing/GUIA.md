# Guía de testing — PuntoX

Guía única de testing: cómo ejecutar, qué está implementado, infraestructura y convenciones. Toda la documentación de testing del proyecto vive en la carpeta **`testing/`**.

---

## Estado actual

- **Framework:** Vitest 4.x
- **Tests de UI:** @testing-library/react, @testing-library/jest-dom, jsdom (solo para componentes)
- **Entorno por defecto:** `node` (API y lib). `jsdom` se aplica automáticamente a:
  - `src/components/**/*.test.{ts,tsx}`
  - `src/**/*.test.tsx`

---

## Cómo ejecutar tests

| Comando | Descripción |
|--------|-------------|
| `npm test` | Ejecuta toda la suite de tests unitarios una vez |
| `npm run test:watch` | Modo watch (desarrollo) |
| `npm run test:coverage` | Ejecuta tests con reporte de cobertura (V8) |
| `npm run test:e2e` | Ejecuta tests E2E con Playwright |
| `npm run test:e2e:ui` | Ejecuta tests E2E con interfaz visual (modo debug) |

### Ejecutar tests concretos

```bash
# Un archivo
npx vitest run src/components/auth/CredentialsForm.test.ts

# Por patrón
npx vitest run src/lib

# Un test por nombre
npx vitest run -t "debe retornar 401"
```

---

## Tests implementados (archivos reales)

### 1. Componentes / Auth

**Archivo:** `src/components/auth/CredentialsForm.test.ts`

- Validación de email (regex)
- Mapeo de errores (getErrorMessage)
- Casos: credenciales inválidas, Error, objeto con message, desconocido

### 2. Utilidades de auditoría

**Archivo:** `src/app/(dashboard)/empleados/auditoria-utils.test.ts`

- Formateo de auditoría: tiempo relativo, acciones, severidad

**Archivos API (handlers):** La **estructura de referencia** para todos los tests de API es **`src/app/api/marcas/route.test.ts`** (API de marcas en productos). El resto de tests de API deben seguir esa misma estructura. Archivos actuales: `marcas` (referencia), `permisos`, `empleados`, `clientes`, `auth/me`, `comprobantes`, `caja`, `roles`, `gastos`, `productos`, `ivas`, `rubros`, `unidades-medidas`, `conceptos-gastos`, `sucursales`, `contadores`, `condiciones-iva`, `configuracion`, `provincias`, `tarjetas`, `ventas/productos` — 403, 400+details, 200/201 según método.

**Lib:** `src/lib/errors/handler.test.ts` — isDatabaseConnectionError, handlePrismaError, handleError. `src/lib/services/comprobantes.test.ts` — schemas formaPago, detalleComprobante, createComprobanteBase. `src/lib/sucursal/verifyUserBranch.test.ts` — null cuando sucursalId null, notFound si sucursal inexistente, forbidden sin acceso.

**Componente caja:** `src/components/caja/CajaActual.test.tsx` — render sin crash y texto "Abrir Caja" cuando no hay caja abierta.

**Hooks:** `useRoles`, `useProductos`, `useGastos`, `useCaja`, `useDebounce`, `useSucursales`, `useConfiguracion`, `useCtaCte`, `useUsuario` — fetch con datos, mutations con mock global.

**Componente ventas:** `src/components/ventas/VentaFooter.test.tsx` — render sin crash, Subtotal y CONFIRMAR VENTA. `src/components/ventas/ProductSearch.test.tsx` — render y placeholder de búsqueda.

**Componentes compartidos:** `src/components/shared/GenericCrud.test.tsx` — render con input de búsqueda. `src/components/dashboard/Sidebar.test.tsx` — botones Ventas, Productos, Clientes.

**Lib:** `src/lib/utils/debounce.test.ts`, `src/lib/services/contadores.test.ts` — utilidades y servicios.

**API adicionales:** `departamentos`, `localidades`, `CtaCteCliente`, `productos/[id]`, `productos/ultimo-codigo`, `auth/register`, `ventas/clientes`, `analiticas/kpis`, `analiticas/graficas`, `sucursales/[id]`, `sucursales/cambiar`, `auditoria-empleados`, `cajas`.

Para tests **no encontrados** o **fallos** ver [INFORME-FALLOS.md](INFORME-FALLOS.md). Para el último resultado de ejecución, [resumen-ejecucion.md](resumen-ejecucion.md).

---

### Tests E2E (Playwright)

**Carpeta:** `e2e/`

| Archivo | Flujos |
|---------|--------|
| `landing.spec.ts` | Carga página principal, título Punto X, navbar con "Iniciar Sesión", sección hero/características |
| `signin.spec.ts` | Carga /signin, heading "Bienvenido", formulario (placeholder juan), mensaje de acceso por invitación |
| `guards/redirect-unauth.spec.ts` | /ventas, /dashboard, /productos, /clientes sin login redirigen a /signin |
| `auth/login-dashboard.spec.ts` | Login real → redirección → sidebar visible |
| `auth/login-ventas.spec.ts` | Login real → pantalla de ventas con búsqueda de productos |

**Ejecutar tests E2E:**

```bash
npm run test:e2e
# Solo Chromium (más rápido)
npm run test:e2e -- --project=chromium
# Interfaz visual para depuración
npm run test:e2e:ui
```

Playwright arranca automáticamente el servidor de desarrollo (`npm run dev`) si no está corriendo.

**Tests con login real:** Los archivos `auth/login-*.spec.ts` usan el fixture `e2e/fixtures/auth.ts` que hace login con usuario de Supabase. Credenciales por defecto: `E2E_USER` (default: Agucho), `E2E_PASSWORD` (default: 12345678). Para CI u otro usuario, definir las variables de entorno. Ver `.env.e2e.example`.

---

### 3. Tests de validación (fronteras / límites)

**Carpeta:** `src/test/validation/`

Objetivo: detectar valores inválidos que el sistema acepta (ej. descuento 200% en ventas, montos sin tope). Los tests ejercitan schemas Zod con valores en el límite o inválidos; cuando el schema **acepta** lo que no debería, el test falla y el hallazgo se documenta.

| Archivo | Módulo | Casos |
|---------|--------|--------|
| `comprobantes-validation.test.ts` | Comprobantes (ventas) | Descuento sin tope, cantidades/precios negativos, montos de pago |
| `caja-validation.test.ts` | Caja (abrir/cerrar) | Montos negativos y montos excesivos sin máximo |
| `gastos-validation.test.ts` | Gastos | Descripción vacía, montos &lt; 0.01, montos excesivos |
| `cliente-validation.test.ts` | Clientes | MontoMaximoCtaCte excesivo (crear/actualizar) |
| `producto-validation.test.ts` | Productos | PrecioPublico negativo, PrecioCosto negativo |
| `ctacte-validation.test.ts` | Cta. Cte. cliente | Monto de pago excesivo |
| `roles-validation.test.ts` | Roles | Nombre vacío, nombre de longitud excesiva |
| `usuario-validation.test.ts` | Usuario (empleado) | nombreUsuario vacío, longitud excesiva, password corta |
| `iva-validation.test.ts` | IVA | Porcentaje negativo, &gt; 100 (ya validado) |
| `catalogos-validation.test.ts` | Marca, rubro, unidad medida | Descripcion vacía / longitud |

**Ejecutar solo tests de validación:**

```bash
npx vitest run src/test/validation
```

Los hallazgos (tests que fallan hasta que se añadan las validaciones) están listados en [INFORME-VALIDACIONES.md](INFORME-VALIDACIONES.md), con módulo, campo, valor probado, comportamiento actual vs esperado y dónde corregir.

Plan ejecutivo completo (cronograma, fases, E2E): [PLAN-COMPLETO-TESTING.md](PLAN-COMPLETO-TESTING.md). Principios y criterios: [PLAN-TESTING-PROYECTO.md](PLAN-TESTING-PROYECTO.md).

---

## Infraestructura

- **Vitest:** `vitest.config.ts` (raíz del proyecto)
- **Playwright:** `playwright.config.ts` — tests E2E, Chromium y Firefox; servidor dev arranca automático
  - `setupFiles`: `src/test/setup.ts`
  - `environment`: `node` por defecto; `environmentMatchGlobs` para jsdom en componentes
  - `coverage`: provider v8, reporters text/json/html
- **Setup global:** `src/test/setup.ts`
  - Variables de entorno de prueba (Supabase, DATABASE_URL)
  - Import de `@testing-library/jest-dom/vitest` para matchers en tests con DOM

---

## Convenciones

- **Estructura:** Arrange / Act / Assert
- **Nombres:** descriptivos y en español cuando ayude, ej. `debe retornar 401 cuando no hay usuario`
- **Mocks:** en el mismo archivo o en `__mocks__`; reutilizar el patrón de `route.test.ts` para API (requirePermiso, Prisma)

### Estructura de referencia para tests de API (marcas)

Todos los tests de API del proyecto deben tomar como referencia **`src/app/api/marcas/route.test.ts`** (API de marcas, usada en productos). Esa estructura incluye:

- **Auth:** `getAuthContext({ req, permission: PERMISSIONS.XXX })`; mock que rechace con `PermisoError` para 403.
- **Mocks:** `getAuthContext`, `prisma` (modelo correspondiente), `handleError` (que devuelva 403 cuando el error sea `PermisoError`), y si aplica `parsePaginationParams` y `createPaginationResponse`.
- **GET:** al menos 403 sin permiso y 200 con `{ data, pagination }` (o el formato que use la ruta).
- **POST:** 403, 400 con body inválido (respuesta con `error: "Datos inválidos"` y `details` si la ruta usa Zod), 201 con el recurso creado.
- **PATCH:** 403, 400 body inválido (con `details` si aplica), 201 con el recurso actualizado.
- **DELETE:** 403, 400 cuando el id es inválido, 404 cuando no existe, 200 con `{ success: true, Id }` (o el formato que use la ruta).

### Ejemplo de test unitario

```typescript
import { describe, it, expect } from "vitest";

describe("Nombre del módulo", () => {
  it("debe hacer algo específico", () => {
    const input = "valor";
    const result = funcion(input);
    expect(result).toBe("esperado");
  });
});
```

### Ejemplo de test de ruta API (con mocks)

Usar como referencia **`src/app/api/marcas/route.test.ts`** (getAuthContext, prisma, handleError con PermisoError, GET/POST/PATCH/DELETE con 403, 400+details, 201/200).

---

## Plan prioritario (tests a añadir)

### Corto plazo

- Scripts `test` / `test:watch` / `test:coverage` ✅
- Tests de `calculos`, `permissions`, `requirePermiso`
- Rutas API críticas: permisos, empleados, clientes, auth/me, comprobantes, caja ✅

### Mediano plazo

- Resto de rutas API (prioridad alta y media)
- Tests de componentes e hooks prioritarios (jsdom ya configurado)

### Largo plazo

- Más componentes/hooks; integración con DB. **E2E con Playwright** — implementado (landing, signin).

---

## Referencias

- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- Tests unitarios: `src/**/*.test.{ts,tsx}`
- Tests E2E: `e2e/*.spec.ts`

---

*Última actualización: Febrero 2025. Documentación unificada en `testing/`.*
