import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";

/**
 * Endpoint para obtener el email interno de un usuario por su nombre de usuario
 * Se usa durante el login para convertir username a email interno
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Nombre de usuario requerido" },
        { status: 400 },
      );
    }

    const usernameNormalized = username.trim().toLowerCase();

    // Buscar usuario por nombre de usuario
    const usuario = await prisma.usuario.findFirst({
      where: {
        Nombre: usernameNormalized,
        EstaEliminado: false,
      },
      select: {
        EstaBloqueado: true,
        TenantId: true,
        AuthUserId: true,
        Persona_Empleado: {
          include: {
            Persona: {
              select: {
                Mail: true,
                TenantId: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Si tiene email en Persona, usarlo (puede ser email real o interno)
    // Si no tiene email, generar uno interno basado en el username
    const email = usuario.Persona_Empleado?.Persona?.Mail || null;

    // Si no hay email, significa que es un empleado nuevo con email interno
    // Generamos el email interno basado en el username
    if (!email) {
      const { generateInternalEmail } =
        await import("@/lib/auth/generateInternalEmail");
      const internalEmail = generateInternalEmail(usernameNormalized);

      return NextResponse.json({
        email: internalEmail,
        isInternal: true,
        isBlocked: usuario.EstaBloqueado,
        tenantId: usuario.TenantId ? Number(usuario.TenantId) : null,
      });
    }

    // Si tiene email, puede ser real o interno
    const isInternal = email.endsWith("@puntox.com");

    return NextResponse.json({
      email,
      isInternal,
      isBlocked: usuario.EstaBloqueado,
      tenantId: usuario.TenantId ? Number(usuario.TenantId) : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
