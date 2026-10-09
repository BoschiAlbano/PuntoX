# Planes SaaS — Plan de implementación y progreso

> Documento de trabajo del enforcement de planes definido en `PLANES-SAAS.md`.
> Se actualiza a medida que avanzamos: marcar cada paso al completarlo y
> registrar decisiones/hallazgos en la bitácora del final.

**Estado general: 🟡 En progreso** (pasos 1-7/8 completos + verificación automática del paso 8 — falta la prueba manual del usuario)

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

### ☑ 1. Helper central + migración de datos — **Completo**

- [x] Creado `src/lib/planes/features.ts`:
  - `PlanFeatures { maxSucursales; maxUsuarios; maxArticulos; incluyeAFIP }`
  - `parsePlanFeatures(caracteristicas)` — parseo seguro, defaults permisivos
    (`null`/`true`) ante JSON ausente/inválido/no-objeto.
  - `getPlanFeaturesDeTenant(tenantId)` — lee Plan del tenant y parsea.
  - `assertDentroDeLimite(tenantId, "sucursales" | "usuarios" | "articulos")` —
    cuenta registros activos (`EstaEliminado:false`) y tira
    `createError.forbidden` si `count >= max` (si `max` es `null`, no bloquea).
  - `planIncluyeAFIP(tenantId): Promise<boolean>`.
- [x] Migración de datos ejecutada (`scripts/migrar-planes-features.ts`,
  `npx tsx scripts/migrar-planes-features.ts`) — normalizó los 3 planes:
  - Ilimitado → `{"maxSucursales":null,"maxUsuarios":null,"maxArticulos":null,"incluyeAFIP":true}`
  - Básico → `{"maxSucursales":1,"maxUsuarios":3,"maxArticulos":100,"incluyeAFIP":false}`
  - Premium → `{"maxSucursales":3,"maxUsuarios":10,"maxArticulos":null,"incluyeAFIP":true}`
- [x] Tests unitarios en `src/lib/planes/features.test.ts` (9 casos: JSON
  válido, legacy `{"unlimited":true}`, null, vacío, inválido, no-objeto,
  valores numéricos inválidos, límite en 0, booleano inválido) — todos ✓.
- [x] `npx tsc --noEmit` limpio tras el helper y la migración.

### ☑ 2. Extender `/api/auth/me` + `useUserStore` — **Completo**

- [x] `src/app/api/auth/me/route.ts`: `Tenant` ahora se incluye con `Plan:true`
  y `_count` filtrado (`Sucursales`/`Usuarios`/`Articulos`, todos con
  `EstaEliminado:false`). Devuelve `planFeatures` (parseado con
  `parsePlanFeatures`) y `planUsage` (los 3 conteos) en el JSON de respuesta.
- [x] `src/store/useUserStore.ts`: nuevos campos tipados `planFeatures:
  PlanFeatures | null` y `planUsage: PlanUsage | null` (interfaces espejo
  locales, para no importar código de servidor/Prisma en el store del
  cliente); `refreshUserData()` los persiste desde la respuesta de `auth/me`.
- [x] Test `src/app/api/auth/me/route.test.ts` actualizado (mock de `Tenant`
  con `Plan`/`_count`) + aserciones nuevas de `planFeatures`/`planUsage` — 3/3 ✓.

### ☑ 3. Hook `usePlanFeatures()` + soporte en GenericCrud — **Completo**

- [x] `src/hooks/usePlanFeatures.ts`: lee `planFeatures`/`planUsage` del store
  y expone `puedeCrearSucursal`, `puedeCrearUsuario`, `puedeCrearArticulo`,
  `tieneAFIP`, y por dimensión `{usado, limite, alcanzado}` (sirve para
  mensajes tipo "3 de 3"). Es solo UX — el backend repregunta siempre.
- [x] `GenericTable`/`GenericCrud`: props `newButtonDisabled`/
  `newButtonDisabledMessage`. En desktop es un `<button disabled>` nativo con
  `title` (tooltip); en el menú mobile "Más opciones" el ítem se marca
  `isDisabled` y el label incluye el motivo.

### ☑ 4. Gating de sucursales (referencia del patrón) — **Completo**

- [x] Backend: `assertDentroDeLimite(tenantId, "sucursales")` insertado al
  inicio de `POST /api/sucursales`, justo tras `getAuthContext`.
- [x] UI: `src/app/(dashboard)/sucursales/page.tsx` — `newButtonDisabled`
  desde `usePlanFeatures()`, mensaje con el límite del plan;
  `refreshUserData()` agregado al `onSuccess` del form (create y edit).
- [x] Test `src/app/api/sucursales/route.test.ts`: mock de `prisma.tenant`
  agregado (antes faltaba, rompía todo POST con 500) + mock de
  `handleError` actualizado para reconocer `AppErrorClass` (antes solo
  `PermisoError`, igual que en `marcas/route.test.ts`) + nuevo test "retorna
  403 cuando se alcanzó el límite". Quedan 3 fallas *preexistentes* sin
  relación con planes (confirmadas contra baseline con `git stash`:
  mismatches de forma de respuesta ya rotos antes de este trabajo).

### ☑ 5. Gating de usuarios/empleados — **Completo**

- [x] Backend: `assertDentroDeLimite(tenantId, "usuarios")` en
  `POST /api/empleados` (tras `getAuthContext`) y en `POST /api/auth/register`
  (el agujero detectado — endpoint público que también crea `Usuario`; se
  agregó tras validar que el tenant existe y antes de crear el usuario en
  Supabase Auth, para no dejar auth users huérfanos si se rechaza por plan).
- [x] UI: `UsuariosCRUD.tsx` — `newButtonDisabled`/`newButtonDisabledMessage`
  en el botón "Nuevo empleado" vía `usePlanFeatures()`. `empleados/new/page.tsx`
  — guard de acceso directo por URL (si `!puedeCrearUsuario` muestra un aviso
  en vez del formulario) + `refreshUserData()` en el `onSuccess` de la mutation.
- [x] Tests: `empleados/route.test.ts` — mock de `prisma.tenant`/`usuario.count`
  agregado + `handleError` mock `AppErrorClass`-aware + nuevo test 403 por
  límite. `auth/register/route.test.ts` ya mockeaba `prisma.tenant` (lo usaba
  antes), no rompió nada. 12/12 tests ✓ en ambos archivos.

### ☑ 6. Gating de artículos — **Completo**

- [x] Backend: `assertDentroDeLimite(tenantId, "articulos")` en
  `POST /api/productos`, insertado antes de leer/parsear el body (falla lo
  más rápido posible).
- [x] **Combos resuelto**: un combo ES un `Articulo` (`EsCombo:true`, ver
  schema); `ArticuloComboItem` solo linkea sus componentes. Tanto
  `productos/new` como `productos/promociones-combo/new` postean al mismo
  `POST /api/productos` → un único chequeo cubre ambos, sin caso especial.
- [x] UI: `ProductoCRUD.tsx` y `ComboCRUD.tsx` — `newButtonDisabled` vía
  `usePlanFeatures()`. `productos/new/page.tsx` y
  `productos/promociones-combo/new/page.tsx` — guard de acceso directo por
  URL + `refreshUserData()` tras cada alta (relevante acá porque ambas
  páginas se quedan abiertas para cargar "el siguiente" sin navegar, así que
  el guard debe reaccionar en vivo cuando se alcanza el límite a mitad de
  sesión, no solo al entrar a la página).
- [x] Test `productos/route.test.ts`: mismo fix de mocks (`prisma.tenant`,
  `handleError` AppErrorClass-aware) + nuevo test 403 por límite. Confirmado
  con `git stash` que las 2 fallas restantes (GET y DELETE) son preexistentes.

### ☑ 7. Gating de AFIP (el más delicado) — **Completo**

- [x] `facturacion.service.ts`: `isFacturacionElectronicaHabilitada` ahora
  hace `Promise.all` de la config existente + `planIncluyeAFIP(tenantId)` y
  retorna `false` si el plan no lo incluye. El call site de venta inline
  (`comprobantes:503`) no necesitó ningún cambio — sigue siendo el mismo
  "skip elegante", ahora también cubierto por plan.
- [x] Reprocesar individual (`[id]/reprocesar/route.ts`) y bulk
  (`bulk-reprocesar/route.ts`): chequeo `planIncluyeAFIP` explícito ANTES de
  `isFacturacionElectronicaHabilitada`, con mensaje propio ("Tu plan no
  incluye Facturación Electrónica...") y `403`, distinto del `400` de
  "faltan certificados" para no confundir a un tenant cuyo plan simplemente
  no lo incluye.
- [x] ~~UI ventas: `ComprobanteSelector.tsx` — excluir Factura A/B/C sin
  AFIP~~ **Revertido**: el usuario aclaró que en Argentina es práctica
  habitual emitir Factura A/B/C sin declararlas electrónicamente a AFIP
  ("venta en negro" en papel/local). El plan NO debe restringir qué tipo de
  comprobante se puede crear — solo si se intenta autorizar electrónicamente
  ese comprobante. `ComprobanteSelector.tsx` quedó sin cambios (idéntico al
  original, confirmado con `git diff` vacío). Corregido también en
  `PLANES-SAAS.md` sección 3.
- [x] UI Caja Actual: botón por fila "Emitir FA"/"Reintentar FA"
  (`puedeEmitirFa`), acción masiva "Emitir Facturas Electrónicas"
  (`bulkActionsDropdown`) y filtro "Filtrar sin FE" (botón + ítem de menú)
  ahora todos condicionados también a `tieneAFIP`, sumado a los chequeos de
  configuración (`fiscal?.afipHabilitado`) que ya existían.
- [x] UI configuración: `ArcaSettings.tsx` (renderizado dentro de
  `FiscalTab.tsx`) — el switch "Habilitar Facturación" se deshabilita
  también cuando `!tieneAFIP`, con un banner de aviso arriba explicando que
  el plan no la incluye.
- [x] Tests nuevos: `facturacion.service.test.ts` (3 casos: plan+config OK,
  plan sin AFIP, config incompleta), y un test de gating por ruta en cada
  reprocesar (403 cuando `planIncluyeAFIP` da `false`) — no existían tests
  previos para estos archivos. `comprobantes/route.test.ts` (pre-existente)
  sigue en 6/6 sin cambios.

### 🟡 8. Verificación final — automático completo, falta la prueba manual

- [x] `npx tsc --noEmit` limpio (verificado después de cada paso, 1-7).
- [x] Tests dirigidos de todos los endpoints tocados (sucursales, empleados,
  auth/register, productos, reprocesar individual/bulk, auth/me,
  facturacion.service) corridos en una sola tanda: **48/53 ✓**. Los 5
  fallos son exactamente los mismos que en el baseline sin este trabajo
  (confirmado con `git stash` por archivo): 3 en `sucursales/route.test.ts`
  y 2 en `productos/route.test.ts`, todos por mismatches de forma de
  respuesta ya rotos antes de tocar nada de planes.
- [x] Build de producción (`npm run build`): exit 0, 134 rutas generadas
  sin errores.
- [ ] **Prueba manual (pendiente, requiere al usuario)**: con un tenant en
  Plan Básico → intentar crear una 2da sucursal, un 4to usuario, un artículo
  101 y emitir una FA → los 4 deben bloquearse con mensaje claro tanto en
  el botón (deshabilitado) como si se fuerza la acción. Con un tenant en
  Plan Ilimitado → nada debe bloquearse. Puntos concretos a mirar:
  - `/sucursales`, `/empleados`, `/productos` y
    `/productos/promociones-combo`: botón "Nuevo X" deshabilitado con
    tooltip/mensaje al llegar al límite.
  - Venta con cliente Responsable Inscripto en un tenant sin AFIP: el
    selector de comprobante SÍ debe seguir ofreciendo Factura A/B/C
    (corregido — ver bug de la bitácora); la venta debe crearse
    normalmente, sin intentar autorizar ante AFIP.
  - Caja Actual: sin AFIP no debe aparecer "Emitir FA" (ni por fila ni
    masivo) ni el filtro "Filtrar sin FE", aunque sí se vean los
    comprobantes Factura A/B/C creados (solo sin FE).
  - Configuración → Fiscal: el switch "Habilitar Facturación" debe verse
    deshabilitado con el aviso de upgrade cuando el plan no incluye AFIP.

> **Bug encontrado durante la prueba manual (no relacionado a planes):**
> el onboarding no dejaba avanzar del paso "Facturación (AFIP)" porque
> `FiscalTab.tsx` reportaba `hasChanges: true` siempre, para cualquier
> tenant/plan, sin que el usuario tocara nada. Causa real: `hasChanges`
> comparaba `JSON.stringify(regional)` contra `JSON.stringify(fiscalData)`,
> y el objeto local (`regional`) declara `condicionIvaId` antes que
> `tipoIva`, mientras que la interfaz `Fiscal`
> (`src/hooks/useConfiguracion.ts:74-88`) — y por lo tanto lo que devuelve
> la API — los declara en el orden inverso. Mismos valores, JSON distinto
> por orden de claves → siempre "sucio". Se verificaron los otros 8
> componentes que reportan `hasChanges` (`SeguridadTab`, `PerfilTab`,
> `PuntosVentaSettings`, `NotificacionesTab`, y los 4 de `ventas/`): todos
> comparan campo a campo o reemplazan el estado completo, ninguno tiene
> este problema. Se corrigió solo `FiscalTab.tsx`, cambiando la comparación
> a campo por campo (mismo patrón ya usado en el resto), excluyendo a
> propósito los campos de AFIP (`afipHabilitado`, etc.) porque esos los
> maneja `ArcaSettings.tsx` con su propio guardado inmediato, no el botón
> "Guardar" de esta pestaña. Confirmado con `git diff` que el bug es previo
> a este trabajo de planes (viene del punto 6 de tareas, "dirty tracking"
> del onboarding) — el plan Básico solo hizo más visible que había que
> completar ese paso.

> **Corrección de alcance (punto 4 de la prueba manual):** el usuario aclaró
> que en Argentina es habitual emitir Factura A/B/C sin declararlas
> electrónicamente a AFIP ("venta en negro" en papel/local) — el plan NO
> debe restringir qué **tipo de comprobante** se puede crear, solo si se
> intenta **autorizarlo electrónicamente**. Se revirtió por completo el
> cambio en `ComprobanteSelector.tsx` (vuelve a ofrecer Factura A/B/C sin
> importar el plan; `git diff` de ese archivo queda vacío). El resto del
> gating de AFIP (reprocesar, botón/acción masiva "Emitir FA", switch de
> `ArcaSettings`) se mantiene sin cambios porque esos sí son, específicamente,
> la acción de declarar a AFIP. Corregido también `PLANES-SAAS.md` sección 3.

---

## Bitácora de progreso

| Fecha | Paso | Notas |
|---|---|---|
| 2026-07-22 | — | Documento creado. Definición cerrada en `PLANES-SAAS.md`; plan verificado contra el código (hallazgos 1-7 arriba). |
| 2026-07-22 | 1 | `src/lib/planes/features.ts` creado con `parsePlanFeatures`/`getPlanFeaturesDeTenant`/`assertDentroDeLimite`/`planIncluyeAFIP`. Migración de datos corrida una vez (`scripts/migrar-planes-features.ts`) — los 3 planes en DB ya tienen el esquema nuevo. 9 tests unitarios del parser pasando, `tsc --noEmit` limpio. |
| 2026-07-22 | 2-3 | `auth/me` + `useUserStore` extendidos con `planFeatures`/`planUsage` (cero requests extra). Hook `usePlanFeatures()` creado. `GenericTable`/`GenericCrud` soportan `newButtonDisabled`/`newButtonDisabledMessage` (desktop: `disabled` nativo + `title`; mobile: item de menú marcado `isDisabled` con el motivo en el label). Test de `auth/me` actualizado, 3/3 ✓. |
| 2026-07-22 | 4 | Sucursales gateado end-to-end (patrón de referencia): `assertDentroDeLimite` en el POST + botón deshabilitado en la página + `refreshUserData()` tras alta. Mock de `prisma.tenant` agregado al test (faltaba, rompía todo el POST) y `handleError` mock hecho `AppErrorClass`-aware; nuevo test de 403 por límite pasando. Confirmado con `git stash` que las 3 fallas restantes en ese archivo son preexistentes, no introducidas acá. |
| 2026-07-22 | 5 | Usuarios/empleados gateado: `POST /api/empleados` + agujero cerrado en `POST /api/auth/register` (público, creaba `Usuario` sin ningún chequeo de plan). UI: botón deshabilitado en `UsuariosCRUD` + guard de acceso directo en `empleados/new/page.tsx` + `refreshUserData()`. Mismo fix de mocks (`prisma.tenant`, `handleError` AppErrorClass-aware) que en el paso 4, más 1 test nuevo de 403. 12/12 tests ✓. |
| 2026-07-22 | 6 | Artículos gateado en `POST /api/productos`. Confirmado que los combos son `Articulo` (`EsCombo:true`) — mismo endpoint, mismo límite, sin caso especial. UI en `ProductoCRUD`/`ComboCRUD` + guards en ambas páginas "new" (con atención especial a que se quedan abiertas para cargar varios seguidos, así que el guard debe reaccionar apenas se alcanza el límite). Mismo fix de mocks + 1 test nuevo de 403; confirmadas con `git stash` las 2 fallas restantes (GET, DELETE) como preexistentes. |
| 2026-07-22 | 7 | AFIP gateado de punta a punta: `isFacturacionElectronicaHabilitada` ahora factoriza el plan (protege gratis el alta inline de venta), reprocesar individual/bulk con mensaje y status (403) distintos de "faltan certificados", `ComprobanteSelector` excluye Factura A/B/C + auto-corrige el tipo seleccionado, Caja Actual oculta emisión (fila/masiva/filtro) sin AFIP, y `ArcaSettings` bloquea el switch con aviso de upgrade. Sin tests previos para `facturacion.service.ts` ni los reprocesar — se agregaron desde cero (3 + 1 + 1 tests). `CajaActual.test.tsx` falla igual que en baseline (QueryClientProvider faltante en el test, no relacionado). `FiscalTab.test.tsx` tarda/cuelga igual que ya estaba documentado como preexistente antes de este trabajo. |
| 2026-07-22 | 8 | Verificación automática completa: 48/53 tests dirigidos ✓ (5 fallas, todas preexistentes y confirmadas por archivo con `git stash`), `tsc --noEmit` limpio, build de producción exit 0 con las 134 rutas. Queda pendiente la prueba manual del usuario (checklist en el paso 8) antes de dar por cerrada toda la implementación. |
