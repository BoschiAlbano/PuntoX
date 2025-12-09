# Configuración (frontend y APIs vinculadas)

## Página
- `src/app/(dashboard)/configuracion/page.tsx`
  - Secciones: Perfil del negocio, Preferencias de venta, Notificaciones, Seguridad, Fiscal, Branding.
  - Acciones principales:
    - `handleSavePerfil`: guarda Tenant + Configuración.
    - Navegación de secciones controlada por estado `openSection`.
  - Estados de carga: `isLoadingTenant`, `isLoadingConfig`, `isSavingAll`.
  - Fetch inicial:
    - `/api/tenant` (no incluido en este repo) para datos del tenant.
    - `/api/configuracion` para datos fiscales/identidad.

## Endpoints principales
### `src/app/api/configuracion/route.ts`
- Métodos:
  - `GET`: requiere tenant en metadata Supabase (`tenantId`), devuelve datos de configuración (RazonSocial, NombreFantasia, Cuit, Email, Telefono, Direccion, ObservacionEnPieFactura).
  - `PUT`: valida con zod (campos obligatorios/optativos), actualiza configuración existente para el tenant autenticado.
- Notas:
  - Usa Prisma `configuracion` y `getSupabaseServerClient`.
  - Respuestas de error: 401 (no autenticado), 404 (no hay config), 400 (datos inválidos), 500 (error al actualizar).

### Otros endpoints relacionados (externos a este archivo)
- `/api/tenant` (no detallado aquí): usado por la página para cargar datos del tenant.

## Flujo de guardado en la página
- `handleSavePerfil` ejecuta `saveTenant` y `saveConfiguracion` en serie y muestra toasts de éxito/error.
- El botón “Guardar todo” se deshabilita mientras carga tenant/configuración o está guardando.

## Sugerencias de uso y futuras extensiones
- Añadir validación/feedback por campo en el frontend para datos fiscales (CUIT, email, etc.).
- Exponer más campos de configuración fiscal (IVA, inicio de actividades) si se agregan al endpoint.
- Integrar logs de actividad en “Ver actividad” cuando el backend esté disponible.
