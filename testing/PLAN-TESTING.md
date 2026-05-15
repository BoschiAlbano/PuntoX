# Plan de testing — PuntoX

Plan unificado: principios, tipos de test, fases y criterios. Los fallos y hallazgos se registran en [INFORME-FALLOS.md](INFORME-FALLOS.md) y [INFORME-VALIDACIONES.md](INFORME-VALIDACIONES.md). Para comandos, cobertura y tests implementados: [GUIA.md](GUIA.md).

---

## 1. Principios

- **Detectar primero:** tests que revelen comportamiento incorrecto o validaciones faltantes; documentar en INFORME-FALLOS / INFORME-VALIDACIONES sin obligación de corregir de inmediato.
- **Justo y necesario:** un test por idea (p. ej. un valor en el límite por campo crítico); evitar duplicar casos obvios.
- **Límite y fronteras:** donde haya números o longitudes (montos, porcentajes, precios, nombres), probar negativos, cero, valores excesivos o cadenas muy largas según corresponda.
- **Una sola estructura de documentación:** fallos y causas en INFORME-FALLOS; validaciones insuficientes y prioridad en INFORME-VALIDACIONES; resumen de ejecución en [GUIA.md](GUIA.md#resumen-de-última-ejecución).

---

## 2. Tipos de test

| Tipo | Dónde | Objetivo |
|------|--------|--------|
| **Unitario** | `src/lib`, utilidades, cálculos | Lógica pura: entradas/salidas, edge cases. |
| **Validación (fronteras)** | `src/test/validation/` | Schemas Zod: rechazo de valores inválidos; si aceptan → fallo documentado. |
| **API (rutas)** | Junto a cada `route.ts` | Handlers: permisos (401/403), body inválido (400), éxito (200/201). Mocks de auth y Prisma. |
| **Componente** | Junto al componente | Render, interacción mínima, mensajes de error; jsdom. |
| **Hook** | Junto al hook | Estados (loading, data, error), llamadas a API mockeadas. |
| **E2E** | `e2e/` con Playwright | Flujos críticos completos (login, venta, caja). |

---

## 3. Plan por fases

### Fase 1 — API prioritaria ✅ (completada)

Rutas críticas siguiendo el patrón de `marcas/route.test.ts`:

- `api/CtaCteCliente`, `api/productos/[id]`, `api/auth/register`, `api/ventas/clientes`, `api/productos/ultimo-codigo`
- API adicionales: `empleados/cambiar-password`, `auth/get-email-by-username`, `auth/registrar-sesion`, etc.

### Fase 2 — API secundaria y analíticas ✅ (completada)

- `api/analiticas/kpis`, `api/analiticas/graficas`, `api/sucursales/[id]`, `api/sucursales/cambiar`, `api/auditoria-empleados`, `api/cajas`
- API config: `configuracion/fiscal`, `configuracion/preferencias`, `configuracion/notificaciones`, `configuracion/branding`, `configuracion/seguridad/*`

### Fase 3.2-3.3 — Componentes restantes + Lib ✅ (completada)

- **Lib:** requestContext, cliente.adapter, empleado.adapter — tests unitarios añadidos.
- **Componentes:** SucursalSelector — tests de render condicional.

### Fase 3 — Componentes prioritarios ✅ (parcial)

Con Testing Library + jsdom: ProductSearch, GenericCrud, Pagination, Sidebar, SucursalSelector, ProductoForm, ClienteForm, VentasScreen (muchos ya con tests).

### Fase 4 — Hooks pendientes (opcional)

useConfiguracion, useSucursales, useCtaCte, useUsuario, useDebounce, useEmpleados (varios ya con tests).

### Fase 5 — Lib pendiente ✅ (parcial)

lib/services/comprobantes, lib/sucursal/verifyUserBranch, lib/utils/barcode, lib/auth/requestContext, lib/adapters/cliente.adapter, lib/adapters/empleado.adapter — tests añadidos.

### Fase 6 — E2E flujos autenticados ✅ (implementada)

- Login → Dashboard, Login → Ventas, guards redirect-unauth
- Venta completa, abrir/cerrar caja, CRUD producto
- CRUD cliente, CRUD empleado, CRUD sucursal
- Dashboard, Analíticas (5 specs E2E adicionales)

---

## 4. Criterios de aceptación

| Área | Criterios |
|------|-----------|
| **API** | 403 sin permiso; 400 con body/params inválidos; 200/201 con datos válidos (mocks); 404 cuando el recurso no existe. |
| **Componente** | Render sin crash; al menos un elemento clave visible o interacción verificada. |
| **Hook** | Estados loading/data/error; llamada a fetch/API mockeada verificada. |
| **E2E** | Flujo completo en navegador real; no depender de datos aleatorios. |

---

## 5. Comandos de referencia

```bash
# Unitarios
pnpm test
pnpm test:watch
pnpm test:coverage

# E2E
pnpm test:e2e
pnpm test:e2e -- --project=chromium
pnpm test:e2e:ui

# Solo validación
npx vitest run src/test/validation

# Un archivo concreto
npx vitest run src/app/api/CtaCteCliente/route
```

---

*Última actualización: Febrero 2025.*
