import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { requirePermiso, PermisoError } from "@/lib/requirePermiso";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { handleError } from "@/lib/errors/handler";

type RolTipo = "ADMINISTRADOR" | "EMPLEADO";

const rolSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(["ADMINISTRADOR", "EMPLEADO"]).default("EMPLEADO"),
  permisos: z.array(z.string().min(1)).optional().default([]),
});

function normalizePermisoKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapRolTipo(tipo?: string | null): RolTipo {
  if (tipo === "ADMINISTRADOR" || tipo === "EMPLEADO") return tipo;
  return "EMPLEADO";
}

export async function GET() {
  try {
    const { tenantId } = await requirePermiso("empleados:admin");

    const roles = await prisma.perfiles.findMany({
      where: { TenantId: BigInt(tenantId), EstaEliminado: false },
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
    });

    const response = roles.map((rol) => ({
      id: Number(rol.Id),
      nombre: rol.Descripcion,
      tipo: mapRolTipo(rol.Tipo as string | undefined),
      descripcion: null as string | null,
      usuarios: rol.PerfilUsuario.length,
      permisos: rol.PerfilPermiso.filter(
        (pp) => !pp.Permiso?.EstaEliminado
      ).map((pp) => pp.Permiso?.Descripcion ?? pp.Permiso?.Clave ?? ""),
    }));

    return NextResponse.json({ roles: response }, { status: 200 });
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

export async function POST(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");
    const json = await req.json().catch(() => null);
    const parsed = rolSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const data = parsed.data;
    // Si es rol administrador, nos aseguramos de incluir el permiso core de empleados.
    const permisosSolicitados = Array.from(
      new Set([
        ...(data.permisos ?? []),
        ...(data.tipo === "ADMINISTRADOR" ? ["empleados:admin"] : []),
      ])
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
        { status: 400 }
      );
    }

    const permisosUnicos = Array.from(
      new Set(
        permisosSolicitados.map((p) => p.trim()).filter((p) => p.length > 0)
      )
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
        permisos = await Promise.all(
          permisosUnicos.map((permisoLabel) => {
            const clave =
              normalizePermisoKey(permisoLabel) || permisoLabel.toLowerCase();
            return tx.permiso.upsert({
              where: {
                Clave_TenantId: { Clave: clave, TenantId: tenantIdBigInt },
              },
              update: { Descripcion: permisoLabel, EstaEliminado: false },
              create: {
                Clave: clave,
                Descripcion: permisoLabel,
                TenantId: tenantIdBigInt,
              },
            });
          })
        );

        await tx.perfilPermiso.createMany({
          data: permisos.map((permiso) => ({
            PerfilId: rol.Id,
            PermisoId: permiso.Id,
            TenantId: tenantIdBigInt,
          })),
          skipDuplicates: true,
        });
      }

      return { rol, permisos };
    });

    const rolResponse = {
      id: Number(created.rol.Id),
      nombre: created.rol.Descripcion,
      tipo: mapRolTipo(created.rol.Tipo as string | undefined),
      descripcion: data.descripcion ?? null,
      usuarios: 0,
      permisos: created.permisos.map((p) => p.Descripcion ?? p.Clave),
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
        permisos: created.permisos.map((p) => p.Descripcion ?? p.Clave),
      },
      req,
    });

    return NextResponse.json({ rol: rolResponse }, { status: 201 });
  } catch (error) {
    console.error("Error al crear rol", error);
    return NextResponse.json({ error: "Error al crear rol" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");
    const tenantIdBigInt = BigInt(tenantId);

    const { searchParams } = new URL(req.url);
    const rolIdParam = searchParams.get("id");

    if (!rolIdParam) {
      return NextResponse.json(
        { error: "ID de rol requerido" },
        { status: 400 }
      );
    }

    const rolIdNumber = Number(rolIdParam);
    if (!Number.isInteger(rolIdNumber) || rolIdNumber <= 0) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Validar si es rol del sistema
    const nombreNormalizado = rolExistente.Descripcion.trim().toLowerCase();
    const esRolSistema =
      rolIdNumber < 0 ||
      nombreNormalizado === "administrador" ||
      nombreNormalizado === "admin" ||
      nombreNormalizado === "superadmin";

    const json = await req.json().catch(() => null);
    const parsed = rolSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const data = parsed.data;

    // Si es rol del sistema, no permitir cambiar nombre ni tipo
    if (esRolSistema) {
      if (
        data.nombre.trim() !== rolExistente.Descripcion.trim() ||
        data.tipo !== rolExistente.Tipo
      ) {
        return NextResponse.json(
          { error: "No se puede modificar el nombre o tipo de un rol del sistema" },
          { status: 400 }
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
            { status: 400 }
          );
        }
      }
    }

    // Si es rol administrador, asegurar que incluya el permiso core
    const permisosSolicitados = Array.from(
      new Set([
        ...(data.permisos ?? []),
        ...(data.tipo === "ADMINISTRADOR" ? ["empleados:admin"] : []),
      ])
    );

    const permisosUnicos = Array.from(
      new Set(
        permisosSolicitados.map((p) => p.trim()).filter((p) => p.length > 0)
      )
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
        permisos = await Promise.all(
          permisosUnicos.map((permisoLabel) => {
            const clave =
              normalizePermisoKey(permisoLabel) || permisoLabel.toLowerCase();
            return tx.permiso.upsert({
              where: {
                Clave_TenantId: { Clave: clave, TenantId: tenantIdBigInt },
              },
              update: { Descripcion: permisoLabel, EstaEliminado: false },
              create: {
                Clave: clave,
                Descripcion: permisoLabel,
                TenantId: tenantIdBigInt,
              },
            });
          })
        );

        await tx.perfilPermiso.createMany({
          data: permisos.map((permiso) => ({
            PerfilId: rolIdBigInt,
            PermisoId: permiso.Id,
            TenantId: tenantIdBigInt,
          })),
          skipDuplicates: true,
        });
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
      id: Number(updated.rol.Id),
      nombre: updated.rol.Descripcion,
      tipo: mapRolTipo(updated.rol.Tipo as string | undefined),
      descripcion: data.descripcion ?? null,
      usuarios: updated.rol.PerfilUsuario.length,
      permisos: updated.rol.PerfilPermiso.filter(
        (pp) => !pp.Permiso?.EstaEliminado
      ).map((pp) => pp.Permiso?.Descripcion ?? pp.Permiso?.Clave ?? ""),
    };

    // Registrar auditoría EDITAR_ROL
    const permisosAnteriores = rolExistente.PerfilPermiso
      .filter((pp) => !pp.Permiso?.EstaEliminado)
      .map((pp) => pp.Permiso?.Descripcion ?? pp.Permiso?.Clave ?? "");
    
    const permisosNuevos = updated.rol.PerfilPermiso
      .filter((pp) => !pp.Permiso?.EstaEliminado)
      .map((pp) => pp.Permiso?.Descripcion ?? pp.Permiso?.Clave ?? "");

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
    const { actualizarPermisosUsuariosDelRol } = await import("@/lib/auth/updateUserPermissions");
    actualizarPermisosUsuariosDelRol(rolIdBigInt, tenantIdBigInt).catch((err) => {
      console.warn("No se pudieron actualizar permisos en JWT:", err);
    });

    return NextResponse.json({ rol: rolResponse }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar rol", error);
    return NextResponse.json(
      { error: "Error al actualizar el rol" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, usuarioId } = await requirePermiso("empleados:admin");
    const tenantIdBigInt = BigInt(tenantId);

    const { searchParams } = new URL(req.url);
    const rolIdParam = searchParams.get("id");

    if (!rolIdParam) {
      return NextResponse.json(
        { error: "ID de rol requerido" },
        { status: 400 }
      );
    }

    const rolIdNumber = Number(rolIdParam);
    if (!Number.isInteger(rolIdNumber) || rolIdNumber <= 0) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Bloquear eliminación si tiene usuarios asignados
    if (rol.PerfilUsuario.length > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el rol porque tiene ${rol.PerfilUsuario.length} usuario(s) asignado(s). Asigna los usuarios a otro rol primero.`,
        },
        { status: 400 }
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
        { status: 400 }
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
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar rol", error);
    return NextResponse.json(
      { error: "Error al eliminar el rol" },
      { status: 500 }
    );
  }
}