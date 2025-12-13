# Autenticación con Helper `getAuthUser`

## Problema

Antes teníamos código repetitivo en cada ruta API para obtener el usuario y el tenantId:

```typescript
const supabase = await getSupabaseServerClient();
const {
  data: { user },
} = await supabase.auth.getUser();

const tenantId = user?.app_metadata?.tenantId;

if (!tenantId) {
  return NextResponse.json({ message: "No autenticado" }, { status: 401 });
}
```

## Solución

Creamos una función helper reutilizable en `src/lib/auth/getAuthUser.ts`:

```typescript
export async function getAuthUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenantId = user?.app_metadata?.tenantId;

  if (!tenantId) {
    return {
      user: null,
      tenantId: null,
      error: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  return {
    user,
    tenantId: Number(tenantId),
    error: null,
  };
}
```

## Uso en rutas API

Ahora en cualquier ruta API puedes usar:

```typescript
import { getAuthUser } from "@/lib/auth/getAuthUser";

export async function GET(req: NextRequest) {
  const { user, tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  // Aquí ya tienes acceso a user y tenantId
  // tenantId ya viene como número
}
```

## Ventajas

1. **DRY (Don't Repeat Yourself)**: No repetimos código de autenticación
2. **Consistencia**: Todos los endpoints manejan la autenticación de la misma manera
3. **Mantenibilidad**: Si necesitas cambiar la lógica de autenticación, solo lo haces en un lugar
4. **Type Safety**: TypeScript infiere correctamente los tipos
5. **Simplicidad**: Reduce las líneas de código en cada endpoint

## Alternativa considerada: Headers desde Middleware

También se consideró pasar el usuario desde el middleware usando headers personalizados, pero tiene limitaciones:

- El middleware de Next.js no puede modificar headers de request de forma confiable
- Los headers tienen limitaciones de tamaño
- Es más complejo de implementar y mantener

Por eso optamos por la solución del helper function.

## Validación de datos con Zod

Además de la autenticación, es importante validar los datos de entrada antes de enviarlos a la base de datos.

### Ejemplo de schema de validación

```typescript
// src/lib/validations/marca.schema.ts
import { z } from "zod";

export const createMarcaSchema = z.object({
  Descripcion: z
    .string({ message: "La descripción debe ser un texto" })
    .min(1, { message: "La descripción no puede estar vacía" })
    .max(250, { message: "La descripción no puede exceder los 250 caracteres" })
    .trim(),
  EstaEliminado: z.boolean().optional().default(false),
});
```

### Uso en rutas API

```typescript
import { createMarcaSchema } from "@/lib/validations/marca.schema";
import { ZodError } from "zod";

export async function POST(req: Request) {
  const { tenantId, error } = await getAuthUser();

  if (error) {
    return error;
  }

  try {
    const body = await req.json();

    // Validar con Zod
    const validatedData = createMarcaSchema.parse(body);

    // Usar solo datos validados
    const marca = await prisma.marca.create({
      data: {
        Descripcion: validatedData.Descripcion,
        EstaEliminado: validatedData.EstaEliminado,
        TenantId: tenantId,
      },
    });

    return NextResponse.json(marca, { status: 201 });
  } catch (error) {
    // Manejo de errores de validación
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

### Beneficios de usar Zod

1. **Seguridad**: Previene inyección de datos maliciosos
2. **Type Safety**: TypeScript infiere los tipos automáticamente
3. **Validación robusta**: Valida tipos, longitudes, formatos, etc.
4. **Mensajes claros**: Errores descriptivos para el cliente
5. **Transformaciones**: Puede limpiar/transformar datos (ej: `.trim()`)
