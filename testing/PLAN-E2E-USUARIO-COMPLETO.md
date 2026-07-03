# Plan E2E — Viaje Completo del Usuario (PuntoX)

**Objetivo:** Simular el ciclo de vida completo de un comerciante que adopta PuntoX por primera vez: configura su tienda, carga su catálogo, gestiona clientes y proveedores, opera la caja, realiza ventas y analiza su negocio.

**Enfoque:** Cada fase es independiente y ejecutable por separado. Las fases están ordenadas por la secuencia lógica que seguiría un usuario real. Todos los tests de `journey/` se ejecutan sobre una tienda E2E dedicada, creada automáticamente por el `globalSetup` vía el panel SuperAdmin.

---

## Arquitectura del entorno de testing

```
┌─────────────────────────────────────────────────────┐
│                  pnpm test:e2e                      │
│                                                     │
│  1. global-setup.ts  (corre UNA VEZ al inicio)      │
│     ├── Intenta login con admin_e2e / E2Etest123!   │
│     │   ├── OK → tenant ya existe → continúa        │
│     │   └── Fail → login como superadmin            │
│     │           → /admin/tenants/new                │
│     │           → crea "Tienda E2E PuntoX"          │
│     │           → crea usuario admin_e2e            │
│                                                     │
│  2. Todos los specs corren con e2ePage fixture      │
│     (autenticado como admin_e2e en la tienda E2E)   │
└─────────────────────────────────────────────────────┘
```

### Credenciales

| Rol            | Username     | Password      | Cuándo se usa                                 |
| -------------- | ------------ | ------------- | --------------------------------------------- |
| **SuperAdmin** | `superadmin` | `12345678`    | Solo en `global-setup.ts` y specs de `/admin` |
| **Admin E2E**  | `admin_e2e`  | `E2Etest123!` | Todos los tests de `journey/`                 |

Las credenciales E2E están centralizadas en `e2e/fixtures/e2e-tenant.ts`.  
El `global-setup.ts` las usa para crear el tenant si no existe.

---

## Estado actual de cobertura E2E

| Área                                  | Estado           | Calidad                      |
| ------------------------------------- | ---------------- | ---------------------------- |
| Login / Auth guards                   | ✅ Implementado  | Básica (visible, redirect)   |
| Dashboard                             | ✅ Implementado  | Básica (elementos visibles)  |
| Ventas                                | ✅ Implementado  | Básica (búsqueda, botones)   |
| Caja                                  | ✅ Implementado  | Media (abrir, tabs visibles) |
| Productos                             | ✅ Implementado  | Básica (form abre, tabs)     |
| Clientes                              | ✅ Implementado  | Básica (navegación)          |
| Empleados                             | ✅ Implementado  | Básica (tabs visibles)       |
| Sucursales                            | ✅ Implementado  | Básica (form abre)           |
| Proveedores                           | ❌ Sin tests     | —                            |
| Compras                               | ❌ Sin tests     | —                            |
| Comprobantes                          | ❌ Sin tests     | —                            |
| Onboarding                            | ❌ Sin tests     | —                            |
| Configuración (completa)              | ⚠️ Parcial       | Tabs visibles solamente      |
| Analytics (datos reales)              | ⚠️ Parcial       | Carga de página              |
| CRUD completo (crear/editar/eliminar) | ❌ Ningún módulo | —                            |

---

## Arquitectura de los tests

```
e2e/
  global-setup.ts         ← NUEVO: crea el tenant E2E vía SuperAdmin (1 sola vez)
  fixtures/
    auth.ts               ← ACTUALIZADO: agrega e2ePage y superAdminPage fixtures
    e2e-tenant.ts         ← NUEVO: credenciales centralizadas del tenant E2E
  journey/                ← NUEVO: flujos integrales de usuario
    00-admin-panel.spec.ts    (verifica panel SuperAdmin — opcional)
    01-onboarding.spec.ts
    02-maestros.spec.ts
    03-productos.spec.ts
    04-clientes.spec.ts
    05-proveedores.spec.ts
    06-caja.spec.ts
    07-ventas.spec.ts
    08-compras.spec.ts
    09-empleados-roles.spec.ts
    10-sucursales.spec.ts
    11-analiticas.spec.ts
    12-viaje-completo.spec.ts
```

Los tests existentes en `e2e/{modulo}/` se **conservan** (regresión básica con credenciales legacy).  
Los nuevos en `e2e/journey/` usan el fixture `e2ePage` (tenant E2E dedicado).

---

## Convenciones de los tests

- Cada test en `journey/` usa `test.describe.serial` para ejecutar en orden dentro del describe.
- Siempre importar `{ test, expect }` desde `"../fixtures/auth"` (no de `@playwright/test` directamente).
- Usar el fixture `e2ePage` (no `authenticatedPage`) para todos los tests de `journey/`.
- Los datos de prueba usan timestamps para evitar colisiones: `Cliente_Test_${Date.now()}`.
- Si un paso previo falla (ej. no se pudo crear el producto), el test que depende de él se marca con `test.skip()`.
- Se usa `page.waitForLoadState('networkidle')` para esperar datos de APIs.
- Los timeouts en formularios y tablas son de 10 s por defecto.
- Los datos creados durante los tests se eliminan al final de cada describe (cleanup).

---

## FASE 0 — Setup: Panel SuperAdmin (global-setup.ts)

**Archivo:** `e2e/global-setup.ts` _(ya implementado)_  
**Prerrequisitos:** App corriendo en localhost:3000. Seed ejecutado (usuario `superadmin` existe).  
**Se ejecuta:** Automáticamente antes de toda la suite, una sola vez por `playwright.config.ts`.

### Flujo

```
1. Abrir navegador headless
2. Ir a /signin → login como "superadmin" / "12345678"
   ↳ Si falla el login como admin_e2e (tenant no existe):
       a. Login SuperAdmin → /admin
       b. Ir a /admin/tenants/new
       c. Seleccionar Plan (primero disponible)
       d. Completar datos del comercio: "Tienda E2E PuntoX"
       e. Completar datos del admin: admin_e2e / E2Etest123!
       f. Submit → esperar redirección a /admin/tenants
   ↳ Si login admin_e2e OK → el tenant ya existe → skip creación
3. Cerrar navegador
```

### Verificación manual (opcional)

Para verificar que el setup funciona antes de correr los specs:

```bash
# Correr solo el global-setup (sin specs)
pnpm test:e2e -- --list
# O ejecutar el setup manualmente con la UI
pnpm test:e2e:ui
```

### Spec de panel admin (opcional)

**Archivo:** `e2e/journey/00-admin-panel.spec.ts`  
Prueba el panel SuperAdmin como smoke test independiente.

| #   | Escenario                                                  | Tipo   |
| --- | ---------------------------------------------------------- | ------ |
| 0.1 | Login como SuperAdmin → redirige a /admin                  | Auth   |
| 0.2 | /admin/dashboard → cards de métricas visibles              | Smoke  |
| 0.3 | /admin/tenants → tabla de tiendas con al menos 2 registros | Data   |
| 0.4 | La tienda "Tienda E2E PuntoX" aparece en la tabla          | Verify |
| 0.5 | /admin/tenants/[id] → detalle de la tienda E2E visible     | Detail |
| 0.6 | /admin/planes → lista de planes disponibles                | Smoke  |

---

## FASE 1 — Autenticación (Mejorar cobertura existente)

**Archivo:** `e2e/auth/login-completo.spec.ts` _(nuevo, complementa los existentes)_  
**Prerrequisitos:** Ninguno.  
**Duración estimada:** 1 sesión.

### Escenarios

| #   | Escenario                                                          | Tipo       |
| --- | ------------------------------------------------------------------ | ---------- |
| 1.1 | Login con credenciales válidas → redirección a `/ventas`           | Feliz      |
| 1.2 | Login con contraseña incorrecta → mensaje de error visible         | Negativo   |
| 1.3 | Login con usuario vacío → botón deshabilitado o validación         | Negativo   |
| 1.4 | Acceso a `/productos` sin autenticar → redirige a `/signin`        | Guard      |
| 1.5 | Acceso a `/dashboard` sin autenticar → redirige a `/signin`        | Guard      |
| 1.6 | Después de login, navegar con botón atrás no expone rutas privadas | Seguridad  |
| 1.7 | El sidebar muestra el nombre del usuario logueado                  | Post-login |

**Estado actual:** Parcialmente cubierto. Agregar 1.2, 1.3, 1.6, 1.7.

---

## FASE 2 — Configuración de la Tienda (Onboarding + Configuración)

**Archivo:** `e2e/journey/01-onboarding.spec.ts`  
**Prerrequisitos:** Fase 1 (usuario autenticado).  
**Duración estimada:** 1–2 sesiones.

### Escenarios

| #   | Escenario                                                                                     | Tipo      |
| --- | --------------------------------------------------------------------------------------------- | --------- |
| 2.1 | Acceder a `/configuracion` y ver las tabs (Perfil, Fiscal, Ventas, Seguridad, Notificaciones) | Smoke     |
| 2.2 | Tab Perfil de Negocio: completar nombre del negocio, dirección, teléfono y guardar            | CRUD      |
| 2.3 | Tab Perfil: validar que nombre vacío muestra error de validación                              | Negativo  |
| 2.4 | Tab Preferencias de Venta: cambiar método de pago por defecto y guardar                       | Config    |
| 2.5 | Tab Seguridad: verificar sección de cambio de contraseña                                      | Config    |
| 2.6 | Acceder a `/onboarding` y completar el wizard paso a paso                                     | Flujo     |
| 2.7 | Onboarding: saltar un paso opcional y continuar                                               | Edge case |

**Datos de prueba:**

```
Nombre negocio: "Tienda Test E2E"
Dirección: "Calle Falsa 123, Buenos Aires"
Teléfono: "+54 11 1234-5678"
```

---

## FASE 3 — Datos Maestros (Marcas, Rubros, Unidades, Listas de Precios)

**Archivo:** `e2e/journey/02-maestros.spec.ts`  
**Prerrequisitos:** Fase 1.  
**Duración estimada:** 2 sesiones.

### Escenarios

| #    | Escenario                                                             | Submódulo | Tipo        |
| ---- | --------------------------------------------------------------------- | --------- | ----------- |
| 3.1  | Ir a `/productos` → tab "Marcas" → crear marca "Marca Test E2E"       | Marca     | CRUD        |
| 3.2  | Buscar "Marca Test E2E" en el buscador → aparece en tabla             | Marca     | Read        |
| 3.3  | Editar "Marca Test E2E" → cambiar nombre → guardar → confirmar cambio | Marca     | Update      |
| 3.4  | Eliminar la marca creada → confirmar en diálogo → desaparece de tabla | Marca     | Delete      |
| 3.5  | Tab "Rubros" → crear rubro "Rubro Test E2E"                           | Rubro     | CRUD        |
| 3.6  | Editar y eliminar el rubro de prueba                                  | Rubro     | CRUD        |
| 3.7  | Tab "Unidades" → crear unidad "kg" (descripción: "Kilogramo")         | Unidad    | CRUD        |
| 3.8  | Editar y eliminar la unidad de prueba                                 | Unidad    | CRUD        |
| 3.9  | Ir a `/productos/listas-precios` → crear lista "Lista Mayorista"      | Listas    | CRUD        |
| 3.10 | Verificar que la lista aparece disponible al crear un producto        | Listas    | Integration |

**Notas:**

- Los datos maestros creados en esta fase sirven como prerrequisitos para la Fase 4 (productos).
- Si el cleanup falla, los tests son idempotentes (buscan por nombre exacto antes de crear).

---

## FASE 4 — Gestión de Productos (Artículos)

**Archivo:** `e2e/journey/03-productos.spec.ts`  
**Prerrequisitos:** Fase 3 (marca, rubro y unidad existentes).  
**Duración estimada:** 2–3 sesiones.

### Escenarios

| #    | Escenario                                                                       | Tipo       |
| ---- | ------------------------------------------------------------------------------- | ---------- |
| 4.1  | Ir a `/productos` → click "Nuevo" → formulario se abre                          | Smoke      |
| 4.2  | Crear producto completo: nombre, código, precio, marca, rubro, unidad → guardar | Create     |
| 4.3  | Confirmar que el producto aparece en la tabla tras crearlo                      | Verify     |
| 4.4  | Buscar el producto por nombre en la barra de búsqueda                           | Search     |
| 4.5  | Abrir el producto creado → editar el precio → guardar → verificar nuevo precio  | Update     |
| 4.6  | Intentar crear producto sin nombre → ver mensaje de error de validación         | Negativo   |
| 4.7  | Intentar crear producto con precio negativo → ver validación                    | Negativo   |
| 4.8  | Ir a "Más opciones" → Exportar CSV → archivo descargado                         | Export     |
| 4.9  | Seleccionar 2 productos → acción masiva "Exportar seleccionados"                | Bulk       |
| 4.10 | Eliminar el producto de prueba → confirmación → no aparece en tabla             | Delete     |
| 4.11 | Ir a `/productos/actualizar-precios` → aplicar aumento de 10% y guardar         | Bulk price |
| 4.12 | Ir a `/productos/promociones-combo` → crear promoción con descuento             | Promo      |

**Datos de prueba:**

```
Nombre: "Producto Test E2E"
Código: "TEST-001"
Precio: 1500.00
Marca: "Marca Test E2E" (de Fase 3)
Rubro: "Rubro Test E2E" (de Fase 3)
Unidad: "kg" (de Fase 3)
```

---

## FASE 5 — Gestión de Clientes

**Archivo:** `e2e/journey/04-clientes.spec.ts`  
**Prerrequisitos:** Fase 1.  
**Duración estimada:** 1–2 sesiones.

### Escenarios

| #    | Escenario                                                                   | Tipo        |
| ---- | --------------------------------------------------------------------------- | ----------- |
| 5.1  | Ir a `/clientes` → tabla cargada y buscador visible                         | Smoke       |
| 5.2  | Click "Nuevo" → formulario se abre con campos Nombre, CUIT, Email, Teléfono | Open form   |
| 5.3  | Crear cliente completo → guardar → aparece en tabla                         | Create      |
| 5.4  | Buscar cliente por nombre en buscador → resultado correcto                  | Search      |
| 5.5  | Abrir cliente → editar email y teléfono → guardar → verificar cambios       | Update      |
| 5.6  | Intentar crear cliente sin nombre → validación visible                      | Negativo    |
| 5.7  | Crear cliente con CUIT inválido (ej. "123") → validación                    | Negativo    |
| 5.8  | Ver "Más opciones" en una fila → options visibles (editar, eliminar)        | Row actions |
| 5.9  | Eliminar cliente → confirmación → desaparece de tabla                       | Delete      |
| 5.10 | Paginación: si hay más de 10 clientes, navegar a página 2                   | Pagination  |

**Datos de prueba:**

```
Nombre: "Cliente Test E2E"
Email: "cliente.test@e2e.com"
Teléfono: "11-9999-8888"
CUIT: "20-12345678-9"
```

---

## FASE 6 — Gestión de Proveedores

**Archivo:** `e2e/journey/05-proveedores.spec.ts`  
**Prerrequisitos:** Fase 1.  
**Duración estimada:** 1–2 sesiones.

### Escenarios

| #   | Escenario                                                    | Tipo        |
| --- | ------------------------------------------------------------ | ----------- |
| 6.1 | Ir a `/proveedores` → tabla y buscador visibles              | Smoke       |
| 6.2 | Crear proveedor: nombre, CUIT, email, teléfono → guardar     | Create      |
| 6.3 | Buscar el proveedor creado → aparece en tabla                | Search      |
| 6.4 | Editar el proveedor → cambiar teléfono → guardar → verificar | Update      |
| 6.5 | Intentar crear proveedor sin nombre → validación             | Negativo    |
| 6.6 | Ir a `/proveedores/cuentas-corrientes` → tabla cargada       | Smoke       |
| 6.7 | Vincular el proveedor a una cuenta corriente                 | Integration |
| 6.8 | Eliminar el proveedor de prueba → confirmación → desaparece  | Delete      |

**Datos de prueba:**

```
Nombre: "Proveedor Test E2E"
CUIT: "30-99887766-5"
Email: "proveedor.test@e2e.com"
Teléfono: "011-4444-5555"
```

---

## FASE 7 — Operación de Caja (Mejorar cobertura existente)

**Archivo:** `e2e/journey/06-caja.spec.ts`  
**Prerrequisitos:** Fase 1. La caja debe estar cerrada al inicio.  
**Duración estimada:** 1–2 sesiones.

### Escenarios

| #    | Escenario                                                                  | Tipo       |
| ---- | -------------------------------------------------------------------------- | ---------- |
| 7.1  | Ir a `/caja` → verificar estado inicial (abierta o cerrada)                | Smoke      |
| 7.2  | Abrir la caja con monto inicial $1000 → caja queda abierta                 | Open       |
| 7.3  | Verificar que tras abrir, el botón "Cerrar Caja" es visible                | Post-open  |
| 7.4  | Registrar un gasto en `/caja/gastos`: descripción "Gasto Test", monto $200 | Expense    |
| 7.5  | Verificar que el gasto aparece en el listado de gastos                     | Verify     |
| 7.6  | Ver tab "Cobros" → datos de cobros del día visibles                        | Cobros     |
| 7.7  | Cerrar la caja → modal de cierre → ingresar monto real → confirmar         | Close      |
| 7.8  | Verificar que tras cerrar, el botón "Abrir Caja" vuelve a aparecer         | Post-close |
| 7.9  | Ir a historial de cajas → al menos un registro visible                     | History    |
| 7.10 | Intentar cerrar caja con campo de monto vacío → validación                 | Negativo   |

**Notas:**

- Este test modifica estado real (caja). El cleanup cierra la caja si quedó abierta.
- Si la caja ya está abierta al inicio, el test 7.2 se salta y continúa desde 7.4.

---

## FASE 8 — Flujo de Venta Completa

**Archivo:** `e2e/journey/07-ventas.spec.ts`  
**Prerrequisitos:** Fase 4 (producto existente), Fase 5 (cliente existente), Fase 7 (caja abierta).  
**Duración estimada:** 2–3 sesiones.

### Escenarios

| #    | Escenario                                                           | Tipo          |
| ---- | ------------------------------------------------------------------- | ------------- |
| 8.1  | Ir a `/ventas` → barra de búsqueda visible                          | Smoke         |
| 8.2  | Buscar "Producto Test E2E" → aparece en sugerencias                 | Search        |
| 8.3  | Seleccionar el producto → aparece en el carrito con precio correcto | Add to cart   |
| 8.4  | Aumentar cantidad a 2 → subtotal se actualiza                       | Quantity      |
| 8.5  | Aplicar descuento del 10% → total se recalcula                      | Discount      |
| 8.6  | Agregar un segundo producto diferente al carrito                    | Multi-item    |
| 8.7  | Asignar cliente "Cliente Test E2E" a la venta                       | Client        |
| 8.8  | Seleccionar método de pago "Efectivo" → ingresar monto pagado       | Payment       |
| 8.9  | Confirmar la venta → modal de éxito o redirección a comprobante     | Confirm       |
| 8.10 | Verificar que se genera un comprobante (número, monto, cliente)     | Receipt       |
| 8.11 | Vender con pago mixto (efectivo + tarjeta) si está disponible       | Mixed payment |
| 8.12 | Eliminar un ítem del carrito → actualización correcta               | Remove item   |
| 8.13 | Buscar producto por código de barras (si hay scanner en UI)         | Barcode       |
| 8.14 | Intentar confirmar venta con carrito vacío → validación             | Negativo      |

**Datos de prueba:**

- Usa el producto y cliente creados en fases anteriores.
- Monto de pago: $3000 (supera el total para probar vuelto).

---

## FASE 9 — Compras (Ingreso de Stock)

**Archivo:** `e2e/journey/08-compras.spec.ts`  
**Prerrequisitos:** Fase 4 (producto existente), Fase 6 (proveedor existente).  
**Duración estimada:** 1–2 sesiones.

### Escenarios

| #   | Escenario                                                         | Tipo         |
| --- | ----------------------------------------------------------------- | ------------ |
| 9.1 | Ir a `/compras` → pantalla de compras visible                     | Smoke        |
| 9.2 | Iniciar nueva compra → seleccionar proveedor                      | Open form    |
| 9.3 | Agregar "Producto Test E2E" con cantidad 10 y costo unitario $500 | Add item     |
| 9.4 | Confirmar la compra → éxito                                       | Confirm      |
| 9.5 | Verificar que el stock del producto aumentó en la sucursal        | Stock verify |
| 9.6 | Intentar confirmar compra sin proveedor seleccionado → validación | Negativo     |

---

## FASE 10 — Empleados y Roles

**Archivo:** `e2e/journey/09-empleados-roles.spec.ts`  
**Prerrequisitos:** Fase 1 (usuario admin autenticado).  
**Duración estimada:** 2–3 sesiones.

### Escenarios

| #     | Escenario                                                                         | Tipo        |
| ----- | --------------------------------------------------------------------------------- | ----------- |
| 10.1  | Ir a `/empleados` → tab "Usuarios" con lista visible                              | Smoke       |
| 10.2  | Tab "Roles" → lista de roles existentes visible                                   | Smoke       |
| 10.3  | Crear nuevo rol "Rol Test E2E" con permisos básicos (ver productos, ver clientes) | Create role |
| 10.4  | Verificar que el rol aparece en la tabla de roles                                 | Verify      |
| 10.5  | Editar el rol → agregar permiso adicional → guardar                               | Update role |
| 10.6  | Crear nuevo empleado/usuario con el rol "Rol Test E2E"                            | Create user |
| 10.7  | Verificar que el empleado aparece en la lista                                     | Verify      |
| 10.8  | Cambiar contraseña del empleado desde el panel admin                              | Password    |
| 10.9  | Tab "Auditoría" → registros de actividad visibles                                 | Audit       |
| 10.10 | Eliminar el empleado de prueba → confirmación                                     | Delete user |
| 10.11 | Eliminar el rol de prueba → confirmación                                          | Delete role |

**Datos de prueba:**

```
Nombre empleado: "Empleado Test E2E"
Username: "emp_test_e2e"
Rol: "Rol Test E2E"
```

---

## FASE 11 — Sucursales

**Archivo:** `e2e/journey/10-sucursales.spec.ts`  
**Prerrequisitos:** Fase 1 (usuario admin).  
**Duración estimada:** 1 sesión.

### Escenarios

| #    | Escenario                                             | Tipo          |
| ---- | ----------------------------------------------------- | ------------- |
| 11.1 | Ir a `/sucursales` → tabla con sucursales existentes  | Smoke         |
| 11.2 | Crear nueva sucursal "Sucursal Test E2E" → guardar    | Create        |
| 11.3 | Buscar la sucursal creada → aparece en tabla          | Search        |
| 11.4 | Editar la sucursal → cambiar nombre → guardar         | Update        |
| 11.5 | Intentar crear sucursal sin nombre → validación       | Negativo      |
| 11.6 | Asignar el empleado creado en Fase 10 a la sucursal   | Assign user   |
| 11.7 | Verificar cambio de sucursal activa desde el selector | Switch branch |
| 11.8 | Eliminar la sucursal de prueba                        | Delete        |

---

## FASE 12 — Analytics y Reportes

**Archivo:** `e2e/journey/11-analiticas.spec.ts`  
**Prerrequisitos:** Fases 7 y 8 (haber realizado al menos una venta y operado la caja).  
**Duración estimada:** 1 sesión.

### Escenarios

| #    | Escenario                                                     | Tipo      |
| ---- | ------------------------------------------------------------- | --------- |
| 12.1 | Ir a `/analiticas` → página carga sin errores                 | Smoke     |
| 12.2 | KPIs visibles: al menos Total Ventas, Ticket Promedio         | Data      |
| 12.3 | Gráfico de ingresos renderizado (canvas o SVG presente)       | Chart     |
| 12.4 | Filtrar por fecha "Hoy" → datos se actualizan                 | Filter    |
| 12.5 | Filtrar por sucursal → datos filtrados                        | Filter    |
| 12.6 | Ir a `/dashboard` → stat cards con valores numéricos          | Dashboard |
| 12.7 | Dashboard muestra productos con bajo stock (si aplica)        | Alerts    |
| 12.8 | Top productos del día: al menos un ítem si se hicieron ventas | Top items |

---

## FASE 13 — Viaje Completo del Usuario (Integration E2E)

**Archivo:** `e2e/journey/12-viaje-completo.spec.ts`  
**Prerrequisitos:** Todo el sistema funcionando. Se ejecuta en un entorno limpio (o usa datos únicos por timestamp).  
**Duración estimada:** 3–4 sesiones (es el test más largo y complejo).

Este test replica el flujo de un comerciante que usa PuntoX por primera vez en un día laboral completo:

```
PASO 1: LOGIN
  → Ingresa con credenciales válidas
  → Llega a /ventas

PASO 2: CONFIGURAR LA TIENDA
  → Va a /configuracion
  → Completa perfil del negocio (nombre, dirección)
  → Guarda preferencias de venta

PASO 3: CARGAR CATÁLOGO
  → Crea una marca
  → Crea un rubro/categoría
  → Crea 2 productos con precios

PASO 4: CARGAR UN CLIENTE
  → Va a /clientes
  → Crea un cliente con datos completos

PASO 5: ABRIR LA CAJA
  → Va a /caja
  → Abre la caja con $5000 iniciales

PASO 6: REALIZAR UNA VENTA
  → Va a /ventas
  → Busca el producto
  → Agrega al carrito
  → Selecciona el cliente
  → Procesa pago en efectivo
  → Confirma la venta
  → Verifica el comprobante

PASO 7: CERRAR LA CAJA
  → Va a /caja
  → Registra los totales
  → Cierra la caja

PASO 8: VER LOS RESULTADOS
  → Va a /analiticas o /dashboard
  → Verifica que la venta aparece en los stats
  → Ve el comprobante generado en /comprobantes
```

---

## Resumen de fases

| Fase  | Archivo                                              | Módulos                          | Tests aprox. | Prioridad          |
| ----- | ---------------------------------------------------- | -------------------------------- | ------------ | ------------------ |
| **0** | `global-setup.ts` + `journey/00-admin-panel.spec.ts` | SuperAdmin, Tenants              | auto + 6     | 🔴 Infraestructura |
| 1     | `auth/login-completo.spec.ts`                        | Auth                             | 7            | 🔴 Alta            |
| 2     | `journey/01-onboarding.spec.ts`                      | Configuración, Onboarding        | 7            | 🔴 Alta            |
| 3     | `journey/02-maestros.spec.ts`                        | Marcas, Rubros, Unidades, Listas | 10           | 🔴 Alta            |
| 4     | `journey/03-productos.spec.ts`                       | Productos, Promociones           | 12           | 🔴 Alta            |
| 5     | `journey/04-clientes.spec.ts`                        | Clientes                         | 10           | 🔴 Alta            |
| 6     | `journey/05-proveedores.spec.ts`                     | Proveedores, Cuentas             | 8            | 🟡 Media           |
| 7     | `journey/06-caja.spec.ts`                            | Caja, Gastos, Cobros             | 10           | 🔴 Alta            |
| 8     | `journey/07-ventas.spec.ts`                          | Ventas, Comprobantes             | 14           | 🔴 Alta            |
| 9     | `journey/08-compras.spec.ts`                         | Compras                          | 6            | 🟡 Media           |
| 10    | `journey/09-empleados-roles.spec.ts`                 | Empleados, Roles, Auditoría      | 11           | 🟡 Media           |
| 11    | `journey/10-sucursales.spec.ts`                      | Sucursales                       | 8            | 🟡 Media           |
| 12    | `journey/11-analiticas.spec.ts`                      | Analiticas, Dashboard            | 8            | 🟢 Baja            |
| 13    | `journey/12-viaje-completo.spec.ts`                  | End-to-end integral              | ~20 pasos    | 🔴 Alta            |

**Total tests nuevos estimados: ~137**

---

## Orden de implementación recomendado

```
Semana 1: Fase 0 (infraestructura) + Fases 1, 3, 4  (Auth + Maestros + Productos)
Semana 2: Fases 5 + 6 + 2  (Clientes + Proveedores + Configuración)
Semana 3: Fases 7 + 8      (Caja + Ventas — las más críticas)
Semana 4: Fases 9 + 10 + 11 (Compras + Empleados + Sucursales)
Semana 5: Fases 12 + 13    (Analytics + Viaje completo)
```

---

## Comandos para ejecutar

```bash
# Ejecutar todas las fases nuevas (incluye global-setup automáticamente)
pnpm test:e2e -- e2e/journey/

# Ejecutar una fase específica
pnpm test:e2e -- e2e/journey/03-productos.spec.ts

# Ejecutar con UI interactiva (recomendado para desarrollar los tests)
pnpm test:e2e:ui

# Solo Chromium (más rápido al desarrollar)
pnpm test:e2e -- --project=chromium e2e/journey/

# Ver reporte HTML tras ejecución
npx playwright show-report

# Verificar que el globalSetup funciona sin correr specs
pnpm test:e2e -- --list
```

---

## Variables de entorno

```bash
# ── Tenant E2E (gestionado por global-setup.ts) ──────────────────────
# NO es necesario configurar estas variables manualmente.
# El global-setup las usa internamente desde e2e/fixtures/e2e-tenant.ts.
# Solo sobreescribir si se quiere usar credenciales diferentes:
# E2E_TENANT_USER=admin_e2e
# E2E_TENANT_PASSWORD=E2Etest123!

# ── SuperAdmin (para el global-setup) ────────────────────────────────
SA_USERNAME=superadmin        # default: "superadmin"
SA_PASSWORD=12345678          # default: "12345678"

# ── Tests legacy (e2e/{modulo}/*.spec.ts existentes) ─────────────────
E2E_USER=Agucho               # default: "Agucho"
E2E_PASSWORD=12345678         # default: "12345678"

# ── App URL ───────────────────────────────────────────────────────────
BASE_URL=http://localhost:3000  # default
```

El tenant E2E se crea **una sola vez**. Las sucesivas ejecuciones detectan que ya existe y lo reutilizan. Si se necesita empezar desde cero, hay que eliminar el usuario `admin_e2e` desde el panel SuperAdmin en `/admin/tenants`.

---

_Plan creado: Junio 2025 | Versión: 2.0 (con tenant E2E dedicado vía SuperAdmin)_
