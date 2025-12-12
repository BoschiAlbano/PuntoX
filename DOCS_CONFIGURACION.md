# Configuración (frontend y APIs vinculadas)

## Página
- `src/app/admin/configuracion/page.tsx`
  - Secciones: Perfil del negocio, **Preferencias de venta**, Notificaciones, **Seguridad y acceso**, Facturación, Branding.
  - **Arquitectura**: Usa **TanStack Query** para gestión de estado y **API Routes** (NO Server Actions).
  - Acciones principales:
    - `handleSaveAll`: guarda todos los tabs con cambios usando mutations en paralelo con `Promise.allSettled`.
    - Navegación de secciones controlada por estado `openSection`.
  - **Dirty state**: Detecta cambios por tab comparando estados locales vs datos de query.
  - **Botón "Guardar todo" global**: 
    - Se deshabilita si no hay cambios (`hasAnyChanges`).
    - Muestra Chip "Cambios sin guardar" cuando hay cambios pendientes.
    - Ejecuta mutations solo para tabs con cambios.
    - Maneja resultados parciales (éxitos y errores por separado).
  - **Carga de datos**: 
    - `useQuery` para cargar Perfil del negocio y Preferencias de venta.
    - Sincronización automática de estados locales con `useEffect`.
  - **Estados**: `isLoading`, `isSaving`, `dirtyPerfil`, `dirtyVentas`, `hasAnyChanges`.

## Endpoints principales

### `src/app/api/admin/configuracion/perfil/route.ts`
- **GET**: Obtiene datos del Perfil del negocio
  - Resuelve `tenantId` desde `user.user_metadata.tenantId` (patrón estándar del proyecto).
  - Retorna Tenant (Nombre, Dominio) + Configuracion vigente (RazonSocial, Cuit, Email, Telefono).
  - Si no existe Configuracion: `existsConfiguracion: false` con campos vacíos.
  - Retorna DTO: `{ existsConfiguracion, nombre, razonSocial, correo, telefono, dominio, cuit }`.
  
- **PUT**: Guarda Perfil del negocio
  - Valida con zod: nombre, razonSocial, cuit requeridos; correo, telefono, dominio opcionales.
  - Actualiza `Tenant.Nombre` y `Tenant.Dominio`.
  - Si existe Configuracion: actualiza `RazonSocial`, `Cuit`, `Email`, `Telefono`.
  - Si NO existe Configuracion: crea Configuracion mínima válida con defaults (Direccion="SIN DEFINIR", LocalidadId=2014010, etc.).
  - Retorna datos actualizados.

### `src/app/api/admin/configuracion/preferencias-venta/route.ts`
- **GET**: Obtiene Preferencias de venta
  - Obtiene Configuracion vigente (where TenantId + EstaEliminado=false, orderBy Id desc).
  - Si no existe: retorna `existsConfiguracion: false` con código `CONFIG_MISSING` (404).
  - Retorna DTO con todos los campos de venta/caja/stock mapeados desde Configuracion.
  
- **PUT**: Guarda Preferencias de venta
  - Valida con zod: todos los campos requeridos, `tipoFormaPagoDefault` enum (0-3), `montoMaximoRetiroCaja >= 0`.
  - Si no existe Configuracion: retorna error `CONFIG_MISSING` (404) - NO crea Configuracion.
  - Actualiza SOLO campos de venta/caja/stock (no toca datos fiscales).
  - Retorna datos actualizados.

### `src/app/api/configuracion/route.ts` (endpoint existente)
- Métodos:
  - `GET`: requiere tenant en metadata Supabase (`tenantId`), devuelve datos de configuración (RazonSocial, NombreFantasia, Cuit, Email, Telefono, Direccion, ObservacionEnPieFactura).
  - `PUT`: valida con zod (campos obligatorios/optativos), actualiza configuración existente para el tenant autenticado.
- Notas:
  - Usa Prisma `configuracion` y `getSupabaseServerClient`.
  - **Manejo de errores mejorado**: 
    - Retorna `503` (Service Unavailable) solo para errores reales de conexión a la base de datos (códigos Prisma P1001, P1002, P1003, timeouts, connection refused).
    - Mantiene `400/404/500` para otros tipos de errores.

### `src/app/api/tenant/route.ts` (endpoint existente)
- Métodos:
  - `GET`: obtiene datos del tenant autenticado.
  - `PUT`: actualiza datos del tenant.
- **Manejo de errores mejorado**: Similar a `/api/configuracion`, diferencia entre errores de conexión (503) y otros errores.

## Patrón de autenticación
Todos los endpoints usan el mismo patrón:
```typescript
async function resolveTenantId() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = user?.user_metadata?.tenantId;
  return tenantId ? Number(tenantId) : null;
}
```
- Si `tenantId` no existe → retorna `401` con código `TENANT_MISSING`.
- Convierte a `Number` para Prisma (luego a `BigInt` en queries).

## Secciones principales

### Perfil del negocio
- **Campos UI**: Nombre, Razón social, Correo, Teléfono, Dominio, CUIT.
- **Persistencia**:
  - `Tenant`: Nombre, Dominio (identidad/dominio).
  - `Configuracion`: RazonSocial, Cuit, Email, Telefono (fiscal).
- **Regla clave**: Si no existe Configuracion, se crea una mínima válida al guardar Perfil.
- **UI/UX**:
  - Inputs organizados en grid responsive.
  - Dirty state detectado comparando estado local vs datos de query.
  - No tiene botón individual de guardado (usa "Guardar todo" global).

### Preferencias de venta
- **Funcionalidad completa**: Tab funcional con persistencia en base de datos.
- **Modelo Prisma**: Campos agregados a `Configuracion` (NO tabla separada).
  - Campos nuevos: `MostrarPreciosConIva`, `AbrirCajonEfectivo`, `NumerarPedidosPantalla` (Boolean, default `true`).
  - Campos existentes usados: `Imprimir`, `UnificarRenglonesIngresarMismoProducto`, `TipoFormaPagoPorDefectoVenta`, `FacturaDescuentaStock`, `PresupuestoDescuentaStock`, `RemitoDescuentaStock`, `IngresoManualCajaInicial`, `PuestoCajaSeparado`, `ActivarRetiroDeCaja`, `MontoMaximoRetiroCaja`, `ActivarBascula`, `EtiquetaPorPeso`, `CodigoBascula`.
- **UI/UX**:
  - Organizado en secciones: Caja y Ticket, Precios, Stock, Forma de pago.
  - Detección de cambios (dirty state): compara preferencias actuales con datos de query.
  - **CONFIG_MISSING**: Si no existe Configuracion:
    - Muestra alerta visual con fondo amarillo y borde.
    - Botones clickeables para navegar a "Perfil del negocio" o "Facturación".
    - Todos los inputs deshabilitados.
  - Summary dinámico: "Imprimir: sí/no | IVA: incluido/excluido | Stock: descuenta/no descuenta".
  - No tiene botón individual de guardado (usa "Guardar todo" global).
- **Flujo**:
  - Carga inicial: `useQuery` con key `["preferencias-venta"]`.
  - Al cambiar switches: se actualiza estado local y se detecta si hay cambios.
  - Al guardar: mutation → actualiza cache → sincroniza estados locales → limpia dirty state.

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

### Botón "Guardar todo" global
- **Ubicación**: Header de la página (junto a "Ver actividad").
- **Estado**: 
  - `isDisabled={!hasAnyChanges}`: solo habilitado si hay cambios pendientes.
  - `isLoading={isSaving}`: muestra spinner mientras guarda.
- **Funcionamiento**:
  1. Detecta qué tabs tienen cambios (`dirtyPerfil`, `dirtyVentas`).
  2. Crea array de tasks con mutations solo para tabs con cambios.
  3. Ejecuta todas las mutations en paralelo con `Promise.allSettled`.
  4. Procesa resultados parciales:
     - Éxitos: muestra toast "Cambios guardados: Perfil del negocio, Preferencias de venta actualizados".
     - Errores: muestra toast individual por cada error "Error: Perfil del negocio: [mensaje]".
  5. Actualiza cache de TanStack Query solo para mutations exitosas.
  6. Los `useEffect` sincronizan estados locales automáticamente, limpiando dirty state.

### Manejo de resultados parciales
- **Ejemplo**: Si Perfil se guarda OK pero Ventas falla:
  - Toast success: "Cambios guardados: Perfil del negocio actualizado".
  - Toast error: "Error: Preferencias de venta: No existe configuración. Completa primero el Perfil del negocio.".
  - Dirty state: `dirtyPerfil = false` (limpio), `dirtyVentas = true` (sigue sucio).
  - El botón "Guardar todo" sigue habilitado porque `hasAnyChanges = true`.

### TanStack Query
- **Queries**:
  - `["perfil-negocio"]`: carga datos de Perfil del negocio.
  - `["preferencias-venta"]`: carga datos de Preferencias de venta.
- **Mutations**:
  - `mutationPerfil`: guarda Perfil del negocio.
  - `mutationPreferencias`: guarda Preferencias de venta.
- **Cache**: Se actualiza con `queryClient.setQueryData` en `onSuccess` de mutations.
- **Sincronización**: `useEffect` sincroniza estados locales cuando cambian los datos de query.

## Manejo de errores y validaciones

### Códigos de error
- **401 TENANT_MISSING**: No autenticado o `tenantId` no encontrado en `user_metadata`.
- **404 CONFIG_MISSING**: No existe Configuracion vigente (solo en Preferencias de venta).
- **400**: Datos inválidos (validación zod fallida).
- **503**: Errores de conexión a la base de datos (P1001, P1002, P1003, timeouts).
- **500**: Otros errores internos.

### Validaciones en backend
- **Perfil del negocio**:
  - `nombre`: requerido, min 1 carácter.
  - `razonSocial`: requerido, min 1 carácter.
  - `cuit`: requerido, min 1 carácter, max 13 caracteres.
  - `correo`: opcional, debe ser email válido si se proporciona.
  - `telefono`, `dominio`: opcionales.
  
- **Preferencias de venta**:
  - `tipoFormaPagoDefault`: número entero, min 0, max 3 (enum: 0=Efectivo, 1=Débito, 2=Crédito, 3=QR).
  - `montoMaximoRetiroCaja`: número, min 0.
  - Todos los booleanos: requeridos.

### Manejo de errores en frontend
- **TanStack Query**: Errores de query se manejan automáticamente (pueden mostrar estados de error).
- **Mutations**: Errores se capturan en `onError` y se muestran como toasts.
- **Promise.allSettled**: Permite manejar éxitos y errores por separado, mostrando resultados parciales.

## Modelo de datos

### Tabla `Configuracion` (actualizada)
Las preferencias de venta se guardan en `Configuracion`, NO en una tabla separada.

**Campos agregados a `Configuracion`** (requiere `prisma db push`):
```prisma
MostrarPreciosConIva       Boolean   @default(true)
AbrirCajonEfectivo         Boolean   @default(true)
NumerarPedidosPantalla     Boolean   @default(true)
```

**Relación con Tenant**:
- `Configuracion` puede haber varias por `TenantId`.
- Siempre usar la **vigente**: `where TenantId + EstaEliminado=false, orderBy Id desc`.
- Relación: `Tenant Configuracion[]` (uno a muchos).

**Campos existentes usados para preferencias de venta**:
- `Imprimir`: Imprimir ticket automáticamente
- `UnificarRenglonesIngresarMismoProducto`: Unificar renglones del mismo producto
- `TipoFormaPagoPorDefectoVenta`: Forma de pago por defecto (0=Efectivo, 1=Débito, 2=Crédito, 3=QR)
- `FacturaDescuentaStock`: Factura descuenta stock
- `PresupuestoDescuentaStock`: Presupuesto descuenta stock
- `RemitoDescuentaStock`: Remito descuenta stock
- `IngresoManualCajaInicial`: Ingreso manual de caja inicial
- `PuestoCajaSeparado`: Puesto de caja separado
- `ActivarRetiroDeCaja`: Activar retiro de caja
- `MontoMaximoRetiroCaja`: Monto máximo de retiro de caja
- `ActivarBascula`: Activar báscula
- `EtiquetaPorPeso`: Etiqueta por peso
- `CodigoBascula`: Código de báscula

**Regla de negocio**:
- `Configuracion` puede haber varias por `TenantId`.
- Siempre usar la **vigente**: `where TenantId + EstaEliminado=false, orderBy Id desc`.
- Preferencias de venta NO crean `Configuracion` si no existe (error `CONFIG_MISSING`).
- Perfil del negocio SÍ puede crear `Configuracion` mínima válida si no existe.

## Arquitectura técnica

### TanStack Query
- **Provider**: `QueryProvider` configurado en el layout con `staleTime: Infinity` y `refetchOnWindowFocus: false`.
- **Queries**: Carga automática al montar el componente, cache persistente.
- **Mutations**: Actualización optimista del cache con `setQueryData`.
- **Sincronización**: Estados locales se sincronizan con datos de query vía `useEffect`.

### Dirty State
- **Implementación**: Comparación profunda usando `JSON.stringify` (suficiente para objetos simples).
- **Nota técnica**: Para objetos complejos con Decimal/null/undefined, considerar `lodash.isequal` a futuro.
- **Cálculo**: `useMemo` que compara estados locales vs datos de query.
- **Limpieza**: Automática cuando mutations exitosas actualizan el cache y los `useEffect` sincronizan.

### Mapeo UI → Prisma
- **Regla general**:
  - Identidad/dominio/branding → `Tenant`.
  - Fiscal + ventas + caja + stock → `Configuracion`.
- **Perfil del negocio**:
  - `Tenant`: Nombre, Dominio.
  - `Configuracion`: RazonSocial, Cuit, Email, Telefono.
- **Preferencias de venta**:
  - Todo en `Configuracion` (campos de venta/caja/stock).

## Sugerencias de uso y futuras extensiones
- Añadir validación/feedback por campo en el frontend para datos fiscales (CUIT, email, etc.).
- Exponer más campos de configuración fiscal (IVA, inicio de actividades) si se agregan al endpoint.
- Integrar logs de actividad en "Ver actividad" cuando el backend esté disponible.
- **Preferencias de venta**: Considerar agregar más opciones de configuración según necesidades del negocio.
- **Seguridad**: Implementar persistencia de políticas de seguridad cuando el backend esté disponible (actualmente solo estado local).
- **Cache optimista**: Implementar `setQueryData` optimista antes de mutations para UX más fluida (opcional).
- **Deep compare**: Migrar a `lodash.isequal` si surgen problemas con `JSON.stringify` y objetos complejos.
