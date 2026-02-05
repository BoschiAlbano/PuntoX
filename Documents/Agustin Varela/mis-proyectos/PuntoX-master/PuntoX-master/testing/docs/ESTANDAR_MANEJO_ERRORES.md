# Estándar de Manejo de Errores en API Routes

**Fecha:** 5 de Febrero, 2026  
**Versión:** 1.0

---

## 📋 Resumen Ejecutivo

Este documento consolida el estándar de manejo de errores para las API routes de PuntoX, basado en:
- La implementación actual de `handleError` en `src/lib/errors/handler.ts`
- Los patrones observados en las rutas existentes
- Los problemas detectados durante los tests

---

## 🎯 Principios Generales

### 1. Siempre retornar una Response válida

**❌ Incorrecto:**
```typescript
export async function GET(req: NextRequest) {
  try {
    // ... lógica ...
  } catch (error) {
    return console.error(error); // ❌ Retorna undefined
  }
}
```

**✅ Correcto:**
```typescript
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    // ... lógica ...
  } catch (error) {
    return handleError(error); // ✅ Retorna NextResponse
  }
}
```

### 2. Usar `handleError` para errores inesperados

`handleError` mapea automáticamente:
- `AppErrorClass` → Respuesta JSON con código y mensaje
- Errores de Prisma → Respuestas específicas (400, 404, 409, 500)
- Errores de conexión a BD → 503 Service Unavailable
- Errores genéricos → 500 Internal Server Error

### 3. Validar y retornar errores específicos antes de operaciones costosas

**✅ Correcto:**
```typescript
export async function POST(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();
    if (authError) return authError; // ✅ Retornar temprano

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      ); // ✅ Error específico de validación
    }

    // ... operaciones costosas ...
  } catch (error) {
    return handleError(error); // ✅ Errores inesperados
  }
}
```

---

## 📊 Códigos de Estado HTTP

### 200 OK
- Operación exitosa
- GET que retorna datos
- PUT/PATCH que actualiza correctamente

### 201 Created
- POST que crea un recurso exitosamente

### 400 Bad Request
- Datos de entrada inválidos (validación de schema)
- Parámetros faltantes o incorrectos
- Reglas de negocio violadas (ej: total de formas de pago no coincide con total de venta)

### 401 Unauthorized
- Usuario no autenticado
- Token JWT inválido o expirado

### 403 Forbidden
- Usuario autenticado pero sin permisos
- Acceso denegado a recurso específico

### 404 Not Found
- Recurso no encontrado (ej: producto, cliente, comprobante)
- Endpoint no existe

### 409 Conflict
- Conflicto de estado (ej: intentar crear un recurso que ya existe)
- Violación de restricciones únicas

### 500 Internal Server Error
- Errores inesperados del servidor
- Errores de Prisma no categorizados
- Errores genéricos sin manejo específico

### 503 Service Unavailable
- Error de conexión a la base de datos
- Servicios externos no disponibles

---

## 🔧 Implementación del Estándar

### Estructura de Respuesta de Error

Todas las respuestas de error deben seguir este formato:

```typescript
{
  error: {
    code: string,        // Código de error (ej: "VALIDATION_ERROR", "NOT_FOUND")
    message: string,     // Mensaje legible para el usuario
    details?: unknown    // Detalles opcionales (ej: issues de Zod)
  }
}
```

**Ejemplo:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": [
      {
        "path": ["email"],
        "message": "Email inválido"
      }
    ]
  }
}
```

### Uso de `handleError`

```typescript
import { handleError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  try {
    // ... lógica de la ruta ...
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
```

### Uso de `AppErrorClass` para Errores Específicos

```typescript
import { createError } from "@/lib/errors/types";

// En validaciones
if (!cliente) {
  throw createError.notFound("Cliente no encontrado");
}

// En reglas de negocio
if (totalFormasPago !== totalVenta) {
  throw createError.validation(
    `El total de formas de pago (${totalFormasPago}) no coincide con el total de la venta (${totalVenta})`
  );
}
```

---

## 🚨 Problemas Conocidos y Soluciones

### Problema 1: Retorno de `undefined` en catch

**Ubicación:** `src/app/api/test/route.ts` (línea 82)

**Código problemático:**
```typescript
catch (error) {
  return console.error(error); // ❌ Retorna undefined
}
```

**Solución:**
```typescript
catch (error) {
  return handleError(error); // ✅ Retorna NextResponse
}
```

### Problema 2: Errores de validación no específicos

**Patrón problemático:**
```typescript
catch (error) {
  return NextResponse.json(
    { error: "Error" },
    { status: 500 }
  ); // ❌ No usa handleError, no incluye detalles
}
```

**Solución:**
```typescript
// Validar antes del try
const parsed = schema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Datos inválidos", details: parsed.error.issues },
    { status: 400 }
  );
}

// O en el catch
catch (error) {
  return handleError(error); // ✅ Maneja automáticamente errores de Prisma
}
```

### Problema 3: No validar autenticación temprano

**Patrón problemático:**
```typescript
try {
  // ... operaciones costosas ...
  const { tenantId } = await getAuthUser(); // ❌ Muy tarde
} catch (error) {
  return handleError(error);
}
```

**Solución:**
```typescript
try {
  const { tenantId, error: authError } = await getAuthUser();
  if (authError) return authError; // ✅ Retornar temprano

  // ... operaciones costosas ...
} catch (error) {
  return handleError(error);
}
```

---

## 📝 Checklist para Nuevas Rutas

Al crear una nueva API route, verificar:

- [ ] Usa `handleError` en el bloque `catch`
- [ ] Valida autenticación/permisos temprano (antes de operaciones costosas)
- [ ] Valida datos de entrada con schemas de Zod
- [ ] Retorna códigos de estado HTTP apropiados (200, 201, 400, 401, 403, 404, 500)
- [ ] Incluye mensajes de error descriptivos
- [ ] No retorna `undefined` en ningún caso
- [ ] Maneja errores de Prisma correctamente (usando `handleError`)
- [ ] Documenta casos de error en tests

---

## 🔍 Rutas que Requieren Corrección

Basado en los tests y análisis del código:

### Prioridad ALTA

1. **`src/app/api/test/route.ts`**
   - ❌ Retorna `undefined` en catch
   - ✅ Debe usar `handleError`

### Prioridad MEDIA

2. **Rutas que usan `console.error` en catch**
   - Buscar archivos con `console.error` o `console.log` en bloques catch
   - Reemplazar por `handleError`

3. **Rutas que retornan errores genéricos 500**
   - Revisar si pueden ser más específicos (400, 404, etc.)
   - Usar `createError` para errores específicos

---

## 📚 Referencias

- **Implementación de `handleError`:** `src/lib/errors/handler.ts`
- **Tipos de error:** `src/lib/errors/types.ts`
- **Tests de manejo de errores:** `testing/lib/error-handler.test.ts`
- **Problemas pendientes:** `testing/PROBLEMAS_PENDIENTES.md`

---

## 🎓 Ejemplos Completos

### Ejemplo 1: GET con validación de autenticación

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();
    if (authError) return authError;

    const productos = await prisma.articulo.findMany({
      where: { TenantId: BigInt(tenantId), EstaEliminado: false },
    });

    return NextResponse.json({ data: productos }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
```

### Ejemplo 2: POST con validación de datos

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError, createError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

const schema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();
    if (authError) return authError;

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Datos inválidos",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const nuevo = await prisma.recurso.create({
      data: { ...parsed.data, TenantId: BigInt(tenantId) },
    });

    return NextResponse.json({ data: nuevo }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### Ejemplo 3: PUT con validación de existencia

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError, createError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";

export async function PUT(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID requerido" } },
        { status: 400 }
      );
    }

    const existente = await prisma.recurso.findUnique({
      where: { Id: BigInt(id), TenantId: BigInt(tenantId) },
    });

    if (!existente) {
      throw createError.notFound("Recurso no encontrado");
    }

    const actualizado = await prisma.recurso.update({
      where: { Id: BigInt(id) },
      data,
    });

    return NextResponse.json({ data: actualizado }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
```

---

**Última actualización:** 5 de Febrero, 2026
