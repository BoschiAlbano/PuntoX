# Empleados y Roles (Frontend + APIs)

## Endpoints

- `GET /api/provincias`: lista catálogo de provincias activas.
- `GET /api/departamentos?provinciaId=ID&q=texto`: departamentos filtrados por provincia, admite búsqueda parcial.
- `GET /api/localidades?departamentoId=ID&q=texto`: localidades filtradas por departamento y búsqueda parcial (límite 50).
- `GET /api/roles`: roles del tenant con tipo (`ADMINISTRADOR` | `EMPLEADO`) y conteo de uso.
- `POST /api/roles { nombre, tipo }`: crea rol para el tenant. Registra auditoría `CREAR_ROL`.
- `PATCH /api/roles?id=<rolId> { nombre, descripcion, tipo, permisos }`: actualiza rol existente. No permite modificar nombre/tipo en roles del sistema. Registra auditoría `EDITAR_ROL` con `valorAnterior` y `valorNuevo` (incluye permisos).
- `DELETE /api/roles?id=<rolId>`: elimina rol (hard delete). Bloquea si el rol tiene usuarios asignados o es rol del sistema. Registra auditoría `ELIMINAR_ROL` antes de eliminar.
- `GET /api/empleados`: lista empleados del tenant (Persona + Usuario + Rol + Localidad) con estado (Activo/Suspendido/Invitado). Soporta paginación (`page`, `limit`) y filtros backend (`rol`, `estado`, `busqueda`).
- `POST /api/empleados`: alta de persona + empleado + usuario + rol; crea usuario en Supabase Auth con metadata `tenant_id` y `role`. Registra auditoría `CREAR_USUARIO` y `INVITAR_USUARIO` (si `autoInvitar` es true).
- `PUT /api/empleados { personaId, nombre, apellido, dni, direccion, telefono, localidadId, rolId }`: edita datos del empleado. Actualiza `Persona` y `PerfilUsuario` (rol). Registra auditoría `EDITAR_USUARIO` y `CAMBIAR_ROL` (si cambió el rol) con `valorAnterior` y `valorNuevo`.
- `PATCH /api/empleados { usuarioId, bloquear }`: suspende/activa usuario (toggle en `EstaBloqueado`). Registra auditoría `SUSPENDER_USUARIO` o `REACTIVAR_USUARIO`.
- `DELETE /api/empleados { personaId }`: elimina empleado definitivamente (hard delete). Registra auditoría `ELIMINAR_USUARIO` antes de eliminar.
- `PUT /api/empleados/cambiar-password { usuarioId, nuevaPassword }`: cambia la contraseña del usuario en Supabase Auth. Valida que la contraseña tenga al menos 8 caracteres. Registra auditoría `CAMBIAR_PASSWORD` con severidad `WARNING`.
- `GET /api/auditoria-empleados`: consulta logs de auditoría con paginación. Filtros opcionales: `accion`, `usuarioId`, `empleadoId`, `fechaDesde`, `fechaHasta`.
- `POST /api/auditoria-empleados`: registro manual de auditoría (principalmente para testing).

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
- Tabla: filtros por búsqueda, rol y estado (filtrado en backend); acciones con íconos SVG (lucide-react):
  - **Editar** (Pencil): abre modal para editar datos del empleado (nombre, apellido, DNI, dirección, teléfono, localidad, rol) y cambiar contraseña
  - **Ver ficha** (Eye): muestra detalles del empleado
  - **Suspender/activar** (Zap): toggle de estado (`PATCH`)
  - **Enviar email** (Mail): reenvía invitación (toast)
  - **Eliminar** (Trash2): elimina empleado con confirmación
- **Edición de empleados**: Modal con formulario prellenado que permite editar todos los campos del empleado. Incluye sección separada para cambiar contraseña con validación (mínimo 8 caracteres, confirmación).
- **Paginación mejorada**: Componente `Pagination` con diseño moderno (fondo gris claro, bordes redondeados, mejor espaciado). Selector de límite sincronizado correctamente usando `useMemo` para evitar problemas de actualización. Los cambios en `limit` recargan automáticamente los datos gracias a `useEffect`.
- **Auditoría de accesos**: 
  - Preview de eventos de seguridad y accesos (máximo 10 items) con chips de severidad (INFO/WARNING/CRITICAL).
  - Muestra descripción legible, tiempo relativo, categoría y severidad de cada evento.
  - Recarga automática después de acciones (crear/editar/eliminar usuario, cambiar estado, crear/editar/eliminar rol).
  - Link a página completa de logs en Analíticas (`/analiticas?tab=logs`).
  - **Lógica de formateo extraída**: Las funciones de formateo de auditoría están en `auditoria-utils.ts` para reutilización y testeo.
- **Helpers de UI**: Función `rolChipColor` para mapear tipos de rol a colores de chip (primary para ADMINISTRADOR, secondary para EMPLEADO).
- Metadata: usa tenant desde `user_metadata.tenant_id` vía `useSupabaseAuthContext`.

## Sistema de Auditoría

### Tabla `AuditoriaEmpleado`

Registra todas las acciones importantes sobre empleados, usuarios y roles:

- **Campos principales**:
  - `TenantId`, `Fecha`, `UsuarioId` (actor), `Accion`, `Severidad` (INFO/WARNING/CRITICAL)
  - `EmpleadoId`, `UsuarioAfectadoId` (entidades afectadas)
  - `Detalle` (descripción legible), `ValorAnterior`, `ValorNuevo` (JSON para cambios)
  - `IpAddress`, `UserAgent` (metadata de seguridad)

- **Acciones registradas**:
  - **Empleados/Usuarios**: `CREAR_USUARIO`, `INVITAR_USUARIO`, `REENVIAR_INVITACION`, `ACEPTAR_INVITACION`, `CAMBIAR_ROL`, `SUSPENDER_USUARIO`, `REACTIVAR_USUARIO`, `ELIMINAR_USUARIO`
  - **Roles**: `CREAR_ROL`, `EDITAR_ROL`, `ELIMINAR_ROL`
  - **Configuración**: `CAMBIAR_CONFIG_SEGURIDAD`
  - **Seguridad**: `CAMBIAR_PASSWORD` (cambio de contraseña de usuario)

- **Severidad automática**:
  - **CRITICAL**: `ELIMINAR_USUARIO`, `ELIMINAR_ROL`
  - **WARNING**: `CAMBIAR_ROL`, `EDITAR_ROL`, `SUSPENDER_USUARIO`, `CAMBIAR_CONFIG_SEGURIDAD`, `CAMBIAR_PASSWORD`
  - **INFO**: resto de acciones (creaciones, invitaciones, reactivaciones)

### Helper `registrarAuditoria()`

Ubicación: `src/lib/auditoria/registrarAuditoria.ts`

- Función centralizada para registrar auditorías
- Infiere severidad automáticamente si no se especifica
- Obtiene IP y User-Agent de headers automáticamente
- No interrumpe el flujo principal si falla (solo loguea error)

**Uso**:
```typescript
await registrarAuditoria({
  tenantId,
  usuarioId,
  accion: "CREAR_USUARIO",
  empleadoId: empleadoId,
  usuarioAfectadoId: usuarioId,
  detalle: "Usuario creado: Juan Pérez",
  valorNuevo: { nombre: "Juan", email: "juan@example.com" },
  req, // Opcional: para obtener headers en API routes
});
```

### API de Auditoría

- **GET `/api/auditoria-empleados`**: 
  - Paginación: `page`, `limit`
  - Filtros: `accion`, `usuarioId`, `empleadoId`, `fechaDesde`, `fechaHasta`
  - Incluye relaciones: Usuario (actor), Empleado, UsuarioAfectado
  - Retorna: array de auditorías con severidad, detalles formateados, valores anterior/nuevo parseados

- **POST `/api/auditoria-empleados`**: 
  - Registro manual (principalmente para testing)
  - Valida esquema con Zod

## Notas técnicas

- Prisma: 
  - Se agregó `PerfilTipo` (enum) y campo `Tipo` en `Perfiles` (default EMPLEADO)
  - Se agregó tabla `AuditoriaEmpleado` con campo `Severidad`
  - Requiere migraciones: `add_auditoria_empleado`, `add_severidad_auditoria`
  - Después de migraciones: ejecutar `prisma generate` y reiniciar servidor de desarrollo
- Supabase: 
  - Al crear usuario se setea `app_metadata.role` según el tipo de rol (Administrador/Empleado).
  - El cambio de contraseña se realiza mediante `supabase.auth.admin.updateUserById()` usando el `AuthUserId` del usuario.
- Localidad se valida contra Departamento/Provincia para asegurar consistencia.
- **Componente Pagination** (`src/components/common/Pagination.tsx`):
  - Usa `useMemo` para sincronizar correctamente el selector de límite con el estado.
  - Diseño mejorado con fondo gris claro, bordes redondeados y mejor espaciado.
  - El cambio de límite resetea automáticamente a la página 1.
- **Utils de Auditoría** (`src/app/(dashboard)/empleados/auditoria-utils.ts`):
  - `formatTiempoRelativo`: formatea fechas a tiempo relativo legible (ej: "Hace 2 min", "Ayer").
  - `formatearAccion`: genera texto descriptivo de acciones de auditoría.
  - `mapearAccion`: categoriza acciones y asigna colores (Usuarios, Roles, Invitaciones, General).
  - `mapearSeveridad`: mapea niveles de severidad (CRITICAL/WARNING/INFO) a colores de chip.
  - Tests unitarios completos en `auditoria-utils.test.ts`.
- **Tests**:
  - Tests de `requirePermiso` actualizados para reflejar comportamiento actual (sin auto-asignación de permisos).
  - Tests de `route.test.ts` corregidos con mocks explícitos de `requirePermiso` y `registrarAuditoria`.
  - Todos los tests pasan: `npx vitest run` ejecuta exitosamente todos los archivos de test.
- **Gestión de roles**:
  - Los roles del sistema se identifican por `id < 0` o nombres normalizados como "administrador"/"superadmin".
  - La eliminación de roles realiza hard delete: primero elimina `PerfilPermiso` y luego `Perfiles`.
  - La edición de roles actualiza `Perfiles` y recrea las relaciones `PerfilPermiso` según el array de permisos.
  - Todas las acciones registran auditoría con severidad apropiada.
- **Auditoría**:
  - Se registra automáticamente en todas las acciones críticas
  - Los logs se muestran en tiempo real en la UI (recarga después de cada acción)
  - La severidad se infiere automáticamente pero puede sobrescribirse
  - Los valores anterior/nuevo se guardan como JSON para cambios importantes
- **UI/UX**:
  - Se eliminó la tab "Seguridad" (movida a Configuración → Seguridad).
  - Se agregó tab "Auditoría de accesos" con preview limitado (10 items) y navegación a Analíticas.
  - Chips de severidad con colores: INFO (azul), WARNING (amarillo), CRITICAL (rojo)
  - Iconos SVG de lucide-react en todas las acciones: Pencil (editar), Eye (ver ficha), Zap (suspender/activar), Mail (enviar email), Trash2 (eliminar).
  - **Paginación mejorada**: Componente `Pagination` con diseño moderno, selector de límite sincronizado correctamente, fondo gris claro con bordes redondeados, mejor tipografía y espaciado.
  - **Filtrado backend**: Los filtros de búsqueda, rol y estado se procesan en el servidor, mejorando el rendimiento y la precisión de los resultados.
  - **Refactorización de código**: Lógica de formateo de auditoría extraída a `auditoria-utils.ts` con tests unitarios (`auditoria-utils.test.ts`).
  - Mejoras en responsive design y accesibilidad (aria-labels).
