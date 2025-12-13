import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";
// import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// API de empleados: lista, alta (con Supabase Auth) y suspensión/activación.
// async function resolveTenantId(req?: NextRequest) {
//   const supabase = await getSupabaseServerClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   const isSuperAdmin =
//     user?.role === "superadmin" ||
//     user?.role === "SuperAdmin" ||
//     (user?.app_metadata as Record<string, unknown> | undefined)?.role ===
//       "SuperAdmin";

//   const tenantFromQuery = req?.nextUrl.searchParams.get("tenantId");
//   const tenantRaw =
//     (user?.app_metadata as Record<string, unknown> | undefined)?.tenantId ??
//     (user?.app_metadata as Record<string, unknown> | undefined)?.tenant_id ??
//     (user as unknown as any)?.tenantId;
//   const resolved =
//     tenantFromQuery ?? tenantRaw ?? process.env.DEFAULT_TENANT_ID;

//   if (isSuperAdmin) {
//     if (!resolved) return null;
//     const parsed = Number(resolved);
//     return Number.isNaN(parsed) ? null : parsed;
//   }

//   if (!tenantRaw) return null;
//   const parsed = Number(tenantRaw);
//   return Number.isNaN(parsed) ? null : parsed;
// }

function mapEstado(estaBloqueado: boolean | null | undefined) {
  if (estaBloqueado) return "Suspendido" as const;
  return "Activo" as const;
}

type EstadoEmpleado = "Activo" | "Suspendido" | "Invitado";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");

    let empleados;
    try {
      empleados = await prisma.persona.findMany({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          Persona_Empleado: { isNot: null },
        },
        select: {
          Id: true,
          Apellido: true,
          Nombre: true,
          Dni: true,
          Direccion: true,
          Telefono: true,
          Mail: true,
          LocalidadId: true,
          Localidad: { select: { Descripcion: true } },
          Persona_Empleado: {
            select: {
              Legajo: true,
              Usuario: {
                where: { EstaEliminado: false },
                select: {
                  Id: true,
                  Nombre: true,
                  EstaBloqueado: true,
                  PerfilUsuario: {
                    select: {
                      Perfiles: {
                        select: {
                          Id: true,
                          Descripcion: true,
                          Tipo: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { Nombre: "asc" },
      });
    } catch (err) {
      // Fallback si falta columna Tipo en Perfiles.
      empleados = await prisma.persona.findMany({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          Persona_Empleado: { isNot: null },
        },
        select: {
          Id: true,
          Apellido: true,
          Nombre: true,
          Dni: true,
          Direccion: true,
          Telefono: true,
          Mail: true,
          LocalidadId: true,
          Localidad: { select: { Descripcion: true } },
          Persona_Empleado: {
            select: {
              Legajo: true,
              Usuario: {
                where: { EstaEliminado: false },
                select: {
                  Id: true,
                  Nombre: true,
                  EstaBloqueado: true,
                  PerfilUsuario: {
                    select: {
                      Perfiles: {
                        select: {
                          Id: true,
                          Descripcion: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { Nombre: "asc" },
      });
      console.warn(
        "[empleados] usando fallback sin campo Tipo en Perfiles",
        err
      );
    }

    const response = empleados.map((persona) => {
      const legajo = persona.Persona_Empleado?.Legajo ?? null;
      const usuario = persona.Persona_Empleado?.Usuario?.[0] ?? null;
      const perfil = usuario?.PerfilUsuario?.[0]?.Perfiles ?? null;

      const estado: EstadoEmpleado = usuario
        ? mapEstado(usuario.EstaBloqueado)
        : "Invitado";

      return {
        id: Number(usuario?.Id ?? persona.Id),
        personaId: Number(persona.Id),
        usuarioId: usuario ? Number(usuario.Id) : null,
        nombre: persona.Nombre,
        apellido: persona.Apellido,
        nombreCompleto: `${persona.Nombre} ${persona.Apellido}`,
        email: persona.Mail,
        telefono: persona.Telefono,
        direccion: persona.Direccion,
        localidadId: persona.LocalidadId ? Number(persona.LocalidadId) : null,
        localidad: persona.Localidad?.Descripcion ?? null,
        rolId: perfil ? Number(perfil.Id) : null,
        rolNombre: perfil?.Descripcion ?? null,
        rolTipo: (perfil?.Tipo as string | undefined) ?? "EMPLEADO",
        estado,
        legajo: legajo ? `PX-${legajo}` : null,
        dni: persona.Dni,
        ultimaActividad: "Pendiente",
      };
    });

    return NextResponse.json({ empleados: response }, { status: 200 });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error al obtener empleados", error);
    return NextResponse.json(
      { error: "Error al obtener empleados" },
      { status: 500 }
    );
  }
}

const createEmpleadoSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  dni: z.string().optional().nullable(),
  direccion: z.string().min(1),
  telefono: z.string().optional().nullable(),
  mail: z.string().email(),
  localidadId: z.union([z.number(), z.string()]),
  departamentoId: z.union([z.number(), z.string()]).optional().nullable(),
  provinciaId: z.union([z.number(), z.string()]).optional().nullable(),
  nombreUsuario: z.string().min(3),
  password: z.string().min(8),
  rolId: z.union([z.number(), z.string()]).optional().nullable(),
  autoInvitar: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");
    const tenantIdBigInt = BigInt(tenantId);

    const json = await req.json().catch(() => null);
    const parsed = createEmpleadoSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const data = parsed.data;

    const localidadIdNumber = Number(data.localidadId);
    if (!Number.isInteger(localidadIdNumber)) {
      return NextResponse.json(
        { error: "Localidad invalida" },
        { status: 400 }
      );
    }

    const departamentoIdNumber =
      data.departamentoId === null || data.departamentoId === undefined
        ? null
        : Number(data.departamentoId);
    if (data.departamentoId !== undefined && departamentoIdNumber !== null) {
      if (!Number.isInteger(departamentoIdNumber)) {
        return NextResponse.json(
          { error: "Departamento invalido" },
          { status: 400 }
        );
      }
    }

    const provinciaIdNumber =
      data.provinciaId === null || data.provinciaId === undefined
        ? null
        : Number(data.provinciaId);
    if (data.provinciaId !== undefined && provinciaIdNumber !== null) {
      if (!Number.isInteger(provinciaIdNumber)) {
        return NextResponse.json(
          { error: "Provincia invalida" },
          { status: 400 }
        );
      }
    }

    const rolIdNumber =
      data.rolId === null || data.rolId === undefined
        ? null
        : Number(data.rolId);
    if (data.rolId !== undefined && Number.isNaN(Number(rolIdNumber))) {
      return NextResponse.json({ error: "Rol invalido" }, { status: 400 });
    }

    const localidadValida = await prisma.localidad.findFirst({
      where: { Id: BigInt(localidadIdNumber), EstaEliminado: false },
      select: {
        Id: true,
        Departamento: { select: { Id: true, ProvinciaId: true } },
      },
    });
    if (!localidadValida) {
      return NextResponse.json(
        { error: "Localidad no valida" },
        { status: 400 }
      );
    }

    if (
      departamentoIdNumber &&
      localidadValida.Departamento.Id !== BigInt(departamentoIdNumber)
    ) {
      return NextResponse.json(
        { error: "La localidad no pertenece al departamento indicado" },
        { status: 400 }
      );
    }

    if (
      provinciaIdNumber &&
      localidadValida.Departamento.ProvinciaId !== BigInt(provinciaIdNumber)
    ) {
      return NextResponse.json(
        { error: "La localidad no pertenece a la provincia indicada" },
        { status: 400 }
      );
    }

    let rolTipo: "ADMINISTRADOR" | "EMPLEADO" = "EMPLEADO";
    if (rolIdNumber) {
      let rolValido: PerfilesTipo | null | { Id: bigint } | null;
      try {
        rolValido = await prisma.perfiles.findFirst({
          where: {
            Id: BigInt(rolIdNumber),
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
          },
          select: {
            Tipo: true,
          },
        });

        rolTipo = rolValido?.Tipo ?? "EMPLEADO";
      } catch {
        rolValido = await prisma.perfiles.findFirst({
          where: {
            Id: BigInt(rolIdNumber),
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
          },
          select: { Id: true },
        });
      }
      if (!rolValido) {
        return NextResponse.json(
          { error: "Rol no valido para este tenant" },
          { status: 400 }
        );
      }

      // rolTipo = rolValido.Tipo ?? "EMPLEADO";
    }

    const mailNormalized = data.mail.trim().toLowerCase();
    const usernameNormalized = data.nombreUsuario.trim();

    const existingPersona = await prisma.persona.findFirst({
      where: {
        Mail: mailNormalized,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
    });
    if (existingPersona) {
      return NextResponse.json(
        { error: "El correo ya esta registrado" },
        { status: 400 }
      );
    }

    const existingUsuario = await prisma.usuario.findFirst({
      where: {
        Nombre: usernameNormalized,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
    });
    if (existingUsuario) {
      return NextResponse.json(
        { error: "El nombre de usuario ya esta en uso" },
        { status: 400 }
      );
    }

    const supabaseService = getSupabaseServiceClient();
    const { data: authUser, error: authError } =
      await supabaseService.auth.admin.createUser({
        email: mailNormalized,
        password: data.password,
        email_confirm: data.autoInvitar ?? true,
        app_metadata: {
          tenant_id: tenantId.toString(),
          role: rolTipo === "ADMINISTRADOR" ? "Administrador" : "Empleado",
        },
      });

    if (authError || !authUser?.user) {
      console.error("Error creando usuario en Supabase:", authError);
      return NextResponse.json(
        { error: "No se pudo crear el usuario en Supabase" },
        { status: 500 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const persona = await tx.persona.create({
        data: {
          TenantId: tenantIdBigInt,
          Apellido: data.apellido,
          Nombre: data.nombre,
          Dni: data.dni ?? null,
          Direccion: data.direccion,
          Telefono: data.telefono ?? null,
          Mail: mailNormalized,
          LocalidadId: BigInt(localidadIdNumber),
          EstaEliminado: false,
        },
      });

      const personaEmpleado = await tx.persona_Empleado.create({
        data: {
          Id: persona.Id,
          Legajo: Math.floor(Math.random() * 9000) + 1000,
          Foto: Buffer.alloc(0),
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          EmpleadoId: personaEmpleado.Id,
          TenantId: tenantIdBigInt,
          Nombre: usernameNormalized,
          AuthUserId: authUser.user.id,
          EstaBloqueado: false,
          EstaEliminado: false,
        },
      });

      if (rolIdNumber) {
        await tx.perfilUsuario.create({
          data: {
            Perfil_Id: BigInt(rolIdNumber),
            Usuario_Id: usuario.Id,
            TenantId: tenantIdBigInt,
          },
        });
      }

      return { persona, personaEmpleado, usuario };
    });

    const empleadoResponse = {
      id: Number(created.usuario.Id),
      personaId: Number(created.persona.Id),
      usuarioId: Number(created.usuario.Id),
      nombre: created.persona.Nombre,
      apellido: created.persona.Apellido,
      nombreCompleto: `${created.persona.Nombre} ${created.persona.Apellido}`,
      email: created.persona.Mail,
      telefono: created.persona.Telefono,
      direccion: created.persona.Direccion,
      localidadId: localidadIdNumber,
      localidad: null as string | null,
      rolId: rolIdNumber,
      rolNombre: null as string | null,
      rolTipo,
      estado: "Activo" as EstadoEmpleado,
      legajo: `PX-${created.personaEmpleado.Legajo}`,
      dni: created.persona.Dni,
      ultimaActividad: "Pendiente",
    };

    return NextResponse.json({ empleado: empleadoResponse }, { status: 201 });
  } catch (error) {
    console.error("Error creando empleado", error);
    return NextResponse.json(
      { error: "No se pudo crear el empleado" },
      { status: 500 }
    );
  }
}

const updateEstadoSchema = z.object({
  usuarioId: z.union([z.number(), z.string()]),
  bloquear: z.boolean(),
});

const deleteEmpleadoSchema = z.object({
  personaId: z.union([z.number(), z.string()]),
});

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");

    const json = await req.json().catch(() => null);
    const parsed = updateEstadoSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const usuarioId = Number(parsed.data.usuarioId);
    if (!Number.isInteger(usuarioId)) {
      return NextResponse.json({ error: "Usuario invalido" }, { status: 400 });
    }

    const updated = await prisma.usuario.update({
      where: { Id: BigInt(usuarioId), TenantId: BigInt(tenantId) },
      data: { EstaBloqueado: parsed.data.bloquear },
      select: { Id: true, EstaBloqueado: true },
    });

    return NextResponse.json({
      usuarioId: Number(updated.Id),
      estado: mapEstado(updated.EstaBloqueado),
    });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error actualizando estado de empleado", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el estado" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");

    const json = await req.json().catch(() => null);
    const parsed = deleteEmpleadoSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const personaIdNum = Number(parsed.data.personaId);
    if (!Number.isInteger(personaIdNum)) {
      return NextResponse.json({ error: "Empleado invalido" }, { status: 400 });
    }
    const personaId = BigInt(personaIdNum);
    const tenantIdBig = BigInt(tenantId);

    const persona = await prisma.persona.findFirst({
      where: { Id: personaId, TenantId: tenantIdBig, EstaEliminado: false },
      select: {
        Persona_Empleado: {
          select: {
            Usuario: {
              select: { Id: true, AuthUserId: true },
            },
          },
        },
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    // Evitar que un admin se borre a sí mismo.
    const usuarioActual = await prisma.usuario.findFirst({
      where: {
        Id: BigInt(usuarioId),
        TenantId: tenantIdBig,
        EstaEliminado: false,
      },
      select: { Persona_Empleado: { select: { Id: true } } },
    });
    const personaActualId = usuarioActual?.Persona_Empleado?.Id;
    if (personaActualId && personaActualId === personaId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario." },
        { status: 400 }
      );
    }

    const usuarios = persona.Persona_Empleado?.Usuario ?? [];
    const usuarioIds = usuarios.map((u) => u.Id);
    const authIds = usuarios
      .map((u) => u.AuthUserId)
      .filter(Boolean) as string[];

    await prisma.$transaction(async (tx) => {
      if (usuarioIds.length) {
        await tx.perfilUsuario.deleteMany({
          where: { Usuario_Id: { in: usuarioIds } },
        });
        await tx.usuario.deleteMany({
          where: { Id: { in: usuarioIds }, TenantId: tenantIdBig },
        });
      }

      await tx.persona_Empleado.deleteMany({
        where: { Id: personaId },
      });

      await tx.persona.delete({
        where: { Id: personaId, TenantId: tenantIdBig },
      });
    });

    // Borramos en Supabase Auth de forma no bloqueante.
    if (authIds.length) {
      const supabase = getSupabaseServiceClient();
      for (const authId of authIds) {
        supabase.auth.admin.deleteUser(authId).catch((err) => {
          console.warn("No se pudo borrar usuario auth", authId, err);
        });
      }
    }

    return NextResponse.json({ ok: true, personaId: personaIdNum });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error eliminando empleado", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el empleado" },
      { status: 500 }
    );
  }
}

type PerfilesTipo = {
  Tipo: "ADMINISTRADOR" | "EMPLEADO";
};
