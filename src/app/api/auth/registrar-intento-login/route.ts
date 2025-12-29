import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";

/**
 * POST /api/auth/registrar-intento-login
 * Registra un intento de login (exitoso o fallido) en la tabla IntentoLogin
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

    // Si no se proporciona tenantId, intentar obtenerlo del usuario
    let finalTenantId = tenantId;
    if (!finalTenantId && usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { Id: BigInt(usuarioId) },
        select: { TenantId: true },
      });
      if (usuario) {
        finalTenantId = Number(usuario.TenantId);
      }
    }

    // Si no hay tenantId, no podemos registrar (pero no fallamos silenciosamente)
    if (!finalTenantId) {
      console.warn("[registrar-intento-login] No se pudo determinar tenantId para:", email);
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
    console.error("[registrar-intento-login] Error:", error);
    return NextResponse.json(
      { message: "Error al registrar intento (no crítico)" },
      { status: 200 } // Retornamos 200 para no interrumpir el flujo
    );
  }
}

