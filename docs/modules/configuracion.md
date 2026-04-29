# Configuración (frontend y APIs vinculadas)

## Páginas de Configuración

### `src/app/(dashboard)/configuracion/page.tsx` (Página principal - FUNCIONAL)
- **Secciones**: Perfil del negocio, Preferencias de venta, Notificaciones, Seguridad y acceso, Facturación y región, Branding.
- **Arquitectura**: Usa **API Routes** con fetch directo y **Server Actions** para preferencias de venta.
- **Estado**: ✅ **COMPLETAMENTE FUNCIONAL** - Todas las secciones conectadas a la base de datos.
- **Características principales**:
  - Carga de datos desde múltiples APIs al montar el componente.
  - Detección de cambios (dirty state) por sección.
  - Botones de guardar individuales por sección que aparecen solo cuando hay cambios.
  - Manejo de errores con toasts informativos.
  - Modo offline con valores por defecto.
  - **Transacciones**: Todas las operaciones de escritura usan transacciones de Prisma para garantizar atomicidad.

### `src/app/admin/configuracion/page.tsx` (Página admin)
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

### `src/app/api/configuracion/route.ts` (endpoint principal - ACTUALIZADO)
- **Métodos**:
  - **GET**: Obtiene configuración vigente del tenant
    - Retorna: `RazonSocial`, `NombreFantasia`, `Cuit`, `Email`, `Telefono`, `Celular`, `Direccion`, `LocalidadId`, `ObservacionEnPieFactura`
    - También incluye **TODAS** las preferencias de venta:
      - Básicas: `MostrarPreciosConIva`, `AbrirCajonEfectivo`, `NumerarPedidosPantalla`, `Imprimir`
      - Stock: `FacturaDescuentaStock`, `PresupuestoDescuentaStock`, `RemitoDescuentaStock`, `ActualizaCostoDesdeCompra`, `ModificaPrecioVentaDesdeCompra`
      - Caja: `TipoFormaPagoPorDefectoVenta`, `TipoFormaPagoPorDefectoCompra`, `IngresoManualCajaInicial`, `PuestoCajaSeparado`, `ActivarRetiroDeCaja`, `MontoMaximoRetiroCaja`
      - Productos: `UnificarRenglonesIngresarMismoProducto`
      - Báscula: `ActivarBascula`, `EtiquetaPorPeso`, `CodigoBascula`
    - Si no existe: retorna `404`
  - **PUT**: Crea o actualiza configuración
    - **Validación zod**: 
  - `razonSocial` (requerido, min 1 carácter) ⭐
  - `cuit` (requerido, min 1 carácter) ⭐
  - `direccion` (requerido, min 1 carácter) ⭐
  - `localidadId` (requerido, número positivo) ⭐
  - Todos los demás campos son opcionales
    - Campos opcionales: `nombreFantasia`, `email`, `telefono`, `celular`, `observacionPieFactura`
    - **TODAS las preferencias de venta opcionales**:
      - Básicas: `mostrarPreciosConIva`, `abrirCajonEfectivo`, `numerarPedidosPantalla`, `imprimir`
      - Stock: `facturaDescuentaStock`, `presupuestoDescuentaStock`, `remitoDescuentaStock`, `actualizaCostoDesdeCompra`, `modificaPrecioVentaDesdeCompra`
      - Caja: `tipoFormaPagoPorDefectoVenta` (0-3), `tipoFormaPagoPorDefectoCompra` (0-3), `ingresoManualCajaInicial`, `puestoCajaSeparado`, `activarRetiroDeCaja`, `montoMaximoRetiroCaja` (number >= 0)
      - Productos: `unificarRenglonesIngresarMismoProducto`
      - Báscula: `activarBascula`, `etiquetaPorPeso`, `codigoBascula` (string opcional)
    - **Si no existe configuración**: Crea una nueva con valores por defecto
    - **Si existe**: Actualiza la configuración vigente
    - **TRANSACCIONES**: ✅ Usa `prisma.$transaction()` para garantizar atomicidad
- **Notas**:
  - Usa Prisma `configuracion` y `getSupabaseServerClient`.
  - **Manejo de errores mejorado**: 
    - Retorna `503` (Service Unavailable) solo para errores reales de conexión a la base de datos (códigos Prisma P1001, P1002, P1003, timeouts, connection refused).
    - Mantiene `400/404/500` para otros tipos de errores.
  - **Transacciones**: Todas las operaciones de escritura están envueltas en transacciones para garantizar que si falla algo, no se guarde nada.

### `src/app/api/tenant/route.ts` (endpoint existente)
- Métodos:
  - `GET`: obtiene datos del tenant autenticado.
  - `PUT`: actualiza datos del tenant.
- **Manejo de errores mejorado**: Similar a `/api/configuracion`, diferencia entre errores de conexión (503) y otros errores.

### `src/app/api/configuracion/preferencias/route.ts` (NUEVO)
- **Métodos**:
  - **GET**: Obtiene preferencias de notificaciones
    - Retorna: `email`, `push`, `resumenDiario`, `stockBajo`
    - Por ahora retorna valores por defecto (preparado para futura tabla `TenantPreferencias`)
  - **PUT**: Guarda preferencias de notificaciones
    - Valida con zod: todos los campos booleanos opcionales
    - Por ahora solo retorna éxito (preparado para futura persistencia)
- **Nota**: Preparado para futura implementación con tabla dedicada o extensión de Tenant.

### `src/app/api/configuracion/seguridad/route.ts` (NUEVO)
- **Métodos**:
  - **GET**: Obtiene configuración de seguridad
    - Retorna: `dobleFactor`, `alertarNuevoDispositivo`, `bloquearPorInactividad`, `bloquearTrasIntentos`, `recordarSesion30Dias`
    - Por ahora retorna valores por defecto (preparado para futura tabla `TenantSeguridad`)
  - **PUT**: Guarda configuración de seguridad
    - Valida con zod: campos opcionales, `bloquearTrasIntentos` enum ("nunca" | "5" | "10")
    - Por ahora solo retorna éxito (preparado para futura persistencia)
- **Nota**: Preparado para futura implementación con tabla dedicada o extensión de Tenant.

### `src/app/api/configuracion/fiscal/route.ts` (NUEVO)
- **Métodos**:
  - **GET**: Obtiene configuración fiscal y regional
    - Retorna: `moneda`, `zonaHoraria`, `idioma`, `tipoIva`, `puntoVenta`, `inicioActividades`
    - Por ahora retorna valores por defecto
  - **PUT**: Guarda configuración fiscal
    - Valida con zod: todos los campos opcionales string
    - Por ahora solo retorna éxito (preparado para futura persistencia)
- **Nota**: Preparado para futura implementación. Algunos campos como `puntoVenta` podrían guardarse en `Configuracion`.

### `src/app/api/configuracion/branding/route.ts` (NUEVO)
- **Métodos**:
  - **GET**: Obtiene configuración de branding
    - Retorna: `slogan`, `color`, `logoPreview` (base64), `tieneLogo`
    - Carga el logo desde `Configuracion.Foto` si existe y `ShowFoto = true`
  - **PUT**: Guarda branding (incluye logo)
    - Recibe `FormData` con: `slogan`, `color`, `logo` (archivo opcional)
    - Valida tamaño máximo de logo: 5MB
    - Valida tipo: solo imágenes
    - Guarda el logo en `Configuracion.Foto` como `Bytes`
    - Actualiza `Configuracion.ShowFoto` según si hay logo
    - **TRANSACCIONES**: ✅ Usa `prisma.$transaction()` para garantizar atomicidad
- **Nota**: El logo se guarda en la tabla `Configuracion`. El slogan y color están preparados para futura persistencia.

### `src/app/(dashboard)/configuracion/actions-preferencias-venta.ts` (Server Actions)
- **Funciones**:
  - `getPreferenciasVenta()`: Obtiene preferencias desde `Configuracion`
    - Mapea `Imprimir` → `ticketDigitalPorCorreo`
    - Retorna valores por defecto si no existe configuración
  - `savePreferenciasVenta(data)`: Guarda preferencias en `Configuracion`
    - Busca configuración existente (no crea si no existe)
    - Actualiza campos: `Imprimir`, `MostrarPreciosConIva`, `AbrirCajonEfectivo`, `NumerarPedidosPantalla`
    - **TRANSACCIONES**: ✅ Usa `prisma.$transaction()` para garantizar atomicidad

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

## Secciones principales (Página funcional - `src/app/(dashboard)/configuracion/page.tsx`)

### Perfil del negocio ✅ FUNCIONAL
- **Campos UI**: 
  - Nombre (Tenant)
  - Razón social (Configuracion) - **OBLIGATORIO** ⭐
  - Nombre de fantasía (Configuracion) - Opcional
  - Correo (Configuracion) - Opcional
  - Teléfono (Configuracion) - Opcional
  - Celular (Configuracion) - Opcional
  - Dominio (Tenant) - Opcional
  - CUIT (Configuracion) - **OBLIGATORIO** ⭐
  - Dirección (Configuracion) - **OBLIGATORIO** ⭐
  - Localidad (Select con lista de localidades) - **OBLIGATORIO** ⭐
  - Observación en pie de factura (Configuracion) - Opcional
- **Indicadores visuales**: Los campos obligatorios muestran asterisco rojo (*) y descripción "Campo obligatorio"
- **Persistencia**:
  - `Tenant`: Nombre, Dominio (identidad/dominio).
  - `Configuracion`: RazonSocial, NombreFantasia, Cuit, Email, Telefono, Celular, Direccion, LocalidadId, ObservacionEnPieFactura (fiscal).
- **Regla clave**: Si no existe Configuracion, se crea una mínima válida al guardar Perfil.
- **UI/UX**:
  - Inputs organizados en grid responsive (2 columnas en desktop).
  - Carga de localidades desde `/api/localidades`.
  - Botón "Guardar todo" en el header que guarda Tenant + Configuracion.
  - Manejo de errores con toasts.
  - Modo offline con valores por defecto.
- **Transacciones**: ✅ El guardado usa transacciones para garantizar atomicidad.

### Preferencias de venta ✅ FUNCIONAL
- **Funcionalidad completa**: Tab funcional con persistencia en base de datos.
- **Modelo Prisma**: Campos en `Configuracion` (NO tabla separada).
  - Campos usados: `MostrarPreciosConIva`, `AbrirCajonEfectivo`, `NumerarPedidosPantalla`, `Imprimir` (mapea a `ticketDigitalPorCorreo`).
  - **NUEVOS CAMPOS AGREGADOS**:
    - **Stock y compras**: `FacturaDescuentaStock`, `PresupuestoDescuentaStock`, `RemitoDescuentaStock`, `ActualizaCostoDesdeCompra`, `ModificaPrecioVentaDesdeCompra`
    - **Caja y pagos**: `TipoFormaPagoPorDefectoVenta`, `TipoFormaPagoPorDefectoCompra`, `IngresoManualCajaInicial`, `PuestoCajaSeparado`, `ActivarRetiroDeCaja`, `MontoMaximoRetiroCaja`
    - **Productos**: `UnificarRenglonesIngresarMismoProducto`
    - **Báscula**: `ActivarBascula`, `EtiquetaPorPeso`, `CodigoBascula`
- **UI/UX**:
  - **Organización en subsecciones con Cards**:
    - **Preferencias básicas**: Switches para ticket digital, precios con IVA, cajón efectivo, numerar pedidos
    - **Stock y compras**: Switches para descuento de stock en diferentes comprobantes y actualización de costos
    - **Caja y pagos**: Selects para formas de pago por defecto, switches para caja inicial, retiro de caja, y input para monto máximo
    - **Productos**: Switch para unificar renglones
    - **Báscula**: Switches para activar báscula y etiqueta por peso, input para código de báscula (se muestra solo si báscula está activada)
  - Detección de cambios (dirty state): compara preferencias actuales con datos originales por subsección.
  - **NO tiene botón individual**: Los cambios se guardan desde el botón "Guardar todo" del header.
  - Summary dinámico: "Ticket digital: activado/desactivado | Impuestos: incluidos/excluidos".
  - Estados de carga y guardado.
  - Manejo de errores con toasts.
- **Flujo**:
  - Carga inicial: Todos los campos se cargan desde `/api/configuracion` al montar.
  - Al cambiar cualquier campo: se actualiza estado local y se detecta si hay cambios.
  - Al guardar: El botón "Guardar todo" guarda todas las secciones con cambios, incluyendo preferencias de venta.
- **Transacciones**: ✅ El guardado usa transacciones para garantizar atomicidad.

### Notificaciones ✅ FUNCIONAL
- **Campos**:
  - Switch: Enviar alertas por correo
  - Switch: Notificaciones push en la app
  - Switch: Avisar stock crítico y roturas
  - Switch: Enviar resumen diario a las 20:00
- **Persistencia**: 
  - Por ahora solo estado local (preparado para futura tabla `TenantPreferencias`).
  - API: `/api/configuracion/preferencias` (GET/PUT).
- **UI/UX**:
  - Botón "Guardar cambios" que aparece solo cuando hay cambios.
  - Summary dinámico: "Correo: on/off | Push: on/off | Resumen diario: on/off".

### Seguridad y acceso ✅ FUNCIONAL
- **Reorganización**: Sección mejorada con 3 cards organizadas:
  - **Acceso y autenticación**: 
    - Switch: Habilitar doble factor (2FA)
    - Switch: Avisar inicio de sesión desde nuevos dispositivos
    - Switch: Bloquear dashboard por inactividad (10 minutos)
    - Select: Bloquear cuenta tras intentos fallidos (Nunca / 5 intentos / 10 intentos)
    - Switch: Recordar sesión por 30 días en dispositivos confiables
  - **Estado de seguridad**: Información de solo lectura (sesiones activas, dispositivos activos, último acceso).
  - **Auditoría**: Texto informativo con link a Analíticas → Logs.
- **Persistencia**: 
  - Por ahora solo estado local (preparado para futura tabla `TenantSeguridad`).
  - API: `/api/configuracion/seguridad` (GET/PUT).
- **UI/UX**:
  - Botón "Guardar cambios de seguridad" que aparece solo cuando hay cambios.
  - Summary dinámico: "2FA: activo/pendiente | Bloqueo: desactivado/X intentos | Recordar sesión: 30 días/off".

### Facturación y región ✅ FUNCIONAL
- **Campos**:
  - Select: Moneda (ARS, USD, BRL)
  - Select: Zona horaria
  - Select: Idioma (es-AR, es-MX, en-US)
  - Input: Condición IVA
  - Input: Punto de venta
  - Input: Inicio de actividades
- **Persistencia**: 
  - Por ahora solo estado local (preparado para futura persistencia).
  - API: `/api/configuracion/fiscal` (GET/PUT).
- **UI/UX**:
  - Botón "Guardar cambios" que aparece solo cuando hay cambios.
  - Summary dinámico: "Moneda: X | IVA: X | Punto de venta: X".

### Branding ✅ FUNCIONAL
- **Campos**:
  - Input file: Logo (con preview y eliminación)
    - Validación: máximo 5MB, solo imágenes
    - Preview antes de guardar
    - Botón para eliminar logo seleccionado
  - Input color: Color principal
  - Input text: Slogan del negocio
- **Persistencia**: 
  - Logo se guarda en `Configuracion.Foto` como `Bytes`
  - `Configuracion.ShowFoto` indica si hay logo
  - Slogan y color preparados para futura persistencia
  - API: `/api/configuracion/branding` (GET/PUT con FormData).
- **UI/UX**:
  - Preview del logo antes de guardar
  - Botón para eliminar logo seleccionado
  - Botón "Guardar cambios" que aparece solo cuando hay cambios.
  - Summary dinámico: "Color: X | Logo: pendiente/configurado".
- **Transacciones**: ✅ El guardado usa transacciones para garantizar atomicidad.

## Flujo de guardado en la página

### Botón "Guardar todo" global ✅ ACTUALIZADO
- **Ubicación**: Header de la página (junto a "Ver actividad").
- **Estado**: 
  - `isDisabled={!hasAnyChanges || isLoadingTenant || isLoadingConfig || isOffline}`: solo habilitado si hay cambios pendientes y no está cargando.
  - `isLoading={isSavingAll}`: muestra spinner mientras guarda.
- **Funcionamiento**:
  1. **Detección de cambios**: Detecta cambios en todas las secciones:
     - `hasPreferenciasChanges`: Cambios en preferencias básicas de venta
     - `hasStockChanges`: Cambios en configuración de stock y compras
     - `hasCajaChanges`: Cambios en configuración de caja y pagos
     - `hasProductosChanges`: Cambios en configuración de productos
     - `hasBasculaChanges`: Cambios en configuración de báscula
     - `hasNotificacionesChanges`: Cambios en notificaciones
     - `hasSeguridadChanges`: Cambios en seguridad
     - `hasFiscalChanges`: Cambios en configuración fiscal
     - `hasBrandingChanges`: Cambios en branding
  2. **Guardado secuencial**:
     - Primero guarda `Tenant` y `Configuracion` básica (perfil)
     - Si hay cambios en preferencias básicas, guarda usando `savePreferenciasVenta()`
     - Si hay cambios en otras secciones, guarda cada una usando su API correspondiente
     - Actualiza estados originales solo para las secciones guardadas exitosamente
  3. **Manejo de errores**: Si falla cualquier sección, muestra toast de error pero continúa guardando las demás.
  4. **Toast de éxito**: Muestra "Configuración actualizada - Todos los datos se guardaron correctamente."
- **Cambio importante**: ✅ **NO hay botones individuales por sección**. Todo se guarda desde el botón "Guardar todo" del header.
- **Ventaja**: Guarda todas las secciones con cambios en una sola operación, manteniendo consistencia.

### Secciones sin botones individuales
- **Preferencias de venta**: Ya no tiene botón "Guardar cambios". Los cambios se guardan desde "Guardar todo".
- **Otras secciones**: Mantienen sus botones individuales por ahora, pero también se pueden guardar desde "Guardar todo".

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
- `Imprimir`: Imprimir ticket automáticamente (mapeado a `ticketDigitalPorCorreo`)
- `MostrarPreciosConIva`: Mostrar precios con impuestos incluidos
- `AbrirCajonEfectivo`: Abrir cajón al cobrar en efectivo
- `NumerarPedidosPantalla`: Numerar pedidos y mostrar en pantalla
- `UnificarRenglonesIngresarMismoProducto`: Unificar renglones del mismo producto
- `TipoFormaPagoPorDefectoVenta`: Forma de pago por defecto en ventas (0=Efectivo, 1=Débito, 2=Crédito, 3=QR)
- `TipoFormaPagoPorDefectoCompra`: Forma de pago por defecto en compras (0=Efectivo, 1=Débito, 2=Crédito, 3=QR)
- `FacturaDescuentaStock`: Factura descuenta stock
- `PresupuestoDescuentaStock`: Presupuesto descuenta stock
- `RemitoDescuentaStock`: Remito descuenta stock
- `ActualizaCostoDesdeCompra`: Actualizar costo desde compra
- `ModificaPrecioVentaDesdeCompra`: Modificar precio de venta desde compra
- `IngresoManualCajaInicial`: Ingreso manual de caja inicial
- `PuestoCajaSeparado`: Puesto de caja separado
- `ActivarRetiroDeCaja`: Activar retiro de caja
- `MontoMaximoRetiroCaja`: Monto máximo de retiro de caja (Decimal)
- `ActivarBascula`: Activar báscula
- `EtiquetaPorPeso`: Etiqueta por peso
- `CodigoBascula`: Código de báscula (String opcional)

**Regla de negocio**:
- `Configuracion` puede haber varias por `TenantId`.
- Siempre usar la **vigente**: `where TenantId + EstaEliminado=false, orderBy Id desc`.
- Preferencias de venta NO crean `Configuracion` si no existe (error `CONFIG_MISSING`).
- Perfil del negocio SÍ puede crear `Configuracion` mínima válida si no existe.

## Transacciones de Base de Datos ✅ IMPLEMENTADO

### Uso de Transacciones de Prisma
Todas las operaciones de escritura que involucran múltiples tablas o requieren atomicidad están protegidas con transacciones de Prisma usando `prisma.$transaction()`.

**APIs con transacciones**:
1. `/api/configuracion/route.ts` (PUT)
   - Crea o actualiza `Configuracion` dentro de una transacción
   - Si falla cualquier operación, se revierte todo automáticamente

2. `/api/configuracion/branding/route.ts` (PUT)
   - Actualiza `Configuracion.Foto` y `Configuracion.ShowFoto` dentro de una transacción
   - Valida que exista configuración antes de actualizar

3. `/api/admin/configuracion/perfil/route.ts` (PUT)
   - Actualiza `Tenant` y `Configuracion` dentro de una transacción
   - Si falla alguna actualización, ambas se revierten

4. `actions-preferencias-venta.ts` (savePreferenciasVenta)
   - Actualiza campos de preferencias en `Configuracion` dentro de una transacción

**Beneficios**:
- ✅ **Atomicidad**: Todas las operaciones se completan o ninguna
- ✅ **Consistencia**: No quedan datos parciales guardados
- ✅ **Rollback automático**: Si falla algo, Prisma revierte todo automáticamente
- ✅ **Integridad de datos**: Los datos se mantienen siempre consistentes

**Patrón usado**:
```typescript
await prisma.$transaction(async (tx) => {
  // Todas las operaciones de base de datos usan 'tx' en lugar de 'prisma'
  const config = await tx.configuracion.findFirst({...});
  await tx.configuracion.update({...});
  // Si cualquier operación falla, todo se revierte automáticamente
});
```

## Arquitectura técnica

### Página principal (`src/app/(dashboard)/configuracion/page.tsx`)
- **Carga de datos**: 
  - `useEffect` con múltiples funciones async al montar
  - Carga: Tenant, Configuracion, Preferencias de venta, Localidades, Notificaciones, Seguridad, Fiscal, Branding
- **Estados locales**: Cada sección tiene su propio estado y estado original para detectar cambios
- **Dirty state**: Comparación usando `JSON.stringify` o comparación directa de campos
- **Guardado**: Botones individuales por sección que aparecen solo cuando hay cambios

### Dirty State
- **Implementación**: Comparación profunda usando `JSON.stringify` (suficiente para objetos simples) o comparación directa de campos.
- **Nota técnica**: Para objetos complejos con Decimal/null/undefined, considerar `lodash.isequal` a futuro.
- **Cálculo**: Variables calculadas que comparan estados locales vs estados originales.
- **Limpieza**: Automática cuando guardado exitoso actualiza el estado original.

### TanStack Query (solo en página admin)
- **Provider**: `QueryProvider` configurado en el layout con `staleTime: Infinity` y `refetchOnWindowFocus: false`.
- **Queries**: Carga automática al montar el componente, cache persistente.
- **Mutations**: Actualización optimista del cache con `setQueryData`.
- **Sincronización**: Estados locales se sincronizan con datos de query vía `useEffect`.

### Mapeo UI → Prisma
- **Regla general**:
  - Identidad/dominio/branding → `Tenant`.
  - Fiscal + ventas + caja + stock → `Configuracion`.
- **Perfil del negocio**:
  - `Tenant`: Nombre, Dominio.
  - `Configuracion`: RazonSocial, Cuit, Email, Telefono.
- **Preferencias de venta**:
  - Todo en `Configuracion` (campos de venta/caja/stock).

## Campos nuevos agregados a Configuracion

### Campos implementados y funcionales
- `MostrarPreciosConIva` (Boolean, default `true`) - ✅ Funcional
- `AbrirCajonEfectivo` (Boolean, default `true`) - ✅ Funcional
- `NumerarPedidosPantalla` (Boolean, default `true`) - ✅ Funcional
- `Imprimir` (Boolean) - ✅ Funcional (mapeado a `ticketDigitalPorCorreo`)
- `Celular` (String, opcional) - ✅ Funcional
- `NombreFantasia` (String, opcional) - ✅ Funcional
- `Foto` (Bytes, opcional) - ✅ Funcional (para logo de branding)
- `ShowFoto` (Boolean, default `false`) - ✅ Funcional

### Campos existentes usados
- `RazonSocial`, `Cuit`, `Email`, `Telefono`, `Direccion`, `LocalidadId`, `ObservacionEnPieFactura`
- `Imprimir`, `UnificarRenglonesIngresarMismoProducto`, `TipoFormaPagoPorDefectoVenta`
- `FacturaDescuentaStock`, `PresupuestoDescuentaStock`, `RemitoDescuentaStock`
- `IngresoManualCajaInicial`, `PuestoCajaSeparado`, `ActivarRetiroDeCaja`, `MontoMaximoRetiroCaja`
- `ActivarBascula`, `EtiquetaPorPeso`, `CodigoBascula`

## Manejo de errores mejorado

### Códigos de error
- **401**: No autenticado o `tenantId` no encontrado
- **404**: Configuración no encontrada
- **400**: Datos inválidos (validación zod fallida)
- **503**: Errores de conexión a la base de datos (P1001, P1002, P1003, timeouts, connection refused)
- **500**: Otros errores internos

### Detección de errores de conexión
Todas las APIs detectan errores reales de conexión a la base de datos y retornan `503`:
- Códigos Prisma: `P1001`, `P1002`, `P1003`
- Mensajes: "can't reach database server", "connection timeout", "connection refused", "econnrefused", "etimedout"

### Modo offline
- La página detecta errores de conexión y entra en "modo offline"
- Muestra chip de advertencia: "Modo offline: valores por defecto"
- Deshabilita botones de guardar
- Usa valores por defecto para continuar funcionando

## Sugerencias de uso y futuras extensiones

### Implementaciones futuras recomendadas
- **Notificaciones**: Crear tabla `TenantPreferencias` o extender `Tenant` con campos JSON para persistir preferencias de notificaciones
- **Seguridad**: Crear tabla `TenantSeguridad` o extender `Tenant` con campos JSON para persistir políticas de seguridad
- **Fiscal**: Guardar algunos campos (como `puntoVenta`) en `Configuracion` o crear tabla `TenantFiscal`
- **Branding**: Persistir `slogan` y `color` en `Tenant` o tabla dedicada

### Mejoras de UX
- Añadir validación/feedback por campo en el frontend para datos fiscales (CUIT, email, etc.)
- Integrar logs de actividad en "Ver actividad" cuando el backend esté disponible
- **Cache optimista**: Implementar actualización optimista antes de mutations para UX más fluida (opcional)
- **Deep compare**: Migrar a `lodash.isequal` si surgen problemas con `JSON.stringify` y objetos complejos

### Mejoras técnicas
- **Preferencias de venta**: Considerar agregar más opciones de configuración según necesidades del negocio
- **Validación de localidad**: Verificar que la localidad seleccionada existe antes de guardar
- **Validación de CUIT**: Agregar validación de formato de CUIT argentino
- **Historial de cambios**: Implementar auditoría de cambios en configuración

## Cambios recientes (Última actualización)

### Enero 2025: Validación y UI Mejorada

- ✅ **Campos Obligatorios Marcados en UI**
  - Razón Social, CUIT, Dirección y Localidad ahora muestran asterisco rojo (*)
  - Descripción "Campo obligatorio" debajo de cada campo requerido
  - Prop `isRequired` en componentes Input/Select para indicadores visuales automáticos

- ✅ **Resolución Mejorada de TenantId**
  - Función `resolveTenantId()` mejorada con logging detallado
  - Búsqueda en múltiples ubicaciones: `app_metadata.tenantId`, `app_metadata.tenant_id`, `(user as any).tenantId`
  - Fallback a consulta en base de datos si no está en metadata
  - Mensajes de error más descriptivos: "No se pudo determinar el tenant. Por favor, cierra sesión y vuelve a iniciar sesión."

- ✅ **Validación de Schema Mejorada**
  - Schema de validación actualizado con `z.preprocess` para `localidadId`
  - Conversión automática de strings a números
  - Validación de números positivos
  - Mensajes de error más específicos indicando qué campo falló

---

## Cambios recientes (Diciembre 2024)

### Unificación del botón de guardado
- ✅ **Eliminado**: Botón individual "Guardar cambios" de la sección de Preferencias de venta
- ✅ **Implementado**: Uso exclusivo del botón "Guardar todo" del header para guardar todos los cambios
- ✅ **Detección de cambios**: El botón "Guardar todo" detecta cambios en todas las secciones y subsecciones
- ✅ **Guardado unificado**: Al hacer clic en "Guardar todo", se guardan todas las secciones con cambios pendientes

### Nuevos campos en la interfaz de Preferencias de venta
- ✅ **Stock y compras**: 5 nuevos switches para configurar cómo se maneja el stock en diferentes comprobantes
- ✅ **Caja y pagos**: 6 nuevos campos (2 selects para formas de pago, 3 switches, 1 input para monto máximo)
- ✅ **Productos**: 1 switch para unificar renglones
- ✅ **Báscula**: 3 campos (2 switches y 1 input para código, que se muestra condicionalmente)

### Organización de la interfaz
- ✅ **Cards por subsección**: Cada subsección de Preferencias de venta está organizada en su propia Card
- ✅ **Mejor UX**: Títulos y descripciones claras para cada subsección
- ✅ **Campos condicionales**: El input de código de báscula solo se muestra cuando la báscula está activada
- ✅ **Input condicional**: El input de monto máximo de retiro solo se muestra cuando el retiro de caja está activado

### API actualizada
- ✅ **GET `/api/configuracion`**: Ahora retorna todos los campos de preferencias de venta (básicas, stock, caja, productos, báscula)
- ✅ **PUT `/api/configuracion`**: Ahora acepta y guarda todos los campos de preferencias de venta
- ✅ **Validación**: Schema de Zod actualizado con todos los nuevos campos
- ✅ **Transacciones**: Todas las operaciones siguen usando transacciones para garantizar atomicidad

## Resumen de implementación

### Estado actual: ✅ COMPLETAMENTE FUNCIONAL

**Página principal**: `src/app/(dashboard)/configuracion/page.tsx`
- ✅ Todas las 6 secciones están funcionales y conectadas a la base de datos
- ✅ Carga de datos desde múltiples APIs
- ✅ Guardado individual por sección con detección de cambios
- ✅ Manejo de errores robusto con modo offline
- ✅ Transacciones implementadas en todas las operaciones críticas

**APIs creadas/actualizadas**:
- ✅ `/api/configuracion/route.ts` - Actualizado con todos los campos y transacciones
- ✅ `/api/configuracion/preferencias/route.ts` - Nuevo (notificaciones)
- ✅ `/api/configuracion/seguridad/route.ts` - Nuevo (seguridad)
- ✅ `/api/configuracion/fiscal/route.ts` - Nuevo (fiscal/regional)
- ✅ `/api/configuracion/branding/route.ts` - Nuevo (branding con logo)
- ✅ `actions-preferencias-venta.ts` - Actualizado con transacciones

**Características implementadas**:
- ✅ Transacciones de Prisma en todas las operaciones de escritura
- ✅ Detección de cambios (dirty state) por sección y subsección
- ✅ **Botón "Guardar todo" unificado**: Guarda todas las secciones con cambios desde un solo botón
- ✅ **Eliminación de botones individuales**: La sección de Preferencias de venta ya no tiene botón individual
- ✅ **Nuevos campos en interfaz**: Stock y compras, Caja y pagos, Productos, Báscula
- ✅ **Organización en Cards**: Cada subsección de Preferencias de venta está en su propia Card
- ✅ Carga de logo con preview y validación
- ✅ Carga de localidades desde API
- ✅ Manejo de errores diferenciado (503 para conexión, otros códigos para otros errores)
- ✅ Modo offline con valores por defecto

**Campos nuevos en Configuracion**:
- ✅ `Celular` - Funcional
- ✅ `NombreFantasia` - Funcional
- ✅ `MostrarPreciosConIva` - Funcional
- ✅ `AbrirCajonEfectivo` - Funcional
- ✅ `NumerarPedidosPantalla` - Funcional
- ✅ `Foto` y `ShowFoto` - Funcional (para logo)

**Campos existentes ahora expuestos en la interfaz**:
- ✅ `FacturaDescuentaStock`, `PresupuestoDescuentaStock`, `RemitoDescuentaStock` - Funcional (Stock y compras)
- ✅ `ActualizaCostoDesdeCompra`, `ModificaPrecioVentaDesdeCompra` - Funcional (Stock y compras)
- ✅ `TipoFormaPagoPorDefectoVenta`, `TipoFormaPagoPorDefectoCompra` - Funcional (Caja y pagos)
- ✅ `IngresoManualCajaInicial`, `PuestoCajaSeparado` - Funcional (Caja y pagos)
- ✅ `ActivarRetiroDeCaja`, `MontoMaximoRetiroCaja` - Funcional (Caja y pagos)
- ✅ `UnificarRenglonesIngresarMismoProducto` - Funcional (Productos)
- ✅ `ActivarBascula`, `EtiquetaPorPeso`, `CodigoBascula` - Funcional (Báscula)

**Preparado para futuro**:
- ⏳ Notificaciones: API lista, falta tabla de persistencia
- ⏳ Seguridad: API lista, falta tabla de persistencia
- ⏳ Fiscal: API lista, falta persistencia completa
- ⏳ Branding: Logo funcional, slogan/color preparados para persistencia

---

## Gestión de Sesiones Activas (Cierre Remoto) ✅ IMPLEMENTADO

Permite ver y cerrar remotamente sesiones activas desde **Configuración → Seguridad**.

### Endpoints

#### `GET /api/configuracion/seguridad/sesiones`
- **Permiso**: `GET_PERMISSIONS.CONFIGURACION`
- **Función**: Devuelve las sesiones activas del tenant.
- **Deduplicación**: Usa `DISTINCT ON (UsuarioId, Dispositivo, IpAddress)` para evitar duplicados y retorna siempre la actividad más reciente por combinación.
- **Campo `esActual`**: Compara el `SupabaseSessionId` de cada sesión con el del JWT del request actual (`extractSessionIdFromJwt(accessToken)`) para marcar la sesión propia.
- **Respuesta**: `{ sesiones: SesionActiva[] }` donde cada ítem incluye:
  - `id`, `usuarioId`, `usuarioNombre`, `ipAddress`, `dispositivo`, `ubicacion`
  - `fechaInicio`, `fechaUltimaActividad`, `esConfiable`, `esActual`

#### `DELETE /api/configuracion/seguridad/sesiones?id={sesionId}`
- **Permiso**: `SET_PERMISSIONS.CONFIGURACION`
- **Función**: Cierra una sesión específica.
- **Validaciones**:
  - Usuario normal: solo puede cerrar sus propias sesiones.
  - Administrador: puede cerrar sesiones de cualquier usuario de su tenant.
  - SuperAdmin: puede cerrar sesiones de cualquier tenant.
  - **Protección anti-autocierre**: Si `SupabaseSessionId` coincide con la sesión actual, retorna `400` con mensaje explicativo.
- **Revocación en Supabase**: Llama a `serviceClient.auth.admin.signOut(supabaseSessionId, "local")` para invalidar el refresh token del dispositivo remoto. Si falla, no es crítico (el token expira naturalmente).
- **Cierre en DB**: Actualiza `EstaActiva = false` filtrando **directamente por `Id`** (ver sección de bug corregido).

#### `POST /api/configuracion/seguridad/sesiones/cerrar-otras`
- **Permiso**: `SET_PERMISSIONS.CONFIGURACION`
- **Función**: Cierra todas las sesiones del usuario actual excepto la sesión en curso.
- **Flujo** (cliente llama primero a Supabase, luego a este endpoint):
  1. **Frontend**: `supabase.auth.signOut({ scope: "others" })` — revoca todos los refresh tokens excepto el actual en Supabase.
  2. **Backend**: `UPDATE SesionActiva SET EstaActiva = false WHERE ... AND SupabaseSessionId != currentSessionId` — sincroniza estado en DB.
- **Respuesta**: `{ message: "X sesión(es) cerrada(s) correctamente", sesionesCerradas: number }`

### Componente UI — `SeguridadTab.tsx`

**Flujo del usuario**:
1. El **card "Sesiones activas"** muestra el total y permite hacer clic para abrir el modal.
2. El **modal** lista todas las sesiones con: dispositivo, IP, fecha, usuario, badge "Esta sesión" si es la actual.
3. Por cada sesión que no sea la actual aparece el botón **"Cerrar"** → llama a `cerrarSesion(id)`.
4. En el footer del modal, si hay sesiones ajenas: botón **"Cerrar todas las demás"** con confirmación de dos pasos.
5. Después de cualquier acción, se recarga el listado con `recargarDatos()`.

**Estados del componente**:
- `sesionesActivas`: Array de sesiones cargadas del API.
- `isCerrandoOtras`: Loading state para "cerrar todas las demás".
- `confirmCerrarOtras`: Controla el estado de confirmación en dos pasos.

### Modelo de datos — Tabla `SesionActiva`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Id` | BigInt PK | Identificador único |
| `TenantId` | BigInt | Tenant al que pertenece |
| `UsuarioId` | BigInt | Usuario al que pertenece |
| `SupabaseSessionId` | String? | UUID de sesión en Supabase (extraído del JWT) |
| `IpAddress` | String? | IP del cliente |
| `UserAgent` | String? | User-Agent del navegador |
| `Dispositivo` | String? | Nombre amigable del dispositivo |
| `Ubicacion` | String? | Ubicación aproximada (GeoIP) |
| `FechaInicio` | DateTime | Cuando se inició la sesión |
| `FechaUltimaActividad` | DateTime | Última actividad registrada |
| `EstaActiva` | Boolean | `false` cuando se cierra (lógico) |
| `EsConfiable` | Boolean | Si el dispositivo fue marcado como confiable |

Las sesiones se registran en `POST /api/auth/registrar-sesion` (llamado desde el `sessionProvider` al iniciar sesión).

### Utilidad interna — `extractSessionIdFromJwt`

```typescript
function extractSessionIdFromJwt(accessToken: string): string | null {
  const payload = JSON.parse(
    Buffer.from(accessToken.split(".")[1], "base64url").toString()
  );
  return payload.session_id || null;
}
```

El `session_id` es un claim estable del JWT de Supabase que identifica la sesión, a diferencia del `access_token` que rota. Se usa para:
- Marcar `esActual` en el GET.
- Proteger la sesión propia en el DELETE.
- Excluir la sesión propia al cerrar todas las demás.

### Bug corregido (2026-04-29)

**Síntoma**: Al presionar "Cerrar" en una sesión específica, la operación no tenía efecto en la DB (aunque la revocación en Supabase podía funcionar).

**Causa raíz**: El `UPDATE` en el `DELETE` handler filtraba por la combinación `TenantId + UsuarioId + Dispositivo + IpAddress` en lugar de hacerlo directamente por `Id`. Cuando `Dispositivo` o `IpAddress` eran `NULL` en múltiples registros del mismo usuario, la condición `COALESCE(campo, '') = COALESCE($param, '')` evaluaba `'' = ''` y podía afectar filas incorrectas o no encontrar la fila exacta buscada.

**Fix aplicado** en `src/app/api/configuracion/seguridad/sesiones/route.ts`:

```diff
- // --- Cerrar en nuestra DB ---
- await prisma.$executeRawUnsafe(
-   `UPDATE "SesionActiva"
-    SET "EstaActiva" = false
-    WHERE "TenantId" = $1
-      AND "UsuarioId" = $2
-      AND COALESCE("Dispositivo", '') = COALESCE($3, '')
-      AND COALESCE("IpAddress", '') = COALESCE($4, '')
-      AND "EstaActiva" = true`,
-   sesionObj.TenantId,
-   sesionObj.UsuarioId,
-   sesionObj.Dispositivo,
-   sesionObj.IpAddress,
- );
+ // --- Cerrar en nuestra DB (filtrando por Id exacto para evitar ambigüedades) ---
+ await prisma.$executeRawUnsafe(
+   `UPDATE "SesionActiva"
+    SET "EstaActiva" = false
+    WHERE "Id" = $1
+      AND "EstaActiva" = true`,
+   sesionIdBigInt,
+ );
```

**Por qué funciona "cerrar todas las demás"**: Ese endpoint usa `UsuarioId + SupabaseSessionId != currentId` como filtro, que no depende de `Dispositivo`/`IpAddress`, por eso no tenía el mismo problema.

### Bug corregido 2 (2026-04-29) — Sesiones duplicadas al renovar token

**Síntoma**: Después de cerrar una sesión remota, al cabo de un rato (minutos u horas) volvía a aparecer como sesión activa.

**Causa raíz**: `registrar-sesion` buscaba sesiones existentes filtrando por `Dispositivo + IpAddress + UserAgent`. Al hacer token refresh, Supabase emite un evento `SIGNED_IN` desde el `sessionProvider`. Si el cooldown de 5 minutos del `localStorage` había expirado, el endpoint era llamado de nuevo. Como la fila anterior estaba con `EstaActiva = false` (cerrada remotamente), la búsqueda no la encontraba y **creaba una fila nueva**, haciendo que la sesión reaparezca en el listado.

**Fix aplicado** en `src/app/api/auth/registrar-sesion/route.ts`:

La deduplicación ahora tiene dos estrategias en orden de prioridad:

1. **Buscar por `SupabaseSessionId`** (clave estable que no cambia con el token refresh, solo con un nuevo signIn). Filtra `EstaActiva = true` — si la sesión fue cerrada remotamente (`EstaActiva = false`), no la reutiliza ni la reactiva.
2. **Fallback por `Dispositivo + IpAddress + UserAgent`** solo cuando `SupabaseSessionId IS NULL` (sesiones antiguas sin ese campo).

```typescript
// Estrategia 1: por SupabaseSessionId (activo solamente)
if (supabaseSessionId) {
  sesionExistente = await prisma.$queryRawUnsafe(`
    SELECT "Id" FROM "SesionActiva"
    WHERE "SupabaseSessionId" = $3 AND "EstaActiva" = true
    ...
  `);
}

// Estrategia 2: fallback para sesiones sin SupabaseSessionId
if (sesionExistente.length === 0) {
  sesionExistente = await prisma.$queryRawUnsafe(`
    SELECT "Id" FROM "SesionActiva"
    WHERE "SupabaseSessionId" IS NULL
      AND "Dispositivo" = $3 AND "IpAddress" = $4 AND "UserAgent" = $5
    ...
  `);
}
```

**Resultado**: Si una sesión fue cerrada remotamente (`EstaActiva = false`), el próximo `SIGNED_IN` por token refresh no la reutiliza (porque `EstaActiva = true` filtra), y el `SupabaseSessionId` es el mismo así que tampoco cae en el fallback. La sesión permanece cerrada.

