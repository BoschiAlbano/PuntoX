# Guía de Implementación - API de Productos

Esta guía te ayudará a conectar el componente CRUD de productos con la base de datos.

## 📋 Archivos Creados

### Componentes UI

- ✅ `src/components/productos/ProductoCRUD.tsx` - Componente principal CRUD
- ✅ `src/app/(dashboard)/productos/page.tsx` - Página de productos actualizada

### Ejemplos de API (para implementar)

- 📄 `src/app/api/productos/route.example.ts` - GET (listar) y POST (crear)
- 📄 `src/app/api/productos/[id]/route.example.ts` - GET, PUT, DELETE por ID
- 📄 `src/app/api/marcas/route.example.ts` - Listar marcas
- 📄 `src/app/api/rubros/route.example.ts` - Listar rubros
- 📄 `src/app/api/unidades-medida/route.example.ts` - Listar unidades de medida
- 📄 `src/app/api/ivas/route.example.ts` - Listar tipos de IVA

## 🚀 Pasos para Implementar la API

### Paso 1: Renombrar archivos de ejemplo

Los archivos `.example.ts` son plantillas. Para activarlos:

```bash
# Renombrar archivos de ejemplo (quitar .example)
mv src/app/api/productos/route.example.ts src/app/api/productos/route.ts
mv src/app/api/productos/[id]/route.example.ts src/app/api/productos/[id]/route.ts
mv src/app/api/marcas/route.example.ts src/app/api/marcas/route.ts
mv src/app/api/rubros/route.example.ts src/app/api/rubros/route.ts
mv src/app/api/unidades-medida/route.example.ts src/app/api/unidades-medida/route.ts
mv src/app/api/ivas/route.example.ts src/app/api/ivas/route.ts
```

### Paso 2: Actualizar el componente ProductoCRUD

Agrega las siguientes funciones al componente `ProductoCRUD.tsx`:

#### 2.1 Cargar datos iniciales

```typescript
// Agregar al inicio del componente, después de los estados
useEffect(() => {
  cargarProductos();
  cargarDatosIniciales();
}, []);

const cargarProductos = async () => {
  try {
    const response = await fetch("/api/productos");
    if (!response.ok) throw new Error("Error al cargar productos");
    const data = await response.json();
    setProductos(data);
  } catch (error) {
    toast.error("Error al cargar productos");
    console.error(error);
  }
};

const cargarDatosIniciales = async () => {
  try {
    // Cargar marcas, rubros, unidades, ivas en paralelo
    const [marcasRes, rubrosRes, unidadesRes, ivasRes] = await Promise.all([
      fetch("/api/marcas"),
      fetch("/api/rubros"),
      fetch("/api/unidades-medida"),
      fetch("/api/ivas"),
    ]);

    // Actualizar los arrays de datos
    // Nota: Necesitarás crear estados para estos datos
  } catch (error) {
    toast.error("Error al cargar datos iniciales");
    console.error(error);
  }
};
```

#### 2.2 Actualizar handleGuardar

Reemplaza el `handleGuardar` actual con:

```typescript
const handleGuardar = async () => {
  try {
    // Validaciones
    if (!formData.Descripcion || formData.Descripcion.trim() === "") {
      toast.error("La descripción es obligatoria");
      return;
    }

    if (!formData.CodigoBarra || formData.CodigoBarra.trim() === "") {
      toast.error("El código de barras es obligatorio");
      return;
    }

    const url =
      modoEdicion && productoSeleccionado
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al guardar");
    }

    toast.success(
      modoEdicion
        ? "Producto actualizado correctamente"
        : "Producto creado correctamente"
    );

    // Recargar lista
    await cargarProductos();
    onClose();
  } catch (error: any) {
    toast.error(error.message || "Error al guardar el producto");
    console.error(error);
  }
};
```

#### 2.3 Actualizar handleEliminar

Reemplaza el `handleEliminar` actual con:

```typescript
const handleEliminar = async (id: number) => {
  // Agregar confirmación
  if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
    return;
  }

  try {
    const response = await fetch(`/api/productos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al eliminar");
    }

    toast.success("Producto eliminado correctamente");

    // Recargar lista
    await cargarProductos();
  } catch (error: any) {
    toast.error(error.message || "Error al eliminar el producto");
    console.error(error);
  }
};
```

### Paso 3: Consideraciones Importantes

#### 3.1 Campo Foto

El campo `Foto` en la base de datos es de tipo `Bytes`. Actualmente no está implementado en el formulario. Para agregarlo:

1. Instalar una librería de carga de imágenes (ej: `react-dropzone`)
2. Convertir la imagen a Base64 o subirla a un servicio de almacenamiento
3. Guardar el buffer en la base de datos

#### 3.2 Campo PrecioId

El modelo `Articulo` tiene una relación con `Precio`. Actualmente se está usando un valor por defecto (1). Según tu lógica de negocio, podrías:

- Crear automáticamente un registro en `Precio` al crear un producto
- Usar una tabla de precios existente
- Modificar el esquema si no necesitas esta relación

Ejemplo de creación automática de precio:

```typescript
// En route.ts al crear producto
const nuevoPrecio = await prisma.precio.create({
  data: {
    ArticuloId: 0, // Se actualizará después
    PrecioCosto: body.PrecioCosto,
    PorcentajeGanancia: body.PorcentajeGanancia,
    PrecioPublico: body.PrecioCosto * (1 + body.PorcentajeGanancia / 100),
    PorcentajeGanancia2: 0,
    PrecioPublico2: 0,
    FechaActualizacion: new Date(),
    EstaEliminado: false,
  },
});

// Luego usar nuevoPrecio.Id en PrecioId
```

#### 3.3 Campos de Fecha/Hora

Los campos `HoraLimiteVentaDesde` y `HoraLimiteVentaHasta` son de tipo `DateTime` en la base de datos pero solo necesitas la hora. La conversión en el ejemplo usa:

```typescript
new Date(`1970-01-01T${body.HoraLimiteVentaDesde}:00`);
```

Esto guarda solo la hora con una fecha fija. Al mostrar, extrae solo la hora:

```typescript
const hora = new Date(producto.HoraLimiteVentaDesde).toTimeString().slice(0, 5);
```

### Paso 4: Mejoras Opcionales

#### 4.1 Paginación

Para grandes cantidades de productos, implementa paginación:

```typescript
// En route.ts
const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");
const skip = (page - 1) * limit;

const [productos, total] = await Promise.all([
  prisma.articulo.findMany({
    skip,
    take: limit,
    // ... resto de la query
  }),
  prisma.articulo.count({
    where: { EstaEliminado: false },
  }),
]);

return NextResponse.json({ productos, total, page, limit });
```

#### 4.2 Búsqueda y Filtros

Agrega búsqueda por descripción, código, etc:

```typescript
const search = request.nextUrl.searchParams.get("search");

const where = {
  EstaEliminado: false,
  ...(search && {
    OR: [
      { Descripcion: { contains: search } },
      { CodigoBarra: { contains: search } },
      { Codigo: parseInt(search) || undefined },
    ],
  }),
};
```

#### 4.3 Validaciones Adicionales

- Verificar que el código de barras sea único
- Validar rangos de precios
- Validar que las horas sean coherentes
- Verificar que los IDs de relaciones existan

#### 4.4 Manejo de Errores

Implementa un middleware de manejo de errores centralizado:

```typescript
// src/lib/api-error-handler.ts
export function handleApiError(error: any) {
  if (error.code === "P2002") {
    return {
      error: "Ya existe un producto con ese código de barras",
      status: 409,
    };
  }
  if (error.code === "P2025") {
    return { error: "Producto no encontrado", status: 404 };
  }
  return { error: "Error interno del servidor", status: 500 };
}
```

## 🧪 Pruebas

### Probar con Postman o cURL

```bash
# Listar productos
curl http://localhost:3000/api/productos

# Crear producto
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "MarcaId": 1,
    "RubroId": 1,
    "UnidadMedidaId": 1,
    "IvaId": 1,
    "PrecioId": 1,
    "Codigo": 1001,
    "CodigoBarra": "7891234567890",
    "Descripcion": "Producto de Prueba",
    "PrecioCosto": 100,
    "PorcentajeGanancia": 50,
    "ActivarLimiteVenta": false,
    "LimiteVenta": 0,
    "ActivarHoraVenta": false,
    "HoraLimiteVentaDesde": "00:00",
    "HoraLimiteVentaHasta": "23:59",
    "PermiteStockNegativo": false,
    "DescuentaStock": true,
    "StockMinimo": 10,
    "VencimientoDias": 0,
    "TipoVenta": 0
  }'

# Actualizar producto
curl -X PUT http://localhost:3000/api/productos/1 \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Eliminar producto
curl -X DELETE http://localhost:3000/api/productos/1
```

## 📝 Checklist de Implementación

- [ ] Renombrar archivos `.example.ts` a `.ts`
- [ ] Actualizar `ProductoCRUD.tsx` con las funciones de API
- [ ] Decidir estrategia para el campo `PrecioId`
- [ ] Implementar carga de imágenes (opcional)
- [ ] Agregar validaciones adicionales
- [ ] Implementar paginación (opcional)
- [ ] Agregar búsqueda y filtros (opcional)
- [ ] Probar todas las operaciones CRUD
- [ ] Verificar manejo de errores
- [ ] Revisar permisos y autenticación

## 🎯 Próximos Pasos

Una vez que la API esté funcionando:

1. **Gestión de Stock**: Crear componente para ver y ajustar stock por depósito
2. **Gestión de Precios**: Historial de cambios de precios
3. **Importación masiva**: Cargar productos desde Excel/CSV
4. **Códigos de barras**: Generar e imprimir códigos de barras
5. **Reportes**: Productos más vendidos, stock bajo, etc.

## 💡 Ayuda

Si tienes dudas sobre algún paso, revisa:

- Documentación de Prisma: https://www.prisma.io/docs
- Documentación de Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Hero UI Components: https://heroui.com/docs/components
