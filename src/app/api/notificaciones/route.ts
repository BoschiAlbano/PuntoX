import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await getAuthContext({
      req,
    });

    // Obtener parámetros
    const { searchParams } = new URL(req.url);
    const limitParams = searchParams.get("limit");
    const limit = limitParams ? parseInt(limitParams) : 20;

    // Obtiene notificaciones (si es UsuarioId null es global para el admin, o bien específicas para el usuario)
    // Para simplificar, obtenemos las del Tenant donde UsuarioId = null O UsuarioId = current user
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        TenantId: BigInt(tenantId),
        OR: [{ UsuarioId: null }, { UsuarioId: BigInt(usuarioId) }],
      },
      orderBy: { Fecha: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notificacion.count({
      where: {
        TenantId: BigInt(tenantId),
        OR: [{ UsuarioId: null }, { UsuarioId: BigInt(usuarioId) }],
        Leida: false,
      },
    });

    // Convertimos a string BigInts
    const safeData = notificaciones.map((n) => ({
      ...n,
      Id: n.Id.toString(),
      TenantId: n.TenantId.toString(),
      UsuarioId: n.UsuarioId ? n.UsuarioId.toString() : null,
      Fecha: n.Fecha.toISOString(),
    }));

    return NextResponse.json({
      data: safeData,
      pagination: { unreadCount, total: safeData.length },
    });
  } catch (error) {
    console.error("Error GET /api/notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await getAuthContext({
      req,
    });

    const data = await req.json();
    const { markAll, id } = data;

    if (markAll) {
      await prisma.notificacion.updateMany({
        where: {
          TenantId: BigInt(tenantId),
          Leida: false,
          OR: [{ UsuarioId: null }, { UsuarioId: BigInt(usuarioId) }],
        },
        data: { Leida: true },
      });
      return NextResponse.json({
        success: true,
        message: "Todas marcadas como leídas",
      });
    } else if (id) {
      await prisma.notificacion.update({
        where: {
          Id: BigInt(id),
          TenantId: BigInt(tenantId), // ensure tenant validation
        },
        data: { Leida: true },
      });
      return NextResponse.json({
        success: true,
        message: "Marcada como leída",
      });
    }

    return NextResponse.json(
      { error: "Faltan parámetros (id o markAll)" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error PATCH /api/notificaciones:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
    });

    const payload = await req.json();
    const {
      Tipo,
      Titulo,
      Mensaje,
      AccionUrl,
      EntidadTipo,
      EntidadId,
      UsuarioId,
    } = payload;

    if (!Tipo || !Titulo || !Mensaje) {
      return NextResponse.json(
        { error: "Tipo, Titulo y Mensaje son obligatorios" },
        { status: 400 },
      );
    }

    // Prevencion de spam: si EntidadTipo y EntidadId existen, verificamos si hay una "No Leída"
    if (EntidadTipo && EntidadId) {
      const existing = await prisma.notificacion.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          EntidadTipo,
          EntidadId,
          Leida: false,
          Tipo, // opcional, asegura que sea del mismo nivel de severidad o contexto
        },
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          message: "La alerta ya existe y no ha sido leída.",
          data: {
            ...existing,
            Id: existing.Id.toString(),
            TenantId: existing.TenantId.toString(),
          },
        });
      }
    }

    const nueva = await prisma.notificacion.create({
      data: {
        TenantId: BigInt(tenantId),
        UsuarioId: UsuarioId ? BigInt(UsuarioId) : null,
        Tipo,
        Titulo,
        Mensaje,
        AccionUrl: AccionUrl || null,
        EntidadTipo: EntidadTipo || null,
        EntidadId: EntidadId || null,
        Leida: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...nueva,
        Id: nueva.Id.toString(),
        TenantId: nueva.TenantId.toString(),
        UsuarioId: nueva.UsuarioId ? nueva.UsuarioId.toString() : null,
      },
    });
  } catch (error) {
    console.error("Error POST /api/notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
