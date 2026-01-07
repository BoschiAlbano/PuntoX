# Manejo de Logout y Errores de Autenticación

## Resumen

Este documento describe el sistema implementado para manejar el proceso de logout de forma limpia, evitando que se muestren múltiples toasts de error cuando el usuario cierra sesión.

## Problema Original

Cuando el usuario hacía clic en "Cerrar sesión", ocurría lo siguiente:

1. Se ejecutaba `supabase.auth.signOut()`
2. El estado de autenticación cambiaba a `unauthenticated`
3. Todas las queries activas de TanStack Query fallaban con error 401
4. Cada query mostraba un toast de error ("Error No autenticado")
5. El usuario veía múltiples notificaciones de error innecesarias

## Solución Implementada

### 1. Gestor de Logout Manual (`src/lib/auth/logoutManager.ts`)

Sistema de banderas globales para detectar cuando se está realizando un logout manual:

- `startManualLogout()`: Marca que se está iniciando un logout manual
- `endManualLogout()`: Marca que el logout manual ha terminado
- `isManualLogoutInProgress()`: Verifica si actualmente se está realizando un logout manual

### 2. Manejador de Errores (`src/lib/auth/errorHandler.ts`)

Helper reutilizable para manejar errores de forma consistente:

```typescript
handleError(error, defaultMessage, showToast)
```

**Características:**
- No muestra toasts durante logout manual
- No muestra toasts para errores de autenticación (401) que se manejan globalmente
- Proporciona un mensaje por defecto si el error no tiene mensaje

### 3. Mejoras en el Proceso de Logout (`src/components/dashboard/Sidebar.tsx`)

El `handleLogout` ahora:

1. Marca el inicio del logout manual
2. Cancela todas las queries activas usando `queryClient.cancelQueries()`
3. Limpia todo el cache usando `queryClient.clear()`
4. Ejecuta `supabase.auth.signOut()`
5. Limpia el estado después de un breve delay
6. Redirige al login

### 4. Interceptor Global Mejorado (`src/components/auth/sessionProvider.tsx`)

El interceptor de fetch ahora:
- No procesa respuestas 401 durante logout manual
- Evita loops infinitos y toasts innecesarios
- Solo maneja 401s cuando no hay un logout manual en progreso

### 5. Actualización de Handlers de Error

Todos los `onError` handlers en los hooks han sido actualizados para usar `handleError`:

- `src/hooks/useEmpleados.ts`
- `src/hooks/useConfiguracion.ts`
- `src/components/shared/GenericCrud.tsx`
- `src/app/(dashboard)/empleados/page.tsx`

## Flujo de Logout

```
Usuario hace clic en "Cerrar sesión"
    ↓
startManualLogout() - Marca estado
    ↓
queryClient.cancelQueries() - Cancela queries activas
    ↓
queryClient.clear() - Limpia cache
    ↓
supabase.auth.signOut() - Cierra sesión
    ↓
endManualLogout() - Limpia estado (después de delay)
    ↓
router.push("/signin") - Redirige al login
```

## Beneficios

1. **UX Mejorada**: No se muestran errores innecesarios al usuario
2. **Limpieza de Recursos**: Se cancelan queries y se limpia el cache antes del logout
3. **Consistencia**: Todos los errores se manejan de forma uniforme
4. **Prevención de Loops**: El interceptor evita procesar 401s durante logout

## Uso

### Para nuevos hooks con mutations:

```typescript
import { handleError } from "@/lib/auth/errorHandler";

const mutation = useMutation({
  mutationFn: myFunction,
  onSuccess: () => {
    // ...
  },
  onError: (error: Error) => {
    handleError(error, "Mensaje por defecto");
  },
});
```

### Para logout manual:

El sistema se maneja automáticamente en `Sidebar.tsx`. No se requiere acción adicional.

## Notas Técnicas

- El delay de 100ms antes de `endManualLogout()` asegura que cualquier error pendiente no muestre toasts
- Los errores de autenticación (401) se manejan globalmente y no requieren toasts individuales
- El interceptor global solo procesa 401s cuando no hay un logout manual en progreso


