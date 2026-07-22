# Planes SaaS — Plan de implementación y progreso

> Documento de trabajo del enforcement de planes definido en `PLANES-SAAS.md`.
> Se actualiza a medida que avanzamos: marcar cada paso al completarlo y
> registrar decisiones/hallazgos en la bitácora del final.

**Estado general: 🔴 No iniciado** (actualizar a 🟡 En progreso / 🟢 Completo)

---

## Arquitectura acordada (verificada contra el código)

- **Fuente de verdad backend**: cada endpoint consulta plan + conteo real al
  momento de la operación (nunca confía en datos cacheados del cliente).
- **Fuente para UI**: `/api/auth/me` ya devuelve `tenant` y alimenta
  `useUserStore` — se extiende con `Plan` + `_count` filtrado (Prisma 6.14
  soporta `_count` con `where`; el patch `BigInt.prototype.toJSON` de
  `src/DB/prisma.ts:12` cubre la serialización). Cero requests extra.
- **Bloqueo duro**: API responde `403` vía `createError.forbidden`
  (`src/lib/errors/types.ts:67`, ya existe y fluye por `handleError`);
  la UI deshabilita el botón con mensaje de upgrade en vez de ocultarlo.
- **Refresco en UI**: tras cada alta exitosa se llama `refreshUserData()`
  del store para actualizar los conteos.

### Hallazgos del repaso previo (ya verificados)

1. Los 3 POST de alta usan el mismo patrón `getAuthContext → tenantId`:
   `sucursales:123`, `empleados:393`, `productos:305`. Inserción de una línea.
2. **AFIP tiene embudo único**: las 3 vías de emisión pasan por
   `isFacturacionElectronicaHabilitada(tenantId)`
   (`src/lib/services/facturacion.service.ts:71`). En el alta de venta
   (`comprobantes:503`) un `false` NO rompe la venta (skip elegante).
   Los 2 reprocesar ya manejan el `false` con mensaje de error.
3. **UI compartida**: Sucursales, Empleados y Productos usan `GenericCrud` —
   el botón "Nueva X" es el mismo `newButtonText`/`onNewClick` de
   `GenericTable`. Un par de props nuevos cubre las 3 pantallas.
4. `ComprobanteSelector.tsx` ya filtra tipos por `allowedTipos` — ocultar
   Factura A/B/C para planes sin AFIP usa ese mecanismo existente.
5. **Agujero detectado**: `POST /api/auth/register` (público) también crea
   `Usuario` → debe llevar el mismo chequeo de `maxUsuarios`.
6. **Parser permisivo obligatorio**: el Plan Ilimitado hoy tiene
   `{"unlimited":true}` sin claves de límites. Ante JSON faltante/inválido,
   los defaults deben ser "sin límite" (nunca bloquear por error de parseo).
7. **Tenants ya excedidos**: solo se bloquean altas nuevas
   (`count >= max → 403`). Jamás se borra/desactiva lo existente.

---

## Pasos

### ☐ 1. Helper central + migración de datos

- [ ] Crear `src/lib/planes/features.ts`:
  - `interface PlanFeatures { maxSucursales; maxUsuarios; maxArticulos; incluyeAFIP }`
  - `parsePlanFeatures(caracteristicas: string | null): PlanFeatures` —
    parseo seguro, defaults permisivos (`null`/`true`).
  - `getPlanFeaturesDeTenant(tenantId)` — lee Plan del tenant y parsea.
  - `assertDentroDeLimite(tenantId, "sucursales" | "usuarios" | "articulos")` —
    consulta límite + conteo real y tira `createError.forbidden` con mensaje
    claro si `count >= max`.
  - `planIncluyeAFIP(tenantId): Promise<boolean>`.
- [ ] Migración de datos (script una vez, no cambia schema): normalizar
  `Caracteristicas` de los 3 planes al esquema de `PLANES-SAAS.md`:
  - Ilimitado → `{"maxSucursales":null,"maxUsuarios":null,"maxArticulos":null,"incluyeAFIP":true}`
  - Básico → `{"maxSucursales":1,"maxUsuarios":3,"maxArticulos":100,"incluyeAFIP":false}`
  - Premium → `{"maxSucursales":3,"maxUsuarios":10,"maxArticulos":null,"incluyeAFIP":true}`
- [ ] Tests unitarios de `parsePlanFeatures` (JSON válido, inválido, vacío,
  legacy `{"unlimited":true}`).

### ☐ 2. Extender `/api/auth/me` + `useUserStore`

- [ ] `src/app/api/auth/me/route.ts`: include de `Plan` + `_count` filtrado
  (`Sucursales`/`Usuarios`/`Articulos` con `EstaEliminado: false`).
  Devolver `planFeatures` (parseado) y `planUsage` (conteos).
- [ ] `src/store/useUserStore.ts`: guardar `planFeatures`/`planUsage` en el
  estado (tipados, no `any`).

### ☐ 3. Hook `usePlanFeatures()` + soporte en GenericCrud

- [ ] `src/hooks/usePlanFeatures.ts`: lee del store y expone
  `puedeCrearSucursal`, `puedeCrearUsuario`, `puedeCrearArticulo`,
  `tieneAFIP`, más los datos crudos (límite/uso) para mensajes tipo "3 de 3".
- [ ] `GenericCrud`/`GenericTable`: props `newButtonDisabled?: boolean` y
  `newButtonDisabledMessage?: string` (tooltip/toast al intentar), aplicadas
  al botón "Nueva X" en desktop y mobile.

### ☐ 4. Gating de sucursales (referencia del patrón)

- [ ] Backend: `assertDentroDeLimite(tenantId, "sucursales")` al inicio de
  `POST /api/sucursales`.
- [ ] UI: `src/app/(dashboard)/sucursales/page.tsx` — deshabilitar botón con
  mensaje cuando `!puedeCrearSucursal`; `refreshUserData()` tras alta OK.

### ☐ 5. Gating de usuarios/empleados

- [ ] Backend: `POST /api/empleados` + **`POST /api/auth/register`** (agujero
  detectado — mismo chequeo).
- [ ] UI: `src/components/empleados/UsuariosCRUD.tsx` (botón "Nuevo empleado",
  `onNewClick` → `/empleados/new`) y guard en `empleados/new/page.tsx` para
  acceso directo por URL; `refreshUserData()` tras alta OK.

### ☐ 6. Gating de artículos

- [ ] Backend: `assertDentroDeLimite(tenantId, "articulos")` en
  `POST /api/productos`.
- [ ] UI: `ProductoCRUD.tsx` (botón "Nuevo Producto") y guard en
  `productos/new/page.tsx`; `refreshUserData()` tras alta OK.
- [ ] Definir si los combos (`ArticuloCombo`) cuentan contra el límite
  (¿los combos crean un `Articulo`? verificar en implementación).

### ☐ 7. Gating de AFIP (el más delicado)

- [ ] `facturacion.service.ts`: `isFacturacionElectronicaHabilitada` devuelve
  `false` si el plan no incluye AFIP (la venta inline queda protegida sola,
  sin romper ventas).
- [ ] Reprocesar individual y bulk: chequeo previo con mensaje específico
  ("Tu plan no incluye Facturación Electrónica") distinto de "faltan
  certificados" → 403.
- [ ] UI ventas: `ComprobanteSelector.tsx` — excluir FACTURA_A/B/C de
  `allowedTipos` cuando `!tieneAFIP`.
- [ ] UI Caja Actual: ocultar botón por fila "Emitir FA", acción masiva de
  emisión y filtro de pendientes cuando `!tieneAFIP`.
- [ ] UI configuración: `FiscalTab.tsx` — bloquear activación de AFIP con
  aviso de upgrade cuando `!tieneAFIP`.

### ☐ 8. Verificación final

- [ ] `npx tsc --noEmit` limpio.
- [ ] Tests dirigidos de los endpoints tocados (sucursales, empleados,
  productos, reprocesar) — comparar contra baseline con `git stash` si hay
  dudas de fallos preexistentes.
- [ ] Build de producción OK.
- [ ] Prueba manual: tenant Básico → intentar 2da sucursal, 4to usuario,
  artículo 101, emitir FA → los 4 bloqueados con mensaje claro; tenant
  Ilimitado → nada bloqueado.

---

## Bitácora de progreso

| Fecha | Paso | Notas |
|---|---|---|
| 2026-07-22 | — | Documento creado. Definición cerrada en `PLANES-SAAS.md`; plan verificado contra el código (hallazgos 1-7 arriba). |
