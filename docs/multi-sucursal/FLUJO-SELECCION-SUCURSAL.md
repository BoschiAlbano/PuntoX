# 🔄 Flujo de Selección de Sucursal Post-Login

**Fecha:** 7 de Enero, 2026  
**Estado:** ✅ Implementado y funcional

---

## 📋 Resumen

Se implementó un flujo completo de selección de sucursal que se ejecuta automáticamente después del login, asegurando que el usuario siempre tenga una sucursal activa antes de acceder al dashboard.

---

## 🎯 Comportamiento

### Flujo Automático Post-Login

1. **Usuario inicia sesión** → `CredentialsForm` procesa el login
2. **Verificación de sucursales** → Se verifica inmediatamente después del login exitoso
3. **Decisión automática:**
   - **Si tiene múltiples sucursales** → Redirige a `/seleccionar-sucursal`
   - **Si tiene solo 1 sucursal** → Autoselecciona y redirige al dashboard
   - **Si no tiene sucursales** → Muestra mensaje de error con botón "Cerrar sesión"
4. **Usuario selecciona sucursal** (si aplica) → Se guarda en cookie y redirige al dashboard
5. **Dashboard** → Bloquea acceso si no hay sucursal activa

---

## 🏗️ Arquitectura

### Componentes Involucrados

#### 1. `CredentialsForm` (`src/components/auth/CredentialsForm.tsx`)

**Responsabilidad:** Verificar sucursales inmediatamente después del login exitoso.

**Lógica:**
```typescript
// Después de login exitoso
const resSucursales = await fetch("/api/sucursales/mis-sucursales");

if (tieneMultiples) {
  // Redirigir a seleccionar-sucursal
  window.location.href = "/seleccionar-sucursal";
  return;
}

if (soloUna && !tieneSucursalActiva) {
  // Autoseleccionar
  await fetch("/api/sucursales/cambiar", { sucursalId });
  // Continuar con redirect normal
}
```

**Características:**
- ✅ Verifica sucursales ANTES de cualquier redirección
- ✅ Usa `window.location.href` para forzar navegación completa
- ✅ Limpia `sessionStorage` para forzar selección en cada sesión
- ✅ Maneja errores redirigiendo a `/seleccionar-sucursal`

#### 2. `Auth Layout` (`src/app/(auth)/layout.tsx`)

**Responsabilidad:** Verificar sucursales para usuarios autenticados que visitan rutas de auth.

**Lógica:**
- Si el usuario está en `/signin` explícitamente → **Siempre mostrar login** (permite cerrar sesión)
- Si el usuario está autenticado en otras rutas → Verificar sucursales antes de redirigir
- Si hay múltiples sucursales → Redirigir a `/seleccionar-sucursal`
- Si solo hay 1 → Autoseleccionar y continuar

**Características:**
- ✅ No interfiere con el flujo de `CredentialsForm`
- ✅ Solo actúa como fallback si el usuario navega directamente
- ✅ Permite ver el login incluso si está autenticado (para cambiar de cuenta)

#### 3. `Dashboard Layout` (`src/app/(dashboard)/layout.tsx`)

**Responsabilidad:** Bloquear acceso al dashboard si no hay sucursal activa.

**Lógica:**
```typescript
if (!tieneSucursalActiva) {
  window.location.href = "/seleccionar-sucursal";
  return;
}
```

**Características:**
- ✅ Bloquea acceso si no hay sucursal activa
- ✅ Redirige a `/seleccionar-sucursal` automáticamente
- ✅ Previene acceso a datos sin contexto de sucursal

#### 4. `Seleccionar Sucursal Page` (`src/app/(dashboard)/seleccionar-sucursal/page.tsx`)

**Responsabilidad:** Mostrar interfaz para que el usuario seleccione su sucursal.

**Características:**
- ✅ Lista todas las sucursales disponibles del usuario
- ✅ Autoselecciona si solo hay 1 sucursal
- ✅ Muestra mensaje claro si no hay sucursales asignadas
- ✅ Botón "Cerrar sesión" si no tiene acceso a ninguna sucursal
- ✅ Guarda selección en cookie HttpOnly y `sessionStorage`
- ✅ Redirige a `/ventas` después de seleccionar

---

## 🔧 Implementación Técnica

### Obtención de `usuarioId`

**Problema identificado:** `getUserBranches()` esperaba `usuarioId` de `getAuthUser()`, pero esta función solo devuelve `user`, `tenantId` y `error`.

**Solución implementada:**

```typescript
// En getUserBranches()
const { user, tenantId, error } = await getAuthUser();

if (error || !user || !tenantId) {
  return [];
}

// Obtener usuarioId desde la BD usando AuthUserId
const usuario = await prisma.usuario.findFirst({
  where: {
    AuthUserId: user.id,
    TenantId: BigInt(tenantId),
    EstaEliminado: false,
  },
  select: {
    Id: true,
  },
});

if (!usuario) {
  return [];
}

const usuarioId = usuario.Id;
```

**Archivos corregidos:**
- ✅ `src/lib/sucursal/context.ts` - `getUserBranches()` y `getActiveBranchContext()`
- ✅ `src/lib/sucursal/getAuthWithBranch.ts` - `getAuthWithBranch()` y `getAuthWithOptionalBranch()`

### Cookie y SessionStorage

**Cookie HttpOnly:**
- Nombre: `puntox_sucursal_activa`
- HttpOnly: `true` (no accesible desde JavaScript)
- Secure: `true` (solo HTTPS en producción)
- SameSite: `lax`
- Path: `/`

**SessionStorage:**
- Clave: `sucursal_seleccionada`
- Valor: `"true"` o `sucursalId.toString()`
- Propósito: Rastrear si el usuario ya seleccionó sucursal en esta sesión
- Se limpia al cerrar sesión

---

## 🔄 Flujos de Usuario

### Escenario 1: Usuario con Múltiples Sucursales

```
1. Login exitoso
2. CredentialsForm verifica → Detecta múltiples sucursales
3. Redirige a /seleccionar-sucursal
4. Usuario ve lista de sucursales
5. Usuario selecciona sucursal
6. Se guarda en cookie y sessionStorage
7. Redirige a /ventas
8. Dashboard funciona normalmente
```

### Escenario 2: Usuario con Solo 1 Sucursal

```
1. Login exitoso
2. CredentialsForm verifica → Detecta 1 sucursal
3. Autoselecciona la sucursal
4. Redirige directamente a /ventas
5. Dashboard funciona normalmente
```

### Escenario 3: Usuario sin Sucursales Asignadas

```
1. Login exitoso
2. CredentialsForm verifica → No encuentra sucursales
3. Redirige a /seleccionar-sucursal
4. Usuario ve mensaje: "Sin sucursales asignadas"
5. Usuario puede cerrar sesión
6. Administrador debe asignar sucursales
```

### Escenario 4: Usuario Autenticado Visita /signin

```
1. Usuario ya autenticado navega a /signin
2. Auth Layout detecta autenticación
3. PERO permite ver el login (no redirige)
4. Usuario puede cerrar sesión o iniciar con otra cuenta
```

---

## 🛡️ Seguridad

### Validaciones Implementadas

1. **Verificación de acceso:**
   - El usuario solo puede seleccionar sucursales a las que tiene acceso
   - La cookie se valida contra `UsuarioSucursal`

2. **Middleware:**
   - `/seleccionar-sucursal` requiere autenticación
   - No está en rutas públicas

3. **Dashboard Layout:**
   - Bloquea acceso si no hay sucursal activa
   - Previene operaciones sin contexto

4. **API Endpoints:**
   - `/api/sucursales/cambiar` valida que el usuario tenga acceso
   - `/api/sucursales/mis-sucursales` solo devuelve sucursales del usuario

---

## 🐛 Problemas Resueltos

### 1. "Pantallazo" de /ventas antes de seleccionar sucursal

**Problema:** El usuario veía brevemente `/ventas` antes de ser redirigido a `/seleccionar-sucursal`.

**Solución:** 
- `CredentialsForm` verifica sucursales ANTES de redirigir
- Usa `window.location.href` en lugar de `router.push` para forzar navegación completa
- `Auth Layout` también verifica antes de redirigir

### 2. Página de login en blanco

**Problema:** Usuarios autenticados que visitaban `/signin` veían página en blanco.

**Solución:**
- `Auth Layout` ahora permite ver `/signin` incluso si está autenticado
- Esto permite cerrar sesión o cambiar de cuenta

### 3. "Sin sucursales asignadas" cuando sí las hay

**Problema:** `getUserBranches()` no podía obtener el `usuarioId` correctamente.

**Solución:**
- Se corrigió para obtener `usuarioId` desde la BD usando `AuthUserId`
- Todas las funciones relacionadas fueron actualizadas

---

## 📝 Archivos Modificados

### Componentes
- `src/components/auth/CredentialsForm.tsx` - Verificación post-login
- `src/app/(auth)/layout.tsx` - Verificación en auth layout
- `src/app/(dashboard)/layout.tsx` - Bloqueo de acceso sin sucursal
- `src/app/(dashboard)/seleccionar-sucursal/page.tsx` - Página de selección

### Librerías
- `src/lib/sucursal/context.ts` - Corrección de obtención de usuarioId
- `src/lib/sucursal/getAuthWithBranch.ts` - Corrección de obtención de usuarioId

### Middleware
- `src/middleware.ts` - `/seleccionar-sucursal` requiere autenticación

---

## ✅ Checklist de Pruebas

- [x] Usuario con múltiples sucursales ve selector después del login
- [x] Usuario con 1 sucursal es autoseleccionado automáticamente
- [x] Usuario sin sucursales ve mensaje de error
- [x] No hay "pantallazo" de /ventas antes de seleccionar
- [x] Login se muestra correctamente incluso si está autenticado
- [x] Dashboard bloquea acceso sin sucursal activa
- [x] Cambio de sucursal funciona desde el sidebar
- [x] Cookie se guarda correctamente
- [x] SessionStorage se limpia al cerrar sesión

---

## 🎉 Resultado Final

El sistema ahora garantiza que:

1. ✅ **Todos los usuarios** tienen una sucursal activa antes de acceder al dashboard
2. ✅ **El flujo es claro** y no confunde al usuario
3. ✅ **No hay pantallazos** o redirecciones inesperadas
4. ✅ **La seguridad está garantizada** con validaciones en múltiples capas
5. ✅ **El código es mantenible** con funciones claras y documentadas

---

**Última actualización:** 7 de Enero, 2026

