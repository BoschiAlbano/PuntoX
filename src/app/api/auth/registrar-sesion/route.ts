import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import crypto from "crypto";

/**
 * POST /api/auth/registrar-sesion
 * Registra o actualiza una sesión activa cuando un usuario inicia sesión
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, dispositivo, ubicacion, esConfiable } = body;
    
    // Debug: Log para verificar que esConfiable llegue correctamente
    console.log("[registrar-sesion] esConfiable recibido:", esConfiable, typeof esConfiable);

    // Obtener usuario autenticado
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
        { status: 404 }
      );
    }

    // Obtener IP y User-Agent
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-client-ip") ||
      "unknown";
    
    const userAgent = req.headers.get("user-agent") || null;

    // Generar hash del token si no se proporciona
    const tokenHash = token 
      ? crypto.createHash("sha256").update(token).digest("hex")
      : crypto.createHash("sha256").update(user.id + Date.now().toString()).digest("hex");

    // Verificar si ya existe una sesión activa para este usuario y token
    const sesionExistente = await prisma.$queryRawUnsafe<Array<{
      Id: bigint;
    }>>(`
      SELECT "Id" FROM "SesionActiva"
      WHERE "TenantId" = $1
        AND "UsuarioId" = $2
        AND "EstaActiva" = true
        AND "TokenHash" = $3
      LIMIT 1
    `, usuario.TenantId, usuario.Id, tokenHash);

    if (sesionExistente && sesionExistente.length > 0) {
      // Actualizar sesión existente
      await prisma.$executeRawUnsafe(`
        UPDATE "SesionActiva"
        SET "FechaUltimaActividad" = NOW(),
            "IpAddress" = $1,
            "UserAgent" = $2,
            "Dispositivo" = $3,
            "Ubicacion" = $4,
            "EsConfiable" = $5
        WHERE "Id" = $6
      `, 
        ipAddress,
        userAgent,
        dispositivo || null,
        ubicacion || null,
        esConfiable === true,
        sesionExistente[0].Id
      );

      return NextResponse.json(
        { 
          message: "Sesión actualizada",
          sesionId: Number(sesionExistente[0].Id),
        },
        { status: 200 }
      );
    }

    // Crear nueva sesión
    const nuevaSesion = await prisma.$queryRawUnsafe<Array<{
      Id: bigint;
    }>>(`
      INSERT INTO "SesionActiva" ("TenantId", "UsuarioId", "TokenHash", "IpAddress", "UserAgent", "Dispositivo", "Ubicacion", "FechaInicio", "FechaUltimaActividad", "EstaActiva", "EsConfiable")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), true, $8)
      RETURNING "Id"
    `,
      usuario.TenantId,
      usuario.Id,
      tokenHash,
      ipAddress,
      userAgent,
      dispositivo || null,
      ubicacion || null,
      esConfiable === true
    );

    // Si es confiable, también registrar en DispositivoConfiable
    // Nota: Aceptamos cualquier IP, incluyendo "::1" (localhost)
    console.log("[registrar-sesion] Verificando dispositivo confiable:", { esConfiable, userAgent, ipAddress, tipo: typeof esConfiable });
    if (esConfiable === true && userAgent) {
      console.log("[registrar-sesion] Intentando guardar dispositivo confiable");
      // Verificar si ya existe
      const dispositivoExistente = await prisma.$queryRawUnsafe<Array<{
        Id: bigint;
      }>>(`
        SELECT "Id" FROM "DispositivoConfiable"
        WHERE "TenantId" = $1
          AND "UsuarioId" = $2
          AND "UserAgent" = $3
          AND "IpAddress" = $4
          AND "EstaActivo" = true
        LIMIT 1
      `, usuario.TenantId, usuario.Id, userAgent, ipAddress);
      
      console.log("[registrar-sesion] Dispositivo existente:", dispositivoExistente);

      if (dispositivoExistente && dispositivoExistente.length > 0) {
        // Actualizar último uso
        await prisma.$executeRawUnsafe(`
          UPDATE "DispositivoConfiable"
          SET "FechaUltimoUso" = NOW()
          WHERE "Id" = $1
        `, dispositivoExistente[0].Id);
      } else {
        // Crear nuevo dispositivo confiable
        const nombreDispositivo = dispositivo || 
          userAgent?.substring(0, 50) || 
          "Dispositivo desconocido";
        
        // Intentar insertar, si ya existe actualizar
        try {
          console.log("[registrar-sesion] Insertando nuevo dispositivo confiable");
          await prisma.$executeRawUnsafe(`
            INSERT INTO "DispositivoConfiable" ("TenantId", "UsuarioId", "NombreDispositivo", "UserAgent", "IpAddress", "FechaRegistro", "FechaUltimoUso", "EstaActivo")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true)
          `,
            usuario.TenantId,
            usuario.Id,
            nombreDispositivo,
            userAgent,
            ipAddress
          );
          console.log("[registrar-sesion] Dispositivo confiable insertado correctamente");
        } catch (insertError: any) {
          console.log("[registrar-sesion] Error al insertar:", insertError?.code, insertError?.message);
          // Si falla por constraint único, actualizar en su lugar
          if (insertError?.code === "23505" || insertError?.message?.includes("unique") || insertError?.message?.includes("duplicate")) {
            console.log("[registrar-sesion] Dispositivo ya existe, actualizando");
            await prisma.$executeRawUnsafe(`
              UPDATE "DispositivoConfiable"
              SET "FechaUltimoUso" = NOW(), 
                  "EstaActivo" = true,
                  "NombreDispositivo" = $1
              WHERE "TenantId" = $2
                AND "UsuarioId" = $3
                AND "UserAgent" = $4
                AND "IpAddress" = $5
            `,
              nombreDispositivo,
              usuario.TenantId,
              usuario.Id,
              userAgent,
              ipAddress
            );
            console.log("[registrar-sesion] Dispositivo confiable actualizado correctamente");
          } else {
            console.error("[registrar-sesion] Error no manejado al insertar dispositivo:", insertError);
            // No lanzamos el error para no interrumpir el flujo
          }
        }
      }
    }

    const sesionId = nuevaSesion && nuevaSesion.length > 0 ? Number(nuevaSesion[0].Id) : null;

    return NextResponse.json(
      { 
        message: "Sesión registrada correctamente",
        sesionId,
      },
      { status: 200 }
    );
  } catch (error) {
    // No queremos que un error en el registro de sesión rompa el login
    console.error("[registrar-sesion] Error:", error);
    return NextResponse.json(
      { message: "Error al registrar sesión (no crítico)" },
      { status: 200 } // Retornamos 200 para no interrumpir el flujo
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
      await prisma.$executeRawUnsafe(`
        UPDATE "SesionActiva"
        SET "EstaActiva" = false
        WHERE "Id" = $1
      `, BigInt(sesionId));
    } else {
      // Cerrar todas las sesiones del usuario actual
      const supabase = await getSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const tenantId = user.app_metadata?.tenantId;
        if (tenantId) {
          const usuario = await prisma.$queryRawUnsafe<Array<{
            Id: bigint;
            TenantId: bigint;
          }>>(`
            SELECT "Id", "TenantId" FROM "Usuario"
            WHERE "AuthUserId" = $1 AND "TenantId" = $2
            LIMIT 1
          `, user.id, BigInt(tenantId));

          if (usuario && usuario.length > 0) {
            await prisma.$executeRawUnsafe(`
              UPDATE "SesionActiva"
              SET "EstaActiva" = false
              WHERE "TenantId" = $1
                AND "UsuarioId" = $2
                AND "EstaActiva" = true
            `, usuario[0].TenantId, usuario[0].Id);
          }
        }
      }
    }

    return NextResponse.json(
      { message: "Sesión cerrada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[registrar-sesion] Error al cerrar sesión:", error);
    return NextResponse.json(
      { message: "Error al cerrar sesión (no crítico)" },
      { status: 200 }
    );
  }
}

