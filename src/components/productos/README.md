# Componente CRUD de Productos

Este componente proporciona una interfaz completa para gestionar productos en el sistema Punto X.

## Características

### ✅ Funcionalidades Implementadas

- **Listado de productos** con tabla responsive
- **Crear nuevo producto** con formulario completo
- **Editar producto** existente
- **Eliminar producto** (soft delete)
- **Validaciones** de campos obligatorios
- **Cálculo automático** de precio de venta basado en costo y ganancia
- **Notificaciones** con toast para feedback al usuario

### 📋 Campos del Formulario

El formulario incluye todos los campos del modelo `Articulo` de la base de datos:

#### Información Básica

- Código (número)
- Código de Barras (texto)
- Abreviatura (opcional)
- Descripción (obligatorio)
- Detalle (opcional)
- Ubicación (opcional)

#### Categorización

- Marca (select)
- Rubro (select)
- Unidad de Medida (select)
- IVA (select)
- Tipo de Venta (select)

#### Precios y Rentabilidad

- Precio Costo
- Porcentaje de Ganancia
- Precio de Venta (calculado automáticamente)

#### Gestión de Stock

- Stock Mínimo
- Días de Vencimiento
- Descuenta Stock (switch)
- Permite Stock Negativo (switch)

#### Límites de Venta

- Activar Límite de Venta (switch)
- Límite de Venta (condicional)
- Activar Horario de Venta (switch)
- Hora Desde / Hora Hasta (condicional)

#### Estado

- Producto Activo/Inactivo (switch)

## 🔌 Integración con API

Actualmente el componente tiene la lógica de UI completa pero necesita conectarse a la API. Los puntos de integración están marcados con comentarios:

### Endpoints necesarios:

```typescript
// GET /api/productos - Listar productos
// POST /api/productos - Crear producto
// PUT /api/productos/:id - Actualizar producto
// DELETE /api/productos/:id - Eliminar producto (soft delete)

// GET /api/marcas - Listar marcas
// GET /api/rubros - Listar rubros
// GET /api/unidades-medida - Listar unidades de medida
// GET /api/ivas - Listar tipos de IVA
```

### Ejemplo de integración:

```typescript
// En el componente ProductoCRUD.tsx

// Cargar productos al montar el componente
useEffect(() => {
  const fetchProductos = async () => {
    try {
      const response = await fetch("/api/productos");
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      toast.error("Error al cargar productos");
    }
  };

  fetchProductos();
}, []);

// Guardar producto
const handleGuardar = async () => {
  try {
    const url = modoEdicion
      ? `/api/productos/${productoSeleccionado.Id}`
      : "/api/productos";

    const method = modoEdicion ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error("Error al guardar");

    const data = await response.json();
    toast.success(modoEdicion ? "Producto actualizado" : "Producto creado");

    // Recargar lista
    fetchProductos();
    onClose();
  } catch (error) {
    toast.error("Error al guardar el producto");
  }
};
```

## 🎨 Componentes de Hero UI Utilizados

- `Table` - Tabla de datos
- `Modal` - Ventana modal para formularios
- `Input` - Campos de texto y número
- `Textarea` - Área de texto multilinea
- `Select` - Selector desplegable
- `Switch` - Interruptor on/off
- `Button` - Botones de acción
- `Chip` - Etiquetas de estado
- `Tooltip` - Información contextual

## 📝 Notas Importantes

1. **Datos de ejemplo**: Los arrays `marcas`, `rubros`, `unidadesMedida`, `ivas` y `tiposVenta` contienen datos de ejemplo. Estos deben ser reemplazados por llamadas a la API.

2. **Validaciones**: Actualmente solo valida campos obligatorios básicos. Se pueden agregar más validaciones según las reglas de negocio.

3. **Foto del producto**: El campo `Foto` está en el modelo pero no está implementado en el formulario. Se puede agregar un componente de carga de imágenes.

4. **PrecioId**: Este campo se está seteando en 1 por defecto. Según la lógica de negocio, puede necesitar ajustes.

5. **Formato de fechas**: Los campos de hora están usando input type="time". Para las fechas completas del modelo (HoraLimiteVentaDesde/Hasta) se necesitará conversión a DateTime.

## 🚀 Próximos Pasos

1. Crear los endpoints de API en `/app/api/productos/`
2. Implementar las llamadas a la API en el componente
3. Agregar paginación a la tabla
4. Implementar búsqueda y filtros
5. Agregar carga de imágenes para el campo Foto
6. Implementar validaciones adicionales
7. Agregar confirmación antes de eliminar
8. Implementar manejo de errores más robusto

## 💡 Uso

El componente ya está integrado en la página de productos:

```tsx
// src/app/(dashboard)/productos/page.tsx
import ProductoCRUD from "@/components/productos/ProductoCRUD";

export default function ProductosPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ProductoCRUD />
    </div>
  );
}
```

Navega a `/productos` en tu aplicación para ver el componente en acción.
