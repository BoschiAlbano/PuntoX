import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { notificarPasswordCambiadaPorAdmin } from "@/lib/notificaciones/seguridad";

/**
 * GET /api/admin/tenants/[id]/usuarios
 * Lists users for a specific tenant
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isSuperAdmin } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = BigInt(id);

    const usuarios = await prisma.usuario.findMany({
      where: {
        TenantId: tenantId,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Nombre: true,
        EstaBloqueado: true,
        IntentosFallidos: true,
        FechaUltimoIntento: true,
        AuthUserId: true,
        Persona_Empleado: {
          select: {
            Persona: {
              select: {
                Nombre: true,
                Apellido: true,
                Mail: true,
                Telefono: true,
              },
            },
          },
        },
        PerfilUsuario: {
          select: {
            Perfiles: {
              select: {
                Descripcion: true,
                Tipo: true,
              },
            },
          },
        },
        Sucursales: {
          select: {
            Sucursal: {
              select: {
                Id: true,
                Nombre: true,
              },
            },
          },
        },
        SesionesActivas: {
          where: { EstaActiva: true },
          orderBy: { FechaUltimaActividad: "desc" },
          take: 1,
          select: {
            FechaUltimaActividad: true,
            Dispositivo: true,
          },
        },
      },
      orderBy: { Id: "asc" },
    });

    const formatted = usuarios.map((u) => ({
      id: Number(u.Id),
      usuario: u.Nombre,
      nombre: u.Persona_Empleado.Persona.Nombre,
      apellido: u.Persona_Empleado.Persona.Apellido,
      email: u.Persona_Empleado.Persona.Mail || "",
      telefono: u.Persona_Empleado.Persona.Telefono || "",
      estaBloqueado: u.EstaBloqueado,
      intentosFallidos: u.IntentosFallidos,
      roles: u.PerfilUsuario.map((pu) => ({
        descripcion: pu.Perfiles.Descripcion,
        tipo: pu.Perfiles.Tipo,
      })),
      sucursales: u.Sucursales.map((s) => ({
        id: Number(s.Sucursal.Id),
        nombre: s.Sucursal.Nombre,
      })),
      ultimaActividad: u.SesionesActivas[0]?.FechaUltimaActividad || null,
      dispositivo: u.SesionesActivas[0]?.Dispositivo || null,
    }));

    return NextResponse.json({ usuarios: formatted });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/admin/tenants/[id]/usuarios
 * Block/unblock a user, reset or set their password, close sessions.
 * Siempre sobre un usuario del tenant de la URL (no del superadmin).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isSuperAdmin, usuarioId: superAdminId } = await getAuthContext({ req });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = BigInt(id);
    const body = await req.json();
    const { usuarioId, action, nuevaPassword } = body;

    if (!usuarioId || !action) {
      return NextResponse.json(
        { error: "usuarioId y action son requeridos" },
        { status: 400 },
      );
    }

    // Verify user belongs to tenant
    const usuario = await prisma.usuario.findFirst({
      where: {
        Id: BigInt(usuarioId),
        TenantId: tenantId,
        EstaEliminado: false,
      },
      select: { Id: true, AuthUserId: true, Nombre: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado en este tenant" },
        { status: 404 },
      );
    }

    switch (action) {
      case "block": {
        await prisma.usuario.update({
          where: { Id: BigInt(usuarioId) },
          data: { EstaBloqueado: true },
        });
        return NextResponse.json({
          success: true,
          message: `Usuario "${usuario.Nombre}" bloqueado`,
        });
      }

      case "unblock": {
        await prisma.usuario.update({
          where: { Id: BigInt(usuarioId) },
          data: {
            EstaBloqueado: false,
            IntentosFallidos: 0,
            FechaUltimoIntento: null,
          },
        });
        return NextResponse.json({
          success: true,
          message: `Usuario "${usuario.Nombre}" desbloqueado`,
        });
      }

      case "resetPassword": {
        // Genera un link de recuperación con la Admin API de Supabase.
        // OJO: auth.admin.generateLink NO envía ningún email; solo devuelve el
        // link (action_link) para que lo mande un proveedor propio o se comparta
        // a mano. Por eso se devuelve el link en la respuesta.
        const supabaseAdmin = getSupabaseServiceClient();

        // Get user email from Supabase
        const { data: authUser, error: authError } =
          await supabaseAdmin.auth.admin.getUserById(usuario.AuthUserId);

        if (authError || !authUser?.user?.email) {
          return NextResponse.json(
            { error: "No se pudo obtener el email del usuario" },
            { status: 500 },
          );
        }

        const { data: linkData, error: resetError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email: authUser.user.email,
          });

        const link = linkData?.properties?.action_link;
        // generate_link puede fallar sin error y devolver action_link vacío
        if (resetError || !link) {
          return NextResponse.json(
            { error: "No se pudo generar el link de recuperación" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: `Link de recuperación generado para ${authUser.user.email}. No se envió ningún email: compartilo con el usuario.`,
          link,
        });
      }

      case "setPassword": {
        // El panel usaba /api/empleados/cambiar-password, que busca el
        // usuario en el comercio de quien está logueado (el del superadmin)
        // y respondía "Usuario no encontrado" para usuarios de otro comercio.
        if (
          typeof nuevaPassword !== "string" ||
          nuevaPassword.length < 8 ||
          nuevaPassword.length > 72
        ) {
          return NextResponse.json(
            { error: "La contraseña debe tener entre 8 y 72 caracteres" },
            { status: 400 },
          );
        }

        const { error: authError } =
          await getSupabaseServiceClient().auth.admin.updateUserById(
            usuario.AuthUserId,
            { password: nuevaPassword },
          );
        if (authError) {
          return NextResponse.json(
            { error: "No se pudo actualizar la contraseña" },
            { status: 500 },
          );
        }

        await registrarAuditoria({
          tenantId,
          usuarioId: superAdminId,
          accion: "CAMBIAR_PASSWORD",
          usuarioAfectadoId: usuario.Id,
          detalle: `Contraseña de "${usuario.Nombre}" cambiada por el administrador de PuntoX`,
          req,
        });
        await notificarPasswordCambiadaPorAdmin({
          tenantId,
          usuarioAfectadoId: usuario.Id,
          cambiadaPor: "El administrador de PuntoX",
        });

        return NextResponse.json({
          success: true,
          message: `Contraseña de "${usuario.Nombre}" actualizada`,
        });
      }

      case "closeSessions": {
        // Close all active sessions
        await prisma.sesionActiva.updateMany({
          where: {
            UsuarioId: BigInt(usuarioId),
            TenantId: tenantId,
            EstaActiva: true,
          },
          data: { EstaActiva: false },
        });

        return NextResponse.json({
          success: true,
          message: `Sesiones cerradas para "${usuario.Nombre}"`,
        });
      }

      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 },
        );
    }
  } catch (error) {
    return handleError(error);
  }
}
