# 🏷️ Catálogo, Productos y Stock — PuntoX

Este directorio contiene la documentación sobre el modelo de catálogo de artículos, control de existencias por sucursal, optimización de imágenes y caché de productos por código de barras.

---

## Documentos del Módulo

| Documento | Descripción |
|---|---|
| 🏢 [stock-por-sucursal.md](stock-por-sucursal.md) | Arquitectura de stock compartido vs. cantidad independiente por sucursal (`ArticuloStock`), stock crítico y descuento al vender |
| 🖼️ [cache-imagenes-plan.md](cache-imagenes-plan.md) | Sistema de catálogo compartido de fotos por código de barras entre tenants para acelerar la carga de productos |
| ⚡ [optimizacion-imagenes.md](optimizacion-imagenes.md) | Procesamiento en cliente con Sharp/Canvas, compresión y conversión a WebP antes de subirse a Supabase Storage |

---

## Estructura del Catálogo

- **`Articulo`**: Entidad única global por tenant (Código, Código de barras, Descripción, Marca, Rubro, IVA, Unidad de Medida, Costo Unitario, Foto).
- **`ArticuloStock`**: Registro de existencias físicas (`CantidadStock`, `StockMinimo`) por combinación de `(ArticuloId, SucursalId)`.
- **`ListaPrecio` / `Precio`**: Múltiples listas de precios (Minorista, Mayorista, etc.) con porcentajes de ganancia configurables aplicados sobre el costo del artículo.
- **`Combo`**: Agrupaciones de artículos con precio promocional conjunto.

---

## APIs Relacionadas

- `GET /api/productos`: Listado con paginación, filtros por rubro, marca, bajo stock, búsqueda debounced.
- `POST /api/productos`: Alta con asignación inicial de stock y precios de lista.
- `PATCH /api/productos`: Edición de datos maestros o ajuste de stock.
- `DELETE /api/productos?Id={id}`: Soft delete del artículo.
- `GET/POST /api/rubros`, `/api/marcas`, `/api/unidades-medidas`, `/api/listas-precios`.
