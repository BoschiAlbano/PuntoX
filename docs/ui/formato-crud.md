# Formato CRUD Unificado

**Fecha:** Febrero 2025

## Resumen

Se aplicó un formato consistente tipo "panel administrativo" a todos los formularios CRUD del sistema: Marca, Rubro, Unidad de Medida, Cliente, Producto y Usuario.

## Estilo del Modal

### Configuración general

- `placement="center"`, `backdrop="opaque"`, `scrollBehavior="inside"`
- `max-w-[820px]` (formularios complejos) o `max-w-[500px]` (formularios simples)
- `max-h-[90vh] overflow-hidden`

### ClassNames del Modal

```tsx
classNames={{
  backdrop: "bg-black/50 backdrop-blur-sm",
  base: "font-sans bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-[#e5e7eb] ... overflow-hidden",
  header: "border-t-[3px] border-t-[#67afc3] border-b border-[#e5e7eb] bg-[#67afc3]/5 rounded-t-2xl",
  body: "py-0 overflow-y-auto overflow-x-hidden",
  footer: "border-t border-[#e5e7eb] bg-[#f8fafc] rounded-b-2xl",
  closeButton: "hover:bg-[#67afc3]/10 hover:text-[#67afc3] rounded-full p-1.5 transition-colors text-[#6b7280]",
}}
```

### Header

- Título: `text-[28px] font-bold text-[#0f172a]`
- Subtexto (solo en creación): `text-sm text-[#6b7280] mt-1` — "Completa la información de..."

### Inputs

```tsx
const inputClassNames = {
  inputWrapper:
    "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
};
```

### Botones del footer

- **Cancelar:** `variant="light"`, `className="font-medium text-[#6b7280] hover:bg-[#f1f5f9] h-11 px-5 rounded-[10px]"`
- **Crear/Actualizar:** `className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"`

## Paleta

| Uso                    | Color     |
|------------------------|-----------|
| Acento principal       | `#67afc3` |
| Hover botón            | `#4a8d9e` |
| Completo (chip)        | `#90c472` |
| Pendiente (chip)       | `#f59e0b` |
| Borde / fondo footer   | `#e5e7eb` |
| Texto principal        | `#0f172a` |
| Texto secundario       | `#6b7280` |

## Formularios con Accordion

Producto, Cliente y Usuario usan `Accordion` + `AccordionItem` con:

- Secciones colapsables
- Íconos por sección (lucide-react)
- Chips **Completo** / **Pendiente** según validación en tiempo real
- Sección activa: borde izquierdo 3px `#67afc3`, fondo `#f8fafc`

## Secciones por formulario

| Formulario | Secciones |
|------------|-----------|
| Producto   | Información general, Categorización, Precios, Stock, Configuración |
| Cliente    | Datos personales, Ubicación, Cuenta Corriente |
| Usuario    | Información Personal, Ubicación, Información de Usuario |

## Formularios simples

Marca, Rubro y Unidad de Medida usan el mismo modal sin accordion: contenido lineal con inputs y switch de estado.

## Relacionado

- **[CRUD y tablas genéricas](./crud-tablas-genericas.md)** - Acciones masivas, paginación, filtros y optimizaciones de tablas

## Archivos afectados

- `src/components/marcas/MarcaForm.tsx`
- `src/components/rubros/RubroForm.tsx`
- `src/components/unidad-medida/UnidadMedidaForm.tsx`
- `src/components/clientes/ClienteForm.tsx`
- `src/components/empleados/UsuarioForm.tsx`
- `src/components/productos/ProductoForm.tsx`
