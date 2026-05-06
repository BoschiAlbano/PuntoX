import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";

const RESET_MINUTOS = 30;

/**
 * POST /api/auth/registrar-intento-fallido
 * Registra un intento de login fallido y aplica bloqueo automático si corresponde.
 *
 * Endpoint público (sin autenticación requerida). Aplica anti-user-enumeration:
 * siempre responde { ok: true } aunque el usuario no exista.
 *
 * Body: { username: string }
 * Response: { ok: true, bloqueado?: true }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username } = body;

    if (!username || typeof username !== "string") {
      // Anti-enumeration: no revelar error de validación
      return NextResponse.json({ ok: true });
    }

    const usernameNormalized = username.trim().toLowerCase();

    // Buscar usuario en DB
    const usuario = await prisma.usuario.findFirst({
      where: {
        Nombre: usernameNormalized,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        TenantId: true,
        EstaBloqueado: true,
        IntentosFallidos: true,
        FechaUltimoIntento: true,
        Persona_Empleado: {
          select: { Id: true },
        },
      },
    });

    // Anti-enumeration: responder igual si el usuario no existe
    if (!usuario) {
      return NextResponse.json({ ok: true });
    }

    // Si ya está bloqueado, no seguir incrementando
    if (usuario.EstaBloqueado) {
      return NextResponse.json({ ok: true, bloqueado: true });
    }

    // Leer umbral de bloqueo del tenant
    const config = await prisma.configuracion.findFirst({
      where: { TenantId: usuario.TenantId },
      select: { BloquearTrasIntentos: true },
    });

    const umbral = config?.BloquearTrasIntentos ?? null;

    // Si el umbral es "nunca" (null), registrar intento pero no bloquear
    if (umbral === null) {
      await prisma.usuario.update({
        where: { Id: usuario.Id },
        data: {
          IntentosFallidos: { increment: 1 },
          FechaUltimoIntento: new Date(),
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Calcular nuevos intentos, reseteando si han pasado más de 30 minutos desde el último
    let intentosBase = usuario.IntentosFallidos;
    if (usuario.FechaUltimoIntento) {
      const minutosPasados =
        (Date.now() - usuario.FechaUltimoIntento.getTime()) / 60_000;
      if (minutosPasados > RESET_MINUTOS) {
        intentosBase = 0;
      }
    }

    const nuevosIntentos = intentosBase + 1;
    const debeBloquear = nuevosIntentos >= umbral;

    // Actualizar contador (y bloquear si corresponde)
    await prisma.usuario.update({
      where: { Id: usuario.Id },
      data: {
        IntentosFallidos: nuevosIntentos,
        FechaUltimoIntento: new Date(),
        ...(debeBloquear ? { EstaBloqueado: true } : {}),
      },
    });

    // Registrar auditoría del bloqueo automático
    if (debeBloquear) {
      try {
        await registrarAuditoria({
          tenantId: usuario.TenantId,
          // Sin usuario autenticado: el "actor" es el propio usuario afectado (sistema)
          usuarioId: usuario.Id,
          accion: "BLOQUEO_AUTOMATICO",
          empleadoId: usuario.Persona_Empleado?.Id ?? null,
          usuarioAfectadoId: usuario.Id,
          detalle: `Cuenta bloqueada automáticamente tras ${nuevosIntentos} intento${nuevosIntentos !== 1 ? "s" : ""} fallido${nuevosIntentos !== 1 ? "s" : ""} de inicio de sesión`,
          valorAnterior: {
            estaBloqueado: false,
            intentosFallidos: usuario.IntentosFallidos,
          },
          valorNuevo: { estaBloqueado: true, intentosFallidos: nuevosIntentos },
          req,
        });
      } catch {
        // La auditoría no debe interrumpir el flujo principal
      }
    }

    return NextResponse.json({
      ok: true,
      ...(debeBloquear ? { bloqueado: true } : {}),
    });
  } catch {
    // Anti-enumeration: no revelar errores internos
    return NextResponse.json({ ok: true });
  }
}
