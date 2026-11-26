# Avisos de vencimiento de la suscripción

**Estado:** 🟢 Implementado (26/11/2026)
**Política:** solo avisos — al vencer, el comercio **sigue usando PuntoX** (no hay bloqueo).

## Qué se avisa y cuándo

| Etapa | Cuándo (días calendario, hora Argentina) | Email | Notificación in-app | Banner |
|---|---|---|---|---|
| `7d` | faltan 2 a 7 días | ✅ | ✅ `WARNING` | ✅ |
| `1d` | vence mañana | ✅ | ✅ `WARNING` | ✅ |
| `vencido` | vence hoy o venció hace ≤ 7 días | ✅ | ✅ `ERROR` | ✅ (sigue visible mientras esté vencida) |

- Cada etapa se envía **una sola vez por fecha de vencimiento**. Si el cron se
  saltea un día, se envía la etapa vigente.
- Al **renovar** (SuperAdmin › Renovar, +30 días) cambia `FechaVencimiento` y
  arranca un ciclo nuevo de avisos.
- Comercios vencidos hace más de 7 días no reciben email (evita avisos viejos).

## Destinatarios

- Usuarios del comercio con perfil **ADMINISTRADOR**, no eliminados ni
  bloqueados, con email real (se excluyen los internos `@puntox.com`).
- Si ninguno tiene email real: el email del comercio (`Configuracion.Email`).
- La notificación in-app se crea para cada administrador (`UsuarioId`).
- El banner del dashboard se muestra solo a administradores, desde 7 días
  antes; se puede ocultar hasta el día siguiente.

## Piezas

| Archivo | Rol |
|---|---|
| `src/lib/suscripcion/vencimiento.ts` | Días restantes (hora AR), etapa, textos, link de WhatsApp |
| `src/lib/suscripcion/avisos.ts` | Proceso diario: destinatarios, email, notificación, deduplicación |
| `src/lib/email/send.ts` / `layout.ts` | Envío vía API de Resend y layout HTML de los emails de la app |
| `src/app/api/cron/suscripciones/route.ts` | Endpoint del cron (protegido con `CRON_SECRET`) |
| `src/components/dashboard/SuscripcionBanner.tsx` | Banner en el dashboard |
| `vercel.json` | Cron diario `0 12 * * *` (09:00 Argentina) |

La deduplicación usa `Notificacion` con `EntidadTipo = "SUSCRIPCION_VENCIMIENTO"`
y `EntidadId = "<tenantId>:<YYYY-MM-DD vencimiento>:<etapa>"`.

## Variables de entorno (Vercel › Settings › Environment Variables)

| Variable | Obligatoria | Uso |
|---|---|---|
| `RESEND_API_KEY` | Sí (para emails) | API key de Resend con *Sending access* a `mail.puntox.com.ar`. Sin ella no se envían emails (las notificaciones in-app sí se crean). |
| `NEXT_PUBLIC_WHATSAPP_RENOVACION` | Recomendada | Número para el botón "Renovar por WhatsApp", con código de país y sin `+` (ej. `5493511234567`). Sin él, el email dice "Contactá a PuntoX" y el banner no muestra botón. Requiere redeploy al cambiarla. |
| `CRON_SECRET` | Sí (producción) | Vercel la envía como `Authorization: Bearer …` al ejecutar el cron. |
| `EMAIL_FROM` | No | Remitente. Default: `PuntoX <no-reply@mail.puntox.com.ar>`. |

## Probar manualmente

En local (sin `CRON_SECRET`, solo desde localhost):

```bash
curl http://localhost:3000/api/cron/suscripciones
```

Devuelve `{ revisados, avisos: [{ tenantId, etapa, destinatarios, email }] }`.

## Pendiente / relacionado

- **Bloqueo al vencer** (gracia + solo lectura o bloqueo total): decisión de
  negocio postergada. Hoy tampoco `Tenant.EstaActivo = false` ("Desactivar" en
  el panel SuperAdmin) restringe el acceso.
- `GET /api/admin/check-subscriptions` (aviso al SuperAdmin) no requiere
  autenticación; solo crea notificaciones deduplicadas, pero conviene protegerlo.
