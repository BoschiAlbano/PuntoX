# Plantillas de email de Supabase Auth — PuntoX

Plantillas en castellano con la identidad de PuntoX para los emails que envía
Supabase Auth (vía el SMTP de Resend, remitente `no-reply@mail.puntox.com.ar`).

**Dónde se cargan:** Supabase Dashboard › Authentication › Emails › Templates.
Por cada plantilla: pegar el **Subject** y reemplazar todo el **Message body**
por el contenido del `.html` correspondiente.

| Plantilla en Supabase | Archivo | Subject |
|---|---|---|
| Confirm signup | [confirmation.html](confirmation.html) | `Confirmá tu email para activar PuntoX` |
| Invite user | [invite.html](invite.html) | `Te invitaron a PuntoX` |
| Reset Password | [recovery.html](recovery.html) | `Restablecé tu contraseña de PuntoX` |
| Change Email Address | [email_change.html](email_change.html) | `Confirmá tu nuevo email en PuntoX` |

## Variables de Supabase usadas

- `{{ .ConfirmationURL }}` — link de acción (botón y link alternativo).
- `{{ .Email }}` — email del usuario.
- `{{ .NewEmail }}` — email nuevo (solo en *Change Email Address*).
- `{{ .SiteURL }}` — Site URL configurada en Authentication › URL Configuration.

> Los links usan `{{ .ConfirmationURL }}` (flujo estándar de Supabase). Si más
> adelante se implementa una ruta propia `/auth/confirm` con `verifyOtp`
> (recomendado para SSR), cambiar el `href` a
> `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<tipo>`.

## Cuándo se envía cada una (estado al 25/11/2026)

- **Reset Password**: al llamar `resetPasswordForEmail` (pendiente: "Olvidé mi
  contraseña" en el login) o desde Authentication › Users › *Send password recovery*.
- **Invite user**: al llamar `inviteUserByEmail` (pendiente: reenvío de invitación).
- **Confirm signup**: solo si el alta no usa `email_confirm: true`. Hoy el
  registro de comercios y empleados auto-confirma, así que no se envía.
- **Change Email Address**: al cambiar el email con `updateUser({ email })`.

## Diseño

- Logo: `https://www.puntox.com.ar/icon-192.png` (19 KB). No usar `logo.png`
  (~300 KB) en emails.
- Colores (DESIGN.md): franja `#FF6100`, botón `#0050cb` con texto blanco
  (contraste AA), texto `#181c1f` / `#424656`, secundario `#5f6371`.
- Tipografía: Plus Jakarta Sans (títulos) e Inter (texto), con fallback a
  fuentes del sistema; la mayoría de los clientes de correo usa el fallback.
- HTML con tablas y estilos inline (compatible con Gmail, Outlook y móviles).
