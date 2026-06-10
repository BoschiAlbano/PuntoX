import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { PermisoError } from "@/lib/requirePermiso";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import {
  ALL_PERMISSIONS,
  GET_PERMISSIONS,
  SET_PERMISSIONS,
} from "@/lib/constants/comprobantes";

// Conjunto de todas las claves válidas del sistema de permisos
const CLAVES_VALIDAS = new Set<string>(ALL_PERMISSIONS);

type RolTipo = "SUPERADMIN" | "ADMINISTRADOR" | "EMPLEADO";

export const rolSchema = z.object({
  nombre: z
    .string()
    .min(1)
    .max(250, "El nombre no puede exceder 250 caracteres"),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(["SUPERADMIN", "ADMINISTRADOR", "EMPLEADO"]).default("EMPLEADO"),
  permisos: z.array(z.string().min(1)).optional().default([]),
});

function mapRolTipo(tipo?: string | null): RolTipo {
  if (tipo === "SUPERADMIN" || tipo === "ADMINISTRADOR" || tipo === "EMPLEADO") return tipo;
  return "EMPLEADO";
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.EMPLEADOS, // Mismo permiso que productos por coherencia
    });

    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get("q")?.trim() || "";
    const editId = searchParams.get("editId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const skip = (page - 1) * limit;

    const whereBase: any = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
      ...(busqueda
        ? { Descripcion: { contains: busqueda, mode: "insensitive" as const } }
        : {}),
    };

    if (editId && !Number.isNaN(Number(editId))) {
      whereBase.Id = BigInt(editId);
    }

    const [total, roles] = await Promise.all([
      prisma.perfiles.count({ where: whereBase }),
      prisma.perfiles.findMany({
        where: whereBase,
        select: {
          Id: true,
          Descripcion: true,
          Tipo: true,
          PerfilUsuario: { select: { Usuario_Id: true } },
          PerfilPermiso: {
            select: {
              Permiso: {
                select: { Clave: true, Descripcion: true, EstaEliminado: true },
              },
            },
          },
        },
        orderBy: { Descripcion: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const data = roles.map((rol) => ({
      Id: Number(rol.Id),
      nombre: rol.Descripcion,
      tipo: mapRolTipo(rol.Tipo as string | undefined),
      descripcion: null as string | null,
      usuarios: rol.PerfilUsuario.length,
      permisos: rol.PerfilPermiso.filter(
        (pp) => !pp.Permiso?.EstaEliminado,
      ).map((pp) => pp.Permiso?.Clave ?? ""),
    }));

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Retornamos tanto `data` (estándar GenericCrud) como `roles` (compat useRoles/useUsuario)
    return NextResponse.json({ data, roles: data, pagination }, { status: 200 });
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
    const json = await req.json().catch(() => null);
    const parsed = rolSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const data = parsed.data;

    // Validación BOLA / Elevación de privilegios: Solo Admin o SuperAdmin pueden crear roles de Administrador
    if (data.tipo === "ADMINISTRADOR" && !isAdministrador && !isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para crear roles de Administrador" },
        { status: 403 },
      );
    }

    if (data.tipo === "SUPERADMIN" && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Solo un Superadmin puede crear roles de tipo Superadmin" },
        { status: 403 },
      );
    }

    // Si es rol administrador, nos aseguramos de incluir el permiso core de empleados.
    const permisosSolicitados = Array.from(
      new Set([
        ...(data.permisos ?? []),
        ...(data.tipo === "ADMINISTRADOR"
          ? [] /* "empleados:admin" eliminado — redundante con bypass Administrador */
          : []),
      ]),
    );

    const tenantIdBigInt = BigInt(tenantId);

    const existing = await prisma.perfiles.findFirst({
      where: {
        TenantId: tenantIdBigInt,
        Descripcion: data.nombre.trim(),
        EstaEliminado: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un rol con ese nombre" },
        { status: 400 },
      );
    }

    const permisosUnicos = Array.from(
      new Set(
        permisosSolicitados.map((p) => p.trim()).filter((p) => p.length > 0),
      ),
    );

    const created = await prisma.$transaction(async (tx) => {
      const rol = await tx.perfiles.create({
        data: {
          Descripcion: data.nombre.trim(),
          Tipo: data.tipo,
          EstaEliminado: false,
          TenantId: tenantIdBigInt,
        },
      });

      let permisos = [] as {
        Id: bigint;
        Clave: string;
        Descripcion: string | null;
      }[];

      if (permisosUnicos.length) {
        // Solo procesar claves que pertenezcan al catálogo válido del sistema
        const clavesValidas = permisosUnicos.filter((c) =>
          CLAVES_VALIDAS.has(c),
        );

        permisos = await Promise.all(
          clavesValidas.map((clave) =>
            tx.permiso.upsert({
              where: { Clave: clave },
              update: { EstaEliminado: false },
              create: { Clave: clave, EstaEliminado: false },
            }),
          ),
        );

        if (permisos.length > 0) {
          await tx.perfilPermiso.createMany({
            data: permisos.map((permiso) => ({
              PerfilId: rol.Id,
              PermisoId: permiso.Id,
              TenantId: tenantIdBigInt,
            })),
            skipDuplicates: true,
          });
        }
      }

      return { rol, permisos };
    });

    const rolResponse = {
      Id: Number(created.rol.Id),
      nombre: created.rol.Descripcion,
      tipo: mapRolTipo(created.rol.Tipo as string | undefined),
      descripcion: data.descripcion ?? null,
      usuarios: 0,
      permisos: created.permisos.map((p) => p.Clave),
    };

    // Registrar auditoría CREAR_ROL
    await registrarAuditoria({
      tenantId: tenantIdBigInt,
      usuarioId,
      accion: "CREAR_ROL",
      detalle: `Rol creado: ${created.rol.Descripcion}`,
      valorNuevo: {
        nombre: created.rol.Descripcion,
        tipo: created.rol.Tipo,
        permisos: created.permisos.map((p) => p.Clave),
      },
      req,
    });

    return NextResponse.json({ rol: rolResponse }, { status: 201 });
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
    const { tenantId, usuarioId, isAdministrador, isSuperAdmin } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS, // Mismo permiso que productos por coherencia
    });
    const tenantIdBigInt = BigInt(tenantId);

    // Leer Id del body (convención GenericCrud) o del query param ?Id= / ?id= como fallback
    const rawBody = await req.json().catch(() => null);
    const { searchParams } = new URL(req.url);
    const rolIdParam =
      rawBody?.Id != null
        ? String(rawBody.Id)
        : (searchParams.get("Id") ?? searchParams.get("id") ?? "");

    if (!rolIdParam) {
      return NextResponse.json(
        { error: "ID de rol requerido" },
        { status: 400 },
      );
    }

    const rolIdNumber = Number(rolIdParam);
    if (!Number.isInteger(rolIdNumber) || rolIdNumber <= 0) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 },
      );
    }

    const rolIdBigInt = BigInt(rolIdNumber);

    // Verificar que el rol existe y pertenece al tenant
    const rolExistente = await prisma.perfiles.findFirst({
      where: {
        Id: rolIdBigInt,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Descripcion: true,
        Tipo: true,
        PerfilPermiso: {
          select: {
            Permiso: {
              select: { Clave: true, Descripcion: true, EstaEliminado: true },
            },
          },
        },
      },
    });

    if (!rolExistente) {
      return NextResponse.json(
        { error: "Rol no encontrado o no pertenece a este tenant" },
        { status: 404 },
      );
    }

    // Validar si es rol del sistema
    const nombreNormalizado = rolExistente.Descripcion.trim().toLowerCase();
    const esRolSistema =
      rolIdNumber < 0 ||
      nombreNormalizado === "administrador" ||
      nombreNormalizado === "admin" ||
      nombreNormalizado === "superadmin";

    const parsed = rolSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const data = parsed.data;

    // Validación BOLA / Elevación de privilegios: 
    // - Un empleado no puede cambiar un rol a tipo ADMINISTRADOR.
    // - Un empleado no puede editar un rol que ya es de tipo ADMINISTRADOR.
    if (!isAdministrador && !isSuperAdmin) {
      if (data.tipo === "ADMINISTRADOR" || rolExistente.Tipo === "ADMINISTRADOR" || rolExistente.Tipo === "SUPERADMIN") {
        return NextResponse.json(
          { error: "No tienes permisos para modificar o asignar roles de Administrador" },
          { status: 403 },
        );
      }
    }

    // Si es rol del sistema, no permitir cambiar nombre ni tipo
    if (esRolSistema) {
      if (
        data.nombre.trim() !== rolExistente.Descripcion.trim() ||
        data.tipo !== rolExistente.Tipo
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede modificar el nombre o tipo de un rol del sistema",
          },
          { status: 400 },
        );
      }
    } else {
      // Verificar que el nuevo nombre no esté en uso por otro rol
      if (data.nombre.trim() !== rolExistente.Descripcion.trim()) {
        const nombreEnUso = await prisma.perfiles.findFirst({
          where: {
            TenantId: tenantIdBigInt,
            Descripcion: data.nombre.trim(),
            EstaEliminado: false,
            Id: { not: rolIdBigInt },
          },
        });

        if (nombreEnUso) {
          return NextResponse.json(
            { error: "Ya existe un rol con ese nombre" },
            { status: 400 },
          );
        }
      }
    }

    // Si es rol administrador, asegurar que incluya el permiso core
    const permisosSolicitados = Array.from(
      new Set([
        ...(data.permisos ?? []),
        ...(data.tipo === "ADMINISTRADOR"
          ? [] /* "empleados:admin" eliminado — redundante con bypass Administrador */
          : []),
      ]),
    );

    const permisosUnicos = Array.from(
      new Set(
        permisosSolicitados.map((p) => p.trim()).filter((p) => p.length > 0),
      ),
    );

    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar rol (solo si no es del sistema o si es del sistema pero solo cambian permisos)
      if (!esRolSistema) {
        await tx.perfiles.update({
          where: { Id: rolIdBigInt },
          data: {
            Descripcion: data.nombre.trim(),
            Tipo: data.tipo,
          },
        });
      }

      // Eliminar permisos existentes
      await tx.perfilPermiso.deleteMany({
        where: {
          PerfilId: rolIdBigInt,
          TenantId: tenantIdBigInt,
        },
      });

      // Recrear permisos
      let permisos = [] as {
        Id: bigint;
        Clave: string;
        Descripcion: string | null;
      }[];

      if (permisosUnicos.length) {
        // Solo procesar claves que pertenezcan al catálogo válido del sistema
        const clavesValidas = permisosUnicos.filter((c) =>
          CLAVES_VALIDAS.has(c),
        );

        permisos = await Promise.all(
          clavesValidas.map((clave) =>
            tx.permiso.upsert({
              where: { Clave: clave },
              update: { EstaEliminado: false },
              create: { Clave: clave, EstaEliminado: false },
            }),
          ),
        );

        if (permisos.length > 0) {
          await tx.perfilPermiso.createMany({
            data: permisos.map((permiso) => ({
              PerfilId: rolIdBigInt,
              PermisoId: permiso.Id,
              TenantId: tenantIdBigInt,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Obtener el rol actualizado con conteo de usuarios
      const rolActualizado = await tx.perfiles.findFirst({
        where: { Id: rolIdBigInt },
        select: {
          Id: true,
          Descripcion: true,
          Tipo: true,
          PerfilUsuario: { select: { Usuario_Id: true } },
          PerfilPermiso: {
            select: {
              Permiso: {
                select: { Clave: true, Descripcion: true, EstaEliminado: true },
              },
            },
          },
        },
      });

      return {
        rol: rolActualizado,
        permisos,
      };
    });

    if (!updated.rol) {
      throw new Error("Error al actualizar el rol");
    }

    const rolResponse = {
      Id: Number(updated.rol.Id),
      nombre: updated.rol.Descripcion,
      tipo: mapRolTipo(updated.rol.Tipo as string | undefined),
      descripcion: data.descripcion ?? null,
      usuarios: updated.rol.PerfilUsuario.length,
      permisos: updated.rol.PerfilPermiso.filter(
        (pp) => !pp.Permiso?.EstaEliminado,
      ).map((pp) => pp.Permiso?.Clave ?? ""),
    };

    // Registrar auditoría EDITAR_ROL
    const permisosAnteriores = rolExistente.PerfilPermiso.filter(
      (pp) => !pp.Permiso?.EstaEliminado,
    ).map((pp) => pp.Permiso?.Clave ?? "");

    const permisosNuevos = updated.rol.PerfilPermiso.filter(
      (pp) => !pp.Permiso?.EstaEliminado,
    ).map((pp) => pp.Permiso?.Clave ?? "");

    await registrarAuditoria({
      tenantId: tenantIdBigInt,
      usuarioId,
      accion: "EDITAR_ROL",
      detalle: `Rol editado: ${updated.rol.Descripcion}`,
      valorAnterior: {
        nombre: rolExistente.Descripcion,
        tipo: rolExistente.Tipo,
        permisos: permisosAnteriores,
      },
      valorNuevo: {
        nombre: updated.rol.Descripcion,
        tipo: updated.rol.Tipo,
        permisos: permisosNuevos,
      },
      req,
    });

    // Actualizar permisos en JWT de todos los usuarios con este rol
    const { actualizarPermisosUsuariosDelRol } =
      await import("@/lib/auth/updateUserPermissions");
    actualizarPermisosUsuariosDelRol(rolIdBigInt, tenantIdBigInt).catch(() => {
      // Error no crítico, solo loguear silenciosamente
    });

    return NextResponse.json({ rol: rolResponse }, { status: 200 });
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
    const { tenantId, usuarioId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.EMPLEADOS, // Mismo permiso que productos por coherencia
    });
    const tenantIdBigInt = BigInt(tenantId);

    const { searchParams } = new URL(req.url);
    // Soportar ?Id= (convención GenericCrud) y ?id= (legado) como fallback
    const rolIdParam = searchParams.get("Id") ?? searchParams.get("id");

    if (!rolIdParam) {
      return NextResponse.json(
        { error: "ID de rol requerido" },
        { status: 400 },
      );
    }

    const rolIdNumber = Number(rolIdParam);
    if (!Number.isInteger(rolIdNumber) || rolIdNumber <= 0) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 },
      );
    }

    const rolIdBigInt = BigInt(rolIdNumber);

    // Verificar que el rol existe y pertenece al tenant
    const rol = await prisma.perfiles.findFirst({
      where: {
        Id: rolIdBigInt,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Descripcion: true,
        PerfilUsuario: {
          select: { Usuario_Id: true },
        },
      },
    });

    if (!rol) {
      return NextResponse.json(
        { error: "Rol no encontrado o no pertenece a este tenant" },
        { status: 404 },
      );
    }

    // Bloquear eliminación si tiene usuarios asignados
    if (rol.PerfilUsuario.length > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el rol porque tiene ${rol.PerfilUsuario.length} usuario(s) asignado(s). Asigna los usuarios a otro rol primero.`,
        },
        { status: 400 },
      );
    }

    // Bloquear eliminación de roles del sistema (id < 0 o nombres Admin/SuperAdmin)
    const nombreNormalizado = rol.Descripcion.trim().toLowerCase();
    if (
      rolIdNumber < 0 ||
      nombreNormalizado === "administrador" ||
      nombreNormalizado === "admin" ||
      nombreNormalizado === "superadmin"
    ) {
      return NextResponse.json(
        { error: "No se puede eliminar un rol del sistema" },
        { status: 400 },
      );
    }

    // Registrar auditoría antes de eliminar
    await registrarAuditoria({
      tenantId: tenantIdBigInt,
      usuarioId,
      accion: "ELIMINAR_ROL",
      detalle: `Rol eliminado: ${rol.Descripcion}`,
      valorAnterior: {
        nombre: rol.Descripcion,
        usuariosAsignados: rol.PerfilUsuario.length,
      },
      req,
    });

    // Hard delete: eliminar relaciones primero, luego el rol
    await prisma.$transaction(async (tx) => {
      // Eliminar permisos del rol
      await tx.perfilPermiso.deleteMany({
        where: {
          PerfilId: rolIdBigInt,
          TenantId: tenantIdBigInt,
        },
      });

      // Eliminar el rol (hard delete)
      await tx.perfiles.delete({
        where: {
          Id: rolIdBigInt,
        },
      });
    });

    return NextResponse.json(
      { message: "Rol eliminado correctamente" },
      { status: 200 },
    );
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
