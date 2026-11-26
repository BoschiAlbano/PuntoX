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
| Tests unitarios | ✅ 596/596 en verde (146 archivos en `src/`) |
| Enforcement de Planes SaaS (API + UI) | ✅ Implementado, falta prueba manual |
| Búsqueda en pestañas POS (Carrito / Buscar) | ✅ Commit `4cdefce` |
| Notas de Crédito A/B/C (ARCA) | ✅ |
| Paginación, filtros por URL, actualización masiva de precios | ✅ |
| Errores de TypeScript | ✅ `npx tsc --noEmit` limpio (25/11/2026) |

---

## 🔴 Prioridad 1 — Cerrar cabos sueltos

- [ ] **Prueba manual de planes**: tenant Básico (bloquear 2da sucursal, 4to usuario, artículo 101, FA) y tenant Ilimitado (nada bloqueado). Checklist en [saas/planes-saas-implementacion.md](saas/planes-saas-implementacion.md).
- [ ] **Interruptor "Alertar nuevo dispositivo" sin efecto** — se guarda en Configuración › Seguridad (`AlertarNuevoDispositivo`) pero ningún código lo lee. Implementarlo (ver 📧) u ocultarlo.
- [ ] **Landing / SEO**: crear `public/og-image.png` y reemplazar el handle `@puntox` de ejemplo en `src/app/page.tsx`.

## 🔴 Prioridad 2 — Seguridad

**Incidente 26/11/2026** — `.env` con credenciales reales estuvo en el repo público desde el 08/12/2025:
- [x] Credenciales rotadas (contraseña de la base, claves de Supabase con las *legacy* desactivadas, `CRON_SECRET`) y `.env` fuera del repo.
- [x] Revisión de la base: tabla de sondeo `hermes_probe_1a3f99ad` creada con acceso directo a Postgres (entre 18/03/2026 y 26/11/2026) y usuario de Auth de Burp Collaborator (`oastify.com`, 25/07/2026): ambos borrados. Sin roles, funciones, triggers ni esquemas ajenos. La API REST pública de Supabase no expone tablas (`anon`/`authenticated` sin permisos).
- [x] Eliminada `POST /api/auth/register`: era pública y permitía crear un empleado confirmado en cualquier comercio (no se usaba).
- [ ] Desactivar el registro público de Supabase (Authentication › Sign In / Providers › "Allow new users to sign up").
- [ ] Pedir a los usuarios que cambien su contraseña (los hashes pudieron copiarse).
- [ ] Evaluar aviso a titulares de datos (Ley 25.326) si la base contiene datos reales de clientes.

- [ ] **Rate limiting** — no implementado. Empezar por `/api/auth/*` (≈5 req/min), luego `/api/*` general y `/api/admin/*`. Opción: `@upstash/ratelimit`.
- [ ] **Revisión de permisos granulares** — todas las rutas privadas validan sesión/tenant, pero solo 51 de 94 declaran un permiso explícito. Revisar que las restantes no lo necesiten.

## 📧 Envío de emails

Hoy la app **no envía ningún email**: altas y registros usan `email_confirm: true` y no hay SMTP configurado. El SMTP integrado de Supabase no sirve para producción (2 emails/hora por proyecto y solo a direcciones autorizadas).

**Requisito previo**
- [x] Dominio `mail.puntox.com.ar` verificado en Resend (SPF/DKIM/DMARC en Vercel DNS) y conectado como SMTP de Supabase; plantillas en `docs/email-templates/`.

**1. Acceso y cuenta** — vía Supabase Auth (plantillas de Supabase + SMTP propio)
- [x] **"Olvidé mi contraseña"** — `/recuperar-contrasena` → `POST /api/auth/recuperar-contrasena` → email → `/auth/confirm` (`verifyOtp`) → `/restablecer-contrasena` (pide 2FA si está activo y cierra todas las sesiones). Usuarios con email interno (`@puntox.com`) siguen dependiendo del admin.
- [x] **Invitación de empleados** — en el alta, "Invitar por email" (`inviteUserByEmail` con usuario y comercio en el email) → `/auth/confirm` → "Creá tu contraseña" → login con el usuario precargado. Botón "Reenviar invitación" en la tabla (si Supabase rechaza la reinvitación, envía un link de recuperación). Si falla la base al crear el empleado, se borra el usuario de Auth.
- [ ] **Confirmación de email al registrar comercio** (hoy se auto-confirma).
- [ ] **Cambio de email** (confirmar la dirección nueva).

**2. Seguridad**
- [ ] 🟡 **Inicio de sesión desde dispositivo nuevo** (cablear `AlertarNuevoDispositivo`).
- [ ] **Cuenta bloqueada por intentos fallidos** (el bloqueo existe en `registrar-intento-fallido`, falta el aviso).
- [ ] **Contraseña cambiada por un admin** (aviso al empleado).
- [ ] **2FA activado / desactivado**.

**3. Notificaciones operativas** — envío desde la app (hoy solo in-app)
- [x] **Resumen diario por email** — 07:00 (Argentina) con el día anterior completo (antes resumía un día corrido 3 h por usar UTC). Email a administradores solo si hubo ventas; la notificación in-app siempre (`src/lib/resumen/diario.ts`).
- [x] **Email al cerrar caja** — arqueo (efectivo esperado/contado/diferencia), ventas por medio de pago, salidas y ganancia; interruptor propio `NotificacionesCierreCaja` (migración `20261126220000_notificaciones_cierre_caja`); se envía en segundo plano con `after()` (`src/lib/caja/emailCierre.ts`).
- [ ] Elegir la hora del resumen diario por comercio (requiere cron horario: Vercel Pro o `pg_cron` de Supabase).
- [ ] Stock bajo, límite de crédito superado, caja abierta o con diferencia (idealmente agrupados en el resumen).

**4. Suscripción SaaS (PuntoX → comercios)**
- [x] **Aviso de vencimiento** — email + notificación + banner a los 7 días, 1 día y al vencer, con botón "Renovar por WhatsApp" ([saas/avisos-vencimiento.md](saas/avisos-vencimiento.md)). Política: solo avisos, sin bloqueo.
- [ ] **Bloqueo al vencer / al desactivar**: hoy ni el vencimiento ni `Tenant.EstaActivo = false` restringen el acceso (decisión de negocio pendiente).
- [ ] Proteger `GET /api/admin/check-subscriptions` (hoy no requiere autenticación).
- [ ] Bienvenida al registrar el comercio.
- [ ] Límite del plan alcanzado.

**5. Comercio → clientes finales** (funcionalidades nuevas)
- [ ] Enviar factura/comprobante por email (el cliente ya tiene `Mail`).
- [ ] Estado de cuenta corriente / recordatorio de saldo.
- [ ] Notificaciones de pedidos B2B (cuando se implemente el Portal de Proveedores).

## 🟡 Prioridad 3 — Testing

- [x] **Tests de rutas de API** — 266/266 en verde (25/11/2026). Destapó un bug real ya corregido: un Administrador no podía cambiar la contraseña de otro empleado (`api/empleados/cambiar-password`).
- [x] **Tests de componentes y `lib/`** — suite completa 596/596 en verde (25/11/2026).
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

- [x] **ESLint — errores**: 13 → 0 (25/11/2026).
- [ ] **ESLint — warnings**: ~1100, mayormente `any` y variables sin usar.
- [ ] Quitar `console.log/error` que quedan en 14 rutas de API.
- [ ] Refactor de pantallas largas: ventas, empleados, configuración.
- [ ] Optimización de queries (N+1, índices faltantes).

## ⚪ Infraestructura (backlog)

- [ ] Monitoreo con Sentry
- [ ] Logging estructurado
- [ ] Caché distribuido (Redis / Upstash)
- [ ] Documentación API interactiva (Swagger / OpenAPI)
