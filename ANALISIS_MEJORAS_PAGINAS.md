# Análisis Crítico: Páginas de Configuración y Empleados

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Anti-pattern: Wrapping Mutations con `new Promise`** (Configuración)

**Ubicación**: `handleSavePerfil` y otros handlers

**Problema**:
```typescript
await new Promise<void>((resolve, reject) => {
  saveTenantMutation(tenant, {
    onSuccess: () => resolve(),
    onError: (error) => reject(error),
  });
});
```

**Por qué es malo**:
- Las mutaciones de TanStack Query ya devuelven una Promise
- Estás creando una Promise innecesaria que envuelve otra Promise
- Esto puede causar problemas de manejo de errores y memory leaks
- La mutación puede fallar y la Promise wrapper nunca resolverse/rechazarse

**Solución**:
```typescript
// Las mutaciones de TanStack Query devuelven una Promise
await saveTenantMutation.mutateAsync(tenant);
```

O mejor aún, usar el patrón correcto:
```typescript
try {
  await saveTenantMutation.mutateAsync(tenant);
  // onSuccess logic aquí
} catch (error) {
  // onError logic aquí
}
```

### 2. **Comparación Ineficiente con `JSON.stringify`** (Configuración)

**Ubicación**: Múltiples `hasXChanges` computados

**Problema**:
```typescript
const hasPreferenciasChanges = preferenciasOriginales
  ? JSON.stringify(preferencias) !== JSON.stringify(preferenciasOriginales)
  : false;
```

**Por qué es malo**:
- `JSON.stringify` se ejecuta en CADA render (estos valores no están memoizados)
- Es costoso computacionalmente (serializa objetos completos)
- Puede tener problemas con orden de propiedades
- No es type-safe

**Solución**: Usar `useMemo` y comparación campo por campo:
```typescript
const hasPreferenciasChanges = useMemo(() => {
  if (!preferenciasOriginales) return false;
  return (
    preferencias.ticketDigitalPorCorreo !== preferenciasOriginales.ticketDigitalPorCorreo ||
    preferencias.mostrarPreciosConIva !== preferenciasOriginales.mostrarPreciosConIva ||
    preferencias.abrirCajonEfectivo !== preferenciasOriginales.abrirCajonEfectivo ||
    preferencias.numerarPedidosPantalla !== preferenciasOriginales.numerarPedidosPantalla
  );
}, [preferencias, preferenciasOriginales]);
```

O usar una librería como `lodash.isEqual`:
```typescript
const hasPreferenciasChanges = useMemo(
  () => preferenciasOriginales ? !isEqual(preferencias, preferenciasOriginales) : false,
  [preferencias, preferenciasOriginales]
);
```

### 3. **Estados Duplicados Innecesarios** (Configuración)

**Problema**: Mantienes estados originales y estados actuales separados, cuando TanStack Query ya maneja el estado del servidor.

**Solución**: Usar los datos directamente del query y solo mantener un flag de "has unsaved changes" por campo/sección.

### 4. **useEffect Sin Dependencias Correctas** (Ambas)

**Problema**: Varios useEffects que pueden causar loops infinitos o renders innecesarios.

**Ejemplo en Configuración**:
```typescript
useEffect(() => {
  if (configuracionData) {
    setConfiguracion((prev) => ({
      ...prev,
      razonSocial: configuracionData.razonSocial ?? prev.razonSocial,
      // ...
    }));
  }
}, [configuracionData]); // Esto se ejecuta cada vez que configuracionData cambia
```

**Problema**: Si `configuracionData` cambia frecuentemente (refetch, etc), esto causa renders innecesarios.

**Solución**: Usar un flag para sincronizar solo una vez al inicio o usar una comparación más inteligente.

### 5. **Variable `isOffline` Siempre en `false`** (Configuración)

**Problema**:
```typescript
const [isOffline] = useState(false);
```

**Por qué es malo**:
- El setter no se usa, entonces nunca puede cambiar
- Todos los campos están deshabilitados innecesariamente si `isOffline` siempre es false
- Es código muerto que confunde

**Solución**: Si no se usa, eliminar. Si se planea usar, implementar la lógica.

### 6. **Falta Validación de Email** (Empleados)

**Problema**: No se valida el formato del email antes de crear un empleado.

**Solución**: Agregar validación:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(nuevoUsuario.email)) {
  addToast({
    title: "Email inválido",
    description: "Por favor, ingresa un email válido.",
    color: "warning",
  });
  return;
}
```

### 7. **Detección de Errores Frágil** (Empleados)

**Problema**:
```typescript
if (
  errorMessage.toLowerCase().includes("correo") &&
  (errorMessage.toLowerCase().includes("registrado") || ...)
) {
  // ...
}
```

**Por qué es malo**:
- Depende de strings del mensaje de error que pueden cambiar
- No es type-safe
- Puede fallar con diferentes idiomas

**Solución**: El backend debería devolver códigos de error estructurados, pero mientras tanto, mejorar la detección.

### 8. **Falta Validación de Password** (Empleados)

**Problema**: No se valida la fortaleza o longitud mínima del password.

**Solución**: Agregar validación:
```typescript
if (nuevoUsuario.password.length < 8) {
  addToast({
    title: "Contraseña muy corta",
    description: "La contraseña debe tener al menos 8 caracteres.",
    color: "warning",
  });
  return;
}
```

## 🟡 PROBLEMAS DE RENDIMIENTO

### 9. **Re-renders Innecesarios** (Configuración)

**Problema**: Los summaries se calculan en cada render:
```typescript
const summaryPerfil = `Nombre: ${tenant.nombre} | CUIT: ${tenant.cuit}`;
```

**Solución**: Memoizar con `useMemo`:
```typescript
const summaryPerfil = useMemo(
  () => `Nombre: ${tenant.nombre} | CUIT: ${tenant.cuit}`,
  [tenant.nombre, tenant.cuit]
);
```

### 10. **Múltiples Queries Paralelas Sin Optimización** (Configuración)

**Problema**: Se hacen muchas queries en paralelo que podrían estar relacionadas.

**Solución**: Considerar usar `useQueries` para mejor manejo, o combinar algunas en una sola query si tiene sentido.

## 🟢 MEJORAS DE CÓDIGO

### 11. **Extraer Lógica de Validación** (Empleados)

**Problema**: Validaciones repetitivas en múltiples handlers.

**Solución**: Crear funciones helper:
```typescript
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
  }
  return { valid: true };
};
```

### 12. **Mejor Manejo de Errores** (Ambas)

**Problema**: Errores genéricos sin contexto.

**Solución**: Crear un hook o utilidad para manejar errores de forma consistente:
```typescript
const useErrorHandler = () => {
  return useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : "Error desconocido";
    addToast({
      title: "Error",
      description: message,
      color: "danger",
    });
  }, []);
};
```

### 13. **Código Duplicado en useEffects** (Configuración)

**Problema**: Patrón repetitivo de sincronización de datos.

**Solución**: Crear un hook personalizado:
```typescript
const useSyncState = <T,>(
  serverData: T | undefined,
  initialState: T
): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(initialState);
  
  useEffect(() => {
    if (serverData) {
      setState(serverData);
    }
  }, [serverData]);
  
  return [state, setState];
};
```

### 14. **Componente Muy Grande** (Ambas)

**Problema**: Ambos componentes tienen más de 2000 líneas.

**Solución**: Dividir en componentes más pequeños:
- `ConfiguracionPerfilTab`
- `ConfiguracionVentasTab`
- `EmpleadosList`
- `EmpleadosForm`
- `RolesManagement`

### 15. **Magic Numbers y Strings** (Ambas)

**Problema**: Valores hardcodeados:
```typescript
if (file.size > 5 * 1024 * 1024) // 5MB
setTimeout(() => { ... }, 500); // 500ms debounce
```

**Solución**: Extraer a constantes:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SEARCH_DEBOUNCE_MS = 500;
```

## 🔵 MEJORAS DE UX

### 16. **Falta Feedback Visual Durante Guardado** (Configuración)

**Problema**: No se muestra claramente qué se está guardando.

**Solución**: Agregar indicadores por sección que se está guardando.

### 17. **No Hay Confirmación Antes de Acciones Destructivas** (Empleados)

**Problema**: Eliminar empleados/roles sin confirmación.

**Solución**: Agregar modales de confirmación.

### 18. **Falta Optimistic Updates** (Ambas)

**Problema**: Los cambios no se reflejan inmediatamente en la UI.

**Solución**: Usar `onMutate` en las mutaciones para actualizar el cache optimísticamente.

## 📊 RESUMEN POR PRIORIDAD

### 🔴 Crítico (Arreglar YA)
1. Anti-pattern con `new Promise` en mutaciones
2. Comparación ineficiente con `JSON.stringify`
3. Variable `isOffline` siempre false

### 🟡 Importante (Arreglar pronto)
4. useEffect sin dependencias correctas
5. Falta validación de email y password
6. Re-renders innecesarios

### 🟢 Mejoras (Hacer cuando tengas tiempo)
7. Extraer lógica de validación
8. Dividir componentes grandes
9. Mejor manejo de errores
10. Optimistic updates


