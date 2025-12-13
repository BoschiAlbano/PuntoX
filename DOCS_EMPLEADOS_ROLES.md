# Empleados y Roles (Frontend + APIs)

## Endpoints

- `GET /api/provincias`: lista catálogo de provincias activas.
- `GET /api/departamentos?provinciaId=ID&q=texto`: departamentos filtrados por provincia, admite búsqueda parcial.
- `GET /api/localidades?departamentoId=ID&q=texto`: localidades filtradas por departamento y búsqueda parcial (límite 50).
- `GET /api/roles`: roles del tenant con tipo (`ADMINISTRADOR` | `EMPLEADO`) y conteo de uso.
- `POST /api/roles { nombre, tipo }`: crea rol para el tenant.
- `GET /api/empleados`: lista empleados del tenant (Persona + Usuario + Rol + Localidad) con estado (Activo/Suspendido/Invitado).
- `POST /api/empleados`: alta de persona + empleado + usuario + rol; crea usuario en Supabase Auth con metadata `tenant_id` y `role`.
- `PATCH /api/empleados { usuarioId, bloquear }`: suspende/activa usuario (toggle en `EstaBloqueado`).

## Página `src/app/(dashboard)/empleados/page.tsx`

- Carga inicial: `/api/roles`, `/api/provincias`, `/api/empleados`.
- Cascada con búsqueda: Provincia → Departamento → Localidad (fetch dinámico con `q`).
- Alta rápida: nombre/apellido/email/usuario/password/teléfono/dirección + selección de provincia/departamento/localidad + rol + opción de invitación. Valida campos y dispara `POST /api/empleados`.
- Roles: creación de rol con tipo (Administrador o Empleado) desde modal, se refleja en listado y en selector del alta.
- Tabla: filtros por búsqueda, rol y estado; acciones ver ficha, suspender/activar (`PATCH`), reenviar invitación (toast).
- Metadata: usa tenant desde `app_metadata.tenant_id` vía `useSupabaseAuthContext`.

## Notas técnicas

- Prisma: se agregó `PerfilTipo` (enum) y campo `Tipo` en `Perfiles` (default EMPLEADO). Requiere migración y `prisma generate`.
- Supabase: al crear usuario se setea `app_metadata.role` según el tipo de rol (Administrador/Empleado).
- Localidad se valida contra Departamento/Provincia para asegurar consistencia.
