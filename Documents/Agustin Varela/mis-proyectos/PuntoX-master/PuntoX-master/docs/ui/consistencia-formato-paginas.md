# Consistencia de Formato en Páginas del Sistema

## Fecha: 2024-12-XX

## Resumen
Se aplicó un formato consistente en todas las páginas principales del sistema para mantener una experiencia de usuario uniforme y profesional.

## Cambios Realizados

### 1. Página de Analíticas (`src/app/(dashboard)/analiticas/page.tsx`)

#### Formato de Contenedor
- Aplicado contenedor estándar: `max-w-7xl mx-auto sm:py-8 px-0 sm:px-6`
- Estructura consistente con el resto del sistema

#### Tabs
- Estilo actualizado para coincidir con empleados/productos
- Color de fondo: `#67afc3/90`
- Efectos hover y transiciones consistentes
- Iconos SVG en los títulos de las tabs

#### Headers de Sección
- Headers con títulos y descripciones claras
- Botones de refresh con estilo consistente
- Integración con `useQueryClient` para invalidar queries

#### Cards y Componentes
- Todos los cards con estilo: `rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm`
- Componentes de gráficas y KPIs mantienen el estilo consistente

#### Tablas
- Tablas con headers: `bg-[#67afc3]/90 text-white`
- Efectos hover consistentes
- Mismo estilo que las otras páginas del sistema

#### Botones
- Botón de filtro con estilo estándar
- Botones de refresh con animación de spin cuando están cargando
- Mismo estilo de hover y transiciones

#### Estados de Carga
- Skeletons para KPIs durante la carga
- Skeletons para gráficas con animación pulse
- Mejor feedback visual durante la carga

#### Inputs y Filtros
- Input de búsqueda personalizado con el mismo estilo que GenericTable
- Selects e inputs de fecha mantienen el estilo de HeroUI
- Mejor organización de los filtros

### 2. Página de Configuración (`src/app/(dashboard)/configuracion/page.tsx`)

#### Tabs
- Estilo actualizado para coincidir con analíticas/empleados/productos
- Mismo color de fondo (`#67afc3/90`) y efectos hover
- Mismos efectos de escala y transiciones

#### Cards (SectionPanel)
- Estilo actualizado: `rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm`
- Mejorado el resumen con fondo gris y borde
- Padding y espaciado consistentes

#### Botones
- Botón "Guardar todo" en el Header con estilo estándar
- Botones del modal de confirmación actualizados
- Botón "Actualizar" en seguridad con estilo estándar
- Botones "Cerrar sesión" con estilo de botón de peligro consistente
- Todos los botones tienen las mismas transiciones y efectos hover

#### Cards Internos
- Todos los cards internos actualizados con el estilo estándar
- Consistencia visual en toda la página

#### Header Simplificado
- Eliminado el panel grande con gradiente y efectos decorativos
- Header simple con título y descripción
- Botón "Guardar todo" con el estilo estándar del sistema
- Card con información del plan activo:
  - Muestra el nombre del plan (Business o "Sin plan" si no tiene)
  - Muestra la cantidad de locales/sucursales
  - Estilo consistente con el resto del sistema

## Estilo Estándar Aplicado

### Contenedor Principal
```tsx
<div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch h-full">
```

### Tabs
```tsx
classNames={{
  tabList: "bg-white backdrop-blur-sm rounded-lg shadow-none border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
  tab: "m-[5px] p-[20px] data-[selected=true]:bg-[#67afc3]/90 data-[selected=true]:text-white data-[selected=true]:shadow-none transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2 text-[16px] cursor-pointer transform hover:scale-105 active:scale-95",
  tabContent: "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
  cursor: "bg-[#67afc3]/90",
  panel: "h-full",
}}
```

### Cards
```tsx
className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm"
```

### Botones Principales
```tsx
className="px-4 h-[36px] rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-white cursor-pointer text-sm font-semibold"
```

### Tablas
```tsx
classNames={{
  wrapper: "bg-white rounded-lg border-none",
  th: "bg-[#67afc3]/90 text-white transition-colors duration-200 text-[13px] font-medium hover:!text-white hover:[&_*]:!text-white",
  base: "bg-transparent shadow-none rounded-lg border-none",
}}
```

## Beneficios

1. **Consistencia Visual**: Todas las páginas tienen el mismo aspecto y comportamiento
2. **Mejor UX**: Los usuarios pueden navegar entre páginas sin confusión
3. **Mantenibilidad**: Un solo estilo facilita el mantenimiento y actualizaciones futuras
4. **Profesionalismo**: La interfaz se ve más pulida y profesional

## Archivos Modificados

- `src/app/(dashboard)/analiticas/page.tsx`
- `src/components/analiticas/PanelAlertas.tsx`
- `src/app/(dashboard)/configuracion/page.tsx`

## Notas

- El header de configuración fue simplificado eliminando el panel con gradiente, pero manteniendo la información del plan activo
- Todos los botones ahora usan el mismo estilo estándar en lugar de componentes de HeroUI para mayor consistencia
- Las tablas tienen headers con el color `#67afc3/90` para mantener la identidad visual del sistema

