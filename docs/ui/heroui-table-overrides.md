# HeroUI Table — Cómo sobreescribir estilos internos

Este documento explica por qué los selectores CSS normales no funcionan para personalizar
la tabla de HeroUI y cuál es el patrón correcto para hacerlo.

---

## El problema: los selectores CSS fallan contra utilidades de Tailwind

HeroUI aplica sus estilos como **clases de utilidad de Tailwind**, no como CSS inline ni como
reglas en una hoja de estilos propia. Tailwind v4 emite esas utilidades dentro de `@layer utilities`.

El problema de usar selectores en `globals.css` para sobreescribir esas clases:

```css
/* ❌ ESTO NO FUNCIONA CONFIABLEMENTE */
td [data-slot="base"][data-selected="true"] [data-slot="wrapper"]::after {
  background-color: var(--table-checkbox-accent) !important;
}
```

**¿Por qué falla aunque use `!important`?**

En CSS, las reglas con `!important` dentro de `@layer` y fuera de `@layer` compiten de la
siguiente manera:

| Origen de la regla                  | `!important`     | Prioridad  |
| ----------------------------------- | ---------------- | ---------- |
| No-layered (globals.css sin @layer) | sin `!important` | Media      |
| `@layer utilities` (Tailwind)       | sin `!important` | Baja       |
| No-layered                          | con `!important` | **Máxima** |
| `@layer utilities`                  | con `!important` | Segunda    |

En teoría nuestra regla no-layered con `!important` debería ganar. Sin embargo, el selector
también tiene que **matchear** correctamente el elemento en el DOM. HeroUI genera HTML con
una estructura de data-attributes que puede no coincidir exactamente con lo que se escribe
en el selector, y pequeñas diferencias (espacio vs. sin espacio entre selectores, qué elemento
recibe `data-selected`, etc.) hacen que el selector no matchee.

### Estructura real del DOM del checkbox en la tabla

```html
<!-- TableRow -->
<tr data-selected="true" class="group ...">
  <!-- TableCell -->
  <td data-selected="true">
    <!-- Checkbox [data-slot="base"] es el label raíz, también actúa como "group" de Tailwind -->
    <label data-slot="base" data-selected="true" class="group ...">
      <!-- El wrapper es el cuadrado visual -->
      <span
        data-slot="wrapper"
        class="
        relative inline-flex ...
        before:content-[''] before:border-2 before:border-default   ← borde gris (estado normal)
        after:content-['']  after:absolute after:inset-0            ← relleno azul (estado marcado)
        after:scale-50 after:opacity-0                              ← oculto por defecto
        group-data-[selected=true]:after:scale-100                  ← visible cuando base tiene data-selected
        group-data-[selected=true]:after:opacity-100
        after:bg-primary                                            ← color azul via --heroui-primary
      "
      >
        <svg data-slot="icon" ... /> ← checkmark SVG
      </span>
    </label>
  </td>
</tr>
```

**Puntos clave:**

- `::before` = el borde del checkbox (visible siempre, color varía).
- `::after` = el relleno del checkbox (invisible hasta que está marcado, ahí se anima a escala 100 / opacidad 100).
- El color de `::after` viene de `after:bg-primary` → `background-color: hsl(var(--heroui-primary) / 1)`.
- `--heroui-primary` es `212 100% 47%` (azul) inyectado por el plugin HeroUI en `:root`.
- La visibilidad de `::after` la controlan clases `group-data-[selected=true]:after:*` donde el `group`
  es `[data-slot="base"]`.

---

## La solución correcta: `checkboxesProps` + clase CSS propia

En lugar de intentar que un selector externo llegue al pseudo-elemento, se agrega la clase
**directamente** en el `[data-slot="wrapper"]` desde React, usando la prop `checkboxesProps`
del componente `<Table>` de HeroUI.

### 1. Definir la clase en `globals.css`

```css
/* ── HeroUI Table: color del checkbox seleccionado ────────────────────── */
.table-cb-accent::after {
  background-color: var(--table-checkbox-accent) !important;
}
.table-cb-accent::before {
  border-color: var(--table-checkbox-accent) !important;
}
```

La variable se define en `:root` (también en `globals.css`):

```css
:root {
  --table-checkbox-accent: #05ff65; /* cambia aquí para otro color */
}
```

### 2. Pasar `checkboxesProps` a `<Table>` en `GenericTable.tsx`

```tsx
<Table
  // ...resto de props...
  checkboxesProps={{
    classNames: { wrapper: "table-cb-accent" },
  }}
>
```

HeroUI hace `cn(classNames?.wrapper, ...)` dentro del hook del Checkbox, por lo que `.table-cb-accent`
queda fusionado en la clase del `<span data-slot="wrapper">`. Como nuestra clase CSS ya está en el
elemento correcto, `::after` y `::before` matchean sin ambigüedad.

---

## Patrón general: cómo sobreescribir otros slots de HeroUI Table

HeroUI `<Table>` expone varias props para inyectar clases/estilos en sus sub-componentes internos:

| Prop                                 | Aplica a                                     |
| ------------------------------------ | -------------------------------------------- |
| `classNames.wrapper`                 | el div contenedor exterior                   |
| `classNames.base`                    | el root del componente                       |
| `classNames.table`                   | el `<table>` HTML                            |
| `classNames.thead`                   | el `<thead>`                                 |
| `classNames.tbody`                   | el `<tbody>`                                 |
| `classNames.tr`                      | cada `<tr>`                                  |
| `classNames.th`                      | cada `<th>`                                  |
| `classNames.td`                      | cada `<td>`                                  |
| `checkboxesProps.classNames.wrapper` | el cuadrado visual del checkbox de selección |
| `checkboxesProps.classNames.base`    | el label raíz del checkbox                   |
| `checkboxesProps.classNames.icon`    | el SVG del checkmark                         |
| `checkboxesProps.style`              | estilos inline en el label del checkbox      |

**Regla de oro:** si necesitas estilizar algo que está **dentro** de un sub-componente de HeroUI
(Checkbox, Spinner, Pagination…), usa las props `*Props` o `classNames` específicas de ese
sub-componente en lugar de selectores CSS externos.

---

## Variables CSS disponibles para la tabla (definidas en `globals.css`)

```css
:root {
  --crud-accent: #67afc3; /* color de cabecera de tabla (th) */
  --table-row-selected-bg: ...; /* fondo de fila seleccionada (tr) */
  --table-checkbox-accent: #05ff65; /* color del checkbox al marcar    */
}
```

Para cambiar el color del checkbox basta con editar `--table-checkbox-accent` en `:root`.
No se necesita tocar `GenericTable.tsx` ni la configuración de HeroUI.
