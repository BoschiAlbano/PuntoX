import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import crypto from "crypto";

/**
 * POST /api/auth/registrar-sesion
 * Registra o actualiza una sesión activa cuando un usuario inicia sesión.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, dispositivo, ubicacion } = body;
    let { esConfiable } = body;

    // Obtener usuario autenticado
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
        { status: 400 },
      );
    }

    // Buscar el usuario en la BD
    const usuario = await prisma.usuario.findFirst({
      where: {
        AuthUserId: user.id,
        TenantId: BigInt(tenantId),
      },
      select: {
        Id: true,
        TenantId: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Obtener IP y User-Agent
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-client-ip") ||
      "unknown";

    const userAgent = req.headers.get("user-agent") || null;

    // VULNERABILITY FIX: Un atacante podría enviar esConfiable=true en el nivel AAL1 
    // antes de pasar el 2FA. Debemos forzar esConfiable=false si el usuario requiere AAL2 pero solo tiene AAL1.
    if (esConfiable) {
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaData?.nextLevel === "aal2" && mfaData?.currentLevel === "aal1") {
        console.warn("Intento de registrar dispositivo confiable bloqueado (Usuario pendiente de 2FA).");
        esConfiable = false;
      }
    }

    // Generar hash del token si no se proporciona
    const tokenHash = token
      ? crypto.createHash("sha256").update(token).digest("hex")
      : crypto
          .createHash("sha256")
          .update(user.id + Date.now().toString())
          .digest("hex");

    // Extraer session_id del JWT provisto en el body para identificación estable de sesión
    let supabaseSessionId: string | null = null;
    
    // Priorizar el token enviado por el cliente en el body, que es 100% fresco
    if (token) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString()
        );
        supabaseSessionId = payload.session_id || null;
      } catch {
        // Fallback
      }
    }

    // Si no vino en el body, intentar con la cookie de la sesión del servidor
    if (!supabaseSessionId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          const payload = JSON.parse(
            Buffer.from(session.access_token.split(".")[1], "base64url").toString()
          );
          supabaseSessionId = payload.session_id || null;
        } catch {
          // no crítico
        }
      }
    }

    // Deduplicación de sesiones:
    // 1. Prioridad: buscar por SupabaseSessionId (identifica inequívocamente la sesión de Supabase,
    //    no rota con el token refresh, solo cambia al hacer signOut+signIn).
    // 2. Fallback: si no hay SupabaseSessionId, buscar por Dispositivo+IpAddress+UserAgent
    //    (comportamiento anterior, solo para sesiones sin session_id registrado).
    let sesionExistente: Array<{ Id: bigint }> = [];

    if (supabaseSessionId) {
      // Estrategia 1: buscar por SupabaseSessionId (activa o inactiva — puede haberse cerrado
      // remotamente pero Supabase aún emite SIGNED_IN por el mismo session_id al refrescar token;
      // en ese caso NO se debe reactivar: solo actualizar si está activa)
      sesionExistente = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
        `
        SELECT "Id" FROM "SesionActiva"
        WHERE "TenantId" = $1
          AND "UsuarioId" = $2
          AND "SupabaseSessionId" = $3
          AND "EstaActiva" = true
        LIMIT 1
      `,
        usuario.TenantId,
        usuario.Id,
        supabaseSessionId,
      );
    }

    if (sesionExistente.length === 0) {
      // Estrategia 2: fallback por Dispositivo+IpAddress+UserAgent (sesiones sin SupabaseSessionId)
      sesionExistente = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
        `
        SELECT "Id" FROM "SesionActiva"
        WHERE "TenantId" = $1
          AND "UsuarioId" = $2
          AND "EstaActiva" = true
          AND "SupabaseSessionId" IS NULL
          AND COALESCE("Dispositivo", '') = COALESCE($3, '')
          AND COALESCE("IpAddress", '') = COALESCE($4, '')
          AND COALESCE("UserAgent", '') = COALESCE($5, '')
        ORDER BY "FechaUltimaActividad" DESC
        LIMIT 1
      `,
        usuario.TenantId,
        usuario.Id,
        dispositivo || null,
        ipAddress,
        userAgent,
      );
    }

    let sesionId = null;

    if (sesionExistente && sesionExistente.length > 0) {
      // Actualizar sesión existente
      await prisma.$executeRawUnsafe(
        `
        UPDATE "SesionActiva"
        SET "FechaUltimaActividad" = NOW(),
            "TokenHash" = $1,
            "IpAddress" = $2,
            "UserAgent" = $3,
            "Dispositivo" = $4,
            "Ubicacion" = $5,
            "EsConfiable" = $6,
            "SupabaseSessionId" = COALESCE($8, "SupabaseSessionId")
        WHERE "Id" = $7
      `,
        tokenHash,
        ipAddress,
        userAgent,
        dispositivo || null,
        ubicacion || null,
        esConfiable === true,
        sesionExistente[0].Id,
        supabaseSessionId,
      );
      sesionId = Number(sesionExistente[0].Id);
    } else {
      // Nueva sesión: primero cerrar sesiones anteriores del mismo dispositivo (UserAgent)
      // que hayan quedado huérfanas (el usuario cerró el tab sin hacer logout explícito).
      // Esto previene la acumulación de sesiones activas fantasma.
      if (userAgent) {
        await prisma.$executeRawUnsafe(
          `
          UPDATE "SesionActiva"
          SET "EstaActiva" = false
          WHERE "TenantId" = $1
            AND "UsuarioId" = $2
            AND "EstaActiva" = true
            AND COALESCE("UserAgent", '') = COALESCE($3, '')
        `,
          usuario.TenantId,
          usuario.Id,
          userAgent,
        );
      }

      // Crear nueva sesión
      const nuevaSesion = await prisma.$queryRawUnsafe<Array<{ Id: bigint }>>(
        `
        INSERT INTO "SesionActiva" ("TenantId", "UsuarioId", "TokenHash", "SupabaseSessionId", "IpAddress", "UserAgent", "Dispositivo", "Ubicacion", "FechaInicio", "FechaUltimaActividad", "EstaActiva", "EsConfiable")
        VALUES ($1, $2, $3, $9, $4, $5, $6, $7, NOW(), NOW(), true, $8)
        RETURNING "Id"
      `,
        usuario.TenantId,
        usuario.Id,
        tokenHash,
        ipAddress,
        userAgent,
        dispositivo || null,
        ubicacion || null,
        esConfiable === true,
        supabaseSessionId,
      );
      sesionId = nuevaSesion && nuevaSesion.length > 0 ? Number(nuevaSesion[0].Id) : null;
    }

    // Si es confiable, también registrar en DispositivoConfiable
    // Nota: Aceptamos cualquier IP, incluyendo "::1" (localhost)
    if (esConfiable === true && userAgent) {
      const cookieStore = await cookies();
      const existingToken = cookieStore.get("trusted_device_token")?.value;

      if (!existingToken) {
        // Generar un token único y seguro
        const deviceToken = crypto.randomUUID();
        
        const nombreDispositivo =
          dispositivo ||
          userAgent?.substring(0, 50) ||
          "Dispositivo desconocido";

        // Insertar nuevo dispositivo confiable
        try {
          await prisma.$executeRawUnsafe(
            `
            INSERT INTO "DispositivoConfiable" ("TenantId", "UsuarioId", "NombreDispositivo", "Token", "UserAgent", "IpAddress", "FechaRegistro", "FechaUltimoUso", "EstaActivo")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), true)
          `,
            usuario.TenantId,
            usuario.Id,
            nombreDispositivo,
            deviceToken,
            userAgent,
            ipAddress,
          );

          // Setear la cookie HttpOnly con el token
          cookieStore.set("trusted_device_token", deviceToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 días
          });
        } catch (deviceError) {
          console.error("[registrar-sesion] ERROR al registrar DispositivoConfiable:", deviceError);
        }
      } else {
        // Ya tiene cookie: solo actualizar FechaUltimoUso
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE "DispositivoConfiable" SET "FechaUltimoUso" = NOW() WHERE "Token" = $1`,
            existingToken,
          );
        } catch (updateError) {
          console.error("[registrar-sesion] ERROR al actualizar FechaUltimoUso:", updateError);
        }
      }
    }

    return NextResponse.json(
      {
        message: "Sesión registrada correctamente",
        sesionId,
      },
      { status: 200 },
    );
  } catch (error) {
    // No queremos que un error en el registro de sesión rompa el login
    console.error("[registrar-sesion] ERROR GENERAL en POST:", error);
    return NextResponse.json(
      { message: "Error al registrar sesión (no crítico)" },
      { status: 200 }, // Retornamos 200 para no interrumpir el flujo
    );
  }
}

/**
 * DELETE /api/auth/registrar-sesion
 * Cierra una sesión (logout)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sesionId = searchParams.get("sesionId");

    if (sesionId) {
      // Cerrar sesión específica
      await prisma.$executeRawUnsafe(
        `
        UPDATE "SesionActiva"
        SET "EstaActiva" = false
        WHERE "Id" = $1
      `,
        BigInt(sesionId),
      );
    } else {
      // Cerrar todas las sesiones del usuario actual
      const supabase = await getSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const tenantId = user.app_metadata?.tenantId;
        if (tenantId) {
          const usuario = await prisma.$queryRawUnsafe<
            Array<{
              Id: bigint;
              TenantId: bigint;
            }>
          >(
            `
            SELECT "Id", "TenantId" FROM "Usuario"
            WHERE "AuthUserId" = $1 AND "TenantId" = $2
            LIMIT 1
          `,
            user.id,
            BigInt(tenantId),
          );

          if (usuario && usuario.length > 0) {
            await prisma.$executeRawUnsafe(
              `
              UPDATE "SesionActiva"
              SET "EstaActiva" = false
              WHERE "TenantId" = $1
                AND "UsuarioId" = $2
                AND "EstaActiva" = true
            `,
              usuario[0].TenantId,
              usuario[0].Id,
            );
          }
        }
      }
    }

    return NextResponse.json(
      { message: "Sesión cerrada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    // handleError ya registra el error internamente
    return NextResponse.json(
      { message: "Error al cerrar sesión (no crítico)" },
      { status: 200 },
    );
  }
}
