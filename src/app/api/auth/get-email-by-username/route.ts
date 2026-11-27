import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { aplicarLimites, ipDelCliente, LIMITES_AUTH } from "@/lib/rateLimit";

/**
 * Endpoint para obtener el email interno de un usuario por su nombre de usuario
 * Se usa durante el login para convertir username a email interno
 */
export async function POST(req: NextRequest) {
  try {
    const limitado = await aplicarLimites([
      { regla: LIMITES_AUTH.loginLookupIp, valor: ipDelCliente(req) },
    ]);
    if (limitado) return limitado;

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
        isBlocked: usuario.EstaBloqueado,
      });
    }

    // Solo lo que necesita el login (email para signInWithPassword y si está
    // bloqueada); no se expone el tenant ni si el email es interno.
    return NextResponse.json({
      email,
      isBlocked: usuario.EstaBloqueado,
    });
  } catch (error) {
    return handleError(error);
  }
}
