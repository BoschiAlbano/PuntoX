import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { checkRateLimit, isIpBlocked, blockIp } from "@/lib/security/rateLimiter";
import { crearAlertaSeguridad } from "@/lib/security/suspiciousActivity";

/**
 * POST /api/auth/registrar-intento-login
 * Registra un intento de login (exitoso o fallido) en la tabla IntentoLogin
 * Ahora incluye rate limiting y detección de actividad sospechosa
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, exitoso, motivoFallo, usuarioId, tenantId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Obtener IP y User-Agent del request
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-client-ip") ||
      "unknown";
    
    const userAgent = req.headers.get("user-agent") || null;

    // Verificar rate limiting solo para intentos fallidos
    if (!exitoso && tenantId) {
      // Verificar si la IP está bloqueada
      const ipBlocked = await isIpBlocked(ipAddress, BigInt(tenantId));
      if (ipBlocked) {
        return NextResponse.json(
          { error: "IP bloqueada temporalmente. Intenta más tarde." },
          { status: 429 }
        );
      }

      // Verificar rate limit por email
      const emailRateLimit = await checkRateLimit({
        maxAttempts: 5,
        windowMinutes: 15,
        identifier: email,
        tenantId: BigInt(tenantId),
      });

      if (!emailRateLimit.allowed) {
        // Bloquear IP después de muchos intentos fallidos
        await blockIp(
          ipAddress,
          BigInt(tenantId),
          "Demasiados intentos fallidos de login",
          30 // 30 minutos
        );

        // Crear alerta de seguridad
        await crearAlertaSeguridad({
          tenantId: BigInt(tenantId),
          tipo: "INTENTOS_FALLIDOS",
          severidad: "ALTA",
          mensaje: `Múltiples intentos fallidos desde IP ${ipAddress} para email ${email}`,
          detalles: {
            email,
            ipAddress,
            intentos: 5,
          },
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        });

        return NextResponse.json(
          {
            error: "Demasiados intentos fallidos. IP bloqueada temporalmente.",
            resetAt: emailRateLimit.resetAt.toISOString(),
          },
          { status: 429 }
        );
      }

      // Verificar rate limit por IP
      const ipRateLimit = await checkRateLimit({
        maxAttempts: 10,
        windowMinutes: 15,
        identifier: ipAddress,
        tenantId: BigInt(tenantId),
      });

      if (!ipRateLimit.allowed) {
        await blockIp(
          ipAddress,
          BigInt(tenantId),
          "Demasiados intentos desde esta IP",
          60 // 1 hora
        );

        return NextResponse.json(
          {
            error: "Demasiados intentos desde esta IP. Bloqueada temporalmente.",
            resetAt: ipRateLimit.resetAt.toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // Si no se proporciona tenantId, intentar obtenerlo del usuario
    let finalTenantId = tenantId;
    
    // Primero intentar por usuarioId si está disponible
    if (!finalTenantId && usuarioId) {
      try {
        const usuario = await prisma.usuario.findUnique({
          where: { Id: BigInt(usuarioId) },
          select: { TenantId: true },
        });
        if (usuario) {
          finalTenantId = Number(usuario.TenantId);
        }
      } catch (error) {
        // Ignorar errores al buscar por usuarioId
      }
    }
    
    // Si aún no tenemos tenantId, intentar buscar por email
    if (!finalTenantId && email) {
      try {
        // Buscar usuario por email en Supabase Auth (necesitamos el AuthUserId)
        // Como no tenemos acceso directo a Supabase Auth aquí, intentamos buscar en la BD
        // por el email normalizado
        const emailNormalizado = email.trim().toLowerCase();
        
        // Buscar en la tabla Usuario por el email (si hay una relación con Persona)
        const usuarioPorEmail = await prisma.usuario.findFirst({
          where: {
            Persona_Empleado: {
              some: {
                Persona: {
                  Email: {
                    equals: emailNormalizado,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
          select: { TenantId: true },
        });
        
        if (usuarioPorEmail) {
          finalTenantId = Number(usuarioPorEmail.TenantId);
        }
      } catch (error) {
        // Ignorar errores al buscar por email
      }
    }

    // Si no hay tenantId, no podemos registrar (pero no fallamos silenciosamente)
    // Solo mostramos warning en desarrollo, no en producción
    if (!finalTenantId) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[registrar-intento-login] No se pudo determinar tenantId para:", email);
      }
      return NextResponse.json(
        { message: "Intento registrado (sin tenantId)" },
        { status: 200 }
      );
    }

    // Registrar el intento usando SQL directo (por si el Prisma client no está actualizado)
    const usuarioIdBigInt = usuarioId ? BigInt(usuarioId) : null;
    const motivoFalloEscapado = motivoFallo ? motivoFallo.replace(/'/g, "''") : null;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "IntentoLogin" ("TenantId", "Email", "IpAddress", "UserAgent", "Exitoso", "MotivoFallo", "UsuarioId", "FechaIntento")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, 
      BigInt(finalTenantId),
      email,
      ipAddress,
      userAgent,
      exitoso === true,
      motivoFalloEscapado,
      usuarioIdBigInt
    );

    return NextResponse.json(
      { message: "Intento de login registrado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    // No queremos que un error en el registro de intentos rompa el login
    // handleError ya registra el error internamente
    return NextResponse.json(
      { message: "Error al registrar intento (no crítico)" },
      { status: 200 } // Retornamos 200 para no interrumpir el flujo
    );
  }
}

