# Cobertura de tests — Estado actual

Resumen de qué parte del proyecto PuntoX está cubierta por tests (sin incluir cobertura de líneas automática).

---

## 1. API (rutas)

| Métrica | Valor |
|--------|--------|
| **Rutas totales** (`route.ts`) | **57** |
| **Rutas con tests de handler** | **32** |
| **Cobertura aproximada** | **~56 %** |

### Con tests de handler (GET/POST/PATCH + 403, 400, 200/201)

- **`api/marcas`** — **estructura de referencia** para el resto de tests de API (GET, POST, PATCH, DELETE; Zod con `details` en 400).
- `api/permisos`, `api/empleados`, `api/clientes`, `api/auth/me`, `api/comprobantes`, `api/caja`, `api/roles`
- `api/gastos` — POST, DELETE | `api/productos` — CRUD completo
- `api/ivas`, `api/rubros`, `api/unidades-medidas` — catálogos CRUD
- `api/conceptos-gastos` — GET, POST | `api/sucursales` — GET, POST
- `api/contadores` — GET (próximo número comprobante)
- `api/condiciones-iva` — GET | `api/configuracion` — GET (404 cuando no existe)
- `api/provincias` — GET | `api/tarjetas` — GET | `api/departamentos` — GET | `api/localidades` — GET
- `api/ventas/productos` — GET | `api/ventas/clientes` — GET
- `api/CtaCteCliente` — GET, POST | `api/productos/[id]` — GET | `api/productos/ultimo-codigo` — GET
- `api/auth/register` — POST | `api/analiticas/kpis`, `api/analiticas/graficas` — GET
- `api/sucursales/[id]` — GET, PATCH | `api/sucursales/cambiar` — POST
- `api/auditoria-empleados` — GET | `api/cajas` — GET

### Sin tests de handler (25 rutas)

Incluye, entre otras: `api/productos/[id]`, `api/CtaCteCliente`, `api/sucursales`, `api/configuracion` y subrutas, `api/analiticas/*`, `api/ivas`, `api/rubros`, `api/unidades-medidas`, `api/conceptos-gastos`, `api/auditoria-empleados`, `api/auth/register`, `api/admin/*`, etc.

---

## 2. Validación (schemas Zod)

| Métrica | Valor |
|--------|--------|
| **Módulos con tests de validación** | **10** |
| **Cobertura de áreas con schemas** | **Alta** en flujos críticos |

Schemas ejercitados (aceptación/rechazo en el límite): comprobantes, caja, gastos, cliente, producto, CtaCte, roles, usuario, IVA, catálogos (marca, rubro, unidad-medida).  
Hay **10 tests que fallan a propósito** hasta que se añadan validaciones (ver [INFORME-FALLOS.md](INFORME-FALLOS.md)).

---

## 3. Lib / utilidades

| Métrica | Valor |
|--------|--------|
| **Módulos lib con tests unitarios** | **11** |
| **Módulos lib totales (aprox.)** | **~25** (auth, errors, services, validations, adapters, etc.) |
| **Cobertura aproximada** | **~44 %** |

### Con tests

- `lib/ventas/calculos.ts`
- `lib/auth/permissions.ts`
- `lib/requirePermiso.ts`
- `lib/errors/handler.ts`
- `lib/pagination.ts`
- `lib/input/number.ts`
- `lib/utils/debounce.ts`
- `lib/services/contadores.ts`
- `lib/services/comprobantes.ts` — schemas: `formaPagoSchema`, `detalleComprobanteSchema`, `createComprobanteBaseSchema`
- `lib/sucursal/verifyUserBranch.ts` — null cuando sucursalId null, notFound si sucursal inexistente, forbidden sin acceso

### Sin tests (ejemplos)

- `lib/auth/getAuthUser.ts`, `updateUserPermissions.ts`, `requestContext.ts`
- `lib/auditoria/registrarAuditoria.ts`
- `lib/adapters/*`
- `lib/security/*`, `lib/supabase/*`, `lib/utils/barcode.ts`, etc.

---

## 4. Componentes (UI)

| Métrica | Valor |
|--------|--------|
| **Componentes .tsx (aprox.)** | **65** |
| **Componentes con test** | **7** |
| **Cobertura aproximada** | **~11 %** |

### Con tests

- `CredentialsForm` — tests de lógica extraída (validación email, mensajes de error).
- `auditoria-utils` — formateo de auditoría.
- `CajaActual` — render y texto "Abrir Caja" con mocks.
- `VentaFooter` — render sin crash y texto clave (Subtotal, CONFIRMAR VENTA).
- `ProductSearch` — render y placeholder de búsqueda con mocks.
- `GenericCrud` — render con input de búsqueda.
- `Sidebar` — botones Ventas, Productos, Clientes con mocks.

### Sin tests

VentasScreen, ClienteSearch, CRUDs (empleados, clientes, productos, marcas, rubros, unidades), configuración, dashboard (Header), analíticas, landing, etc.

---

## 5. Hooks

| Métrica | Valor |
|--------|--------|
| **Hooks totales** | **14** |
| **Hooks con test** | **10** |
| **Cobertura** | **~71 %** |

### Con tests

- `useRoles` — fetch con datos, refetch y mutations.
- `useProductos` — productos cuando fetch resuelve, saveMutation.
- `useGastos` — conceptosGasto, agregarGasto, editarGasto.
- `useCaja` — cajaActual, abrirCaja, cerrarCaja.
- `useDebounce` — valor inicial, cambio tras delay, cancelación.
- `useSucursales` — fetch de sucursales y array vacío.
- `useConfiguracion` — datos cuando enableConfiguracion, saveConfiguracion, savePreferenciasVenta.
- `useCtaCte` — API expuesta, useMovimientosCliente con clienteId.
- `useUsuario` — roles, sucursales, useDepartamentos, useLocalidades.

### Sin tests

`useTheme`, etc.

---

## 6. Tests E2E (Playwright)

| Métrica | Valor |
|--------|--------|
| **Tests E2E** | **14** (landing, signin, guards, login→dashboard, login→ventas) |
| **Escenarios** | Carga de páginas, visibilidad, redirección sin auth |

### Archivos E2E

- `e2e/landing.spec.ts` — página principal (título, navbar, hero)
- `e2e/signin.spec.ts` — página de login (bienvenido, formulario, mensaje invitación)
- `e2e/guards/redirect-unauth.spec.ts` — /ventas, /dashboard, /productos, /clientes sin login → /signin
- `e2e/auth/login-dashboard.spec.ts` — Login real, redirección, sidebar
- `e2e/auth/login-ventas.spec.ts` — Login real, pantalla ventas con búsqueda

**Ejecutar:** `npm run test:e2e`

---

## 7. Resumen global (por tipo)

| Área | Total (aprox.) | Con tests | Cobertura |
|------|-----------------|-----------|-----------|
| **Rutas API** | 57 | 32 | ~56 % |
| **Validación (schemas)** | 10+ módulos | 10 | Alta en lo crítico |
| **Lib** | ~25 módulos | 11 | ~44 % |
| **Componentes** | ~65 | 7 | ~11 % |
| **Hooks** | 14 | 10 | ~71 % |
| **E2E** | — | 14 tests | Landing, Signin, Guards, Login real |

En conjunto, las **rutas críticas** (ventas, caja, empleados, permisos, clientes, auth/me, roles) y la **validación de datos** están bien cubiertas; **tests E2E** cubren la landing y el login. El resto del proyecto (rutas secundarias, casi toda la UI y hooks) tiene poca o ninguna cobertura de tests.

---

## 8. Cómo mejorar la cobertura

- **API:** Añadir tests a rutas restantes: `configuracion` subrutas, `admin/*`, `empleados/cambiar-password`, etc. (CtaCteCliente, sucursales, analiticas, ventas/clientes ✅)
- **Lib:** Incluir tests para `getAuthUser` (con mocks), `registrarAuditoria`, adapters. (comprobantes ✅, verifyUserBranch ✅)
- **Componentes:** Empezar por un CRUD (p. ej. ProductoCRUD o ClienteCRUD) y componentes compartidos (GenericCrud ✅, Pagination). (VentaFooter ✅, ProductSearch ✅, Sidebar ✅)
- **Hooks:** Resto de hooks. (useRoles, useCaja, useProductos, useDebounce, useSucursales, useConfiguracion, useCtaCte, useUsuario ✅)

Ver [PLAN-COMPLETO-TESTING.md](PLAN-COMPLETO-TESTING.md) para el plan ejecutivo actualizado y [PLAN-TESTING-PROYECTO.md](PLAN-TESTING-PROYECTO.md) para principios y criterios.

---

*Generado a partir del estado del repo. Última actualización: Febrero 2025.*
