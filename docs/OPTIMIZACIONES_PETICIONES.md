# Optimizaciones de Peticiones HTTP

Este documento describe las optimizaciones realizadas para reducir el número de peticiones HTTP innecesarias en la aplicación, mejorando el rendimiento y la experiencia del usuario.

## 📋 Tabla de Contenidos

- [Problema Identificado](#problema-identificado)
- [Optimizaciones Implementadas](#optimizaciones-implementadas)
- [Configuración de TanStack Query](#configuración-de-tanstack-query)
- [Guía de Mantenimiento](#guía-de-mantenimiento)
- [Mejores Prácticas](#mejores-prácticas)

---

## 🔍 Problema Identificado

### Peticiones "Fantasmas"

Se identificaron varios problemas que causaban peticiones HTTP innecesarias:

1. **Refetches automáticos innecesarios**: Las queries se refetchaban cada vez que el componente se montaba, incluso si los datos estaban frescos.
2. **Peticiones duplicadas**: Algunos datos se obtenían múltiples veces sin usar cache.
3. **Falta de configuración de cache**: Queries sin `staleTime` adecuado causaban refetches constantes.
4. **Refetches al cambiar de ventana**: Las queries se refetchaban automáticamente al volver a la pestaña del navegador.

### Impacto

- **Mayor carga en el servidor**: Peticiones innecesarias aumentan la carga.
- **Mayor consumo de ancho de banda**: Especialmente problemático en conexiones lentas.
- **Experiencia de usuario degradada**: Cargas innecesarias hacen que la app se sienta lenta.
- **Mayor costo**: En servicios cloud, más peticiones = mayor costo.

---

## ✅ Optimizaciones Implementadas

### 1. Optimización de Permisos en Empleados

**Antes:**
```typescript
// useEffect con fetch directo - se ejecutaba en cada cambio de user/status
useEffect(() => {
  const checkSuperAdmin = async () => {
    const permisosRes = await fetch("/api/permisos", {
      cache: "no-store",
      credentials: "include",
    });
    // ...
  };
  checkSuperAdmin();
}, [user, status]);
```

**Después:**
```typescript
// useQuery con cache inteligente
const permisosQuery = useQuery({
  queryKey: ["permisos"],
  queryFn: async ({ signal }) => {
    const response = await fetch("/api/permisos", {
      signal,
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Error al obtener permisos");
    return await response.json();
  },
  enabled: !!user && status === "authenticated",
  staleTime: 5 * 60 * 1000, // 5 minutos
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  retry: 1,
});
```

**Beneficios:**
- ✅ Cache de 5 minutos - los permisos no cambian frecuentemente
- ✅ No refetch si ya hay datos en cache
- ✅ No refetch al cambiar de ventana
- ✅ Solo 1 reintento en caso de error

---

### 2. Optimización de Queries en useEmpleados

**Configuración aplicada:**

```typescript
// Empleados - cambian moderadamente
const empleadosQuery = useQuery({
  queryKey: ["empleados", page, limit, filters.busqueda, filters.rol, filters.estado, tenantId],
  queryFn: ({ signal }) => fetchEmpleados({ signal, page, limit, filters }),
  enabled,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  staleTime: 30 * 1000, // 30 segundos
});

// Roles - cambian poco
const rolesQuery = useQuery({
  queryKey: ["roles", tenantId],
  queryFn: ({ signal }) => fetchRoles({ signal, tenantId }),
  enabled,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  staleTime: 5 * 60 * 1000, // 5 minutos
});

// Provincias - nunca cambian
const provinciasQuery = useQuery({
  queryKey: ["provincias"],
  queryFn: ({ signal }) => fetchProvincias({ signal }),
  enabled,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  staleTime: 30 * 60 * 1000, // 30 minutos
});

// Departamentos/Localidades - nunca cambian
const useDepartamentos = (provinciaId: string | null) => {
  return useQuery({
    queryKey: ["departamentos", provinciaId],
    queryFn: ({ signal }) => fetchDepartamentos({ signal, provinciaId: provinciaId! }),
    enabled: !!provinciaId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};
```

**Beneficios:**
- ✅ Cada tipo de dato tiene un `staleTime` apropiado según su frecuencia de cambio
- ✅ No refetches innecesarios cuando los datos están frescos
- ✅ Cache compartido entre componentes que usan los mismos datos

---

### 3. Optimización de Queries en useConfiguracion

**Configuración aplicada:**

```typescript
// Tenant y Configuración - cambian poco
const tenantQuery = useQuery({
  queryKey: ["tenant"],
  queryFn: ({ signal }) => fetchTenant({ signal }),
  enabled,
  retry: 2,
  retryDelay: 1000,
  refetchOnMount: false, // Cambiado de true a false
  refetchOnWindowFocus: false,
  staleTime: 5 * 60 * 1000, // Aumentado de 30 segundos a 5 minutos
});

// Preferencias, Notificaciones, Seguridad, Fiscal, Branding
// Todas con la misma configuración optimizada:
const preferenciasVentaQuery = useQuery({
  queryKey: ["preferencias-venta"],
  queryFn: ({ signal }) => fetchPreferenciasVenta({ signal }),
  enabled,
  retry: 2,
  retryDelay: 1000,
  refetchOnMount: false, // Cambiado de true a false
  refetchOnWindowFocus: false,
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

**Beneficios:**
- ✅ No refetch al montar el componente si los datos están frescos
- ✅ Cache de 5 minutos para datos de configuración
- ✅ Reducción significativa de peticiones al navegar entre secciones

---

### 4. Optimización de useGenericApi (actualizado Feb 2025)

**Configuración aplicada** (ver `src/lib/react-query/queryDefaults.ts`):

```typescript
// dynamicDataQueryOptions
const query = useQuery({
  queryKey: [queryKey, { search, page, limit, extraParams }],
  queryFn: ({ signal }) => fetchData({ signal }),
  ...dynamicDataQueryOptions,
  // Incluye: refetchOnMount: false, refetchOnWindowFocus: false,
  // staleTime: 60 * 1000 (1 min), placeholderData: keepPreviousData
});
```

**Afecta a:**
- ✅ Clientes (ClienteCRUD)
- ✅ Productos (ProductoCRUD)
- ✅ Marcas, Rubros, Unidades de Medida
- ✅ Cualquier componente que use GenericCrud

**Beneficios:**
- ✅ Optimización automática para todos los CRUDs genéricos
- ✅ Cache consistente en toda la aplicación

---

## ⚙️ Configuración de TanStack Query

### Parámetros Clave

#### `staleTime`
Tiempo en milisegundos que los datos se consideran "frescos". Durante este tiempo, no se harán refetches automáticos.

**Valores recomendados:**
- **Datos estáticos** (provincias, departamentos, localidades): `30 * 60 * 1000` (30 minutos)
- **Datos que cambian poco** (roles, permisos, configuración): `5 * 60 * 1000` (5 minutos)
- **Datos que cambian moderadamente** (empleados, productos, clientes, listados): `60 * 1000` (1 minuto, ver dynamicDataQueryOptions)
- **Datos que cambian frecuentemente** (auditorías, sesiones): `10 * 1000` (10 segundos)

#### `refetchOnMount`
Controla si la query se refetcha cuando el componente se monta.

- `false`: No refetch si los datos están frescos (recomendado)
- `true`: Siempre refetch al montar
- `"always"`: Siempre refetch, incluso si los datos están frescos

#### `refetchOnWindowFocus`
Controla si la query se refetcha cuando la ventana recupera el foco.

- `false`: No refetch al cambiar de ventana (recomendado para la mayoría de casos)
- `true`: Refetch cuando la ventana recupera el foco

#### `placeholderData: keepPreviousData`
Mantiene los datos de la página/filtro anterior visibles mientras se cargan los nuevos. Evita parpadeo y pantallas en blanco al cambiar de página. Configurado en `defaultQueryOptions` y aplicado a todos los listados vía `dynamicDataQueryOptions`.

#### `enabled`
Controla si la query se ejecuta.

- `true`: La query se ejecuta automáticamente
- `false`: La query no se ejecuta hasta que se habilite manualmente
- Condicional: `enabled: !!userId` - solo se ejecuta si userId existe

---

## 📊 Matriz de Configuración por Tipo de Dato

| Tipo de Dato | staleTime | refetchOnMount | refetchOnWindowFocus | Ejemplo |
|--------------|-----------|----------------|---------------------|---------|
| **Estáticos** | 30 min | false | false | Provincias, Departamentos, Localidades |
| **Poco frecuente** | 5 min | false | false | Roles, Permisos, Configuración, Tenant |
| **Moderado** | 60 seg (listados) | false | false | Empleados, Productos, Clientes (via dynamicDataQueryOptions) |
| **Frecuente** | 10 seg | false | false | Auditorías, Sesiones Activas |
| **Tiempo real** | 0 | true | true | Notificaciones en tiempo real (si se implementa) |

---

## 🔧 Guía de Mantenimiento

### Al Agregar una Nueva Query

1. **Identifica el tipo de dato:**
   - ¿Es estático? (provincias, departamentos) → `staleTime: 30 * 60 * 1000`
   - ¿Cambia poco? (configuración, roles) → `staleTime: 5 * 60 * 1000`
   - ¿Cambia moderadamente? (empleados, productos) → `staleTime: 30 * 1000`
   - ¿Cambia frecuentemente? (auditorías) → `staleTime: 10 * 1000`

2. **Configura la query:**
```typescript
const nuevaQuery = useQuery({
  queryKey: ["nueva-query", ...dependencias],
  queryFn: ({ signal }) => fetchNuevaData({ signal }),
  enabled: condiciones, // Solo si es necesario
  refetchOnMount: false, // Recomendado para la mayoría
  refetchOnWindowFocus: false, // Recomendado para la mayoría
  staleTime: /* valor apropiado según tipo de dato */,
  retry: 1, // Solo si es crítico, de lo contrario 1 es suficiente
});
```

3. **Verifica que no haya queries duplicadas:**
   - Revisa si ya existe una query con el mismo `queryKey`
   - Reutiliza queries existentes cuando sea posible

### Al Modificar una Query Existente

1. **No cambies `staleTime` sin justificación:**
   - Si aumentas `staleTime`, asegúrate de que los datos realmente no cambian frecuentemente
   - Si disminuyes `staleTime`, verifica que los datos necesitan actualizarse más a menudo

2. **Mantén consistencia:**
   - Si tienes múltiples queries del mismo tipo, usa la misma configuración
   - Documenta cambios significativos

### Invalidación Manual de Cache

Cuando necesites forzar una actualización después de una mutación:

```typescript
const queryClient = useQueryClient();

// Invalidar una query específica
queryClient.invalidateQueries({ queryKey: ["empleados"] });

// Invalidar múltiples queries relacionadas
queryClient.invalidateQueries({ queryKey: ["empleados"] });
queryClient.invalidateQueries({ queryKey: ["roles"] });
```

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

1. **Usa `staleTime` apropiado según el tipo de dato**
   ```typescript
   // ✅ Correcto: Datos estáticos con staleTime largo
   staleTime: 30 * 60 * 1000 // 30 minutos
   ```

2. **Desactiva refetches automáticos cuando no son necesarios**
   ```typescript
   // ✅ Correcto: No refetch si los datos están frescos
   refetchOnMount: false
   refetchOnWindowFocus: false
   ```

3. **Usa `enabled` para queries condicionales**
   ```typescript
   // ✅ Correcto: Solo ejecutar si hay un ID
   enabled: !!userId
   ```

4. **Reutiliza queries existentes**
   ```typescript
   // ✅ Correcto: Usar la misma queryKey para compartir cache
   queryKey: ["provincias"] // Compartido entre componentes
   ```

### ❌ DON'T (No Hacer)

1. **No uses `refetchOnMount: true` sin justificación**
   ```typescript
   // ❌ Incorrecto: Refetch innecesario
   refetchOnMount: true // Solo si los datos cambian constantemente
   ```

2. **No olvides configurar `staleTime`**
   ```typescript
   // ❌ Incorrecto: Sin staleTime, se refetchea constantemente
   const query = useQuery({
     queryKey: ["datos"],
     queryFn: fetchDatos,
     // Falta staleTime
   });
   ```

3. **No hagas fetch directo cuando puedes usar useQuery**
   ```typescript
   // ❌ Incorrecto: Fetch directo sin cache
   useEffect(() => {
     fetch("/api/datos").then(...);
   }, [dependencias]);
   
   // ✅ Correcto: useQuery con cache
   const { data } = useQuery({
     queryKey: ["datos"],
     queryFn: fetchDatos,
   });
   ```

4. **No uses el mismo queryKey para datos diferentes**
   ```typescript
   // ❌ Incorrecto: Mismo queryKey para datos diferentes
   queryKey: ["datos"] // Para empleados
   queryKey: ["datos"] // Para productos
   
   // ✅ Correcto: QueryKeys específicos
   queryKey: ["empleados"]
   queryKey: ["productos"]
   ```

---

## 📈 Métricas de Mejora

### Antes de las Optimizaciones

- **Peticiones al montar página de empleados**: ~6-8 peticiones
- **Peticiones al cambiar de ventana**: Todas las queries se refetcheaban
- **Peticiones duplicadas de permisos**: 1 por cada cambio de user/status
- **Cache efectivo**: Mínimo (solo cache del navegador)

### Después de las Optimizaciones

- **Peticiones al montar página de empleados**: ~3-4 peticiones (solo si los datos están obsoletos)
- **Peticiones al cambiar de ventana**: 0 (refetchOnWindowFocus: false)
- **Peticiones duplicadas de permisos**: 0 (cache de 5 minutos)
- **Cache efectivo**: Alto (TanStack Query cache con staleTime configurado)

### Reducción Estimada

- **~50-60% menos peticiones** en navegación normal
- **~80% menos peticiones** al cambiar de ventana
- **~100% eliminación** de peticiones duplicadas de permisos

---

## 🔍 Debugging

### Verificar Queries Activas

En desarrollo, puedes usar React Query Devtools:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// En tu componente raíz
<ReactQueryDevtools initialIsOpen={false} />
```

### Verificar Cache

```typescript
const queryClient = useQueryClient();

// Ver todas las queries en cache
console.log(queryClient.getQueryCache().getAll());

// Ver una query específica
const query = queryClient.getQueryData(["empleados"]);
console.log(query);
```

### Logs de Desarrollo

Las queries de TanStack Query incluyen información útil en desarrollo:
- Estado de la query (loading, error, success)
- Tiempo desde la última actualización
- Si los datos están "stale" o "fresh"

---

## 🚀 Próximas Optimizaciones Sugeridas

1. **Lazy Loading de Secciones**
   - Cargar queries de configuración solo cuando la sección está abierta
   - Implementar `enabled` condicional basado en `openSection`

2. **Prefetching Inteligente**
   - Prefetch datos que probablemente se necesitarán
   - Usar `queryClient.prefetchQuery()` en hover o antes de navegar

3. **Optimistic Updates**
   - Actualizar cache inmediatamente después de mutaciones
   - Reducir la necesidad de refetches

4. **Batch Requests**
   - Combinar múltiples peticiones en una sola cuando sea posible
   - Usar GraphQL o endpoints batch si se implementan

---

## 📝 Notas Adicionales

### Compatibilidad

- Estas optimizaciones son compatibles con todas las versiones actuales de TanStack Query
- No requieren cambios en el backend
- Son transparentes para el usuario final

### Rollback

Si necesitas revertir alguna optimización:

1. Cambiar `refetchOnMount: false` → `true`
2. Reducir `staleTime` a valores más bajos
3. Habilitar `refetchOnWindowFocus: true`

Sin embargo, esto no es recomendado ya que aumentará significativamente el número de peticiones.

---

**Última actualización**: Febrero 2025  
**Ver también**: [CRUD y tablas genéricas](./ui/crud-tablas-genericas.md) para queryKey, extraParams y keepPreviousData  
**Mantenido por**: Equipo de Desarrollo  
**Revisión recomendada**: Trimestral o cuando se agreguen nuevas queries

