# Actualizaciones Frontend - Paginación

## ✅ Componentes Actualizados

### 1. Componente de Paginación Reutilizable
**Archivo:** `src/components/common/Pagination.tsx`

- Componente reutilizable para mostrar controles de paginación
- Muestra información de resultados (ej: "Mostrando 1 a 20 de 150")
- Botones anterior/siguiente
- Selector de items por página (10, 20, 50, 100)
- Información de página actual

### 2. ProductoCRUD (`src/components/productos/ProductoCRUD.tsx`)
**Cambios:**
- ✅ Actualizado para usar respuesta paginada del API
- ✅ Agregado input de búsqueda (descripción o código de barras)
- ✅ Agregado componente de paginación
- ✅ Estado de paginación (page, limit, search)
- ✅ Query actualizada para incluir parámetros de paginación
- ✅ Retrocompatibilidad con formato antiguo del API

**Características:**
- Búsqueda en tiempo real (se resetea a página 1)
- Selector de items por página
- Scroll automático al inicio al cambiar de página

### 3. Página de Clientes (`src/app/(dashboard)/clientes/page.tsx`)
**Cambios:**
- ✅ Actualizado para usar respuesta paginada del API
- ✅ Búsqueda ahora se hace en el servidor (no en el cliente)
- ✅ Agregado componente de paginación
- ✅ Estado de paginación (page, limit)
- ✅ Recarga automática después de crear/editar/eliminar

**Características:**
- Búsqueda en servidor (más eficiente)
- Paginación completa con controles
- Actualización automática de datos

### 4. Página de Empleados (`src/app/(dashboard)/empleados/page.tsx`)
**Cambios:**
- ✅ Actualizado para usar respuesta paginada del API
- ✅ Agregado componente de paginación
- ✅ Estado de paginación (page, limit)
- ✅ Recarga automática después de crear/editar/eliminar roles
- ✅ Filtros locales (rol, estado) se mantienen en cliente
- ✅ Búsqueda local (se puede mejorar para hacerla en servidor)

**Características:**
- Paginación completa con controles
- Filtros de rol y estado funcionan en cliente
- Actualización automática de datos

## 🎯 Cómo usar la paginación

### En componentes nuevos:

```typescript
import Pagination, { PaginationInfo } from "@/components/common/Pagination";

// Estado
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(20);
const [pagination, setPagination] = useState<PaginationInfo>({...});

// Fetch con parámetros
const params = new URLSearchParams({
  page: page.toString(),
  limit: limit.toString(),
});
if (search) params.append("q", search);

const response = await fetch(`/api/endpoint?${params}`);
const data = await response.json();

// Si viene formato paginado
if (data?.data && data?.pagination) {
  setItems(data.data);
  setPagination(data.pagination);
}

// Renderizar componente
<Pagination
  pagination={pagination}
  onPageChange={(newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}
  onLimitChange={(newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }}
  showLimitSelector={true}
/>
```

## 🔄 Retrocompatibilidad

Todos los endpoints mantienen retrocompatibilidad:
- Si el frontend no envía parámetros de paginación, retorna todos los resultados (formato antiguo)
- Si el frontend envía parámetros, retorna formato paginado
- Los componentes detectan automáticamente el formato y se adaptan

