# Journey E2E — Índice de Fases

Este directorio contiene los specs E2E del flujo completo del usuario ("journey") y sus READMEs de control de progreso.

## Estado general

| Fase                            | README                                 | Spec                          | Tests   | Estado                |
| ------------------------------- | -------------------------------------- | ----------------------------- | ------- | --------------------- |
| **0** — Setup SuperAdmin        | [README-fase-00.md](README-fase-00.md) | `global-setup.ts`             | 6 smoke | ✅ Completada         |
| **1** — Autenticación           | [README-fase-01.md](README-fase-01.md) | `auth/login-completo.spec.ts` | 10      | ✅ Completada (10/10) |
| **2** — Configuración de tienda | [README-fase-02.md](README-fase-02.md) | `01-onboarding.spec.ts`       | 15      | ✅ Completada (15/15) |
| **3** — Datos maestros          | [README-fase-03.md](README-fase-03.md) | `02-maestros.spec.ts`         | 17      | ✅ Completada (17/17) |
| **4** — Productos               | [README-fase-04.md](README-fase-04.md) | `03-productos.spec.ts`        | 13      | ✅ Completada (13/13) |
| **5** — Clientes                | [README-fase-05.md](README-fase-05.md) | `04-clientes.spec.ts`         | 11      | ⏳ Pendiente          |
| **6** — Proveedores             | [README-fase-06.md](README-fase-06.md) | `05-proveedores.spec.ts`      | 10      | ⏳ Pendiente          |
| **7** — Caja                    | [README-fase-07.md](README-fase-07.md) | `06-caja.spec.ts`             | 16      | ⏳ Pendiente          |
| **8** — Ventas                  | [README-fase-08.md](README-fase-08.md) | `07-ventas.spec.ts`           | 16      | ⏳ Pendiente          |
| **9** — Compras                 | [README-fase-09.md](README-fase-09.md) | `08-compras.spec.ts`          | 8       | ⏳ Pendiente          |
| **10** — Empleados y Roles      | [README-fase-10.md](README-fase-10.md) | `09-empleados-roles.spec.ts`  | 16      | ⏳ Pendiente          |
| **11** — Sucursales             | [README-fase-11.md](README-fase-11.md) | `10-sucursales.spec.ts`       | 11      | ⏳ Pendiente          |
| **12** — Analytics              | [README-fase-12.md](README-fase-12.md) | `11-analiticas.spec.ts`       | 12      | ⏳ Pendiente          |
| **13** — Viaje completo         | [README-fase-13.md](README-fase-13.md) | `12-viaje-completo.spec.ts`   | 19      | ⏳ Pendiente          |

**Total tests estimados: ~172**

---

## Tenant E2E (ya creado ✅)

| Campo          | Valor                                   |
| -------------- | --------------------------------------- |
| Nombre tienda  | `Tienda E2E PuntoX`                     |
| Username admin | `admin_e2e`                             |
| Password admin | `E2Etest123!`                           |
| Email          | `admin.e2e@puntox-test.com`             |
| Plan           | Plan Básico                             |
| Creado vía     | Panel SuperAdmin → `/admin/tenants/new` |

---

## Cómo retomar el trabajo

### Ejecutar una fase

```bash
pnpm test:e2e -- e2e/journey/02-maestros.spec.ts --project=chromium
```

### Ejecutar toda la suite journey

```bash
pnpm test:e2e -- e2e/journey/ --project=chromium
```

### Ver el reporte de la última ejecución

```bash
npx playwright show-report
```

### Orden de implementación sugerido

```
Semana 1: Fases 1 → 3 → 4    (auth, maestros, productos)
Semana 2: Fases 5 → 6 → 2    (clientes, proveedores, configuración)
Semana 3: Fases 7 → 8         (caja + ventas — núcleo del negocio)
Semana 4: Fases 9 → 10 → 11  (compras, empleados, sucursales)
Semana 5: Fases 12 → 13       (analytics + viaje integral)
```

---

## Convenciones

- Todos los specs importan de `../../fixtures/auth` (no de `@playwright/test` directamente)
- Todos los specs usan el fixture `e2ePage` (NO `authenticatedPage`)
- Tests que crean datos: limpian al final del `describe` (soft cleanup)
- Tests de datos persistentes (usados entre fases): se documentan en el README con ⚠️
