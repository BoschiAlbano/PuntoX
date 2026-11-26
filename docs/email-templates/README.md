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

- `{{ .SiteURL }}` — Site URL configurada en Authentication › URL Configuration.
- `{{ .TokenHash }}` — token del link (en *Reset Password* e *Invite user*).
- `{{ .ConfirmationURL }}` — link estándar de Supabase (en *Confirm signup* y *Change Email Address*).
- `{{ .Email }}` — email del usuario.
- `{{ .NewEmail }}` — email nuevo (solo en *Change Email Address*).
- `{{ .Data.username }}` / `{{ .Data.comercio }}` — usuario de login y nombre del comercio (solo en *Invite user*; los envía `inviteUserByEmail` en `user_metadata`).

### Links de *Reset Password* e *Invite user*

Apuntan a la ruta propia [`/auth/confirm`](../../src/app/auth/confirm/route.ts):

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery   (Reset Password)
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite     (Invite user)
```

La ruta valida el token con `verifyOtp` (funciona aunque el email se abra en
otro dispositivo, a diferencia del flujo PKCE de `{{ .ConfirmationURL }}`) y
redirige a `/restablecer-contrasena`. Como usa `{{ .SiteURL }}`, el link
siempre apunta a producción; para probar en local, copiar `token_hash` y abrir
`http://localhost:3000/auth/confirm?token_hash=...&type=recovery`.

## Cuándo se envía cada una (estado al 25/11/2026)

- **Reset Password**: "¿Olvidaste tu contraseña?" en el login
  (`/recuperar-contrasena` → `POST /api/auth/recuperar-contrasena`) o desde
  Authentication › Users › *Send password recovery*.
- **Invite user**: al crear un empleado con "Invitar por email" (`POST /api/empleados`, `modoAcceso: "invitacion"`) o con el botón "Reenviar invitación" de la tabla de empleados. El link abre `/restablecer-contrasena?modo=invitacion` ("Creá tu contraseña").
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
