# Documentación: Implementación de Tokens CSRF

## 📋 Índice
1. [¿Qué es CSRF?](#qué-es-csrf)
2. [¿Por qué implementarlo?](#por-qué-implementarlo)
3. [Estado Actual](#estado-actual)
4. [Cómo Usar CSRF](#cómo-usar-csrf)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Endpoints que Deberían Usar CSRF](#endpoints-que-deberían-usar-csrf)

---

## ¿Qué es CSRF?

**CSRF (Cross-Site Request Forgery)** es un tipo de ataque donde un sitio web malicioso hace que el navegador de un usuario autenticado envíe peticiones no deseadas a otro sitio web donde el usuario tiene una sesión activa.

### Ejemplo de Ataque CSRF

```
1. Usuario está logueado en puntox.com
2. Usuario visita sitio-malo.com
3. sitio-malo.com envía una petición a puntox.com usando las cookies del usuario
4. La petición se ejecuta como si el usuario la hubiera hecho intencionalmente
```

**Sin protección CSRF:**
```html
<!-- En sitio-malo.com -->
<img src="https://puntox.com/api/configuracion?forzar2FA=false" />
```

**Con protección CSRF:**
- El servidor requiere un token CSRF único
- El token solo puede ser generado por el sitio legítimo
- El atacante no puede obtener el token válido

---

## ¿Por qué Implementarlo?

### ✅ Beneficios

1. **Protección contra ataques maliciosos**: Previene que sitios externos ejecuten acciones en nombre del usuario
2. **Cumplimiento de estándares**: Mejora la seguridad general de la aplicación
3. **Protección de operaciones críticas**: Especialmente importante para:
   - Cambios de configuración
   - Eliminación de datos
   - Cambios de permisos
   - Operaciones administrativas

### ⚠️ Cuándo NO es Crítico

- **Login/Registro**: Supabase Auth ya protege estos endpoints
- **Endpoints de solo lectura (GET)**: No modifican datos
- **APIs públicas**: No requieren autenticación

---

## Estado Actual

### ✅ Implementado

1. **Tabla en Base de Datos**: `TokenCsrf` (ver `prisma/schema.prisma`)
2. **Funciones de Utilidad**: `src/lib/security/csrf.ts`
   - `generateCsrfToken()` - Genera tokens CSRF
   - `validateCsrfToken()` - Valida tokens CSRF
   - `cleanupExpiredCsrfTokens()` - Limpia tokens expirados

### ❌ Pendiente de Integrar

- Generación de tokens en páginas del frontend
- Validación en endpoints críticos
- Integración en formularios existentes

---

## Cómo Usar CSRF

### Paso 1: Crear Endpoint para Generar Tokens

Crear `src/app/api/csrf-token/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { generateCsrfToken } from "@/lib/security/csrf";

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const tenantId = user.app_metadata?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "No se pudo determinar el tenant" },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || null;

    // Obtener usuarioId de la BD
    const usuario = await prisma.usuario.findFirst({
      where: {
        AuthUserId: user.id,
        TenantId: BigInt(tenantId),
      },
      select: { Id: true },
    });

    const token = await generateCsrfToken(
      BigInt(tenantId),
      usuario?.Id ? BigInt(usuario.Id) : undefined,
      ipAddress,
      userAgent
    );

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("[csrf-token] Error:", error);
    return NextResponse.json(
      { error: "Error al generar token CSRF" },
      { status: 500 }
    );
  }
}
```

### Paso 2: Obtener Token en el Frontend

En cualquier componente que necesite hacer peticiones POST/PUT/DELETE:

```typescript
"use client";

import { useState, useEffect } from "react";

export default function MiComponente() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Obtener token CSRF al cargar el componente
    fetch("/api/csrf-token")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.token))
      .catch((err) => console.error("Error al obtener CSRF token:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csrfToken) {
      alert("Esperando token CSRF...");
      return;
    }

    const response = await fetch("/api/mi-endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken, // Incluir token en header
      },
      body: JSON.stringify({ /* datos */ }),
    });

    // ... manejar respuesta
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... campos del formulario ... */}
    </form>
  );
}
```

### Paso 3: Validar Token en el Endpoint

En cualquier endpoint que modifique datos:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { validateCsrfToken } from "@/lib/security/csrf";

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener usuario autenticado
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const tenantId = user.app_metadata?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "No se pudo determinar el tenant" },
        { status: 400 }
      );
    }

    // 2. Obtener token CSRF del header
    const csrfToken = req.headers.get("X-CSRF-Token");
    if (!csrfToken) {
      return NextResponse.json(
        { error: "Token CSRF requerido" },
        { status: 403 }
      );
    }

    // 3. Validar token CSRF
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const isValid = await validateCsrfToken(
      csrfToken,
      BigInt(tenantId),
      ipAddress
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Token CSRF inválido o expirado" },
        { status: 403 }
      );
    }

    // 4. Si el token es válido, procesar la petición
    const body = await req.json();
    // ... lógica del endpoint ...

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[mi-endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error al procesar la petición" },
      { status: 500 }
    );
  }
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Formulario de Configuración

```typescript
// src/components/configuracion/ConfigForm.tsx
"use client";

import { useState, useEffect } from "react";

export default function ConfigForm() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [config, setConfig] = useState({ forzar2FA: false });

  useEffect(() => {
    fetch("/api/csrf-token")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.token));
  }, []);

  const handleSave = async () => {
    if (!csrfToken) return;

    const response = await fetch("/api/configuracion/seguridad", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      alert("Configuración guardada");
      // Obtener nuevo token para la próxima petición
      fetch("/api/csrf-token")
        .then((res) => res.json())
        .then((data) => setCsrfToken(data.token));
    }
  };

  return (
    <div>
      <input
        type="checkbox"
        checked={config.forzar2FA}
        onChange={(e) =>
          setConfig({ ...config, forzar2FA: e.target.checked })
        }
      />
      <button onClick={handleSave}>Guardar</button>
    </div>
  );
}
```

### Ejemplo 2: Endpoint Protegido

```typescript
// src/app/api/configuracion/seguridad/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { validateCsrfToken } from "@/lib/security/csrf";
import prisma from "@/DB/prisma";

export async function POST(req: NextRequest) {
  try {
    // Autenticación
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tenantId = user.app_metadata?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "No se pudo determinar el tenant" },
        { status: 400 }
      );
    }

    // Validación CSRF
    const csrfToken = req.headers.get("X-CSRF-Token");
    if (!csrfToken) {
      return NextResponse.json(
        { error: "Token CSRF requerido" },
        { status: 403 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const isValid = await validateCsrfToken(
      csrfToken,
      BigInt(tenantId),
      ipAddress
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Token CSRF inválido" },
        { status: 403 }
      );
    }

    // Procesar petición
    const body = await req.json();
    // ... guardar configuración ...

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[configuracion/seguridad] Error:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
```

---

## Endpoints que Deberían Usar CSRF

### 🔴 Alta Prioridad (Críticos)

- `POST /api/configuracion` - Cambios de configuración general
- `POST /api/configuracion/seguridad` - Cambios de seguridad
- `POST /api/configuracion/fiscal` - Cambios fiscales
- `DELETE /api/empleados/[id]` - Eliminar empleados
- `PUT /api/empleados/[id]` - Modificar empleados
- `POST /api/empleados/cambiar-password` - Cambiar contraseñas
- `POST /api/empleados/reenviar-invitacion` - Reenviar invitaciones

### 🟡 Media Prioridad (Importantes)

- `POST /api/productos` - Crear/modificar productos
- `POST /api/clientes` - Crear/modificar clientes
- `POST /api/ventas` - Procesar ventas
- `PUT /api/configuracion/notificaciones` - Cambiar notificaciones

### 🟢 Baja Prioridad (Opcional)

- `POST /api/auth/registrar-sesion` - Ya protegido por autenticación
- `GET /api/*` - Endpoints de solo lectura

---

## Mantenimiento

### Limpieza de Tokens Expirados

Los tokens CSRF expiran después de 30 minutos. Para limpiar tokens expirados periódicamente, crear un cron job o ejecutar manualmente:

```typescript
import { cleanupExpiredCsrfTokens } from "@/lib/security/csrf";

// Ejecutar periódicamente (ej: cada hora)
await cleanupExpiredCsrfTokens();
```

### Configuración

Los tokens CSRF tienen una expiración de **30 minutos** por defecto. Esto se puede ajustar en `src/lib/security/csrf.ts`:

```typescript
const CSRF_TOKEN_EXPIRY_MINUTES = 30; // Cambiar según necesidad
```

---

## Notas Importantes

1. **Un token por petición**: Cada token CSRF solo puede usarse una vez. Después de usarlo, se marca como "usado" y no puede reutilizarse.

2. **Obtener nuevo token**: Después de cada petición exitosa, obtener un nuevo token para la próxima petición.

3. **No usar en GET**: Los endpoints GET no deben requerir CSRF ya que no modifican datos.

4. **Compatibilidad con Supabase**: CSRF es complementario a la autenticación de Supabase, no la reemplaza.

5. **Testing**: Al probar endpoints con CSRF, asegurarse de:
   - Obtener el token primero
   - Incluirlo en el header `X-CSRF-Token`
   - No reutilizar tokens ya usados

---

## Referencias

- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN Web Docs - CSRF](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- Implementación en: `src/lib/security/csrf.ts`
- Schema: `prisma/schema.prisma` (modelo `TokenCsrf`)

---

**Última actualización**: Enero 2025  
**Estado**: Implementación completa, pendiente de integración en endpoints

