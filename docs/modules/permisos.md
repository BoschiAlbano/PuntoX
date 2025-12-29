# Documentación del Sistema de Permisos

## 📋 Resumen

El sistema de permisos de PuntoX utiliza una arquitectura granular basada en roles y permisos explícitos. Se implementó la **Opción B**: solo SuperAdmin tiene acceso automático a todo, mientras que Administradores y Empleados requieren permisos explícitos asignados.

---

## 🎯 Arquitectura del Sistema

### Jerarquía de Acceso

1. **SuperAdmin** → Acceso completo automático (bypass de permisos)
2. **Administrador** → Requiere permisos explícitos asignados
3. **Empleado** → Requiere permisos explícitos asignados

### Componentes del Sistema

#### 1. Modelos de Base de Datos

- **`Perfiles`**: Roles del sistema (Administrador, Empleado, etc.)
  - Campo `Tipo`: `ADMINISTRADOR` o `EMPLEADO`
  - Campo `Descripcion`: Nombre del perfil (ej: "SuperAdmin", "Vendedor")
  
- **`Permiso`**: Permisos funcionales disponibles
  - Campo `Clave`: Identificador único del permiso (ej: "empleados:admin")
  - Campo `Descripcion`: Descripción legible del permiso
  
- **`PerfilPermiso`**: Relación muchos-a-muchos entre perfiles y permisos
  - Asigna permisos específicos a roles

- **`PerfilUsuario`**: Relación muchos-a-muchos entre usuarios y perfiles
  - Asigna roles a usuarios

#### 2. Helpers de Backend

**`src/lib/requirePermiso.ts`**
- Función `requirePermiso(clavePermiso)`: Verifica permisos en API routes
- Bypass automático para SuperAdmin
- Lanza `PermisoError` si no tiene permisos

**`src/app/api/permisos/route.ts`**
- Endpoint GET que retorna permisos del usuario actual
- Retorna `isSuperAdmin`, `esAdministrador`, `permisos`, `roles`

---

## 🔐 Uso del Sistema

### En API Routes (Backend)

```typescript
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";

export async function GET(req: NextRequest) {
  try {
    // Verificar permiso específico
    // SuperAdmin pasa automáticamente, otros necesitan el permiso
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");
    
    // Continuar con la lógica del endpoint
    // ...
    
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return handleError(error);
  }
}
```

### En Páginas (Frontend)

```typescript
const loadData = async () => {
  try {
    const permisosRes = await fetch("/api/permisos", {
      cache: "no-store",
    });
    
    if (!permisosRes.ok) {
      // Manejar error de permisos
      return;
    }
    
    const permisosJson = await permisosRes.json();
    
    // Verificar acceso
    const esSuperAdmin = permisosJson?.isSuperAdmin === true;
    const tienePermiso = esSuperAdmin || 
      permisosJson?.permisos?.includes("empleados:admin");
    
    if (!tienePermiso) {
      // Bloquear acceso
      setIsAuthorized(false);
      return;
    }
    
    // Continuar cargando datos
    // ...
    
  } catch (error) {
    // Manejar error
  }
};
```

---

## 📝 Convenciones de Nomenclatura de Permisos

### Formato
Los permisos siguen el formato: `{modulo}:{accion}`

### Ejemplos de Permisos

| Permiso | Descripción |
|---------|-------------|
| `empleados:admin` | Acceso completo a gestión de empleados |
| `empleados:read` | Solo lectura de empleados |
| `productos:admin` | Acceso completo a gestión de productos |
| `productos:create` | Crear productos |
| `productos:update` | Actualizar productos |
| `productos:delete` | Eliminar productos |
| `ventas:admin` | Acceso completo a módulo de ventas |
| `caja:admin` | Acceso completo a gestión de caja |
| `clientes:admin` | Acceso completo a gestión de clientes |
| `configuracion:admin` | Acceso a configuración del sistema |
| `analiticas:view` | Ver analíticas y reportes |

### Reglas de Nomenclatura

1. **Usar minúsculas** para módulos y acciones
2. **Separar con dos puntos** (`:`) entre módulo y acción
3. **Usar verbos** para acciones (admin, read, create, update, delete, view)
4. **Usar singular** para módulos (empleado, producto, cliente)

---

## 🔧 Configuración de Permisos

### Asignar Permiso a un Rol

Los permisos se asignan a roles (perfiles), no directamente a usuarios. Los usuarios heredan los permisos de sus roles asignados.

**Ejemplo en código:**
```typescript
// Crear permiso
await prisma.permiso.create({
  data: {
    Clave: "empleados:admin",
    Descripcion: "Administración completa de empleados",
    TenantId: tenantIdBigInt,
  },
});

// Asignar permiso a un perfil
await prisma.perfilPermiso.create({
  data: {
    PerfilId: perfilIdBigInt,
    PermisoId: permisoIdBigInt,
    TenantId: tenantIdBigInt,
  },
});
```

### Asignar Rol a un Usuario

```typescript
await prisma.perfilUsuario.create({
  data: {
    Perfil_Id: perfilIdBigInt,
    Usuario_Id: usuarioIdBigInt,
    TenantId: tenantIdBigInt,
  },
});
```

---

## 🚨 SuperAdmin: Caso Especial

### Identificación

SuperAdmin se identifica por el nombre del perfil:
- Nombre exacto: `"SuperAdmin"`
- Case-insensitive: `"superadmin"` también es válido

### Características

- ✅ **Bypass automático:** No necesita verificar permisos específicos
- ✅ **Acceso completo:** Tiene acceso a todas las funcionalidades
- ✅ **Sin configuración:** No requiere asignación de permisos

### Verificación en Código

```typescript
// Backend
const esSuperAdmin = usuario.PerfilUsuario.some(
  (pu) => {
    const descripcion = pu.Perfiles.Descripcion?.trim() || "";
    return descripcion === "SuperAdmin" || 
           descripcion.toLowerCase() === "superadmin";
  }
);

// Frontend
const esSuperAdmin = permisosJson?.isSuperAdmin === true;
```

---

## 📊 Flujo de Verificación de Permisos

### 1. Usuario hace una petición

### 2. Backend verifica autenticación
```typescript
const supabase = await getSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new PermisoError("No autenticado", 401);
```

### 3. Se busca usuario en BD y sus roles/permisos
```typescript
const usuario = await prisma.usuario.findFirst({
  where: { AuthUserId: user.id, EstaEliminado: false },
  select: {
    PerfilUsuario: {
      select: {
        Perfiles: {
          select: {
            Descripcion: true,
            Tipo: true,
            PerfilPermiso: {
              select: {
                Permiso: { select: { Clave: true } }
              }
            }
          }
        }
      }
    }
  }
});
```

### 4. Verificación de SuperAdmin (bypass)
```typescript
if (esSuperAdmin) {
  return { permisos: ["*"] }; // Acceso completo
}
```

### 5. Verificación de permiso específico
```typescript
const tienePermiso = permisos.includes(clavePermiso);
if (!tienePermiso) {
  throw new PermisoError("Sin permisos", 403);
}
```

---

## 🔍 Troubleshooting

### Problema: Usuario no puede acceder aunque tiene el rol

**Causas posibles:**
1. El rol no tiene el permiso asignado
2. El permiso está eliminado (`EstaEliminado: true`)
3. El usuario no tiene el rol asignado

**Solución:**
- Verificar en BD la tabla `PerfilPermiso`
- Verificar que `Permiso.EstaEliminado = false`
- Verificar que el usuario tenga el rol en `PerfilUsuario`

### Problema: SuperAdmin no tiene acceso

**Causas posibles:**
1. El perfil no se llama exactamente "SuperAdmin" (case-sensitive)
2. El usuario no tiene el perfil SuperAdmin asignado

**Solución:**
- Verificar nombre del perfil en tabla `Perfiles`
- Verificar que el usuario tenga el perfil en `PerfilUsuario`
- Usar nombre exacto "SuperAdmin" (case-insensitive en código)

### Problema: Administrador no tiene acceso aunque debería

**Causa:** Con la Opción B, los administradores necesitan permisos explícitos.

**Solución:**
- Asignar el permiso específico al rol Administrador
- O asignar el permiso directamente al usuario (si se implementa)

---

## 📈 Mejoras Futuras Sugeridas

1. **UI para gestión de permisos:**
   - Página para asignar permisos a roles
   - Página para asignar roles a usuarios
   - Visualización de permisos del usuario actual

2. **Permisos granulares:**
   - Expandir permisos a nivel de acciones (read, create, update, delete)
   - Implementar permisos por recurso (ej: productos:create, productos:update)

3. **Auditoría:**
   - Log de cambios en permisos
   - Historial de accesos denegados

4. **Helpers adicionales:**
   - `requireAnyPermiso([...permisos])` - Requiere uno de varios permisos
   - `requireAllPermisos([...permisos])` - Requiere todos los permisos
   - Hook de React `usePermiso(permiso)` para verificación en frontend

---

## 📚 Referencias

- `src/lib/requirePermiso.ts` - Implementación principal
- `src/app/api/permisos/route.ts` - API de permisos
- `CHANGELOG_SESION_2024-12.md` - Changelog de la implementación

---

**Última actualización:** Diciembre 2024







