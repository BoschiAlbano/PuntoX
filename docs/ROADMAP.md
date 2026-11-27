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

- [x] **Planes Básico / Intermedio / Pro** (27/11/2026): límites verificados contra la base real; `/admin/planes` con campos validados en lugar de JSON a mano; ARCA incluido en todos; Premium renombrado a Pro (todo ilimitado). Ver [saas/planes-saas.md](saas/planes-saas.md).
- [ ] **Prueba manual de planes** en la app: tenant Básico (bloquear 2da sucursal, 4to usuario, artículo 1.001) y tenant Pro/Ilimitado (nada bloqueado). Checklist en [saas/planes-saas-implementacion.md](saas/planes-saas-implementacion.md).
- [ ] **Definir precios de los planes** (hoy de ejemplo: $25.000 / $40.000 / $60.000).
- [x] **Interruptor "Alertar nuevo dispositivo"** — ahora visible en Configuración › Seguridad (se había quitado de la pantalla en un refactor) y conectado al aviso in-app de dispositivo nuevo. Activado por defecto.
- [ ] **Landing / SEO**: crear `public/og-image.png` y reemplazar el handle `@puntox` de ejemplo en `src/app/page.tsx`.

## 🔴 Prioridad 2 — Seguridad

**Incidente 26/11/2026** — `.env` con credenciales reales estuvo en el repo público desde el 08/12/2025:
- [x] Credenciales rotadas (contraseña de la base, claves de Supabase con las *legacy* desactivadas, `CRON_SECRET`) y `.env` fuera del repo.
- [x] Revisión de la base: tabla de sondeo `hermes_probe_1a3f99ad` creada con acceso directo a Postgres (entre 18/03/2026 y 26/11/2026) y usuario de Auth de Burp Collaborator (`oastify.com`, 25/07/2026): ambos borrados. Sin roles, funciones, triggers ni esquemas ajenos. La API REST pública de Supabase no expone tablas (`anon`/`authenticated` sin permisos).
- [x] Eliminada `POST /api/auth/register`: era pública y permitía crear un empleado confirmado en cualquier comercio (no se usaba).
- [x] Registro público de Supabase desactivado (`disable_signup: true`, verificado 26/11/2026).
- [ ] Pedir a los usuarios que cambien su contraseña (los hashes pudieron copiarse).
- [ ] Evaluar aviso a titulares de datos (Ley 25.326) si la base contiene datos reales de clientes.

- [x] **Rate limiting en rutas públicas de `/api/auth`** (`src/lib/rateLimit.ts`, tabla `RateLimit` en Postgres, IP/usuario hasheados): login 20/min por IP y 10/15 min por usuario (este se reinicia con un login correcto); recuperar contraseña 5/h por IP y 3/h por usuario. Respuesta 429 con `Retry-After`.
- [x] Cron `cleanup-sesiones` acepta GET (Vercel Cron usa GET; antes respondía 405 y nunca corría). Además purga `RateLimit`.
- [x] **Login del lado del servidor** (`POST /api/auth/login`, 27/11/2026): el bloqueo por intentos fallidos ahora se aplica de verdad y el email no sale del servidor. Se eliminaron las rutas públicas `get-email-by-username` (revelaba el email) y `registrar-intento-fallido` (permitía bloquear cuentas ajenas).
- [x] `security_sb_forwarded_for_enabled` activado en Supabase (27/11/2026): sus límites propios usan la IP real del usuario (header `Sb-Forwarded-For` que manda `/api/auth/login` con la clave secreta) y no la de Vercel.
- ~~Desbloqueo automático tras N minutos~~ — **descartado** (27/11/2026): el bloqueo por intentos queda hasta que un administrador desbloquea la cuenta. Desde el login del lado del servidor ya no se pueden bloquear cuentas ajenas por una ruta pública, y el límite por usuario frena los intentos.
- [x] **Dueño del comercio** (27/11/2026) — `Tenant.UsuarioDuenoId` (migración `20261127200000_tenant_dueno`; los comercios existentes tomaron como dueño al primer administrador). Otros administradores no pueden bloquearlo, cambiarle la contraseña, editarlo ni eliminarlo (`src/lib/tenant/dueno.ts`); el dueño no se puede eliminar. Insignia "Dueño" en Empleados y en el panel del superadmin, que es el único que transfiere la propiedad ("Hacer dueño", auditado como `TRANSFERIR_PROPIEDAD`).
- [ ] Rate limiting en `/api/*` autenticadas y `/api/admin/*` (menor prioridad: requieren sesión).
- [x] **Revisión de permisos** (27/11/2026) — inventario de los 164 métodos de `/api`. Corregido:
  - **Crítico:** un administrador de comercio podía cambiar un rol común a tipo SUPERADMIN (el PATCH de roles no lo impedía) y entrar al panel de la plataforma. Verificado en la base que nadie lo usó.
  - `x-sucursal-id`: para administradores no se validaba que la sucursal fuera de su comercio.
  - Tasas de IVA (catálogo global): cualquier comercio podía cambiarlas o borrarlas para todos → solo superadmin.
  - Venta, cobro y edición de empleado aceptaban un cliente o rol de otro comercio; productos y clientes, marca/rubro/unidad/lista de precios/componentes de otro comercio (`src/lib/tenant/pertenencia.ts`).
  - Permisos faltantes: certificados y puntos de venta ARCA, verificar ARCA, editar comprobante rechazado, reprocesar facturas, completar onboarding, nombre del comercio.
  - Eliminados: `POST /api/auditoria-empleados` (permitía cargar entradas falsas) y la ruta `/api/test`.
  - Test que fija el permiso de cada ruta corregida: `src/app/api/permisos-rutas.test.ts`.
- **Dashboard visible para todos los usuarios** — decidido (27/11/2026): `/api/dashboard/*` (ventas del día, medios de pago, más vendidos) queda solo con sesión; cualquier empleado ve el resumen de su sucursal.

## 📧 Envío de emails

Emails de Auth (recuperar contraseña, invitaciones) vía Supabase con SMTP de Resend (`mail.puntox.com.ar`); emails propios de la app (resumen diario, cierre de caja, vencimientos) vía API de Resend (`src/lib/email/`). Plan gratis de Resend: 100 emails/día.

**Requisito previo**
- [x] Dominio `mail.puntox.com.ar` verificado en Resend (SPF/DKIM/DMARC en Vercel DNS) y conectado como SMTP de Supabase; plantillas en `docs/email-templates/`.

**1. Acceso y cuenta** — vía Supabase Auth (plantillas de Supabase + SMTP propio)
- [x] **"Olvidé mi contraseña"** — `/recuperar-contrasena` → `POST /api/auth/recuperar-contrasena` → email → `/auth/confirm` (`verifyOtp`) → `/restablecer-contrasena` (pide 2FA si está activo y cierra todas las sesiones). Usuarios con email interno (`@puntox.com`) siguen dependiendo del admin.
- [x] **Invitación de empleados** — en el alta, "Invitar por email" (`inviteUserByEmail` con usuario y comercio en el email) → `/auth/confirm` → "Creá tu contraseña" → login con el usuario precargado. Botón "Reenviar invitación" en la tabla (si Supabase rechaza la reinvitación, envía un link de recuperación). Si falla la base al crear el empleado, se borra el usuario de Auth.
- [x] **Alta de comercio por invitación** — el SuperAdmin elige "Invitar por email" (por defecto) y el dueño elige su contraseña (mismo flujo que empleados). Reemplaza "confirmación de email" y "bienvenida". Además: el nombre de usuario se valida globalmente antes de crear la cuenta y, si falla la base, se borra la cuenta de Auth.
- ~~Cambio de email~~ — descartado: la app no permite cambiar el email de un usuario.

**2. Seguridad** — solo notificaciones in-app, sin email (`src/lib/notificaciones/seguridad.ts`)
- [x] **Inicio de sesión desde dispositivo nuevo** — al usuario, si el comercio tiene activado `AlertarNuevoDispositivo` (navegador nunca usado antes por ese usuario; el primer inicio de sesión no cuenta).
- [x] **Cuenta bloqueada por intentos fallidos** — a los administradores.
- [x] **Contraseña cambiada por un admin** — al empleado.
- [x] **2FA activado / desactivado** — al usuario; si se desactiva, también a los administradores. `POST /api/auth/mfa-evento` verifica el estado real en Supabase antes de notificar.

**3. Notificaciones operativas** — envío desde la app (hoy solo in-app)
- [x] **Resumen diario por email** — 07:00 (Argentina) con el día anterior completo (antes resumía un día corrido 3 h por usar UTC). Email a administradores solo si hubo ventas; la notificación in-app siempre (`src/lib/resumen/diario.ts`).
- [x] **Email al cerrar caja** — arqueo (efectivo esperado/contado/diferencia), ventas por medio de pago, salidas y ganancia; interruptor propio `NotificacionesCierreCaja` (migración `20261126220000_notificaciones_cierre_caja`); se envía en segundo plano con `after()` (`src/lib/caja/emailCierre.ts`).
- [ ] Elegir la hora del resumen diario por comercio (requiere cron horario: Vercel Pro o `pg_cron` de Supabase).
- [x] **Detalle en el resumen diario** — stock bajo (los 5 más críticos + total), clientes sobre su límite de crédito (saldo de cta. cte. > `MontoMaximoCtaCte`) y cajas cerradas con diferencia en el arqueo.

**4. Suscripción SaaS (PuntoX → comercios)**
- [x] **Aviso de vencimiento** — email + notificación + banner a los 7 días, 1 día y al vencer, con botón "Renovar por WhatsApp" ([saas/avisos-vencimiento.md](saas/avisos-vencimiento.md)). Política: solo avisos, sin bloqueo.
- [x] **Bloqueo al vencer / al desactivar** (27/11/2026) — reglas en `src/lib/suscripcion/vencimiento.ts`:
  - Vence → 7 días de gracia con el banner rojo y el botón de WhatsApp; el sistema se usa normal.
  - Día 8 → **bloqueo total**: `getAuthContext` responde 403 (`SUSCRIPCION_BLOQUEADA`), el login lo rechaza con el botón de WhatsApp, y los usuarios conectados van a `/suscripcion-vencida` (heartbeat o al cargar). El superadmin nunca se bloquea.
  - Desactivado a mano (`EstaActivo = false`) → bloqueo total igual.
  - Avisos: 7 días antes, 1 día antes, al vencer (con fecha de bloqueo), último día de gracia y el día del bloqueo.
  - **Renovar** (+30 días): al día o en gracia, desde el vencimiento; ya bloqueado, desde hoy. Al renovar, el acceso vuelve en menos de 30 s (cache).
  - Los pagos se arreglan por fuera (sin pasarela) y el superadmin renueva desde `/admin/tenants/[id]`.
- [x] `GET /api/admin/check-subscriptions` y `configuracion/perfil` / `preferencias-venta` solo para superadmin (27/11/2026). Las dos últimas tomaban el comercio de `user_metadata`, editable por el usuario.
- [x] Bienvenida al registrar el comercio — cubierta por el alta por invitación.
- [x] **Límite del plan alcanzado** — notificación in-app a los administradores al llegar al máximo de sucursales, usuarios o artículos (sin email; no se repite mientras esté sin leer).

**5. Comercio → clientes finales** (funcionalidades nuevas)
- ~~Enviar factura/comprobante por email~~ — descartado por ahora.
- ~~Estado de cuenta corriente / recordatorio de saldo~~ — descartado por ahora.
- [ ] Notificaciones de pedidos B2B — después del Portal de Proveedores.

## 🟡 Prioridad 3 — Testing

- [x] **Tests de rutas de API** — 266/266 en verde (25/11/2026). Destapó un bug real ya corregido: un Administrador no podía cambiar la contraseña de otro empleado (`api/empleados/cambiar-password`).
- [x] **Tests de componentes y `lib/`** — suite completa 596/596 en verde (25/11/2026).
- [x] Tipo `Sucursal` en `src/hooks/useSucursales.ts` ahora declara `Id` (como la API); `UsuarioForm` ya no usa `s.Id || s.id`.
- [x] Tests de `api/configuracion/seguridad/sesiones/cerrar-otras`. Además: si no identifica la sesión actual ya no cierra todas (incluida la propia); responde 409. Usa `sessionIdDesdeCookies` como el heartbeat.

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
- [x] **Reset de tienda** (27/11/2026) — solo superadmin, desde `/admin/tenants/[id]` (zona de peligro), confirmando con el nombre exacto del comercio. Borra todos los movimientos (comprobantes, facturas electrónicas incluidas las de ARCA, cajas, gastos, cheques, cuentas corrientes, bajas, numeración local) en una sola transacción y deja el stock en cero; conserva productos, clientes, proveedores, empleados, sucursales y configuración. Audita (`RESET_TIENDA`) y avisa a los administradores del comercio. `src/lib/tenant/reset.ts` (con modo `simular`, validado contra la base real). Por ahora sin "desde una fecha".
- [ ] **Factura E / Factura M (ARCA)** — solo si algún cliente exporta o está en ese régimen.

## 🟢 Prioridad 5 — Calidad de código

- [x] **ESLint — errores**: 13 → 0 (25/11/2026).
- [ ] **ESLint — warnings**: ~1100, mayormente `any` y variables sin usar.
- [x] `console.log` en el servidor: quedan solo los resúmenes de los crons. Se quitaron los de ARCA, que volcaban el comprobante y la respuesta de AFIP (datos del cliente) en los logs. Los `console.error/warn` de fallas se mantienen.
- [ ] Refactor de pantallas largas: ventas, empleados, configuración.
- [ ] Optimización de queries (N+1, índices faltantes).

## ⚪ Infraestructura (backlog)

- [ ] Monitoreo con Sentry
- [ ] Logging estructurado
- [ ] Caché distribuido (Redis / Upstash)
- [ ] Documentación API interactiva (Swagger / OpenAPI)
