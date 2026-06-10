import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { PermisoError } from "@/lib/requirePermiso";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;
const MAX_FOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/** Extrae el mime type desde un data-URL base64. Retorna null si no hay prefijo. */
function parseFotoMime(b64: string): string | null {
  const match = b64.match(/^data:([^;]+);base64,/);
  return match ? match[1].toLowerCase() : null;
}

/** Obtiene el Buffer a partir de un string base64 (con o sin prefijo data-URL). */
function fotoToBuffer(b64: string): Buffer {
  const raw = b64.includes("base64,") ? b64.split("base64,")[1] : b64;
  return Buffer.from(raw, "base64");
}

/** Determina la extensión del archivo según el mime type detectado. */
function extFromMime(mime: string | null): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  return "jpg";
}

/** Elimina la foto de Supabase Storage si la URL pertenece al bucket "empleados". */
async function deleteEmpleadoFotoFromStorage(fotoUrl: string | null) {
  if (!fotoUrl || !fotoUrl.includes("/empleados/")) return;
  try {
    const supabase = getSupabaseServiceClient();
    const path = fotoUrl.split("/empleados/")[1];
    if (path) await supabase.storage.from("empleados").remove([path]);
  } catch (e) {
    console.warn("No se pudo eliminar foto de empleado del storage:", e);
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
  sucursalId: z
    .array(z.union([z.number(), z.string()]))
    .optional()
    .nullable(), // Sucursales a las que pertenece el empleado
  foto: z.string().optional().nullable(), // Base64 de la foto (data-URL o raw base64)
});
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
  sucursalId: z
    .array(z.union([z.number(), z.string()]))
    .optional()
    .nullable(), // Sucursales a las que pertenece el empleado
  foto: z.string().optional().nullable(), // Base64 o URL existente (null = eliminar foto)
});
const deleteEmpleadoSchema = z.object({
  personaId: z.union([z.number(), z.string()]),
});

function mapEstado(estaBloqueado: boolean | null | undefined) {
  if (estaBloqueado) return "Suspendido" as const;
  return "Activo" as const;
}
type EstadoEmpleado = "Activo" | "Suspendido" | "Invitado";

import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { PerfilTipo } from "../../../../prisma/generated/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import {
  PERMISSIONS,
  GET_PERMISSIONS,
  SET_PERMISSIONS,
} from "@/lib/constants/comprobantes";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.EMPLEADOS,
    });

    const pagination = parsePaginationParams(req);

    // Obtener filtros de query params
    const searchParams = req.nextUrl.searchParams;
    const rolFilter = searchParams.get("rol");
    const estadoFilter = searchParams.get("estado");
    const busquedaFilter = searchParams.get("q");
    const sucursalFilter = searchParams.get("sucursal");
    const editId = searchParams.get("editId");

    // Construir where base
    const where: any = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
      Persona_Empleado: { isNot: null },
    };

    if (editId && !Number.isNaN(Number(editId))) {
      where.Id = BigInt(editId);
    }

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

    // Filtro por sucursal
    if (sucursalFilter && sucursalFilter !== "todos") {
      const sucursalId = Number(sucursalFilter);
      if (!Number.isNaN(sucursalId)) {
        usuarioFilters.Sucursales = {
          some: {
            SucursalId: BigInt(sucursalId),
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
            { status: 200 },
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
            Foto: true,
            Usuario: {
              where: { EstaEliminado: false },
              select: {
                Id: true,
                Nombre: true,
                EstaBloqueado: true,
                IntentosFallidos: true,
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
                Sucursales: {
                  where: {
                    Sucursal: {
                      EstaActiva: true,
                      EstaEliminado: false,
                    },
                  },
                  select: {
                    SucursalId: true,
                    EsDefault: true,
                    Sucursal: {
                      select: {
                        Id: true,
                        Nombre: true,
                      },
                    },
                  },
                  orderBy: {
                    EsDefault: "desc",
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
        const foto = persona.Persona_Empleado?.Foto ?? null;
        const usuario = persona.Persona_Empleado?.Usuario?.[0] ?? null;
        const perfil = usuario?.PerfilUsuario?.[0]?.Perfiles ?? null;
        const sucursales = usuario?.Sucursales ?? [];
        const sucursalDefault =
          sucursales.find((s) => s.EsDefault) || sucursales[0];

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
          localidad:
            persona.Localidad && !persona.Localidad.EstaEliminado
              ? persona.Localidad.Descripcion
              : null,
          departamentoId:
            persona.Localidad && persona.Localidad.Departamento
              ? Number(persona.Localidad.Departamento.Id)
              : null,
          provinciaId:
            persona.Localidad &&
            persona.Localidad.Departamento &&
            persona.Localidad.Departamento.Provincia
              ? Number(persona.Localidad.Departamento.Provincia.Id)
              : null,
          rolId: perfil ? Number(perfil.Id) : null,
          rolNombre: perfil?.Descripcion ?? null,
          rolTipo: (perfil?.Tipo as string | undefined) ?? "EMPLEADO",
          sucursales: sucursales.map((s) => ({
            Id: Number(s.Sucursal.Id),
            Nombre: s.Sucursal.Nombre,
            EsDefault: s.EsDefault,
          })),
          // Mantenemos compatibilidad con sucursalId singular (la default)
          sucursalId: sucursalDefault
            ? Number(sucursalDefault.SucursalId)
            : null,
          sucursalNombre: sucursalDefault?.Sucursal?.Nombre ?? null,
          estado,
          legajo: legajo ? `PX-${legajo}` : null,
          foto: foto ?? null,
          dni: persona.Dni,
          ultimaActividad: "Pendiente",
          intentosFallidos: usuario ? Number(usuario.IntentosFallidos ?? 0) : 0,
        };
      });
    } catch (mapError) {
      throw mapError;
    }

    const paginatedResponse = createPaginationResponse(
      response,
      total,
      pagination,
    );

    return NextResponse.json(paginatedResponse, { status: 200 });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return handleError(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId, isAdministrador, isSuperAdmin } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS, // Mismo permiso que productos por coherencia
    });

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
        { status: 400 },
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
          { status: 400 },
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
          { status: 400 },
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

    // Validar sucursales si se proporcionan
    const sucursalesIdsNumbers: number[] = [];
    if (data.sucursalId && Array.isArray(data.sucursalId)) {
      const ids = data.sucursalId as (string | number)[];
      for (const id of ids) {
        const idNum = Number(id);
        if (!Number.isInteger(idNum) || idNum <= 0) {
          return NextResponse.json(
            { error: "Sucursal invalida" },
            { status: 400 },
          );
        }
        sucursalesIdsNumbers.push(idNum);
      }

      if (sucursalesIdsNumbers.length > 0) {
        // Verificar que las sucursales existen y pertenecen al tenant
        const count = await prisma.sucursal.count({
          where: {
            Id: { in: sucursalesIdsNumbers.map((id) => BigInt(id)) },
            TenantId: tenantIdBigInt,
            EstaActiva: true,
            EstaEliminado: false,
          },
        });

        if (count !== sucursalesIdsNumbers.length) {
          return NextResponse.json(
            { error: "Alguna de las sucursales no es válida para este tenant" },
            { status: 400 },
          );
        }
      }
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
        { status: 400 },
      );
    }

    if (
      departamentoIdNumber &&
      localidadValida.Departamento.Id !== BigInt(departamentoIdNumber)
    ) {
      return NextResponse.json(
        { error: "La localidad no pertenece al departamento indicado" },
        { status: 400 },
      );
    }

    if (
      provinciaIdNumber &&
      localidadValida.Departamento.ProvinciaId !== BigInt(provinciaIdNumber)
    ) {
      return NextResponse.json(
        { error: "La localidad no pertenece a la provincia indicada" },
        { status: 400 },
      );
    }

    let rolTipo: PerfilTipo = "EMPLEADO";
    if (rolIdNumber) {
      let rolValido: { Tipo: PerfilTipo } | null = null;
      try {
        const db = await prisma.perfiles.findFirst({
          where: {
            Id: BigInt(rolIdNumber),
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
          },
          select: {
            Tipo: true,
          },
        });

        if (!db) {
          throw new Error("Rol no valido para este tenant");
        }

        rolValido = db;

        rolTipo = rolValido?.Tipo ?? "EMPLEADO";
      } catch {
        if (rolValido === null) {
          return NextResponse.json(
            { error: "Rol no valido para este tenant" },
            { status: 400 },
          );
        }
      }

      if ((rolTipo === "ADMINISTRADOR" || rolTipo === "SUPERADMIN") && !isAdministrador && !isSuperAdmin) {
        return NextResponse.json(
          { error: "No tienes permisos para asignar roles superiores" },
          { status: 403 },
        );
      }
      if (rolTipo === "SUPERADMIN" && !isSuperAdmin) {
        return NextResponse.json(
          { error: "Solo el Super Administrador puede asignar roles Superadmin" },
          { status: 403 }
        );
      }
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
      const { generateInternalEmail } =
        await import("@/lib/auth/generateInternalEmail");
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
          { status: 400 },
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

    // Subir foto a Supabase Storage si se proporcionó
    let fotoUrl: string | null = null;
    if (data.foto && typeof data.foto === "string" && data.foto.length > 0 && !data.foto.startsWith("http")) {
      try {
        const mime = parseFotoMime(data.foto);
        if (!mime || !ALLOWED_IMAGE_TYPES.includes(mime as (typeof ALLOWED_IMAGE_TYPES)[number])) {
          return NextResponse.json(
            { error: "Formato de imagen no válido. Use PNG, JPG o JPEG." },
            { status: 400 },
          );
        }
        const buffer = fotoToBuffer(data.foto);
        if (buffer.length > MAX_FOTO_BYTES) {
          return NextResponse.json(
            { error: "La imagen no puede superar los 5 MB." },
            { status: 400 },
          );
        }
        const ext = extFromMime(mime);
        const supabase = getSupabaseServiceClient();
        const fileName = `${tenantId}/emp-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("empleados")
          .upload(fileName, buffer, { contentType: mime, upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("empleados").getPublicUrl(fileName);
          fotoUrl = urlData.publicUrl;
        } else {
          console.error("Supabase upload error (POST empleado):", uploadError);
        }
      } catch (e) {
        console.error("Error procesando foto (POST empleado):", e);
      }
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
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "No se pudo crear el usuario en Supabase" },
        { status: 500 },
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
          Foto: fotoUrl,
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

      // Asignar sucursales al usuario si se proporcionan
      if (sucursalesIdsNumbers.length > 0) {
        for (let i = 0; i < sucursalesIdsNumbers.length; i++) {
          await tx.usuarioSucursal.create({
            data: {
              UsuarioId: usuario.Id,
              SucursalId: BigInt(sucursalesIdsNumbers[i]),
              TenantId: tenantIdBigInt,
              EsDefault: i === 0, // Primera sucursal asignada es la default
            },
          });
        }
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
      foto: fotoUrl,
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
      const { actualizarPermisosEnJWT } =
        await import("@/lib/auth/updateUserPermissions");
      actualizarPermisosEnJWT(created.usuario.AuthUserId).catch((err) => {
        console.warn("No se pudieron actualizar permisos en JWT:", err);
      });
    }

    return NextResponse.json({ empleado: empleadoResponse }, { status: 201 });
  } catch (error) {
    console.error("Error al crear empleado:", error);
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return handleError(error);
  }
}
export async function PUT(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioIdAccion, isAdministrador, isSuperAdmin } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS, // Mismo permiso que productos por coherencia
    });

    const json = await req.json().catch(() => null);
    const parsed = updateEmpleadoSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error PUT /api/empleados:", parsed.error.format());
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
        { status: 404 },
      );
    }

    const usuarioActual = personaActual.Persona_Empleado?.Usuario?.[0];
    if (!usuarioActual) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const rolIdAnterior = usuarioActual.PerfilUsuario?.[0]?.Perfil_Id
      ? Number(usuarioActual.PerfilUsuario[0].Perfil_Id)
      : null;

    // VALIDACIÓN BOLA: No permitir que un Empleado edite a un Admin/SuperAdmin
    let targetIsAdminOrSuper = false;
    let dbPerfilAnterior = null;
    if (rolIdAnterior) {
      dbPerfilAnterior = await prisma.perfiles.findUnique({
        where: { Id: BigInt(rolIdAnterior) },
        select: { Tipo: true },
      });
      if (dbPerfilAnterior && (dbPerfilAnterior.Tipo === "ADMINISTRADOR" || dbPerfilAnterior.Tipo === "SUPERADMIN")) {
        targetIsAdminOrSuper = true;
      }
    }

    const isTargetAdminOrSuper = personaActual.Persona_Empleado?.Usuario?.[0]?.PerfilUsuario?.some(
      (pu: any) =>
        pu.Perfiles?.Tipo === "ADMINISTRADOR" ||
        pu.Perfiles?.Tipo === "SUPERADMIN" ||
        pu.Perfiles?.tipo === "ADMINISTRADOR" ||
        pu.Perfiles?.tipo === "SUPERADMIN"
    ) || targetIsAdminOrSuper;

    const targetIsSuperAdmin = personaActual.Persona_Empleado?.Usuario?.[0]?.PerfilUsuario?.some(
      (pu: any) => pu.Perfiles?.Tipo === "SUPERADMIN" || pu.Perfiles?.tipo === "SUPERADMIN"
    ) || (dbPerfilAnterior && dbPerfilAnterior.Tipo === "SUPERADMIN");

    if (targetIsSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Solo un Super Administrador puede modificar a otro Super Administrador" },
        { status: 403 },
      );
    }

    if (isTargetAdminOrSuper && !isAdministrador && !isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar a un usuario con rol superior" },
        { status: 403 },
      );
    }

    // VALIDACIÓN: Un Super Administrador no puede ser bajado de rango
    if (targetIsSuperAdmin && data.rolId !== undefined && data.rolId !== null) {
      const nuevoRolDb = await prisma.perfiles.findUnique({
        where: { Id: BigInt(data.rolId) },
        select: { Tipo: true },
      });
      if (!nuevoRolDb || nuevoRolDb.Tipo !== "SUPERADMIN") {
        return NextResponse.json(
          { error: "No se puede degradar el rol de un Super Administrador" },
          { status: 403 },
        );
      }
    }

    // VALIDACIÓN: Un Administrador no puede ser degradado a Empleado
    const targetIsAdmin = personaActual.Persona_Empleado?.Usuario?.[0]?.PerfilUsuario?.some(
      (pu: any) => pu.Perfiles?.Tipo === "ADMINISTRADOR" || pu.Perfiles?.tipo === "ADMINISTRADOR"
    ) || (dbPerfilAnterior && dbPerfilAnterior.Tipo === "ADMINISTRADOR");

    if (targetIsAdmin && data.rolId !== undefined && data.rolId !== null) {
      const nuevoRolDb = await prisma.perfiles.findUnique({
        where: { Id: BigInt(data.rolId) },
        select: { Tipo: true },
      });
      if (nuevoRolDb && nuevoRolDb.Tipo === "EMPLEADO") {
        return NextResponse.json(
          { error: "No se puede degradar a un Administrador a Empleado" },
          { status: 403 },
        );
      }
    }

    // VALIDACIÓN: No permitir asignar rol superior si no eres Admin/SuperAdmin
    if (data.rolId !== undefined && data.rolId !== null) {
      const nuevoRolDb = await prisma.perfiles.findUnique({
        where: { Id: BigInt(data.rolId) },
        select: { Tipo: true },
      });
      if (nuevoRolDb) {
        if ((nuevoRolDb.Tipo === "ADMINISTRADOR" || nuevoRolDb.Tipo === "SUPERADMIN") && !isAdministrador && !isSuperAdmin) {
          return NextResponse.json(
            { error: "No tienes permisos para asignar roles superiores" },
            { status: 403 },
          );
        }
        if (nuevoRolDb.Tipo === "SUPERADMIN" && !isSuperAdmin) {
          return NextResponse.json(
            { error: "Solo el Super Administrador puede asignar el rol de Superadmin" },
            { status: 403 },
          );
        }
      }
    }

    // Validar localidad si se proporciona
    let localidadIdBigInt: bigint | undefined;
    if (data.localidadId !== undefined) {
      const localidadIdNum = Number(data.localidadId);
      if (!Number.isInteger(localidadIdNum)) {
        return NextResponse.json(
          { error: "Localidad invalida" },
          { status: 400 },
        );
      }
      localidadIdBigInt = BigInt(localidadIdNum);

      const localidadValida = await prisma.localidad.findFirst({
        where: { Id: localidadIdBigInt, EstaEliminado: false },
      });

      if (!localidadValida) {
        return NextResponse.json(
          { error: "Localidad no encontrada" },
          { status: 400 },
        );
      }
    }

    // Validar sucursales si se proporcionan
    let sucursalesIdsNumbers: number[] | undefined = undefined;
    if (data.sucursalId !== undefined) {
      if (data.sucursalId === null) {
        sucursalesIdsNumbers = [];
      } else if (Array.isArray(data.sucursalId)) {
        sucursalesIdsNumbers = [];
        const ids = data.sucursalId as (string | number)[];
        for (const id of ids) {
          const idNum = Number(id);
          if (!Number.isInteger(idNum) || idNum <= 0) {
            return NextResponse.json(
              { error: "Sucursal invalida" },
              { status: 400 },
            );
          }
          sucursalesIdsNumbers.push(idNum);
        }

        if (sucursalesIdsNumbers.length > 0) {
          const count = await prisma.sucursal.count({
            where: {
              Id: { in: sucursalesIdsNumbers.map((id) => BigInt(id)) },
              TenantId: tenantIdBig,
              EstaActiva: true,
              EstaEliminado: false,
            },
          });

          if (count !== sucursalesIdsNumbers.length) {
            return NextResponse.json(
              {
                error: "Alguna de las sucursales no es válida para este tenant",
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // Manejar foto: subir nueva, eliminar anterior o limpiar
    let nuevaFotoUrl: string | null | undefined = undefined; // undefined = no tocar, string/null = actualizar
    if (data.foto !== undefined) {
      if (data.foto && !data.foto.startsWith("http")) {
        // Es un nuevo base64: validar, subir y obtener URL
        const mime = parseFotoMime(data.foto);
        if (!mime || !ALLOWED_IMAGE_TYPES.includes(mime as (typeof ALLOWED_IMAGE_TYPES)[number])) {
          return NextResponse.json(
            { error: "Formato de imagen no válido. Use PNG, JPG o JPEG." },
            { status: 400 },
          );
        }
        const buffer = fotoToBuffer(data.foto);
        if (buffer.length > MAX_FOTO_BYTES) {
          return NextResponse.json(
            { error: "La imagen no puede superar los 5 MB." },
            { status: 400 },
          );
        }
        // Eliminar foto anterior si existe
        const fotoActual = await prisma.persona_Empleado.findUnique({
          where: { Id: personaId },
          select: { Foto: true },
        });
        await deleteEmpleadoFotoFromStorage(fotoActual?.Foto ?? null);

        const ext = extFromMime(mime);
        const supabase = getSupabaseServiceClient();
        const empleadoIdForPath = personaId.toString();
        const fileName = `${tenantId}/emp-${empleadoIdForPath}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("empleados")
          .upload(fileName, buffer, { contentType: mime, upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("empleados").getPublicUrl(fileName);
          nuevaFotoUrl = urlData.publicUrl;
        } else {
          console.error("Supabase upload error (PUT empleado):", uploadError);
        }
      } else if (data.foto === null) {
        // Eliminar foto explícitamente
        const fotoActual = await prisma.persona_Empleado.findUnique({
          where: { Id: personaId },
          select: { Foto: true },
        });
        await deleteEmpleadoFotoFromStorage(fotoActual?.Foto ?? null);
        nuevaFotoUrl = null;
      }
      // Si data.foto es una URL existente (empieza con http), no se modifica
    }

    // Actualizar datos
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar Persona
      const personaUpdate: any = {};
      if (data.nombre !== undefined) personaUpdate.Nombre = data.nombre.trim();
      if (data.apellido !== undefined)
        personaUpdate.Apellido = data.apellido.trim();
      if (data.dni !== undefined) personaUpdate.Dni = data.dni || null;
      if (data.direccion !== undefined)
        personaUpdate.Direccion = data.direccion.trim();
      if (data.telefono !== undefined)
        personaUpdate.Telefono = data.telefono || null;
      if (localidadIdBigInt !== undefined)
        personaUpdate.LocalidadId = localidadIdBigInt;

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

      // Actualizar sucursales si se proporcionan
      if (sucursalesIdsNumbers !== undefined) {
        // Eliminar todas las asignaciones de sucursal anteriores
        await tx.usuarioSucursal.deleteMany({
          where: {
            UsuarioId: usuarioActual.Id,
            TenantId: tenantIdBig,
          },
        });

        // Asignar nuevas sucursales
        if (sucursalesIdsNumbers.length > 0) {
          for (let i = 0; i < sucursalesIdsNumbers.length; i++) {
            await tx.usuarioSucursal.create({
              data: {
                UsuarioId: usuarioActual.Id,
                SucursalId: BigInt(sucursalesIdsNumbers[i]),
                TenantId: tenantIdBig,
                EsDefault: i === 0, // Primera sucursal asignada es la default (aunque idealmente debería preservarse la default anterior si sigue asignada)
              },
            });
          }
        }
      }

      // Actualizar foto en Persona_Empleado si corresponde
      if (nuevaFotoUrl !== undefined) {
        await tx.persona_Empleado.update({
          where: { Id: personaId },
          data: { Foto: nuevaFotoUrl },
        });
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
      localidadId: personaActual.LocalidadId
        ? Number(personaActual.LocalidadId)
        : null,
      rolId: rolIdAnterior,
    };

    const valorNuevo: any = {};
    if (data.nombre !== undefined) valorNuevo.nombre = updated.persona.Nombre;
    if (data.apellido !== undefined)
      valorNuevo.apellido = updated.persona.Apellido;
    if (data.dni !== undefined) valorNuevo.dni = updated.persona.Dni;
    if (data.direccion !== undefined)
      valorNuevo.direccion = updated.persona.Direccion;
    if (data.telefono !== undefined)
      valorNuevo.telefono = updated.persona.Telefono;
    if (data.localidadId !== undefined)
      valorNuevo.localidadId = updated.persona.LocalidadId
        ? Number(updated.persona.LocalidadId)
        : null;
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
        const { actualizarPermisosEnJWT } =
          await import("@/lib/auth/updateUserPermissions");
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
        localidadId: updated.persona.LocalidadId
          ? Number(updated.persona.LocalidadId)
          : null,
        rolId: updated.rolIdNuevo,
        foto: nuevaFotoUrl !== undefined ? nuevaFotoUrl : undefined,
      },
    });
  } catch (error) {
    if (error instanceof PermisoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return handleError(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioIdAccion, isAdministrador, isSuperAdmin } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS, // Mismo permiso que productos por coherencia
    });

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
      select: {
        Id: true,
        EstaBloqueado: true,
        Persona_Empleado: { select: { Id: true } },
        PerfilUsuario: {
          select: {
            Perfiles: { select: { Tipo: true } },
          },
        },
      },
    });

    if (!usuarioAnterior) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const targetIsAdminOrSuper = usuarioAnterior.PerfilUsuario?.some(
      (pu) => pu.Perfiles?.Tipo === "ADMINISTRADOR" || pu.Perfiles?.Tipo === "SUPERADMIN"
    );

    if (targetIsAdminOrSuper && !isAdministrador && !isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para bloquear a un usuario con rol superior" },
        { status: 403 },
      );
    }

    const updated = await prisma.usuario.update({
      where: { Id: BigInt(usuarioIdAfectado), TenantId: BigInt(tenantId) },
      data: {
        EstaBloqueado: parsed.data.bloquear,
        // Al desbloquear manualmente, resetear el contador de intentos fallidos
        ...(!parsed.data.bloquear
          ? { IntentosFallidos: 0, FechaUltimoIntento: null }
          : {}),
      },
      select: { Id: true, EstaBloqueado: true },
    });

    // Registrar auditoría
    const accion = updated.EstaBloqueado
      ? "SUSPENDER_USUARIO"
      : "REACTIVAR_USUARIO";
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
        { status: error.status },
      );
    }
    return handleError(error);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, usuarioId: usuarioIdAccion, isAdministrador, isSuperAdmin } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS, // Mismo permiso que productos por coherencia
    });

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
              select: { 
                Id: true, 
                AuthUserId: true,
                PerfilUsuario: {
                  select: {
                    Perfiles: { select: { Tipo: true } }
                  }
                }
              },
            },
          },
        },
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 },
      );
    }

    const targetIsAdminOrSuper = persona.Persona_Empleado?.Usuario?.[0]?.PerfilUsuario?.some(
      (pu) => pu.Perfiles?.Tipo === "ADMINISTRADOR" || pu.Perfiles?.Tipo === "SUPERADMIN"
    );

    if (targetIsAdminOrSuper && !isAdministrador && !isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar a un usuario con rol superior" },
        { status: 403 },
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
        { status: 400 },
      );
    }

    const usuarios = persona.Persona_Empleado?.Usuario ?? [];
    const usuarioIds = usuarios.map((u) => u.Id);
    const authIds = usuarios
      .map((u) => u.AuthUserId)
      .filter(Boolean) as string[];

    // Obtener datos del empleado para la auditoría ANTES de borrar (incluye foto para limpiar storage)
    const personaCompleta = await prisma.persona.findFirst({
      where: { Id: personaId, TenantId: tenantIdBig },
      select: {
        Nombre: true,
        Apellido: true,
        Mail: true,
        Persona_Empleado: { select: { Foto: true } },
      },
    });

    const empleadoId = persona.Persona_Empleado?.Id || null;
    const usuarioAfectadoId =
      persona.Persona_Empleado?.Usuario?.[0]?.Id || null;

    // Limpiar foto del bucket antes de borrar registros en BD
    await deleteEmpleadoFotoFromStorage(personaCompleta?.Persona_Empleado?.Foto ?? null);

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
        { status: error.status },
      );
    }
    return handleError(error);
  }
}
