# Búsqueda de productos en pestaña (Ventas) — Plan de implementación

> Estado: **🔴 No iniciado** — plan cerrado y confirmado, listo para
> implementar.

## 0. Decisiones confirmadas con el usuario

1. **Layout**: "Carrito (N)" y "Buscar productos" son dos pestañas que se
   **reemplazan entre sí** en el mismo espacio (no conviven lado a lado
   siempre visibles) — mismo patrón que ya existe hoy en mobile.
2. **Alcance**: se **unifica mobile y desktop** con el mismo sistema de
   pestañas para esta parte (Carrito/Buscar) — hoy esto solo existe como
   toggle en mobile, en desktop la búsqueda y el carrito están apilados sin
   pestañas.

## 1. Estado actual (confirmado leyendo el código)

- **`VentasScreen.tsx`**: no hay ningún `Tabs`/`Tab` de HeroUI. Lo único
  parecido es un toggle armado a mano (`MobileTab = "productos" | "pago"`,
  líneas 17, 20, 214-252) con dos `<button>` planos, que **solo se muestra
  en mobile** (`lg:hidden`) y alterna entre el panel izquierdo completo
  (búsqueda + carrito) y el panel derecho completo (cliente/comprobante/pago).
  No es un sistema de tabs de contenido reutilizable tal cual.
- El layout de escritorio (líneas 254-327) es un **split de dos columnas**:
  - Columna izquierda (`flex-1`): barra con `ProductSearch` (línea 266) +
    `PriceListSelector`, y debajo — apilado, sin pestañas — el `VentaGrid`
    (el carrito).
  - Columna derecha (ancho fijo): `ClienteSearch`, `ComprobanteSelector`,
    `VentaFooter`.
- **`ProductSearch.tsx`**: es solo un `Input` + botón de escanear código de
  barras — **no** tiene un dropdown/lista de resultados inline. Su lógica
  (`processSearchTerm`, líneas 47-237): si es código de barras o un código
  exacto con match único, agrega el producto directo (sin abrir nada). Si es
  ambiguo (texto libre, o el código no matchea nada único), abre
  `ProductSearchModal` (`setIsSearchModalOpen(true)`).
- **`ProductSearchModal.tsx`**: acá están los resultados hoy — un `Modal` de
  HeroUI con búsqueda debounced (300ms), tabla en desktop (`sm+`) y una
  lista de filas tipo tarjeta en mobile (`sm:hidden`) con descripción,
  códigos, precio (resuelto contra `useVentaStore().listaPrecios`) y stock —
  pero **sin fotos**. El estado de búsqueda/resultados vive internamente en
  este modal, no en `VentasScreen`.
- **`ProductoCard.tsx`** (usado hoy en Productos/Combos): ya tiene foto,
  chip activo/inactivo, marca/rubro, stock (con estilo de stock bajo) y
  precio — pero con botones de acción de administración (`AddStockButton`,
  `EditButton`, `ToggleStatusButton`) que no aplican acá, y toma
  `PreciosLista[0]` fijo en vez de resolver contra la lista de precios activa
  de la venta.

## 2. Diseño (cómo encajan las piezas)

- La barra de búsqueda (`ProductSearch.tsx`) **queda siempre visible**,
  arriba de las pestañas, igual que hoy — así los atajos rápidos (escanear,
  código exacto) siguen agregando directo sin necesidad de cambiar de
  pestaña.
- Se agrega un **par de pestañas nuevo, interno**, "Carrito (N)" / "Buscar
  productos", que vive **dentro** de lo que hoy es la columna izquierda en
  desktop y dentro del panel "Productos" del toggle mobile existente (sin
  tocar ese toggle externo, que sigue resolviendo Productos-vs-Pago en
  mobile como hoy).
- Cuando `ProductSearch` dispara una búsqueda ambigua, en vez de abrir el
  modal: guarda los resultados en un estado compartido y cambia la pestaña
  activa a "Buscar productos" automáticamente.
- El precio mostrado en cada tarjeta sigue respetando el `PriceListSelector`
  que ya existe en la barra de búsqueda — no se agrega un selector nuevo por
  tarjeta.

## 3. Plan de implementación

### Paso 1 — `VentaProductoCard.tsx` (nuevo)
Variante de `ProductoCard.tsx` para este contexto: foto, stock, precio
resuelto contra la lista de precios activa de la venta (mismo cálculo que
hoy hace `ProductSearchModal.tsx`), sin botones de admin, con un botón
"Agregar" que dispara `onAdd(producto)`.

### Paso 2 — `VentaProductosPanel.tsx` (nuevo)
Encapsula las dos pestañas (HeroUI `Tabs`/`Tab`):
- **Carrito (N)**: `VentaGrid` tal cual existe hoy, sin cambios.
- **Buscar productos**: grilla de `VentaProductoCard` con los resultados
  actuales; estado vacío ("buscá un producto arriba") cuando no hay query.

### Paso 3 — Levantar el estado de búsqueda
Hoy vive dentro de `ProductSearchModal.tsx`. Se sube a `VentasScreen.tsx`
(o un hook compartido) — query, resultados, loading — para que
`ProductSearch.tsx` (dispara) y `VentaProductosPanel.tsx` (muestra) lo
compartan.

### Paso 4 — Conectar `ProductSearch.tsx`
- Atajos rápidos (código de barras, código exacto): **sin cambios**, agregan
  directo.
- Caso ambiguo: en vez de `setIsSearchModalOpen(true)`, guarda resultados en
  el estado compartido (paso 3) y cambia la pestaña activa a "Buscar
  productos".

### Paso 5 — Integrar en `VentasScreen.tsx`
Reemplazar el stack actual (barra + `VentaGrid` sueltos) por: barra de
búsqueda (sin cambios) + `VentaProductosPanel` — reusado igual en mobile
(dentro del panel "Productos" del toggle existente) y en desktop (columna
izquierda).

### Paso 6 — Retirar `ProductSearchModal.tsx`
Una vez confirmado que todo funciona igual o mejor, eliminar el modal viejo
para no mantener dos caminos de búsqueda en paralelo.

### Paso 7 — Verificación
- Atajos rápidos (código exacto, escaneo) sin regresión.
- Buscar cambia de pestaña automáticamente y muestra tarjetas correctas.
- Agregar desde una tarjeta usa el mismo `handleSelectProduct` que hoy usa
  el modal (sin lógica duplicada).
- Typecheck + build. Tests si existen para estos componentes (a confirmar
  al implementar — no vi tests dedicados de `ProductSearch`/`VentaGrid` en
  la investigación previa).

## 4. Progreso

| Paso | Estado | Notas |
|---|---|---|
| 1. `VentaProductoCard.tsx` | ☐ | |
| 2. `VentaProductosPanel.tsx` (tabs) | ☐ | |
| 3. Levantar estado de búsqueda | ☐ | |
| 4. Conectar `ProductSearch.tsx` | ☐ | |
| 5. Integrar en `VentasScreen.tsx` | ☐ | |
| 6. Retirar `ProductSearchModal.tsx` | ☐ | |
| 7. Verificación | ☐ | |
