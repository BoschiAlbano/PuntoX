import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { handleError } from "@/lib/errors/handler";
import { assertDentroDeLimite } from "@/lib/planes/features";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apellido,
      nombre,
      dni,
      direccion,
      telefono,
      mail,
      localidadId,
      nombreUsuario,
      password,
      tenantId,
    } = body;

    const resolvedTenantId = tenantId ?? process.env.DEFAULT_TENANT_ID;
    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: "El TenantId es requerido" },
        { status: 400 }
      );
    }

    let parsedTenantId: bigint;
    try {
      parsedTenantId = BigInt(resolvedTenantId);
    } catch {
      return NextResponse.json({ error: "TenantId invalido" }, { status: 400 });
    }

    let parsedLocalidadId: bigint;
    try {
      parsedLocalidadId = BigInt(localidadId);
    } catch {
      return NextResponse.json(
        { error: "Localidad invalida" },
        { status: 400 }
      );
    }

    if (
      !apellido ||
      !nombre ||
      !direccion ||
      !mail ||
      !localidadId ||
      !nombreUsuario ||
      !password
    ) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios son requeridos" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const mailNormalized =
      typeof mail === "string" ? mail.trim().toLowerCase() : "";
    const usernameNormalized =
      typeof nombreUsuario === "string" ? nombreUsuario.trim() : "";

    const tenantExists = await prisma.tenant.findUnique({
      where: { Id: parsedTenantId },
    });

    if (!tenantExists) {
      return NextResponse.json(
        { error: "El Tenant especificado no existe" },
        { status: 400 }
      );
    }

    await assertDentroDeLimite(Number(parsedTenantId), "usuarios");

    const localidadValida = await prisma.localidad.findFirst({
      where: {
        Id: parsedLocalidadId,
        EstaEliminado: false,
      },
    });

    if (!localidadValida) {
      return NextResponse.json(
        { error: "Localidad no valida" },
        { status: 400 }
      );
    }

    const existingPersona = await prisma.persona.findFirst({
      where: {
        Mail: mailNormalized,
        EstaEliminado: false,
        TenantId: parsedTenantId,
      },
    });

    if (existingPersona) {
      return NextResponse.json(
        { error: "El correo electronico ya esta registrado" },
        { status: 400 }
      );
    }

    const existingUsuario = await prisma.usuario.findFirst({
      where: {
        Nombre: usernameNormalized,
        EstaEliminado: false,
        TenantId: parsedTenantId,
      },
    });

    if (existingUsuario) {
      return NextResponse.json(
        { error: "El nombre de usuario ya esta en uso" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: mailNormalized,
        password,
        email_confirm: true,
        app_metadata: {
          tenant_id: parsedTenantId.toString(),
          role: "Empleado",
        },
      });

    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: "No se pudo crear el usuario en Supabase Auth", details: authError?.message },
        { status: 500 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const persona = await tx.persona.create({
        data: {
          TenantId: parsedTenantId,
          Apellido: apellido,
          Nombre: nombre,
          Dni: dni || null,
          Direccion: direccion,
          Telefono: telefono || null,
          Mail: mailNormalized,
          LocalidadId: parsedLocalidadId,
          EstaEliminado: false,
        },
      });

      const personaEmpleado = await tx.persona_Empleado.create({
        data: {
          Id: persona.Id,
          Legajo: Math.floor(Math.random() * 10000) + 1000,
          Foto: null,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          EmpleadoId: personaEmpleado.Id,
          TenantId: parsedTenantId,
          Nombre: usernameNormalized,
          AuthUserId: authUser.user.id,
          EstaBloqueado: false,
          EstaEliminado: false,
        },
      });

      return {
        persona,
        personaEmpleado,
        usuario,
      };
    });

    const response = {
      message: "Usuario registrado exitosamente",
      userId: Number(result.usuario.Id),
      personaId: Number(result.persona.Id),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
