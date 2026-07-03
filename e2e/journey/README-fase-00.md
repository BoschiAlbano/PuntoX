# FASE 0 — Setup: Crear Tienda E2E vía Panel SuperAdmin

## Objetivo

Crear la tienda de testing dedicada **"Tienda E2E PuntoX"** usando el panel de SuperAdmin, con un usuario administrador (`admin_e2e`) que tendrá todos los permisos necesarios para ejecutar el resto de las fases.

## Credenciales SuperAdmin

| Campo    | Valor                           |
| -------- | ------------------------------- |
| Username | `superadmin`                    |
| Password | `12345678`                      |
| Panel    | `/admin` → `/admin/tenants/new` |

## Credenciales del Tenant E2E (a crear)

| Campo          | Valor                       |
| -------------- | --------------------------- |
| Nombre tienda  | `Tienda E2E PuntoX`         |
| Username admin | `admin_e2e`                 |
| Password admin | `E2Etest123!`               |
| Email admin    | `admin.e2e@puntox-test.com` |

## Archivos implementados

- [e2e/global-setup.ts](../e2e/global-setup.ts) — Crea el tenant automáticamente antes de la suite
- [e2e/fixtures/e2e-tenant.ts](../e2e/fixtures/e2e-tenant.ts) — Credenciales centralizadas
- [e2e/fixtures/auth.ts](../e2e/fixtures/auth.ts) — Fixtures `e2ePage` y `superAdminPage`
- [playwright.config.ts](../playwright.config.ts) — Referencia al globalSetup

## Tareas

### Infraestructura (automatizada via globalSetup)

- [x] Crear `e2e/global-setup.ts` con lógica de creación del tenant
- [x] Crear `e2e/fixtures/e2e-tenant.ts` con credenciales centralizadas
- [x] Actualizar `e2e/fixtures/auth.ts` con fixture `e2ePage` y `superAdminPage`
- [x] Actualizar `playwright.config.ts` para ejecutar el globalSetup

### Spec del Panel Admin (opcional - smoke test)

Archivo: `e2e/journey/00-admin-panel.spec.ts`

- [ ] **0.1** Login como SuperAdmin → redirige a `/admin`
- [ ] **0.2** `/admin/dashboard` → cards de métricas visibles
- [ ] **0.3** `/admin/tenants` → tabla con al menos 2 registros
- [ ] **0.4** La tienda "Tienda E2E PuntoX" aparece en la tabla de tenants
- [ ] **0.5** `/admin/tenants/[id]` → detalle de la tienda E2E visible con sus datos
- [ ] **0.6** `/admin/planes` → lista de planes disponibles (Plan Básico, Premium, Ilimitado)

### Ejecución manual de la Fase 0

- [x] Login como superadmin en el browser
- [x] Navegar a `/admin/tenants/new`
- [x] Completar formulario con datos de la tienda E2E
- [x] Verificar que la tienda "Tienda E2E PuntoX" aparece en `/admin/tenants`
- [x] Verificar que login con `admin_e2e` / `E2Etest123!` funciona correctamente

## Cómo ejecutar

```bash
# La Fase 0 corre automáticamente antes de cualquier test E2E
pnpm test:e2e

# Para ejecutar solo el smoke test del panel admin
pnpm test:e2e -- e2e/journey/00-admin-panel.spec.ts --project=chromium
```

## Notas

- El globalSetup es **idempotente**: si la tienda ya existe, no la vuelve a crear.
- Para resetear la tienda E2E: ir a `/admin/tenants` y eliminar "Tienda E2E PuntoX", luego volver a correr los tests.
- El usuario `admin_e2e` tiene permisos de administrador completo en su tenant.

## Estado

- **Implementación:** ✅ Completa
- **Ejecución manual:** ✅ Verificada (tienda creada y confirmada en `/admin/tenants`)
- **Spec smoke test:** ⏳ Pendiente de implementar
