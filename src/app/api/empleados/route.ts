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

import { parsePaginationParams, createPaginationResponse } from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");
    const pagination = parsePaginationParams(req);

    // Obtener filtros de query params
    const searchParams = req.nextUrl.searchParams;
    const rolFilter = searchParams.get("rol");
    const estadoFilter = searchParams.get("estado");
    const busquedaFilter = searchParams.get("busqueda");

    // Construir where base
    const where: any = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
      Persona_Empleado: { isNot: null },
    };

    // Filtro de búsqueda (nombre, apellido, email, dni)
    // Nota: OR debe estar al mismo nivel que otros filtros, no anidado
    if (busquedaFilter && busquedaFilter.trim()) {
      const busqueda = busquedaFilter.trim();
      where.OR = [
        { Nombre: { contains: busqueda, mode: "insensitive" } },
        { Apellido: { contains: busqueda, mode: "insensitive" } },
        { Mail: { contains: busqueda, mode: "insensitive" } },
        { Dni: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    // Construir filtros de Persona_Empleado de forma incremental
    // Nota: "Invitado" (none) no se puede combinar con filtros de rol (some)
    const personaEmpleadoFilters: any = {};
    const usuarioFilters: any = {
      EstaEliminado: false,
    };

    // Filtro por rol
    if (rolFilter && rolFilter !== "todos") {
      const rolId = Number(rolFilter);
      if (!Number.isNaN(rolId)) {
        usuarioFilters.PerfilUsuario = {
          some: {
            Perfil_Id: BigInt(rolId),
          },
        };
      }
    }

    // Filtro por estado
    if (estadoFilter && estadoFilter !== "todos") {
      if (estadoFilter === "Invitado") {
        // Sin usuario asociado - no se puede combinar con filtro de rol
        if (rolFilter && rolFilter !== "todos") {
          // Si hay filtro de rol, no puede haber invitados (tienen rol)
          // Retornar vacío
          return NextResponse.json(
            createPaginationResponse([], 0, pagination),
            { status: 200 }
          );
        }
        personaEmpleadoFilters.Usuario = {
          none: {
            EstaEliminado: false,
          },
        };
      } else {
        // Para "Activo" o "Suspendido", combinar con filtro de rol si existe
        if (estadoFilter === "Suspendido") {
          usuarioFilters.EstaBloqueado = true;
        } else if (estadoFilter === "Activo") {
          usuarioFilters.EstaBloqueado = false;
        }
        personaEmpleadoFilters.Usuario = {
          some: usuarioFilters,
        };
      }
    } else if (rolFilter && rolFilter !== "todos") {
      // Si no hay filtro de estado pero hay filtro de rol, aplicar solo el filtro de rol
      personaEmpleadoFilters.Usuario = {
        some: usuarioFilters,
      };
    }

    // Aplicar filtros de Persona_Empleado si hay alguno
    if (Object.keys(personaEmpleadoFilters).length > 0) {
      where.Persona_Empleado = {
        ...where.Persona_Empleado,
        ...personaEmpleadoFilters,
      };
    }

    // Obtener total para paginación (con filtros aplicados)
    // Nota: Para mejor performance, considerar índices en: TenantId, EstaEliminado, Nombre, Apellido
    let total: number;
    try {
      total = await prisma.persona.count({ where });
    } catch (countError) {
      throw countError;
    }

    // Query optimizada: usar select específico para reducir datos transferidos
    const empleados = await prisma.persona.findMany({
      where,
      select: {
        Id: true,
        Apellido: true,
        Nombre: true,
        Dni: true,
        Direccion: true,
        Telefono: true,
        Mail: true,
        LocalidadId: true,
        Localidad: {
          select: {
            Descripcion: true,
            EstaEliminado: true,
            Departamento: {
              select: {
                Id: true,
                Provincia: {
                  select: {
                    Id: true,
                  },
                },
              },
            },
          },
        },
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
      skip: pagination.skip,
      take: pagination.limit,
    });

    let response;
    try {
      response = empleados.map((persona) => {
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
          username: usuario?.Nombre ?? null, // Nombre de usuario para login
          telefono: persona.Telefono,
          direccion: persona.Direccion,
          localidadId: persona.LocalidadId ? Number(persona.LocalidadId) : null,
          localidad: persona.Localidad && !persona.Localidad.EstaEliminado 
            ? persona.Localidad.Descripcion 
            : null,
          departamentoId: persona.Localidad && persona.Localidad.Departamento
            ? Number(persona.Localidad.Departamento.Id)
            : null,
          provinciaId: persona.Localidad && persona.Localidad.Departamento && persona.Localidad.Departamento.Provincia
            ? Number(persona.Localidad.Departamento.Provincia.Id)
            : null,
          rolId: perfil ? Number(perfil.Id) : null,
          rolNombre: perfil?.Descripcion ?? null,
          rolTipo: (perfil?.Tipo as string | undefined) ?? "EMPLEADO",
          estado,
          legajo: legajo ? `PX-${legajo}` : null,
          dni: persona.Dni,
          ultimaActividad: "Pendiente",
        };
      });
    } catch (mapError) {
      throw mapError;
    }

    const paginatedResponse = createPaginationResponse(response, total, pagination);

    return NextResponse.json(paginatedResponse, { status: 200 });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return handleError(error);
  }
}

const createEmpleadoSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  dni: z.string().optional().nullable(),
  direccion: z.string().min(1),
  telefono: z.string().optional().nullable(),
  mail: z.string().email().optional(), // Opcional: solo para administradores, empleados usan email interno
  localidadId: z.union([z.number(), z.string()]),
  departamentoId: z.union([z.number(), z.string()]).optional().nullable(),
  provinciaId: z.union([z.number(), z.string()]).optional().nullable(),
  nombreUsuario: z.string().min(1), // Requerido: se usa para generar email interno
  password: z.string().min(8),
  rolId: z.union([z.number(), z.string()]).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");
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

    // Normalizar username
    const usernameNormalized = data.nombreUsuario.trim().toLowerCase();
    
    // Generar email interno automático para empleados
    // Si se proporciona mail, se usa (para administradores), sino se genera uno interno
    let mailNormalized: string;
    if (data.mail && data.mail.trim()) {
      mailNormalized = data.mail.trim().toLowerCase();
    } else {
      // Generar email interno automático
      const { generateInternalEmail } = await import("@/lib/auth/generateInternalEmail");
      mailNormalized = generateInternalEmail(usernameNormalized);
    }

    // Solo verificar email duplicado si se proporcionó un email (no para emails internos generados)
    // Los emails internos se generan únicos basados en username, así que no deberían duplicarse
    if (data.mail && data.mail.trim()) {
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
    }

    // Verificar si el nombre de usuario generado ya existe, si es así, agregar un número
    let finalUsername = usernameNormalized;
    let counter = 1;
    let existingUsuario = await prisma.usuario.findFirst({
      where: {
        Nombre: finalUsername,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
    });
    
    // Si el nombre de usuario ya existe, agregar un número hasta encontrar uno disponible
    while (existingUsuario) {
      finalUsername = `${usernameNormalized}${counter}`;
      existingUsuario = await prisma.usuario.findFirst({
        where: {
          Nombre: finalUsername,
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
        },
      });
      counter++;
    }

    const supabaseService = getSupabaseServiceClient();
    const { data: authUser, error: authError } =
      await supabaseService.auth.admin.createUser({
        email: mailNormalized,
        password: data.password,
        email_confirm: true, // Siempre confirmar email automáticamente
        app_metadata: {
          tenant_id: tenantId.toString(),
          role: rolTipo === "ADMINISTRADOR" ? "Administrador" : "Empleado",
        },
      });

    if (authError || !authUser?.user) {
      // Detectar si el error es por correo duplicado
      if (
        authError?.code === "email_exists" ||
        authError?.message?.toLowerCase().includes("already been registered") ||
        authError?.message?.toLowerCase().includes("email address has already")
      ) {
        return NextResponse.json(
          { error: "Este correo ya se encuentra registrado" },
          { status: 400 }
        );
      }
      
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
          Nombre: finalUsername,
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

    // Registrar auditoría CREAR_USUARIO
    await registrarAuditoria({
      tenantId: tenantIdBigInt,
      usuarioId,
      accion: "CREAR_USUARIO",
      empleadoId: created.personaEmpleado.Id,
      usuarioAfectadoId: created.usuario.Id,
      detalle: `Usuario creado: ${created.persona.Nombre} ${created.persona.Apellido} (${created.persona.Mail})`,
      valorNuevo: {
        nombre: created.persona.Nombre,
        apellido: created.persona.Apellido,
        email: created.persona.Mail,
        rolId: rolIdNumber || null,
      },
      req, // Pasar el request para obtener headers
    });


    // Actualizar permisos en JWT del nuevo usuario (si tiene rol asignado)
    if (rolIdNumber && created.usuario.AuthUserId) {
      const { actualizarPermisosEnJWT } = await import("@/lib/auth/updateUserPermissions");
      actualizarPermisosEnJWT(created.usuario.AuthUserId).catch((err) => {
        console.warn("No se pudieron actualizar permisos en JWT:", err);
      });
    }

    return NextResponse.json({ empleado: empleadoResponse }, { status: 201 });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return handleError(error);
  }
}

const updateEstadoSchema = z.object({
  usuarioId: z.union([z.number(), z.string()]),
  bloquear: z.boolean(),
});

const updateEmpleadoSchema = z.object({
  personaId: z.union([z.number(), z.string()]),
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  dni: z.string().optional().nullable(),
  direccion: z.string().min(1).optional(),
  telefono: z.string().optional().nullable(),
  localidadId: z.union([z.number(), z.string()]).optional(),
  departamentoId: z.union([z.number(), z.string()]).optional().nullable(),
  provinciaId: z.union([z.number(), z.string()]).optional().nullable(),
  rolId: z.union([z.number(), z.string()]).optional().nullable(),
});


const deleteEmpleadoSchema = z.object({
  personaId: z.union([z.number(), z.string()]),
});

export async function PUT(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioIdAccion } = await requirePermiso("empleados:admin");

    const json = await req.json().catch(() => null);
    const parsed = updateEmpleadoSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const data = parsed.data;
    const personaIdNum = Number(data.personaId);
    if (!Number.isInteger(personaIdNum)) {
      return NextResponse.json({ error: "Persona invalida" }, { status: 400 });
    }
    const personaId = BigInt(personaIdNum);
    const tenantIdBig = BigInt(tenantId);

    // Obtener datos actuales para auditoría
    const personaActual = await prisma.persona.findFirst({
      where: { Id: personaId, TenantId: tenantIdBig, EstaEliminado: false },
      select: {
        Id: true,
        Nombre: true,
        Apellido: true,
        Dni: true,
        Direccion: true,
        Telefono: true,
        LocalidadId: true,
        Persona_Empleado: {
          select: {
            Id: true,
            Usuario: {
              select: {
                Id: true,
                AuthUserId: true,
                PerfilUsuario: {
                  select: {
                    Perfil_Id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!personaActual) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    const usuarioActual = personaActual.Persona_Empleado?.Usuario?.[0];
    if (!usuarioActual) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const rolIdAnterior = usuarioActual.PerfilUsuario?.[0]?.Perfil_Id
      ? Number(usuarioActual.PerfilUsuario[0].Perfil_Id)
      : null;

    // Validar localidad si se proporciona
    let localidadIdBigInt: bigint | undefined;
    if (data.localidadId !== undefined) {
      const localidadIdNum = Number(data.localidadId);
      if (!Number.isInteger(localidadIdNum)) {
        return NextResponse.json(
          { error: "Localidad invalida" },
          { status: 400 }
        );
      }
      localidadIdBigInt = BigInt(localidadIdNum);

      const localidadValida = await prisma.localidad.findFirst({
        where: { Id: localidadIdBigInt, EstaEliminado: false },
      });

      if (!localidadValida) {
        return NextResponse.json(
          { error: "Localidad no encontrada" },
          { status: 400 }
        );
      }
    }

    // Actualizar datos
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar Persona
      const personaUpdate: any = {};
      if (data.nombre !== undefined) personaUpdate.Nombre = data.nombre.trim();
      if (data.apellido !== undefined) personaUpdate.Apellido = data.apellido.trim();
      if (data.dni !== undefined) personaUpdate.Dni = data.dni || null;
      if (data.direccion !== undefined) personaUpdate.Direccion = data.direccion.trim();
      if (data.telefono !== undefined) personaUpdate.Telefono = data.telefono || null;
      if (localidadIdBigInt !== undefined) personaUpdate.LocalidadId = localidadIdBigInt;

      const persona = await tx.persona.update({
        where: { Id: personaId, TenantId: tenantIdBig },
        data: personaUpdate,
        select: {
          Id: true,
          Nombre: true,
          Apellido: true,
          Dni: true,
          Direccion: true,
          Telefono: true,
          LocalidadId: true,
          Mail: true,
        },
      });

      // Actualizar rol si se proporciona
      let rolIdNuevo: number | null = null;
      if (data.rolId !== undefined) {
        const rolIdNum = data.rolId ? Number(data.rolId) : null;
        rolIdNuevo = rolIdNum;

        // Eliminar rol anterior
        await tx.perfilUsuario.deleteMany({
          where: {
            Usuario_Id: usuarioActual.Id,
            TenantId: tenantIdBig,
          },
        });

        // Asignar nuevo rol si se proporciona
        if (rolIdNum && Number.isInteger(rolIdNum)) {
          await tx.perfilUsuario.create({
            data: {
              Perfil_Id: BigInt(rolIdNum),
              Usuario_Id: usuarioActual.Id,
              TenantId: tenantIdBig,
            },
          });
        }
      }

      return { persona, rolIdNuevo };
    });

    // Preparar valores para auditoría
    const valorAnterior: any = {
      nombre: personaActual.Nombre,
      apellido: personaActual.Apellido,
      dni: personaActual.Dni,
      direccion: personaActual.Direccion,
      telefono: personaActual.Telefono,
      localidadId: personaActual.LocalidadId ? Number(personaActual.LocalidadId) : null,
      rolId: rolIdAnterior,
    };

    const valorNuevo: any = {};
    if (data.nombre !== undefined) valorNuevo.nombre = updated.persona.Nombre;
    if (data.apellido !== undefined) valorNuevo.apellido = updated.persona.Apellido;
    if (data.dni !== undefined) valorNuevo.dni = updated.persona.Dni;
    if (data.direccion !== undefined) valorNuevo.direccion = updated.persona.Direccion;
    if (data.telefono !== undefined) valorNuevo.telefono = updated.persona.Telefono;
    if (data.localidadId !== undefined) valorNuevo.localidadId = updated.persona.LocalidadId ? Number(updated.persona.LocalidadId) : null;
    if (data.rolId !== undefined) valorNuevo.rolId = updated.rolIdNuevo;

    // Registrar auditoría EDITAR_USUARIO
    await registrarAuditoria({
      tenantId,
      usuarioId: usuarioIdAccion,
      accion: "EDITAR_USUARIO",
      empleadoId: personaActual.Persona_Empleado?.Id || null,
      usuarioAfectadoId: usuarioActual.Id,
      detalle: `Empleado editado: ${updated.persona.Nombre} ${updated.persona.Apellido}`,
      valorAnterior,
      valorNuevo,
      req,
    });

    // Si cambió el rol, registrar también CAMBIAR_ROL
    if (data.rolId !== undefined && rolIdAnterior !== updated.rolIdNuevo) {
      await registrarAuditoria({
        tenantId,
        usuarioId: usuarioIdAccion,
        accion: "CAMBIAR_ROL",
        empleadoId: personaActual.Persona_Empleado?.Id || null,
        usuarioAfectadoId: usuarioActual.Id,
        detalle: `Rol cambiado para: ${updated.persona.Nombre} ${updated.persona.Apellido}`,
        valorAnterior: { rolId: rolIdAnterior },
        valorNuevo: { rolId: updated.rolIdNuevo },
        req,
      });

      // Actualizar permisos en JWT cuando cambia el rol
      if (usuarioActual.AuthUserId) {
        const { actualizarPermisosEnJWT } = await import("@/lib/auth/updateUserPermissions");
        actualizarPermisosEnJWT(usuarioActual.AuthUserId).catch((err) => {
          console.warn("No se pudieron actualizar permisos en JWT:", err);
        });
      }
    }

    return NextResponse.json({
      empleado: {
        id: Number(usuarioActual.Id),
        personaId: Number(updated.persona.Id),
        nombre: updated.persona.Nombre,
        apellido: updated.persona.Apellido,
        nombreCompleto: `${updated.persona.Nombre} ${updated.persona.Apellido}`,
        email: updated.persona.Mail,
        telefono: updated.persona.Telefono,
        direccion: updated.persona.Direccion,
        localidadId: updated.persona.LocalidadId ? Number(updated.persona.LocalidadId) : null,
        rolId: updated.rolIdNuevo,
      },
    });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioIdAccion } = await requirePermiso("empleados:admin");

    const json = await req.json().catch(() => null);
    const parsed = updateEstadoSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const usuarioIdAfectado = Number(parsed.data.usuarioId);
    if (!Number.isInteger(usuarioIdAfectado)) {
      return NextResponse.json({ error: "Usuario invalido" }, { status: 400 });
    }

    // Obtener estado anterior para auditoría
    const usuarioAnterior = await prisma.usuario.findFirst({
      where: { Id: BigInt(usuarioIdAfectado), TenantId: BigInt(tenantId) },
      select: { Id: true, EstaBloqueado: true, Persona_Empleado: { select: { Id: true } } },
    });

    if (!usuarioAnterior) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.usuario.update({
      where: { Id: BigInt(usuarioIdAfectado), TenantId: BigInt(tenantId) },
      data: { EstaBloqueado: parsed.data.bloquear },
      select: { Id: true, EstaBloqueado: true },
    });

    // Registrar auditoría
    const accion = updated.EstaBloqueado ? "SUSPENDER_USUARIO" : "REACTIVAR_USUARIO";
    await registrarAuditoria({
      tenantId,
      usuarioId: usuarioIdAccion,
      accion,
      empleadoId: usuarioAnterior.Persona_Empleado?.Id || null,
      usuarioAfectadoId: updated.Id,
      detalle: `Usuario ${updated.EstaBloqueado ? "suspendido" : "reactivado"}`,
      valorAnterior: {
        estaBloqueado: usuarioAnterior.EstaBloqueado,
      },
      valorNuevo: {
        estaBloqueado: updated.EstaBloqueado,
      },
      req, // Pasar el request para obtener headers
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
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioIdAccion } = await requirePermiso("empleados:admin");

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
            Id: true,
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
        Id: BigInt(usuarioIdAccion),
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

    // Obtener datos del empleado para la auditoría ANTES de borrar
    const personaCompleta = await prisma.persona.findFirst({
      where: { Id: personaId, TenantId: tenantIdBig },
      select: { Nombre: true, Apellido: true, Mail: true },
    });
    
    const empleadoId = persona.Persona_Empleado?.Id || null;
    const usuarioAfectadoId = persona.Persona_Empleado?.Usuario?.[0]?.Id || null;

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

    // Registrar auditoría después de borrar en BD pero antes de Supabase
    if (personaCompleta) {
      await registrarAuditoria({
        tenantId,
        usuarioId: usuarioIdAccion,
        accion: "ELIMINAR_USUARIO",
        empleadoId: empleadoId,
        usuarioAfectadoId: usuarioAfectadoId,
        detalle: `Empleado eliminado: ${personaCompleta.Nombre} ${personaCompleta.Apellido} (${personaCompleta.Mail})`,
        valorAnterior: {
          nombre: personaCompleta.Nombre,
          apellido: personaCompleta.Apellido,
          email: personaCompleta.Mail,
        },
        req, // Pasar el request para obtener headers
      });
    }

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
    return handleError(error);
  }
}

type PerfilesTipo = {
  Tipo: "ADMINISTRADOR" | "EMPLEADO";
};
