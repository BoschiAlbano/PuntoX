# Planes SaaS — Definición de funcionalidades y límites

> Estado: **definición** (punto 4 de `Z-Tareas.txt`: "Planes de tiendas, eliminar
> funcionalidades y separar los planes"). Este documento es el registro de qué
> debe bloquear cada plan. El plan de implementación (archivos a tocar, orden
> de trabajo) se arma en un paso posterior, una vez confirmado este documento.

## 1. Estado actual (relevado en el código/DB)

- Modelo `PlanSaaS` (`prisma/schema.prisma`): `Nombre`, `Descripcion`,
  `CostoMensual`, y `Caracteristicas` — hoy un **string libre**, sin schema,
  sin validación y **sin ningún enforcement** en el resto del sistema.
- `Tenant.PlanId` es obligatorio (relación 1 a muchos), pero ningún endpoint
  ni componente lee `Plan.Caracteristicas` para decidir qué permitir.
- Ya existen 3 planes cargados en producción, y `Caracteristicas` ya trae un
  JSON informal (nunca parseado por el código):

  | Plan | Costo | `Caracteristicas` (texto libre actual) | Tenants asignados |
  |---|---|---|---|
  | Plan Ilimitado | $0 | `{"unlimited":true}` | 2 (uso interno/admin) |
  | Plan Básico | $25.000 | `{"maxSucursales":1,"maxUsuarios":3,"incluyeAFIP":true}` | 1 |
  | Plan Premium | $45.000 | `{"maxSucursales":3,"maxUsuarios":10,"incluyeAFIP":true,"soportePrioritario":true}` | 0 |

- Ya existe un chequeo de **vencimiento de suscripción** (`FechaVencimiento`,
  cron `api/admin/check-subscriptions`) que solo genera notificaciones al
  superadmin — no bloquea nada por sí mismo, y es independiente de este tema
  (gating por *plan*, no por *vencimiento*).

Decisión tomada con el usuario: **se mantienen estos 3 planes como base**
(no se rediseñan tiers desde cero), y por ahora **solo se gatean estas cuatro
dimensiones** (sin agregar Analíticas, Cuentas Corrientes, Combos, exportación,
etc. a la lista de features bloqueables):

1. Cantidad máxima de **sucursales**.
2. Cantidad máxima de **usuarios/empleados** con acceso al sistema.
3. Si el plan **incluye Facturación Electrónica (AFIP/ARCA)**.
4. Cantidad máxima de **artículos/productos** cargados en el catálogo.

> Actualización: el **Plan Básico deja de incluir Facturación Electrónica**
> (`incluyeAFIP: false`) — solo el Premium y el Ilimitado la incluyen. Esto
> difiere del valor que hoy tiene cargado en la base (`incluyeAFIP: true`),
> así que al implementar hay que actualizar ese registro además de agregar
> el enforcement.

## 2. Esquema de features (reemplaza el texto libre)

`Caracteristicas` deja de ser texto arbitrario y pasa a tener una forma fija,
la misma para los 3 planes (un plan "ilimitado" se representa con `null`/sin
tope en los campos numéricos, no con una clave `unlimited` separada):

```ts
interface PlanFeatures {
  maxSucursales: number | null; // null = sin límite
  maxUsuarios: number | null;   // null = sin límite
  maxArticulos: number | null;  // null = sin límite
  incluyeAFIP: boolean;
}
```

Mapeo de los 3 planes a este esquema (valores objetivo, no lo que hoy está
cargado en la DB — ver nota de la sección 1):

| Plan | maxSucursales | maxUsuarios | maxArticulos | incluyeAFIP |
|---|---|---|---|---|
| Plan Ilimitado | `null` | `null` | `null` | `true` |
| Plan Básico | `1` | `3` | `100` | `false` |
| Plan Premium | `3` | `10` | `null` | `true` |

`soportePrioritario` se elimina del esquema: es un atributo comercial/de
soporte humano, no algo que el software deba habilitar o bloquear.

## 3. Qué cuenta para cada límite

- **Sucursales**: `Sucursal` con `TenantId` del tenant, `EstaEliminado = false`.
  (Independiente de `EstaActiva`: una sucursal desactivada sigue "ocupando"
  el cupo del plan hasta que se borra, para evitar que desactivar/reactivar
  se use para eludir el límite.)
- **Usuarios**: `Usuario` con `TenantId` del tenant, activos (no eliminados).
  A definir en implementación si el usuario ADMINISTRADOR original cuenta
  contra el cupo (recomendado: sí, cuenta como 1 más).
- **Artículos**: `Articulo` con `TenantId` del tenant, `EstaEliminado = false`
  (misma lógica que sucursales: un artículo desactivado/archivado pero no
  borrado definitivamente sigue ocupando el cupo).
- **AFIP**: cualquier intento de emitir Factura Electrónica (alta de
  comprobante con tipo AFIP, reproceso individual o en lote).

## 4. Comportamiento al superar un límite o no tener una feature

**Bloqueo duro** (decisión confirmada):

- **Backend**: el endpoint devuelve `403` con un mensaje explícito
  ("Tu plan permite hasta N sucursales. Actualizá tu plan para agregar más.")
  antes de ejecutar la operación. Nunca se debe poder eludir el límite
  llamando directo a la API.
- **Frontend**: el botón de alta ("Nueva sucursal", "Nuevo empleado", "Emitir
  Factura Electrónica") se deshabilita u oculta cuando ya no hay cupo o la
  feature no está incluida, mostrando un aviso/upsell en vez de dejar que el
  usuario llegue al error 403 sin contexto.

## 5. Puntos de aplicación (enforcement) relevados

Backend (crear el chequeo de plan antes de la escritura):

- `POST /api/sucursales` — `src/app/api/sucursales/route.ts`
- `POST /api/empleados` — `src/app/api/empleados/route.ts`
- `POST /api/productos` — `src/app/api/productos/route.ts`
- Emisión de FA: `src/lib/services/facturacion.service.ts`, y sus 3 entradas:
  `src/app/api/comprobantes/route.ts` (alta con FA inline),
  `src/app/api/facturacion/electronica/[id]/reprocesar/route.ts`,
  `src/app/api/facturacion/electronica/bulk-reprocesar/route.ts`

Frontend (reflejar el mismo límite antes de llamar a la API):

- `src/app/(dashboard)/sucursales/page.tsx` — botón "Nueva sucursal"
- `src/app/(dashboard)/empleados/new/page.tsx` y el listado de empleados —
  botón "Nuevo empleado"
- `src/components/productos/ProductoCRUD.tsx` y `productos/new/page.tsx` —
  botón "Nuevo Producto"
- `src/components/configuracion/FiscalTab.tsx` y el flujo de venta/Caja Actual
  donde se dispara la emisión de FA (`CajaActual.tsx`,
  `ComprobanteDetalleScreen.tsx` ya tocados en tareas anteriores)

Un helper central (a definir en el plan de implementación, ej.
`src/lib/planes/features.ts`) debe ser la única fuente de verdad para leer
`PlanFeatures` de un tenant y exponer algo como `puedeCrearSucursal(tenantId)`,
`puedeCrearUsuario(tenantId)`, `tienePlanAFIP(tenantId)` — para no duplicar la
lógica de parseo/límite en cada endpoint.

## 6. Fuera de alcance (por ahora)

- No se agregan nuevas features bloqueables (analíticas, cuentas corrientes,
  combos, exportación, básculas, etc.) — solo las 4 dimensiones ya definidas.
- No se rediseñan nombres/precios/cantidad de tiers.
- No se toca el mecanismo de vencimiento de suscripción (`FechaVencimiento`) —
  es un chequeo independiente y ya existente.

## 7. Próximo paso

Con este documento confirmado, el siguiente paso es un plan de implementación
concreto (orden de archivos, migración de `Caracteristicas` a JSON tipado,
helper central, endpoints y componentes a modificar, y cómo se edita
`Caracteristicas` desde `/admin/planes` con un formulario estructurado en vez
de un textarea libre).
