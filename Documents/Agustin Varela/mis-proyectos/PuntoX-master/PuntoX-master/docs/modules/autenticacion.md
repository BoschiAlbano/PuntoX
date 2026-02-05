# 🔐 Documentación del Sistema de Autenticación - PuntoX

## 📋 Resumen

**Pregunta:** ¿Dónde se hace la autenticación de administradores y superadmin?

**Respuesta:** 
- **Autenticación inicial:** Supabase Auth (email/password)
- **Roles y permisos:** Base de datos PostgreSQL (tablas `Perfiles`, `PerfilUsuario`, `Permiso`)
- **SuperAdmin:** Se identifica por el nombre del perfil en la BD (`Descripcion = "SuperAdmin"`)

---

## 🔄 Flujo Completo de Autenticación

### 1. Login Inicial (Supabase Auth) - **ACTUALIZADO: Login por Username**

**Archivo:** `src/components/auth/CredentialsForm.tsx`

**IMPORTANTE:** A partir de Enero 2025, el sistema utiliza **nombre de usuario** en lugar de email para el login.

```typescript
// Usuario ingresa username (no email)
const response = await fetch("/api/auth/get-email-by-username", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username }),
});

const { email, isInternal, tenantId } = await response.json();

// Luego se usa el email resuelto para Supabase Auth
const { error } = await supabase.auth.signInWithPassword({
  email, // Email resuelto desde el username
  password,
});
```

**¿Qué hace?**
1. ✅ Usuario ingresa **username** (no email)
2. ✅ El sistema resuelve el username a email mediante `/api/auth/get-email-by-username`
3. ✅ Valida credenciales contra **Supabase Auth** usando el email resuelto
4. ✅ Si es válido, crea una sesión JWT
5. ✅ Almacena el token en cookies (gestionado por Supabase SSR)

**Resolución de Username a Email:**
- **Endpoint:** `/api/auth/get-email-by-username`
- Busca el usuario en la tabla `Usuario` por `Nombre` (username normalizado)
- Si el usuario tiene email en `Persona.Mail`, lo usa
- Si no tiene email, genera uno automático: `username@puntox.com`
- Retorna el email, si es interno, y el `tenantId`

**Resultado:**
- Usuario autenticado en Supabase
- Token JWT válido
- **PERO:** Aún no sabemos si es admin o superadmin

---

### 2. Middleware de Protección

**Archivo:** `src/middleware.ts`

```typescript
// Verifica que haya una sesión válida
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  redirect("/signin");
}
```

**¿Qué hace?**
- ✅ Verifica que el usuario tenga sesión válida en Supabase
- ✅ Si no tiene sesión → redirige a `/signin`
- ✅ Si tiene sesión → permite continuar

**Resultado:**
- Usuario tiene sesión válida
- **PERO:** Aún no verificamos roles/permisos

---

### 3. Verificación de Roles y Permisos (Base de Datos)

**Archivo:** `src/lib/requirePermiso.ts`

```typescript
// 1. Obtener usuario de Supabase Auth
const { data: { user } } = await supabase.auth.getUser();

// 2. Buscar usuario en BD por AuthUserId
const usuario = await prisma.usuario.findFirst({
  where: { AuthUserId: user.id, EstaEliminado: false },
  select: {
    Id: true,
    TenantId: true,
    PerfilUsuario: {
      select: {
        Perfiles: {
          select: {
            Descripcion: true,  // ← Aquí está "SuperAdmin" o "Administrador"
            Tipo: true,          // ← "ADMINISTRADOR" o "EMPLEADO"
            PerfilPermiso: {
              select: {
                Permiso: {
                  select: { Clave: true, EstaEliminado: true },
                },
              },
            },
          },
        },
      },
    },
  },
});
```

**¿Qué hace?**
1. ✅ Obtiene el usuario autenticado de Supabase
2. ✅ Busca el usuario en la BD PostgreSQL por `AuthUserId`
3. ✅ Obtiene los perfiles (roles) del usuario desde la BD
4. ✅ Obtiene los permisos asignados a esos perfiles

**Resultado:**
- Usuario encontrado en BD
- Perfiles y permisos cargados
- Listo para verificar si es SuperAdmin o tiene permisos específicos

---

### 4. Verificación de SuperAdmin

**Archivo:** `src/lib/requirePermiso.ts` (líneas 64-78)

```typescript
// Verificar si es SuperAdmin - tiene acceso completo sin verificar permisos
const esSuperAdmin = usuario.PerfilUsuario.some(
  (pu) => {
    const descripcion = pu.Perfiles.Descripcion?.trim() || "";
    return descripcion === "SuperAdmin" || 
           descripcion.toLowerCase() === "superadmin";
  }
);

// SuperAdmin tiene acceso a todo, no necesita verificar permisos específicos
if (esSuperAdmin) {
  return {
    tenantId: Number(tenantId),
    usuarioId: Number(usuario.Id),
    permisos: ["*"], // Indica acceso completo
  };
}
```

**¿Qué hace?**
- ✅ Verifica si el usuario tiene un perfil con `Descripcion = "SuperAdmin"`
- ✅ Si es SuperAdmin → retorna permisos `["*"]` (acceso completo)
- ✅ **NO verifica permisos específicos** (bypass automático)

**Resultado:**
- SuperAdmin identificado
- Acceso completo sin verificar permisos

---

### 5. Verificación de Permisos Específicos (No SuperAdmin)

**Archivo:** `src/lib/requirePermiso.ts` (líneas 80-94)

```typescript
// Si NO es SuperAdmin, verificar permisos específicos
const permisos = usuario.PerfilUsuario.flatMap((pu) =>
  pu.Perfiles.PerfilPermiso.filter((pp) => !pp.Permiso?.EstaEliminado).map(
    (pp) => pp.Permiso?.Clave ?? ""
  )
).filter((c) => c);

const tienePermiso = permisos.some((p) => p === clavePermiso);

if (!tienePermiso) {
  throw new PermisoError("Sin permisos", 403);
}
```

**¿Qué hace?**
- ✅ Obtiene todos los permisos del usuario (a través de sus perfiles)
- ✅ Verifica si tiene el permiso específico requerido
- ✅ Si no tiene permiso → lanza error 403

**Resultado:**
- Permisos verificados
- Acceso permitido o denegado según permisos

---

## 🗄️ Estructura de Base de Datos

### Tablas Involucradas

#### 1. `Usuario`
```prisma
model Usuario {
  Id          BigInt   @id
  AuthUserId  String   // ← ID del usuario en Supabase Auth
  TenantId    BigInt
  PerfilUsuario PerfilUsuario[]  // ← Relación con perfiles
}
```

**Relación:**
- `AuthUserId` → vincula con Supabase Auth
- `PerfilUsuario` → perfiles asignados al usuario

#### 2. `Perfiles` (Roles)
```prisma
model Perfiles {
  Id          BigInt      @id
  Descripcion String      // ← "SuperAdmin", "Administrador", "Vendedor", etc.
  Tipo        PerfilTipo // ← "ADMINISTRADOR" o "EMPLEADO"
  TenantId    BigInt
  PerfilUsuario PerfilUsuario[]
  PerfilPermiso PerfilPermiso[]
}
```

**Campos importantes:**
- `Descripcion`: Nombre del perfil (ej: "SuperAdmin")
- `Tipo`: Tipo de perfil ("ADMINISTRADOR" o "EMPLEADO")

#### 3. `PerfilUsuario` (Relación Usuario ↔ Perfil)
```prisma
model PerfilUsuario {
  Perfil_Id  BigInt
  Usuario_Id BigInt
  TenantId   BigInt
  Perfiles   Perfiles
  Usuario    Usuario
}
```

**Función:**
- Asigna perfiles (roles) a usuarios
- Un usuario puede tener múltiples perfiles

#### 4. `Permiso`
```prisma
model Permiso {
  Id          BigInt   @id
  Clave       String   // ← "empleados:admin", "productos:crear", etc.
  Descripcion String?
  TenantId    BigInt
  PerfilPermisos PerfilPermiso[]
}
```

**Función:**
- Define permisos funcionales disponibles
- Ejemplos: "empleados:admin", "productos:crear", "ventas:ver"

#### 5. `PerfilPermiso` (Relación Perfil ↔ Permiso)
```prisma
model PerfilPermiso {
  PerfilId  BigInt
  PermisoId BigInt
  TenantId  BigInt
  Perfil    Perfiles
  Permiso   Permiso
}
```

**Función:**
- Asigna permisos a perfiles (roles)
- Los usuarios heredan permisos de sus perfiles

---

## 🎯 Cómo se Determina si es SuperAdmin

### Método 1: Por Nombre del Perfil (Actual)

**Código:**
```typescript
const esSuperAdmin = usuario.PerfilUsuario.some(
  (pu) => {
    const descripcion = pu.Perfiles.Descripcion?.trim() || "";
    return descripcion === "SuperAdmin" || 
           descripcion.toLowerCase() === "superadmin";
  }
);
```

**Lógica:**
- ✅ Busca en la tabla `Perfiles` un perfil con `Descripcion = "SuperAdmin"`
- ✅ Verifica si el usuario tiene ese perfil asignado en `PerfilUsuario`
- ✅ Case-insensitive (acepta "SuperAdmin", "superadmin", etc.)

**Ubicación en BD:**
- Tabla: `Perfiles`
- Campo: `Descripcion`
- Valor: `"SuperAdmin"`

---

## 📊 Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario ingresa username/password                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 1.5. Sistema resuelve username a email                      │
│     (GET /api/auth/get-email-by-username)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Supabase Auth valida credenciales                        │
│    ✅ Si válido → Crea sesión JWT                           │
│    ❌ Si inválido → Error de autenticación                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Middleware verifica sesión                               │
│    ✅ Si hay sesión → Continúa                              │
│    ❌ Si no hay sesión → Redirige a /signin                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. requirePermiso() busca usuario en BD                     │
│    - Busca por AuthUserId en tabla Usuario                  │
│    - Obtiene PerfilUsuario (perfiles del usuario)          │
│    - Obtiene PerfilPermiso (permisos de cada perfil)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Verifica si es SuperAdmin                                │
│    - Busca perfil con Descripcion = "SuperAdmin"           │
│    ✅ Si es SuperAdmin → Acceso completo (permisos: ["*"])  │
│    ❌ Si NO es SuperAdmin → Continúa a paso 6               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Verifica permisos específicos                           │
│    - Obtiene todos los permisos del usuario                │
│    - Verifica si tiene el permiso requerido                │
│    ✅ Si tiene permiso → Acceso permitido                   │
│    ❌ Si no tiene permiso → Error 403                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Ejemplos Prácticos

### Ejemplo 1: Usuario SuperAdmin

**En Supabase Auth:**
- Email: `admin@example.com`
- Password: `********`
- AuthUserId: `abc123...`

**En Base de Datos:**
```sql
-- Tabla Usuario
Id: 1
AuthUserId: "abc123..."
TenantId: 100

-- Tabla PerfilUsuario
Usuario_Id: 1
Perfil_Id: 1  -- Perfil "SuperAdmin"

-- Tabla Perfiles
Id: 1
Descripcion: "SuperAdmin"
Tipo: "ADMINISTRADOR"
TenantId: 100
```

**Resultado:**
- ✅ Autenticado en Supabase
- ✅ Usuario encontrado en BD
- ✅ Tiene perfil "SuperAdmin"
- ✅ Acceso completo sin verificar permisos

---

### Ejemplo 2: Usuario Administrador (No SuperAdmin)

**En Supabase Auth:**
- Email: `manager@example.com`
- Password: `********`
- AuthUserId: `def456...`

**En Base de Datos:**
```sql
-- Tabla Usuario
Id: 2
AuthUserId: "def456..."
TenantId: 100

-- Tabla PerfilUsuario
Usuario_Id: 2
Perfil_Id: 2  -- Perfil "Administrador"

-- Tabla Perfiles
Id: 2
Descripcion: "Administrador"
Tipo: "ADMINISTRADOR"
TenantId: 100

-- Tabla PerfilPermiso
PerfilId: 2
PermisoId: 1  -- Permiso "empleados:admin"

-- Tabla Permiso
Id: 1
Clave: "empleados:admin"
Descripcion: "Administración completa de empleados"
TenantId: 100
```

**Resultado:**
- ✅ Autenticado en Supabase
- ✅ Usuario encontrado en BD
- ❌ NO es SuperAdmin (es "Administrador")
- ✅ Tiene permiso "empleados:admin"
- ✅ Acceso permitido solo a funcionalidades con ese permiso

---

## 🛠️ Cómo Crear un SuperAdmin

### Opción 1: Manualmente en BD

```sql
-- 1. Crear perfil SuperAdmin (si no existe)
INSERT INTO "Perfiles" ("Descripcion", "Tipo", "TenantId", "EstaEliminado")
VALUES ('SuperAdmin', 'ADMINISTRADOR', 1, false);

-- 2. Asignar perfil al usuario
INSERT INTO "PerfilUsuario" ("Perfil_Id", "Usuario_Id", "TenantId")
VALUES (1, 1, 1);  -- PerfilId=1 (SuperAdmin), UsuarioId=1
```

### Opción 2: Usando Prisma

```typescript
// 1. Crear o buscar perfil SuperAdmin
const perfilSuperAdmin = await prisma.perfiles.upsert({
  where: {
    Id_TenantId: {
      Id: perfilId,
      TenantId: tenantId,
    },
  },
  create: {
    Descripcion: "SuperAdmin",
    Tipo: "ADMINISTRADOR",
    TenantId: tenantId,
    EstaEliminado: false,
  },
  update: {},
});

// 2. Asignar perfil al usuario
await prisma.perfilUsuario.create({
  data: {
    Perfil_Id: perfilSuperAdmin.Id,
    Usuario_Id: usuarioId,
    TenantId: tenantId,
  },
});
```

### Opción 3: Script de Asignación

**Archivo:** `scripts/asignar-permiso-admin.ts`

Este script asigna permisos a perfiles Administrador, pero **NO crea SuperAdmin**.

---

## ⚠️ Puntos Importantes

### 1. SuperAdmin es por Nombre, NO por Tipo

```typescript
// ❌ INCORRECTO - NO funciona así
const esSuperAdmin = usuario.PerfilUsuario.some(
  (pu) => pu.Perfiles.Tipo === "ADMINISTRADOR"
);

// ✅ CORRECTO - Verifica el nombre del perfil
const esSuperAdmin = usuario.PerfilUsuario.some(
  (pu) => pu.Perfiles.Descripcion === "SuperAdmin"
);
```

### 2. SuperAdmin es Multi-Tenant

- Cada tenant puede tener su propio SuperAdmin
- El SuperAdmin solo tiene acceso dentro de su tenant
- Para acceso global, se necesitaría un sistema diferente

### 3. Autenticación es Híbrida

- **Supabase Auth:** Valida credenciales (email/password)
- **Base de Datos:** Almacena roles y permisos
- **Código:** Verifica roles y permisos en cada request

### 4. No Hay Autenticación "Hardcodeada"

- ❌ NO hay usuarios hardcodeados en el código
- ❌ NO hay passwords en el código
- ✅ Todo está en Supabase Auth y PostgreSQL

---

## 🔒 Seguridad

### ¿Es Seguro?

**✅ SÍ, porque:**
1. Credenciales validadas por Supabase Auth (servicio profesional)
2. Tokens JWT firmados y verificados
3. Roles y permisos en BD (no en código)
4. Verificación en cada request (no solo en login)

### Mejoras Recomendadas

1. **Rate Limiting:** Prevenir ataques de fuerza bruta
2. **2FA:** Autenticación de dos factores para SuperAdmin
3. **Auditoría:** Log de acciones de SuperAdmin
4. **Sesiones:** Timeout automático de sesiones

---

## 📝 Resumen Final

| Aspecto | Dónde | Cómo |
|---------|-------|------|
| **Autenticación inicial** | Supabase Auth | Username/password (resuelto a email) |
| **Sesión** | Cookies (Supabase SSR) | JWT tokens |
| **Roles/Perfiles** | PostgreSQL (`Perfiles`) | Tabla de BD |
| **Asignación de roles** | PostgreSQL (`PerfilUsuario`) | Relación muchos-a-muchos |
| **SuperAdmin** | PostgreSQL (`Perfiles.Descripcion`) | Nombre del perfil = "SuperAdmin" |
| **Permisos** | PostgreSQL (`Permiso`, `PerfilPermiso`) | Permisos asignados a perfiles |
| **Verificación** | Código (`requirePermiso.ts`) | En cada request de API |

---

## 🎯 Conclusión

**Respuesta directa a tu pregunta:**

1. **Autenticación inicial:** Supabase Auth (username/password, resuelto a email internamente)
2. **Roles y permisos:** Base de datos PostgreSQL
3. **SuperAdmin:** Se identifica por el nombre del perfil en la BD (`Descripcion = "SuperAdmin"`)
4. **NO hay autenticación hardcodeada** en el código

El sistema es **híbrido**: Supabase maneja la autenticación, PostgreSQL maneja la autorización (roles y permisos).

---

## 🔄 Cambios Recientes (Enero 2025)

### Login por Username

**Antes:**
- Los usuarios ingresaban su email para iniciar sesión
- El email debía coincidir exactamente con el almacenado en Supabase Auth

**Ahora:**
- Los usuarios ingresan su **nombre de usuario** (username)
- El sistema resuelve automáticamente el username a email
- Soporte para emails automáticos (`username@puntox.com`) para empleados
- Normalización automática de usernames (lowercase, sin espacios)

**Beneficios:**
- ✅ Mayor flexibilidad: empleados no necesitan tener email personal
- ✅ Usernames más fáciles de recordar que emails
- ✅ Emails internos automáticos para empleados
- ✅ Consistencia: todos los usuarios usan username para login

**Archivos relacionados:**
- `src/components/auth/CredentialsForm.tsx` - Formulario de login actualizado
- `src/app/api/auth/get-email-by-username/route.ts` - Endpoint de resolución
- `src/lib/auth/generateInternalEmail.ts` - Generación de emails internos

