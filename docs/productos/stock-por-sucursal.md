# Implementación de Stock por Sucursal en CRUD de Productos

## Fecha: 2024-12-XX

## Resumen
Se implementó el manejo correcto de stock por sucursal en el CRUD de productos, permitiendo que cada sucursal tenga su propio inventario independiente mientras comparten el mismo producto.

## Contexto
- **Producto compartido**: Todas las sucursales comparten el mismo `Articulo` (descripción, precios, categorías, etc.)
- **Stock independiente**: Cada sucursal tiene su propio registro en `ArticuloStock` con su cantidad de stock

## Cambios Realizados

### 1. API Route - POST (Crear Producto)
**Archivo**: `src/app/api/productos/route.ts`

- **Antes**: Solo creaba el `Articulo` con el campo `Stock` legacy (deprecated)
- **Ahora**: 
  - Crea el `Articulo` (compartido)
  - Crea automáticamente el `ArticuloStock` para la sucursal activa con el stock inicial
  - Usa `upsert` para evitar duplicados

```typescript
// 4. Crear ArticuloStock para la sucursal activa (si existe)
const sucursalId = await getSucursalId();
if (sucursalId && validarProducto.Stock !== undefined) {
  await tx.articuloStock.upsert({
    where: {
      ArticuloId_SucursalId: {
        ArticuloId: nuevoArticulo.Id,
        SucursalId: BigInt(sucursalId),
      },
    },
    create: {
      ArticuloId: nuevoArticulo.Id,
      SucursalId: BigInt(sucursalId),
      TenantId: BigInt(tenantId),
      Stock: validarProducto.Stock,
      StockMinimo: validarProducto.StockMinimo || null,
      Ubicacion: validarProducto.Ubicacion || null,
    },
    update: {
      Stock: validarProducto.Stock,
      StockMinimo: validarProducto.StockMinimo || null,
      Ubicacion: validarProducto.Ubicacion || null,
    },
  });
}
```

### 2. API Route - PATCH (Actualizar Producto)
**Archivo**: `src/app/api/productos/route.ts`

- **Antes**: Solo actualizaba el campo `Stock` legacy en `Articulo`
- **Ahora**:
  - Actualiza el `Articulo` (compartido: descripción, precios, etc.)
  - Actualiza o crea el `ArticuloStock` solo de la sucursal activa
  - No afecta el stock de otras sucursales

```typescript
// Actualizar o crear ArticuloStock para la sucursal activa (si existe y se actualizó el stock)
if (sucursalId && validarProducto.Stock !== undefined) {
  await tx.articuloStock.upsert({
    where: {
      ArticuloId_SucursalId: {
        ArticuloId: articuloUpdate.Id,
        SucursalId: BigInt(sucursalId),
      },
    },
    create: {
      ArticuloId: articuloUpdate.Id,
      SucursalId: BigInt(sucursalId),
      TenantId: tenantIdBigInt,
      Stock: validarProducto.Stock,
      StockMinimo: validarProducto.StockMinimo || null,
      Ubicacion: validarProducto.Ubicacion || null,
    },
    update: {
      Stock: validarProducto.Stock,
      StockMinimo: validarProducto.StockMinimo || null,
      Ubicacion: validarProducto.Ubicacion || null,
    },
  });
}
```

### 3. API Route - GET (Listar Productos)
**Archivo**: `src/app/api/productos/route.ts`

- **Mejora**: Agregado `SucursalNombre` a la respuesta para indicar de qué sucursal es el stock mostrado

```typescript
// Obtener nombre de sucursal activa
const branchContext = await getActiveBranchContext();
const sucursalNombre = branchContext?.sucursalNombre || null;

// Mapear productos para incluir stock de la sucursal activa
const productosConStock = productos.map((producto) => {
  const stockSucursal = sucursalId && Array.isArray(producto.ArticuloStock) ? producto.ArticuloStock[0] : null;
  return {
    ...producto,
    Stock: stockSucursal ? Number(stockSucursal.Stock) : Number(producto.Stock || 0),
    StockMinimo: stockSucursal?.StockMinimo ? Number(stockSucursal.StockMinimo) : (producto.StockMinimo ? Number(producto.StockMinimo) : null),
    Ubicacion: stockSucursal?.Ubicacion || producto.Ubicacion,
    SucursalNombre: sucursalNombre, // Nombre de la sucursal del stock mostrado
    ArticuloStock: undefined,
  };
});
```

### 4. Componente ProductoCRUD
**Archivo**: `src/components/productos/ProductoCRUD.tsx`

- **Mejora**: Muestra el nombre de la sucursal debajo del stock en la tabla

```typescript
case "Stock":
  return (
    <div className="flex flex-col">
      <span className="font-medium text-gray-700">{item.Stock}</span>
      {item.SucursalNombre && (
        <span className="text-xs text-gray-500 mt-0.5">
          {item.SucursalNombre}
        </span>
      )}
    </div>
  );
```

### 5. Tipos y Adapters
**Archivos**: 
- `src/lib/validations/producto.schema.ts`
- `src/lib/adapters/producto.adapter.ts`

- Agregado `SucursalNombre` al tipo `Producto`
- Actualizado el adapter para incluir `SucursalNombre` en la transformación

### 6. Correcciones de TypeScript
**Archivo**: `src/components/empleados/UsuarioForm.tsx`

- Eliminadas props `value` no válidas en componentes `SelectItem` (HeroUI no las acepta)
- Corregidos 4 instancias de `SelectItem` con props inválidas

## Flujo de Funcionamiento

### Crear Producto
1. Usuario crea un producto desde la sucursal "Centro"
2. Se crea el `Articulo` (compartido)
3. Se crea automáticamente el `ArticuloStock` para "Centro" con el stock inicial
4. Otras sucursales pueden crear su stock después o al editar el producto

### Editar Producto
1. Usuario edita un producto desde la sucursal "Norte"
2. Se actualiza el `Articulo` (compartido: descripción, precios, etc.)
3. Se actualiza o crea el `ArticuloStock` solo de "Norte"
4. El stock de otras sucursales no se ve afectado

### Listar Productos
1. Usuario está en la sucursal "Sur"
2. La lista muestra todos los productos (compartidos)
3. El stock mostrado es el de "Sur"
4. Se muestra el nombre "Sur" debajo del stock en la tabla

### Eliminar Producto
1. Se elimina el `Articulo` (compartido)
2. Por cascade (`onDelete: Cascade`), se eliminan todos los `ArticuloStock` de todas las sucursales
3. Comportamiento esperado: si se elimina un producto, se elimina de todas las sucursales

## Schema de Base de Datos

```prisma
model ArticuloStock {
  Id            BigInt    @id @default(autoincrement())
  ArticuloId    BigInt
  SucursalId    BigInt
  TenantId      BigInt
  Stock         Decimal   @default(0) @db.Decimal(18, 2)
  StockMinimo   Decimal?  @db.Decimal(18, 2)
  Ubicacion     String?   @db.VarChar(200)
  FechaActualizacion DateTime @updatedAt
  Articulo      Articulo  @relation(fields: [ArticuloId], references: [Id], onDelete: Cascade)
  Sucursal      Sucursal  @relation(fields: [SucursalId], references: [Id], onDelete: Cascade)
  Tenant        Tenant    @relation(fields: [TenantId], references: [Id])

  @@unique([ArticuloId, SucursalId]) // Un artículo solo tiene un registro de stock por sucursal
}
```

## Beneficios

1. **Inventario Independiente**: Cada sucursal gestiona su stock sin afectar a otras
2. **Producto Compartido**: Un solo producto para todas las sucursales (evita duplicación)
3. **Flexibilidad**: Las sucursales pueden tener diferentes cantidades del mismo producto
4. **Trazabilidad**: Se puede ver qué sucursal tiene qué stock
5. **Escalabilidad**: Fácil agregar nuevas sucursales sin modificar la estructura

## Archivos Modificados

- `src/app/api/productos/route.ts` - Lógica de creación, actualización y listado
- `src/components/productos/ProductoCRUD.tsx` - Visualización del stock con nombre de sucursal
- `src/lib/validations/producto.schema.ts` - Tipo `Producto` con `SucursalNombre`
- `src/lib/adapters/producto.adapter.ts` - Adapter para incluir `SucursalNombre`
- `src/components/empleados/UsuarioForm.tsx` - Correcciones de TypeScript

## Notas

- El campo `Stock` en `Articulo` está marcado como DEPRECADO en el schema
- Se mantiene por compatibilidad durante la migración
- El stock real se maneja en `ArticuloStock`
- Todas las operaciones usan la sucursal activa del usuario (`getSucursalId()`)

