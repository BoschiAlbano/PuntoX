# 🔐 Mejoras en el Sistema de Autenticación - PuntoX

**Fecha:** Diciembre 2024  
**Estado Actual:** Funcional pero con áreas de mejora

---

## 📊 Resumen Ejecutivo

El sistema de autenticación actual funciona correctamente, pero tiene **8 mejoras importantes** que aumentan la seguridad y la experiencia de usuario.

**Prioridad:**
- 🔴 **Críticas:** Rate limiting, logging de intentos
- 🟡 **Importantes:** Manejo de errores, validaciones, UX
- 🟢 **Mejoras:** Timeout configurable, CSRF, 2FA

---

## 🔴 PRIORIDAD 1: Seguridad Crítica

### 1.1 Rate Limiting en Login ⚠️ CRÍTICO
**Impacto:** 🔴 CRÍTICO - Protección contra fuerza bruta  
**Tiempo:** 2-3 horas  
**Dificultad:** Media

**Problema actual:**
- Sin rate limiting en `/api/auth/login` o en el formulario
- Vulnerable a ataques de fuerza bruta
- No hay límite de intentos fallidos

**Solución:**

#### Opción A: Rate Limiting en API Route (Recomendado)
```typescript
// src/app/api/auth/login/route.ts (NUEVO)
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 intentos cada 15 minutos
  analytics: true,
});

export async function POST(req: NextRequest) {
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const identifier = `login:${ip}`;

  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    return NextResponse.json(
      {
        error: "Demasiados intentos. Intenta de nuevo en 15 minutos.",
        reset: new Date(reset).toISOString(),
      },
      { status: 429 }
    );
  }

  // Continuar con el login...
}
```

#### Opción B: Rate Limiting por Email
```typescript
// Limitar por email en lugar de IP
const identifier = `login:${email}`;
```

**Checklist:**
- [ ] Instalar `@upstash/ratelimit` y `@upstash/redis`
- [ ] Crear API route `/api/auth/login`
- [ ] Implementar rate limiting
- [ ] Actualizar `CredentialsForm` para usar la nueva API
- [ ] Mostrar mensaje cuando se alcanza el límite

---

### 1.2 Logging de Intentos de Login Fallidos
**Impacto:** 🔴 ALTO - Seguridad y auditoría  
**Tiempo:** 2-3 horas  
**Dificultad:** Media

**Problema actual:**
- No se registran intentos de login fallidos
- No hay forma de detectar ataques
- No hay auditoría de accesos

**Solución:**
```typescript
// src/lib/auth/loginLogger.ts (NUEVO)
import prisma from "@/DB/prisma";

export async function logLoginAttempt(
  email: string,
  success: boolean,
  ip?: string,
  userAgent?: string,
  error?: string
) {
  try {
    await prisma.log.create({
      data: {
        Nivel: success ? "INFO" : "WARNING",
        Servicio: "auth",
        Mensaje: success
          ? `Login exitoso: ${email}`
          : `Intento de login fallido: ${email} - ${error}`,
        Metadata: JSON.stringify({
          email,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    // No fallar si el logging falla
    console.error("Error logging login attempt:", error);
  }
}
```

**Uso:**
```typescript
// En CredentialsForm o API route
await logLoginAttempt(
  email,
  false,
  req.ip,
  req.headers.get("user-agent"),
  authError.message
);
```

**Checklist:**
- [ ] Crear función de logging
- [ ] Integrar en formulario de login
- [ ] Crear dashboard de auditoría (opcional)
- [ ] Alertas para múltiples fallos (opcional)

---

### 1.3 Validar Usuario Activo Antes de Login
**Impacto:** 🟡 MEDIO - Seguridad  
**Tiempo:** 1 hora  
**Dificultad:** Fácil

**Problema actual:**
- No se verifica si el usuario está activo antes de permitir login
- Usuarios eliminados pueden intentar login

**Solución:**
```typescript
// En requirePermiso o en API de login
const usuario = await prisma.usuario.findFirst({
  where: {
    AuthUserId: user.id,
    EstaEliminado: false, // ✅ Ya existe
  },
  include: {
    Tenant: {
      select: {
        EstaActivo: true, // ✅ Verificar tenant activo
      },
    },
  },
});

if (!usuario || !usuario.Tenant?.EstaActivo) {
  throw new PermisoError("Usuario o tenant inactivo", 403);
}
```

**Checklist:**
- [ ] Verificar que `EstaEliminado` se valida en login
- [ ] Verificar que `Tenant.EstaActivo` se valida
- [ ] Mostrar mensaje claro si está inactivo

---

## 🟡 PRIORIDAD 2: Mejoras de UX y Errores

### 2.1 Mejor Manejo de Errores en Login
**Impacto:** 🟡 MEDIO - UX  
**Tiempo:** 1-2 horas  
**Dificultad:** Fácil

**Problema actual:**
```typescript
// CredentialsForm.tsx - Línea 30-31
catch (err) {
  console.error("Error al iniciar sesion:", err);
  setError("Credenciales invalidas"); // ⚠️ Mensaje genérico
}
```

**Problemas:**
- Mensaje genérico para todos los errores
- No diferencia entre "email inválido" y "contraseña incorrecta"
- No muestra si el usuario está bloqueado

**Solución:**
```typescript
// CredentialsForm.tsx
catch (err) {
  let errorMessage = "Credenciales inválidas";
  
  if (err instanceof Error) {
    // Errores específicos de Supabase
    if (err.message.includes("Invalid login credentials")) {
      errorMessage = "Email o contraseña incorrectos";
    } else if (err.message.includes("Email not confirmed")) {
      errorMessage = "Por favor confirma tu email antes de iniciar sesión";
    } else if (err.message.includes("Too many requests")) {
      errorMessage = "Demasiados intentos. Intenta de nuevo en unos minutos";
    } else if (err.message.includes("User not found")) {
      errorMessage = "Usuario no encontrado";
    } else {
      errorMessage = err.message;
    }
  }
  
  setError(errorMessage);
}
```

**Checklist:**
- [ ] Mapear errores de Supabase a mensajes claros
- [ ] Agregar mensajes específicos para cada caso
- [ ] Mejorar UX con mensajes más descriptivos

---

### 2.2 Loading State en Formulario de Login
**Impacto:** 🟡 MEDIO - UX  
**Tiempo:** 30 minutos  
**Dificultad:** Fácil

**Problema actual:**
- No hay indicador de carga durante el login
- El usuario puede hacer múltiples clicks

**Solución:**
```typescript
// CredentialsForm.tsx
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true); // ✅ Agregar

  try {
    // ... código de login
  } catch (err) {
    // ... manejo de errores
  } finally {
    setIsLoading(false); // ✅ Agregar
  }
};

// En el botón:
<button
  type="submit"
  disabled={isLoading}
  className={...}
>
  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
</button>
```

**Checklist:**
- [ ] Agregar estado de loading
- [ ] Deshabilitar botón durante login
- [ ] Mostrar spinner o texto de carga

---

### 2.3 Validación de Email Mejorada
**Impacto:** 🟡 BAJO - UX  
**Tiempo:** 30 minutos  
**Dificultad:** Fácil

**Problema actual:**
- Solo validación HTML básica (`type="email"`)
- No valida formato específico

**Solución:**
```typescript
// Validación con regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

// En el formulario
const [emailError, setEmailError] = useState("");

const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setEmail(value);
  
  if (value && !validateEmail(value)) {
    setEmailError("Email inválido");
  } else {
    setEmailError("");
  }
};
```

**Checklist:**
- [ ] Agregar validación de email con regex
- [ ] Mostrar error en tiempo real
- [ ] Validar antes de enviar

---

## 🟢 PRIORIDAD 3: Mejoras Avanzadas

### 3.1 Timeout de Sesión Configurable
**Impacto:** 🟢 BAJO - Seguridad  
**Tiempo:** 2-3 horas  
**Dificultad:** Media

**Problema actual:**
- Timeout de sesión fijo (configurado en Supabase)
- No se puede personalizar por tenant

**Solución:**
```typescript
// Configurar en Supabase Dashboard o vía API
// O implementar refresh manual de token

// src/lib/auth/sessionManager.ts (NUEVO)
export async function refreshSessionIfNeeded() {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;
  
  // Verificar si está por expirar (últimos 5 minutos)
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;
  
  if (timeUntilExpiry < 300) { // 5 minutos
    const { data, error } = await supabase.auth.refreshSession();
    return data.session;
  }
  
  return session;
}
```

**Checklist:**
- [ ] Implementar refresh automático de sesión
- [ ] Configurar timeout en Supabase
- [ ] Agregar notificación antes de expirar (opcional)

---

### 3.2 Protección CSRF
**Impacto:** 🟢 BAJO - Seguridad  
**Tiempo:** 2-3 horas  
**Dificultad:** Media

**Problema actual:**
- No hay protección explícita contra CSRF
- Supabase maneja algunos aspectos, pero se puede mejorar

**Solución:**
```typescript
// Agregar token CSRF en formularios
// Verificar en API routes

// src/lib/auth/csrf.ts (NUEVO)
import { cookies } from "next/headers";

export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hora
  });
  return token;
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get("csrf-token")?.value;
  return storedToken === token;
}
```

**Checklist:**
- [ ] Implementar generación de tokens CSRF
- [ ] Validar tokens en formularios
- [ ] Agregar a middleware (opcional)

---

### 3.3 Autenticación de Dos Factores (2FA)
**Impacto:** 🟢 BAJO - Seguridad avanzada  
**Tiempo:** 8-10 horas  
**Dificultad:** Alta

**Problema actual:**
- No hay 2FA implementado
- Solo email/password

**Solución:**
- Usar Supabase Auth 2FA (TOTP)
- O implementar SMS/Email OTP

**Nota:** Esta es una mejora avanzada que requiere configuración en Supabase y cambios significativos en el flujo de login.

**Checklist:**
- [ ] Habilitar 2FA en Supabase Dashboard
- [ ] Crear flujo de setup de 2FA
- [ ] Modificar formulario de login para solicitar código
- [ ] Agregar opción para deshabilitar 2FA

---

### 3.4 Verificación de Sesión en Middleware
**Impacto:** 🟢 BAJO - Seguridad  
**Tiempo:** 1 hora  
**Dificultad:** Fácil

**Problema actual:**
```typescript
// middleware.ts - Línea 66-72
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  return response; // ⚠️ No verifica si la sesión es válida
}
```

**Mejora:**
```typescript
// Verificar que la sesión no esté expirada
if (session) {
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  
  if (expiresAt && expiresAt > now) {
    return response; // Sesión válida
  }
  // Sesión expirada, continuar a redirección
}
```

**Checklist:**
- [ ] Verificar expiración de sesión en middleware
- [ ] Refrescar sesión si está por expirar
- [ ] Redirigir a login si expirada

---

## 📊 Resumen de Mejoras

| Prioridad | Mejora | Impacto | Tiempo | Dificultad |
|-----------|--------|---------|--------|------------|
| 🔴 1.1 | Rate limiting en login | CRÍTICO | 2-3h | Media |
| 🔴 1.2 | Logging de intentos | ALTO | 2-3h | Media |
| 🔴 1.3 | Validar usuario activo | MEDIO | 1h | Fácil |
| 🟡 2.1 | Mejor manejo de errores | MEDIO | 1-2h | Fácil |
| 🟡 2.2 | Loading state | MEDIO | 30min | Fácil |
| 🟡 2.3 | Validación email mejorada | BAJO | 30min | Fácil |
| 🟢 3.1 | Timeout configurable | BAJO | 2-3h | Media |
| 🟢 3.2 | Protección CSRF | BAJO | 2-3h | Media |
| 🟢 3.3 | 2FA | BAJO | 8-10h | Alta |
| 🟢 3.4 | Verificación sesión middleware | BAJO | 1h | Fácil |

---

## 🎯 Plan de Acción Recomendado

### Semana 1: Críticas (5-7 horas)
1. ✅ Rate limiting en login (2-3h) - **CRÍTICO**
2. ✅ Logging de intentos (2-3h) - **ALTO**
3. ✅ Validar usuario activo (1h) - **MEDIO**

### Semana 2: UX y Errores (2-3 horas)
1. ✅ Mejor manejo de errores (1-2h)
2. ✅ Loading state (30min)
3. ✅ Validación email mejorada (30min)

### Semana 3: Avanzadas (Opcional)
1. ✅ Timeout configurable (2-3h)
2. ✅ Protección CSRF (2-3h)
3. ✅ Verificación sesión middleware (1h)

**Total crítico:** 5-7 horas  
**Total completo:** 13-20 horas

---

## ✅ Checklist General

### Seguridad
- [ ] Rate limiting implementado
- [ ] Logging de intentos fallidos
- [ ] Validación de usuario activo
- [ ] Protección CSRF (opcional)
- [ ] 2FA (opcional)

### UX
- [ ] Mensajes de error claros
- [ ] Loading state en formulario
- [ ] Validación de email mejorada
- [ ] Feedback visual mejorado

### Técnico
- [ ] Timeout de sesión configurable
- [ ] Verificación de sesión en middleware
- [ ] Refresh automático de tokens

---

## 🎉 Conclusión

**Mejoras más importantes:**
1. **Rate limiting** (2-3h) - 🔴 **CRÍTICO**
2. **Logging de intentos** (2-3h) - 🔴 **ALTO**
3. **Mejor manejo de errores** (1-2h) - 🟡 **MEDIO**

**Recomendación:** Empezar con las críticas (5-7 horas) para mejorar significativamente la seguridad del sistema de autenticación.

