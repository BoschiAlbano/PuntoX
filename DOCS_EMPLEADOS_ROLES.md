# Empleados y Roles (Frontend + APIs)

## Endpoints

- `GET /api/provincias`: lista catálogo de provincias activas.
- `GET /api/departamentos?provinciaId=ID&q=texto`: departamentos filtrados por provincia, admite búsqueda parcial.
- `GET /api/localidades?departamentoId=ID&q=texto`: localidades filtradas por departamento y búsqueda parcial (límite 50).
- `GET /api/roles`: roles del tenant con tipo (`ADMINISTRADOR` | `EMPLEADO`) y conteo de uso.
- `POST /api/roles { nombre, tipo }`: crea rol para el tenant.
- `PATCH /api/roles?id=<rolId> { nombre, descripcion, tipo, permisos }`: actualiza rol existente. No permite modificar nombre/tipo en roles del sistema.
- `DELETE /api/roles?id=<rolId>`: elimina rol (hard delete). Bloquea si el rol tiene usuarios asignados o es rol del sistema.
- `GET /api/empleados`: lista empleados del tenant (Persona + Usuario + Rol + Localidad) con estado (Activo/Suspendido/Invitado).
- `POST /api/empleados`: alta de persona + empleado + usuario + rol; crea usuario en Supabase Auth con metadata `tenant_id` y `role`.
- `PATCH /api/empleados { usuarioId, bloquear }`: suspende/activa usuario (toggle en `EstaBloqueado`).

## Página `src/app/(dashboard)/empleados/page.tsx`
- **Estructura con Tabs**: La página está organizada en 3 tabs principales:
  - **Usuarios**: Alta rápida de usuarios + Tabla de empleados con filtros
  - **Roles**: Librería de roles con acciones de editar/eliminar
  - **Auditoría de accesos**: Preview de logs (máximo 10 items) con botón "Ver logs completos" que navega a `/analiticas?tab=logs`

- Carga inicial: `/api/roles`, `/api/provincias`, `/api/empleados`.
- Cascada con búsqueda: Provincia → Departamento → Localidad (fetch dinámico con `q`).
- Alta rápida: nombre/apellido/email/usuario/password/teléfono/dirección + selección de provincia/departamento/localidad + rol + opción de invitación. Valida campos y dispara `POST /api/empleados`.
- **Roles mejorados**:
  - Creación de rol con tipo (Administrador o Empleado) desde modal
  - **Edición de roles**: Menú de acciones (⋯) con opción "Editar rol" que abre modal prellenado. Permite modificar nombre, descripción, tipo y permisos. Los roles del sistema no permiten modificar nombre/tipo.
  - **Eliminación de roles**: Opción "Eliminar" en menú de acciones con confirmación. Bloquea eliminación si el rol tiene usuarios asignados o es rol del sistema (muestra tooltip explicativo).
  - Se refleja en listado y en selector del alta.
- Tabla: filtros por búsqueda, rol y estado; acciones ver ficha, suspender/activar (`PATCH`), reenviar invitación (toast).
- **Auditoría**: Preview de eventos de seguridad y accesos (máximo 10 items). Link a página completa de logs en Analíticas.
- Metadata: usa tenant desde `user_metadata.tenant_id` vía `useSupabaseAuthContext`.

## Notas técnicas

- Prisma: se agregó `PerfilTipo` (enum) y campo `Tipo` en `Perfiles` (default EMPLEADO). Requiere migración y `prisma generate`.
- Supabase: al crear usuario se setea `app_metadata.role` según el tipo de rol (Administrador/Empleado).
- Localidad se valida contra Departamento/Provincia para asegurar consistencia.
- **Gestión de roles**:
  - Los roles del sistema se identifican por `id < 0` o nombres normalizados como "administrador"/"superadmin".
  - La eliminación de roles realiza hard delete: primero elimina `PerfilPermiso` y luego `Perfiles`.
  - La edición de roles actualiza `Perfiles` y recrea las relaciones `PerfilPermiso` según el array de permisos.
- **UI/UX**:
  - Se eliminó la tab "Seguridad" (movida a Configuración → Seguridad).
  - Se agregó tab "Auditoría de accesos" con preview limitado y navegación a Analíticas.
  - Iconos de lucide-react (Pencil, Trash2) en acciones de roles.
  - Mejoras en responsive design y accesibilidad (aria-labels).
