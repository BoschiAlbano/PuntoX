# Configuración (frontend y APIs vinculadas)

## Página
- `src/app/(dashboard)/configuracion/page.tsx`
  - Secciones: Perfil del negocio, **Preferencias de venta**, Notificaciones, **Seguridad y acceso**, Fiscal, Branding.
  - Acciones principales:
    - `handleSavePerfil`: guarda Tenant + Configuración.
    - `handleSavePreferenciasVenta`: guarda preferencias de venta usando server actions.
    - Navegación de secciones controlada por estado `openSection`.
  - Estados de carga: `isLoadingTenant`, `isLoadingConfig`, `isSavingAll`, `isLoadingPreferencias`, `isSavingPreferencias`.
  - **Modo offline**: Detecta errores de conexión (503) y muestra Chip "Modo offline: valores por defecto", deshabilitando acciones de guardado.
  - Fetch inicial:
    - `/api/tenant` para datos del tenant.
    - `/api/configuracion` para datos fiscales/identidad.
    - `getPreferenciasVenta()` (server action) para preferencias de venta.

## Endpoints principales
### `src/app/api/configuracion/route.ts`
- Métodos:
  - `GET`: requiere tenant en metadata Supabase (`tenantId`), devuelve datos de configuración (RazonSocial, NombreFantasia, Cuit, Email, Telefono, Direccion, ObservacionEnPieFactura).
  - `PUT`: valida con zod (campos obligatorios/optativos), actualiza configuración existente para el tenant autenticado.
- Notas:
  - Usa Prisma `configuracion` y `getSupabaseServerClient`.
  - **Manejo de errores mejorado**: 
    - Retorna `503` (Service Unavailable) solo para errores reales de conexión a la base de datos (códigos Prisma P1001, P1002, P1003, timeouts, connection refused).
    - Mantiene `400/404/500` para otros tipos de errores.
    - El frontend diferencia entre errores de conexión (modo offline) y errores de permisos (401/403).

### `src/app/api/tenant/route.ts`
- Métodos:
  - `GET`: obtiene datos del tenant autenticado.
  - `PUT`: actualiza datos del tenant.
- **Manejo de errores mejorado**: Similar a `/api/configuracion`, diferencia entre errores de conexión (503) y otros errores.

## Server Actions
### `src/app/(dashboard)/configuracion/actions-preferencias-venta.ts`
- **`getPreferenciasVenta()`**: 
  - Obtiene las preferencias de venta del tenant actual desde la tabla `PreferenciasVenta`.
  - Si no existen, retorna valores por defecto sin crear en DB.
  - Retorna DTO: `{ ticketDigitalPorCorreo, mostrarPreciosConIva, abrirCajonEfectivo, numerarPedidosPantalla }`.
  
- **`savePreferenciasVenta(data: PreferenciasVentaDTO)`**:
  - Usa `upsert` por `TenantId` para crear o actualizar preferencias.
  - Guarda los 4 flags booleanos.
  - Retorna `{ success: boolean, error?: string }`.

### Otros endpoints relacionados (externos a este archivo)
- `/api/tenant` (no detallado aquí): usado por la página para cargar datos del tenant.

## Secciones principales

### Preferencias de venta
- **Funcionalidad completa**: Tab funcional con persistencia en base de datos.
- **Modelo Prisma**: Tabla `PreferenciasVenta` con relación 1:1 con `Tenant`.
  - Campos: `TicketDigitalPorCorreo`, `MostrarPreciosConIva`, `AbrirCajonEfectivo`, `NumerarPedidosPantalla` (todos Boolean con default `true`).
  - Timestamps: `CreatedAt`, `UpdatedAt`.
- **UI/UX**:
  - 4 switches (HeroUI) para cada preferencia.
  - Detección de cambios (dirty state): compara preferencias actuales con originales.
  - Botón "Guardar cambios" solo visible cuando hay cambios.
  - Summary dinámico: "Ticket digital: activado | Impuestos: incluidos".
  - Switches deshabilitados en modo offline.
  - Chip "Modo offline" cuando hay errores de conexión.
- **Flujo**:
  - Carga inicial: `getPreferenciasVenta()` al montar el componente.
  - Al cambiar switches: se actualiza estado local y se detecta si hay cambios.
  - Al guardar: `savePreferenciasVenta()` → toast success/error → limpia dirty state.

### Seguridad y acceso
- **Reorganización**: Sección mejorada con 3 cards organizadas:
  - **Acceso y autenticación**: 
    - Switch: Habilitar doble factor (2FA)
    - Switch: Avisar inicio de sesión desde nuevos dispositivos
    - Switch: Bloquear dashboard por inactividad (10 minutos)
    - Select: Bloquear cuenta tras intentos fallidos (Nunca / 5 intentos / 10 intentos)
    - Switch: Recordar sesión por 30 días en dispositivos confiables
  - **Estado de seguridad**: Información de solo lectura (sesiones activas, dispositivos activos, último acceso).
  - **Auditoría**: Texto informativo con link a Analíticas → Logs.
- **Página separada**: `src/app/(dashboard)/configuracion/seguridad/page.tsx` (página independiente, no usada actualmente en el tab).

## Flujo de guardado en la página
- `handleSavePerfil` ejecuta `saveTenant` y `saveConfiguracion` en serie y muestra toasts de éxito/error.
- `handleSavePreferenciasVenta` guarda preferencias de venta usando server actions.
- El botón "Guardar todo" se deshabilita mientras carga tenant/configuración o está guardando, o si está en modo offline.
- El botón "Guardar cambios" en Preferencias de venta se deshabilita en modo offline.

## Manejo de errores y modo offline
- **Diferenciación de errores**:
  - `503` (Service Unavailable): Errores de conexión a la base de datos. Activa modo offline.
  - `401/403`: Errores de autenticación/autorización. Muestra toast de error.
  - `404/500`: Otros errores. Muestra toast de error.
- **Modo offline**:
  - Se activa cuando hay errores 503 o errores de red/timeouts.
  - Muestra Chip "Modo offline: valores por defecto" en el header.
  - Deshabilita botones de guardado.
  - Permite visualizar datos con valores por defecto.
  - No rompe la UI, permite continuar navegando.

## Modelo de datos
### Tabla `PreferenciasVenta`
```prisma
model PreferenciasVenta {
  Id                      BigInt   @id @default(autoincrement())
  TenantId                BigInt   @unique
  TicketDigitalPorCorreo  Boolean  @default(true)
  MostrarPreciosConIva    Boolean  @default(true)
  AbrirCajonEfectivo      Boolean  @default(true)
  NumerarPedidosPantalla  Boolean  @default(true)
  CreatedAt               DateTime @default(now())
  UpdatedAt               DateTime @updatedAt
  Tenant                  Tenant   @relation(fields: [TenantId], references: [Id])
  @@index([TenantId])
}
```
- Relación 1:1 con `Tenant`.
- Separada de `Configuracion` para mantener independencia y evitar conflictos con campos obligatorios.

## Sugerencias de uso y futuras extensiones
- Añadir validación/feedback por campo en el frontend para datos fiscales (CUIT, email, etc.).
- Exponer más campos de configuración fiscal (IVA, inicio de actividades) si se agregan al endpoint.
- Integrar logs de actividad en "Ver actividad" cuando el backend esté disponible.
- **Preferencias de venta**: Considerar agregar más opciones de configuración según necesidades del negocio.
- **Seguridad**: Implementar persistencia de políticas de seguridad cuando el backend esté disponible (actualmente solo estado local).
