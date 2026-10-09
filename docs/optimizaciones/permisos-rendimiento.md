# Optimizaciones de Permisos y Rendimiento - Enero 2026

## Resumen Ejecutivo

Este documento detalla las optimizaciones implementadas para mejorar el rendimiento de las peticiones HTTP, la gestión de permisos y la experiencia de usuario en todas las páginas del dashboard. Las mejoras incluyen:

- **Protección de permisos** en todas las páginas del sidebar
- **Optimización de peticiones HTTP** para evitar cancelaciones innecesarias
- **Corrección de errores de React Hooks** (reglas de hooks)
- **Fix de pantalla en blanco** durante la verificación de permisos
- **Correcciones de tipos TypeScript**

---

## 1. Protección de Permisos en Todas las Páginas

### Problema Identificado

Las páginas del dashboard no tenían una protección consistente de permisos, lo que permitía que el contenido se mostrara antes de verificar los permisos del usuario.

### Solución Implementada

Se aplicó protección de permisos con bloqueo de renderizado en todas las páginas del sidebar:

#### Páginas Modificadas

1. **`/ventas`** - `src/app/(dashboard)/ventas/page.tsx`
2. **`/caja`** - `src/app/(dashboard)/caja/page.tsx`
3. **`/productos`** - `src/app/(dashboard)/productos/page.tsx`
4. **`/clientes`** - `src/app/(dashboard)/clientes/page.tsx`
5. **`/empleados`** - `src/app/(dashboard)/empleados/page.tsx`
6. **`/analiticas`** - `src/app/(dashboard)/analiticas/page.tsx`
7. **`/configuracion`** - `src/app/(dashboard)/configuracion/page.tsx`
8. **`/test`** - `src/app/(dashboard)/test/page.tsx`

#### Patrón de Implementación

```typescript
export default function NombrePage() {
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission();
  
  // No renderizar contenido hasta que los permisos estén verificados
  if (isLoadingPermisos) {
    return <Loading text="Verificando permisos..." />;
  }

  // Si tieneAcceso es undefined, aún está cargando
  if (tieneAcceso === undefined) {
    return <Loading text="Verificando permisos..." />;
  }

  // Si no tiene acceso, no renderizar nada (usePagePermission ya redirige)
  if (tieneAcceso === false) {
    return null;
  }

  // Renderizar contenido solo cuando tiene acceso confirmado
  return <Contenido />;
}
```

### Beneficios

- ✅ El contenido no se muestra hasta que los permisos estén verificados
- ✅ Experiencia de usuario más consistente
- ✅ Prevención de acceso no autorizado
- ✅ Mejor seguridad en todas las páginas

---

## 2. Optimización de Peticiones HTTP

### Problema Identificado

Las peticiones HTTP se cancelaban y se volvían a ejecutar innecesariamente, especialmente en la página de Configuración, causando:
- Peticiones duplicadas en la pestaña Network
- Mayor consumo de recursos
- Experiencia de usuario menos fluida

### Solución Implementada

Se optimizaron todos los hooks de TanStack Query agregando configuraciones para evitar cancelaciones:

#### Configuraciones Aplicadas

```typescript
{
  refetchOnMount: false,        // No refetch si los datos están frescos
  refetchOnWindowFocus: false,  // No refetch al cambiar de ventana
  gcTime: 5 * 60 * 1000,        // 5 minutos - mantener en cache
  networkMode: "online",        // Evitar cancelaciones innecesarias
  staleTime: 30 * 1000,         // 30 segundos - datos frescos
}
```

#### Hooks Optimizados

1. **`useConfiguracion.ts`**
   - Todas las queries ahora tienen `gcTime` y `networkMode: "online"`
   - `enabled` condicionado a `tieneAcceso` confirmado

2. **`useAnaliticas.ts`**
   - Agregado `refetchOnMount: false`, `refetchOnWindowFocus: false`
   - Agregado `gcTime: 5 * 60 * 1000` y `networkMode: "online"`
   - Queries condicionadas a `tieneAcceso` confirmado

3. **`useEmpleados.ts`**
   - Agregado `gcTime` y `networkMode: "online"` en todas las queries:
     - `empleadosQuery`: `gcTime: 5 * 60 * 1000`
     - `rolesQuery`: `gcTime: 10 * 60 * 1000`
     - `provinciasQuery`: `gcTime: 60 * 60 * 1000` (1 hora)
     - `auditoriasQuery`: `gcTime: 5 * 60 * 1000`

4. **`useGenericApi.ts`**
   - Agregado `gcTime: 5 * 60 * 1000` y `networkMode: "online"`

5. **`useProductos.ts`**
   - Agregado `refetchOnMount: false`, `refetchOnWindowFocus: false`
   - Agregado `gcTime` y `networkMode: "online"` en todas las queries:
     - `productosQuery`: `gcTime: 5 * 60 * 1000`
     - `marcasQuery`: `gcTime: 10 * 60 * 1000`
     - `rubrosQuery`: `gcTime: 10 * 60 * 1000`
     - `unidadesQuery`: `gcTime: 30 * 60 * 1000`
     - `ivasQuery`: `gcTime: 30 * 60 * 1000`

6. **Componentes de Ventas**
   - `ProductSearch.tsx`: Agregado `signal` a fetch, `gcTime` y `networkMode: "online"`
   - `ClienteSearch.tsx`: Agregado `signal` a fetch, `gcTime` y `networkMode: "online"`

### Beneficios

- ✅ Eliminación de peticiones canceladas y re-ejecutadas
- ✅ Menor consumo de recursos del servidor
- ✅ Mejor rendimiento general
- ✅ Experiencia de usuario más fluida

---

## 3. Corrección de Errores de React Hooks

### Problema Identificado

Se violaban las reglas de React Hooks al llamar hooks después de early returns, causando errores de compilación:

```
Error: React Hook "useState" is called conditionally. 
React Hooks must be called in the exact same order in every component render.
```

### Solución Implementada

Se reorganizó el código en todas las páginas para que **todos los hooks se llamen antes de cualquier early return**.

#### Archivos Corregidos

1. **`src/app/(dashboard)/caja/page.tsx`**
   - Movidos todos los `useState` y `useEffect` antes de los early returns

2. **`src/app/(dashboard)/configuracion/page.tsx`**
   - Movidos todos los hooks (useState, useEffect, useMemo, useQuery) antes de los early returns

3. **`src/app/(dashboard)/empleados/page.tsx`**
   - Movidos todos los hooks antes de los early returns

4. **`src/app/(dashboard)/test/page.tsx`**
   - Movidos todos los hooks antes de los early returns

#### Patrón de Corrección

**Antes (Incorrecto):**
```typescript
export default function Page() {
  const { tieneAcceso } = usePagePermission();
  
  if (!tieneAcceso) {
    return null; // ❌ Early return antes de hooks
  }
  
  const [state, setState] = useState(); // ❌ Hook después de early return
  // ...
}
```

**Después (Correcto):**
```typescript
export default function Page() {
  const { tieneAcceso } = usePagePermission();
  
  // ✅ TODOS LOS HOOKS ANTES DE EARLY RETURNS
  const [state, setState] = useState();
  useEffect(() => { /* ... */ }, []);
  // ... más hooks
  
  // ✅ EARLY RETURNS DESPUÉS DE TODOS LOS HOOKS
  if (!tieneAcceso) {
    return null;
  }
  
  return <Contenido />;
}
```

### Beneficios

- ✅ Cumplimiento de las reglas de React Hooks
- ✅ Build exitoso sin errores
- ✅ Código más mantenible y predecible

---

## 4. Fix de Pantalla en Blanco

### Problema Identificado

Cuando `permisosData` era `null` o `undefined`, `tieneAcceso` se calculaba como `false`, haciendo que las páginas retornaran `null` y quedaran en blanco.

### Solución Implementada

#### Modificación en `usePagePermission.ts`

```typescript
// Antes
const tieneAcceso = permisosData ? (
  permisosData.isSuperAdmin === true || 
  !getPermisoForRoute(pathname) || 
  tienePermisoParaRuta(permisos, pathname)
) : false; // ❌ Retornaba false cuando no había datos

// Después
const tieneAcceso = isLoading || !permisosData 
  ? undefined  // ✅ Retorna undefined cuando aún está cargando
  : (
      permisosData.isSuperAdmin === true || 
      !getPermisoForRoute(pathname) || 
      tienePermisoParaRuta(permisos, pathname)
    );
```

#### Actualización en Todas las Páginas

Todas las páginas ahora manejan tres estados:

```typescript
// 1. Loading inicial
if (isLoadingPermisos) {
  return <Loading text="Verificando permisos..." />;
}

// 2. Aún verificando (tieneAcceso === undefined)
if (tieneAcceso === undefined) {
  return <Loading text="Verificando permisos..." />;
}

// 3. Sin acceso (tieneAcceso === false)
if (tieneAcceso === false) {
  return null; // usePagePermission ya redirige
}

// 4. Con acceso confirmado
return <Contenido />;
```

### Beneficios

- ✅ Eliminación de pantallas en blanco
- ✅ Feedback visual durante la verificación de permisos
- ✅ Mejor experiencia de usuario

---

## 5. Correcciones de Tipos TypeScript

### Problemas Identificados y Corregidos

#### 5.1 Error: Property 'Severidad' does not exist

**Archivo:** `src/app/api/auditoria-empleados/route.ts`

**Problema:** La tabla `AuditoriaEmpleado` no tiene el campo `Severidad` en el schema de Prisma.

**Solución:**
```typescript
// Antes
severidad: aud.Severidad, // ❌ Campo no existe

// Después
severidad: "INFO", // ✅ Valor por defecto
```

**Archivo:** `src/app/(dashboard)/empleados/page.tsx`

**Solución:**
```typescript
// Antes
const severidadColor = mapearSeveridad(aud.severidad || "INFO");
<Chip>{aud.severidad || "INFO"}</Chip>

// Después
const severidadColor = mapearSeveridad("INFO");
<Chip>INFO</Chip>
```

#### 5.2 Error: Property 'ValorAnterior' does not exist

**Archivo:** `src/app/api/auditoria-empleados/route.ts`

**Problema:** El campo `ValorAnterior` no estaba incluido en el `select` de Prisma.

**Solución:**
```typescript
select: {
  Id: true,
  Fecha: true,
  Accion: true,
  Detalle: true,
  ValorAnterior: true, // ✅ Agregado
  ValorNuevo: true,    // ✅ Agregado
  // ...
}
```

#### 5.3 Error: Property 'url' does not exist on type 'URL'

**Archivo:** `src/components/auth/sessionProvider.tsx`

**Problema:** Los objetos `URL` no tienen propiedad `url`, tienen `href`.

**Solución:**
```typescript
// Antes
const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

// Después
const url = typeof args[0] === "string" 
  ? args[0] 
  : args[0] instanceof URL 
    ? args[0].href  // ✅ Usar href para objetos URL
    : args[0]?.url || "";
```

### Beneficios

- ✅ Build exitoso sin errores de tipos
- ✅ Código más robusto y type-safe
- ✅ Mejor experiencia de desarrollo

---

## 6. Resumen de Archivos Modificados

### Páginas del Dashboard (8 archivos)

1. `src/app/(dashboard)/ventas/page.tsx`
2. `src/app/(dashboard)/caja/page.tsx`
3. `src/app/(dashboard)/productos/page.tsx`
4. `src/app/(dashboard)/clientes/page.tsx`
5. `src/app/(dashboard)/empleados/page.tsx`
6. `src/app/(dashboard)/analiticas/page.tsx`
7. `src/app/(dashboard)/configuracion/page.tsx`
8. `src/app/(dashboard)/test/page.tsx`

### Hooks Optimizados (5 archivos)

1. `src/hooks/useConfiguracion.ts`
2. `src/hooks/useAnaliticas.ts`
3. `src/hooks/useEmpleados.ts`
4. `src/hooks/useGenericApi.ts`
5. `src/hooks/useProductos.ts`

### Componentes Optimizados (2 archivos)

1. `src/components/ventas/ProductSearch.tsx`
2. `src/components/ventas/ClienteSearch.tsx`

### Utilidades y Permisos (2 archivos)

1. `src/lib/permissions/usePagePermission.ts`
2. `src/components/auth/sessionProvider.tsx`

### APIs Corregidas (1 archivo)

1. `src/app/api/auditoria-empleados/route.ts`

---

## 7. Métricas de Mejora Esperadas

### Rendimiento

- **Reducción de peticiones HTTP**: ~30-40% menos peticiones canceladas y re-ejecutadas
- **Tiempo de carga**: Mejora en la percepción del usuario (spinner en lugar de pantalla en blanco)
- **Uso de caché**: Mejor aprovechamiento del caché de TanStack Query

### Experiencia de Usuario

- **Feedback visual**: Spinner de carga durante verificación de permisos
- **Consistencia**: Mismo comportamiento en todas las páginas
- **Seguridad**: Contenido no visible hasta verificación de permisos

### Calidad de Código

- **Errores de compilación**: 0 errores de React Hooks
- **Errores de tipos**: 0 errores de TypeScript
- **Mantenibilidad**: Código más predecible y fácil de mantener

---

## 8. Próximos Pasos Recomendados

1. **Monitoreo**: Observar en producción si las optimizaciones mejoran el rendimiento
2. **Testing**: Agregar tests para verificar el comportamiento de permisos
3. **Documentación**: Actualizar guías de desarrollo con los patrones implementados
4. **Optimizaciones adicionales**: Considerar virtualización de listas para tablas grandes

---

## 9. Notas Técnicas

### TanStack Query Configuration

Las optimizaciones se basan en las siguientes configuraciones de TanStack Query:

- **`staleTime`**: Tiempo que los datos se consideran frescos (no requieren refetch)
- **`gcTime`**: Tiempo que los datos permanecen en caché después de no usarse
- **`networkMode: "online"`**: Evita cancelaciones automáticas cuando el componente se desmonta
- **`refetchOnMount: false`**: No refetch si los datos están frescos
- **`refetchOnWindowFocus: false`**: No refetch al cambiar de ventana

### React Hooks Rules

Las reglas de React Hooks requieren que:
1. Los hooks se llamen en el mismo orden en cada render
2. Los hooks no se llamen condicionalmente
3. Los hooks no se llamen dentro de loops, condiciones o funciones anidadas

### TypeScript Strict Mode

El proyecto usa TypeScript en modo estricto, lo que requiere:
- Tipos explícitos para todas las propiedades
- Manejo correcto de valores `null` y `undefined`
- Verificación de existencia de propiedades antes de acceder

---

## 10. Referencias

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

---

**Fecha de implementación:** Enero 2026  
**Autor:** Optimizaciones de rendimiento y permisos  
**Versión:** 1.0

