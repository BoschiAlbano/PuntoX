# Tests para Sistema de Permisos en JWT

## Resumen

Se han creado tests comprehensivos para verificar el funcionamiento del sistema de permisos en JWT implementado.

## Archivos de Test Creados

### 1. `src/lib/auth/updateUserPermissions.test.ts`
Tests para las funciones core del sistema:
- ✅ `calcularPermisosUsuario()` - Calcula permisos desde DB
- ✅ `actualizarPermisosEnJWT()` - Actualiza permisos en JWT
- ✅ `actualizarPermisosUsuariosDelRol()` - Actualiza usuarios de un rol

**Casos de prueba:**
- Calcula permisos correctamente desde la DB
- Detecta SuperAdmin correctamente
- Retorna permisos vacíos si el usuario no existe
- Filtra permisos eliminados
- Actualiza permisos en JWT correctamente
- Preserva otros metadatos al actualizar
- Actualiza permisos de todos los usuarios con un rol

### 2. `src/app/api/permisos/route.test.ts`
Tests para el endpoint `/api/permisos`:
- ✅ Lee permisos del JWT primero (sin DB)
- ✅ Hace fallback a DB si no hay permisos en JWT
- ✅ Retorna 401 si no está autenticado
- ✅ Maneja errores correctamente
- ✅ Detecta SuperAdmin desde JWT

### 3. `src/lib/requirePermiso.test.ts` (Actualizado)
Tests actualizados para incluir casos de JWT:
- ✅ Lee permisos del JWT primero (sin consultar DB)
- ✅ Hace fallback a DB si no hay permisos en JWT
- ✅ Permite acceso a SuperAdmin desde JWT
- ✅ Lanza error si no tiene permiso en JWT

## Cómo Ejecutar los Tests

### Opción 1: Con Vitest (Recomendado)
```bash
npx vitest run src/lib/auth/updateUserPermissions.test.ts
npx vitest run src/app/api/permisos/route.test.ts
npx vitest run src/lib/requirePermiso.test.ts
```

### Opción 2: Todos los tests
```bash
npx vitest run
```

### Opción 3: Modo watch (desarrollo)
```bash
npx vitest watch
```

## Cobertura de Tests

### Funcionalidades Verificadas

1. **Cálculo de Permisos**
   - ✅ Permisos desde DB
   - ✅ Detección de SuperAdmin
   - ✅ Filtrado de permisos eliminados
   - ✅ Manejo de usuarios inexistentes

2. **Actualización en JWT**
   - ✅ Actualización correcta de permisos
   - ✅ Preservación de otros metadatos
   - ✅ Actualización masiva por rol

3. **Lectura desde JWT**
   - ✅ Prioridad: JWT > DB
   - ✅ Fallback automático
   - ✅ SuperAdmin desde JWT
   - ✅ Validación de permisos

4. **Endpoints API**
   - ✅ Lectura optimizada desde JWT
   - ✅ Fallback a DB
   - ✅ Manejo de errores
   - ✅ Autenticación

## Verificación Manual

Si los tests no se pueden ejecutar automáticamente, puedes verificar manualmente:

### 1. Verificar que los permisos se calculan correctamente
```typescript
// En la consola del navegador o en un endpoint de prueba
const permisos = await calcularPermisosUsuario("auth-user-id");
console.log(permisos); // Debe mostrar permisos, roles, isSuperAdmin
```

### 2. Verificar que se actualizan en JWT
```typescript
await actualizarPermisosEnJWT("auth-user-id");
// Luego verificar en Supabase que app_metadata tiene permissions
```

### 3. Verificar que requirePermiso lee del JWT
```typescript
// Primera llamada: debe leer del JWT (rápido)
const result1 = await requirePermiso("ventas");
// Segunda llamada: también del JWT (sin DB)
const result2 = await requirePermiso("productos");
```

### 4. Verificar endpoint /api/permisos
```bash
# Debe retornar permisos del JWT si están disponibles
curl http://localhost:3000/api/permisos
```

## Notas

- Los tests usan mocks para no requerir conexión real a DB o Supabase
- Los tests verifican tanto el flujo optimizado (JWT) como el fallback (DB)
- Todos los tests están configurados para ejecutarse con Vitest

## Próximos Pasos

1. Ejecutar los tests en CI/CD
2. Agregar tests de integración (opcional)
3. Agregar tests de performance (opcional)

