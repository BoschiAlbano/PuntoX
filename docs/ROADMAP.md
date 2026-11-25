# 🎯 Roadmap y Próximos Pasos — PuntoX

**Estado Actual:** 🟢 9/10
**Objetivo:** 🟢 10/10
**Última actualización:** 25 de noviembre de 2026

> Para el detalle módulo por módulo ver [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md).
> Este documento lista solo lo que falta y en qué orden conviene hacerlo.

---

## ✅ Resuelto desde el roadmap anterior (dic. 2024)

| Ítem | Estado |
|---|---|
| Eliminar fallbacks `tenantId \|\| 1` | ✅ No queda ninguno en `src/` |
| Transacciones en productos (POST/PATCH) | ✅ |
| Migrar endpoints a `handleError` | ✅ 86 de 94 rutas (las 8 restantes son auth internas, cron y `api/test`) |
| Tests unitarios básicos | ✅ 148 archivos de test en `src/` |
| Enforcement de Planes SaaS (API + UI) | ✅ Implementado, falta prueba manual |
| Búsqueda en pestañas POS (Carrito / Buscar) | ✅ Commit `4cdefce` |
| Notas de Crédito A/B/C (ARCA) | ✅ |
| Paginación, filtros por URL, actualización masiva de precios | ✅ |
| Errores de TypeScript | ✅ `npx tsc --noEmit` limpio (25/11/2026) |

---

## 🔴 Prioridad 1 — Cerrar cabos sueltos

- [ ] **Prueba manual de planes**: tenant Básico (bloquear 2da sucursal, 4to usuario, artículo 101, FA) y tenant Ilimitado (nada bloqueado). Checklist en [saas/planes-saas-implementacion.md](saas/planes-saas-implementacion.md).
- [ ] **Email real de invitación a empleados**: `src/app/api/empleados/reenviar-invitacion/route.ts` hoy solo audita (TODO con `inviteUserByEmail`).
- [ ] **Landing / SEO**: crear `public/og-image.png` y reemplazar el handle `@puntox` de ejemplo en `src/app/page.tsx`.

## 🔴 Prioridad 2 — Seguridad

- [ ] **Rate limiting** — no implementado. Empezar por `/api/auth/*` (≈5 req/min), luego `/api/*` general y `/api/admin/*`. Opción: `@upstash/ratelimit`.
- [ ] **Revisión de permisos granulares** — todas las rutas privadas validan sesión/tenant, pero solo 51 de 94 declaran un permiso explícito. Revisar que las restantes no lo necesiten.

## 🟡 Prioridad 3 — Testing

- [x] **Tests de rutas de API** — 266/266 en verde (25/11/2026). Destapó un bug real ya corregido: un Administrador no podía cambiar la contraseña de otro empleado (`api/empleados/cambiar-password`).
- [ ] **Reparar 42 tests de componentes y `lib/` desactualizados** (24 archivos; ver [ESTADO_ACTUAL.md §3](ESTADO_ACTUAL.md)). Más afectados: ventas, empleados, productos, clientes, caja, analíticas.
- [ ] Tipo `Sucursal` en `src/hooks/useSucursales.ts` declara `id` pero la API devuelve `Id` (los consumidores usan `s.Id || s.id`, sin impacto en runtime).
- [ ] Sin tests para `api/configuracion/seguridad/sesiones/cerrar-otras` (reemplazó al DELETE por sesión).

### E2E

Estado en [e2e/journey/README.md](../e2e/journey/README.md): fases 0–4 completas, 5–13 pendientes.

- [ ] Fase 7 — Caja
- [ ] Fase 8 — Ventas
- [ ] Fases 5, 6 — Clientes, Proveedores
- [ ] Fases 9, 10, 11 — Compras, Empleados y Roles, Sucursales
- [ ] Fases 12, 13 — Analytics y Viaje completo

## 🟡 Prioridad 4 — Funcionalidades nuevas

- [ ] **Portal de Proveedores & Marketplace B2B** — spec `SPEC-PROV-001` escrita, sin código ([features/portal-proveedores-marketplace.md](features/portal-proveedores-marketplace.md)).
- [ ] **Notas de Débito A/B/C (ARCA)** — códigos AFIP ya reservados en `src/lib/constants/afip.ts` (2/7/12); falta el tipo de comprobante local y la emisión. Reutilizar el patrón de la Nota de Crédito.
- [ ] **Botón de Reset / Purga de Tienda** — limpiar datos transaccionales (total o desde una fecha).
- [ ] **Factura E / Factura M (ARCA)** — solo si algún cliente exporta o está en ese régimen.

## 🟢 Prioridad 5 — Calidad de código

- [ ] **ESLint**: 13 errores y 1116 warnings (25/11/2026). Los errores son triviales (comillas sin escapar, `prefer-const`, `require()` en 2 tests, un `?.!` en `dashboard/page.tsx`).
- [ ] Quitar `console.log/error` que quedan en 14 rutas de API.
- [ ] Refactor de pantallas largas: ventas, empleados, configuración.
- [ ] Optimización de queries (N+1, índices faltantes).

## ⚪ Infraestructura (backlog)

- [ ] Monitoreo con Sentry
- [ ] Logging estructurado
- [ ] Caché distribuido (Redis / Upstash)
- [ ] Documentación API interactiva (Swagger / OpenAPI)
