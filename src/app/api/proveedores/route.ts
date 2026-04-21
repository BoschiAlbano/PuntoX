import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS, GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import {
  createProveedorSchema,
  updateProveedorSchema,
} from "@/lib/validations/proveedor.schema";
import { Prisma } from "../../../../prisma/generated/prisma";

// GET: Listar proveedores
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: GET_PERMISSIONS.PROVEEDORES,
    });

    const pagination = parsePaginationParams(req);
    const searchParams = req.nextUrl.searchParams;
    const busqueda = searchParams.get("q")?.trim() || "";

    const where: Prisma.ProveedorWhereInput = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    };

    // Si hay búsqueda, filtrar por RazonSocial, CUIT, o Mail
    if (busqueda) {
      where.OR = [
        { RazonSocial: { contains: busqueda, mode: "insensitive" } },
        { CUIT: { contains: busqueda, mode: "insensitive" } },
        { Mail: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    const [total, proveedores] = await Promise.all([
      prisma.proveedor.count({ where }),
      prisma.proveedor.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        select: {
          Id: true,
          RazonSocial: true,
          CUIT: true,
          Direccion: true,
          Telefono: true,
          Mail: true,
          LocalidadId: true,
          CondicionIvaId: true,
          Localidad: {
            select: {
              Id: true,
              Descripcion: true,
              Departamento: {
                select: {
                  Id: true,
                  Descripcion: true,
                  Provincia: { select: { Id: true, Descripcion: true } },
                },
              },
            },
          },
          CondicionIva: {
            select: {
              Id: true,
              Descripcion: true,
            },
          },
        },
        orderBy: {
          RazonSocial: "asc",
        },
      }),
    ]);

    const formattedProveedores = proveedores.map(prov => ({
      Id: Number(prov.Id),
      RazonSocial: prov.RazonSocial,
      CUIT: prov.CUIT,
      Direccion: prov.Direccion,
      Telefono: prov.Telefono,
      Mail: prov.Mail,
      LocalidadId: Number(prov.LocalidadId),
      Localidad: prov.Localidad?.Descripcion ?? null,
      DepartamentoId: Number(prov.Localidad?.Departamento?.Id ?? 0),
      Departamento: prov.Localidad?.Departamento?.Descripcion ?? null,
      ProvinciaId: Number(prov.Localidad?.Departamento?.Provincia?.Id ?? 0),
      Provincia: prov.Localidad?.Departamento?.Provincia?.Descripcion ?? null,
      CondicionIvaId: Number(prov.CondicionIvaId),
      CondicionIva: prov.CondicionIva?.Descripcion ?? null,
    }));

    const paginatedResponse = createPaginationResponse(
      formattedProveedores,
      total,
      pagination,
    );

    return NextResponse.json(paginatedResponse, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

// POST: Crear proveedor
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.PROVEEDORES,
    });

    const json = await req.json().catch(() => null);
    const parsed = createProveedorSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Validar localidad
    const localidadIdNumber = Number(data.LocalidadId);
    if (!Number.isInteger(localidadIdNumber)) {
      return NextResponse.json(
        { error: "Localidad inválida" },
        { status: 400 },
      );
    }

    const localidadValida = await prisma.localidad.findFirst({
      where: {
        Id: BigInt(localidadIdNumber),
        EstaEliminado: false,
      },
    });

    if (!localidadValida) {
      return NextResponse.json(
        { error: "Localidad no válida" },
        { status: 400 },
      );
    }

    // Validar condición IVA
    const condicionIvaIdNumber = Number(data.CondicionIvaId);
    if (!Number.isInteger(condicionIvaIdNumber)) {
      return NextResponse.json(
        { error: "Condición IVA inválida" },
        { status: 400 },
      );
    }

    const condicionIvaValida = await prisma.condicionIva.findFirst({
      where: {
        Id: BigInt(condicionIvaIdNumber),
        EstaEliminado: false,
      },
    });

    if (!condicionIvaValida) {
      return NextResponse.json(
        { error: "Condición IVA no válida" },
        { status: 400 },
      );
    }

    const mailNormalized = data.Mail.trim().toLowerCase();
    
    // Check if duplicate email
    const existingProveedor = await prisma.proveedor.findFirst({
       where: {
         Mail: mailNormalized,
         TenantId: tenantId,
         EstaEliminado: false,
       }
    });

    if (existingProveedor) {
        return NextResponse.json(
            { error: "El correo ya está registrado para otro proveedor" },
            { status: 400 },
        );
    }

    const proveedorCreado = await prisma.proveedor.create({
      data: {
        TenantId: tenantId,
        RazonSocial: data.RazonSocial.trim(),
        CUIT: data.CUIT.trim(),
        Direccion: data.Direccion.trim(),
        Telefono: data.Telefono?.trim() || null,
        Mail: mailNormalized,
        LocalidadId: BigInt(localidadIdNumber),
        CondicionIvaId: BigInt(condicionIvaIdNumber),
        EstaEliminado: false,
      },
      select: {
          Id: true,
          RazonSocial: true,
          CUIT: true,
          Direccion: true,
          Telefono: true,
          Mail: true,
          LocalidadId: true,
          CondicionIvaId: true,
          Localidad: {
            select: {
              Descripcion: true,
              Departamento: {
                select: {
                  Id: true,
                  Descripcion: true,
                  Provincia: { select: { Id: true, Descripcion: true } },
                },
              },
            },
          },
          CondicionIva: {
            select: {
              Descripcion: true,
            },
          },
        },
    });

    const proveedorResponse = {
      Id: Number(proveedorCreado.Id),
      RazonSocial: proveedorCreado.RazonSocial,
      CUIT: proveedorCreado.CUIT,
      Direccion: proveedorCreado.Direccion,
      Telefono: proveedorCreado.Telefono,
      Mail: proveedorCreado.Mail,
      LocalidadId: Number(proveedorCreado.LocalidadId),
      Localidad: proveedorCreado.Localidad?.Descripcion ?? null,
      DepartamentoId: Number(proveedorCreado.Localidad?.Departamento?.Id ?? 0),
      Departamento: proveedorCreado.Localidad?.Departamento?.Descripcion ?? null,
      ProvinciaId: Number(proveedorCreado.Localidad?.Departamento?.Provincia?.Id ?? 0),
      Provincia: proveedorCreado.Localidad?.Departamento?.Provincia?.Descripcion ?? null,
      CondicionIvaId: Number(proveedorCreado.CondicionIvaId),
      CondicionIva: proveedorCreado.CondicionIva?.Descripcion ?? null,
    };

    return NextResponse.json({ proveedor: proveedorResponse }, { status: 201 });
  } catch (error: unknown) {
    return handleError(error);
  }
}

// PATCH: Actualizar proveedor
export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.PROVEEDORES,
    });

    const body = await req.json();
    const validarProveedor = updateProveedorSchema.parse(body);
    const tenantIdBigInt = BigInt(tenantId);

    // Verificar que el proveedor existe
    const proveedorExistente = await prisma.proveedor.findFirst({
      where: {
        Id: BigInt(validarProveedor.Id),
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      select: {
        Id: true,
      },
    });

    if (!proveedorExistente) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );
    }

    // Validar localidad si se proporciona
    let localidadIdNumber: number | null = null;
    if (validarProveedor.LocalidadId !== undefined) {
      localidadIdNumber = Number(validarProveedor.LocalidadId);
      if (!Number.isInteger(localidadIdNumber)) {
        return NextResponse.json(
          { error: "Localidad inválida" },
          { status: 400 },
        );
      }

      const localidadValida = await prisma.localidad.findFirst({
        where: {
          Id: BigInt(localidadIdNumber),
          EstaEliminado: false,
        },
      });

      if (!localidadValida) {
        return NextResponse.json(
          { error: "Localidad no válida" },
          { status: 400 },
        );
      }
    }

    // Validar condición IVA si se proporciona
    let condicionIvaIdNumber: number | null = null;
    if (validarProveedor.CondicionIvaId !== undefined) {
      condicionIvaIdNumber = Number(validarProveedor.CondicionIvaId);
      if (!Number.isInteger(condicionIvaIdNumber)) {
        return NextResponse.json(
          { error: "Condición IVA inválida" },
          { status: 400 },
        );
      }

      const condicionIvaValida = await prisma.condicionIva.findFirst({
        where: {
          Id: BigInt(condicionIvaIdNumber),
          EstaEliminado: false,
        },
      });

      if (!condicionIvaValida) {
        return NextResponse.json(
          { error: "Condición IVA no válida" },
          { status: 400 },
        );
      }
    }

    if (validarProveedor.Mail !== undefined) {
        const mailNormalized = validarProveedor.Mail.trim().toLowerCase();
        const checkMail = await prisma.proveedor.findFirst({
            where: {
                Mail: mailNormalized,
                TenantId: tenantIdBigInt,
                EstaEliminado: false,
                Id: { not: BigInt(validarProveedor.Id) }
            }
        })
        if (checkMail) {
            return NextResponse.json(
                { error: "El correo ya está registrado para otro proveedor" },
                { status: 400 },
            );
        }
    }

    const updateData: Prisma.ProveedorUpdateInput = {};
    if (validarProveedor.RazonSocial !== undefined) updateData.RazonSocial = validarProveedor.RazonSocial.trim();
    if (validarProveedor.CUIT !== undefined) updateData.CUIT = validarProveedor.CUIT.trim();
    if (validarProveedor.Direccion !== undefined) updateData.Direccion = validarProveedor.Direccion.trim();
    if (validarProveedor.Telefono !== undefined) updateData.Telefono = validarProveedor.Telefono?.trim() || null;
    if (validarProveedor.Mail !== undefined) updateData.Mail = validarProveedor.Mail.trim().toLowerCase();
    
    if (localidadIdNumber !== null) {
      updateData.Localidad = { connect: { Id: BigInt(localidadIdNumber) } };
    }
    if (condicionIvaIdNumber !== null) {
      updateData.CondicionIva = { connect: { Id: BigInt(condicionIvaIdNumber) } };
    }

    const proveedorActualizado = await prisma.proveedor.update({
        where: { Id: BigInt(validarProveedor.Id) },
        data: updateData,
        select: {
          Id: true,
          RazonSocial: true,
          CUIT: true,
          Direccion: true,
          Telefono: true,
          Mail: true,
          LocalidadId: true,
          CondicionIvaId: true,
          Localidad: {
            select: {
              Id: true,
              Descripcion: true,
              Departamento: {
                select: {
                  Id: true,
                  Descripcion: true,
                  Provincia: { select: { Id: true, Descripcion: true } },
                },
              },
            },
          },
          CondicionIva: {
            select: {
              Id: true,
              Descripcion: true,
            },
          },
        },
    });

    const proveedorResponse = {
      Id: Number(proveedorActualizado.Id),
      RazonSocial: proveedorActualizado.RazonSocial,
      CUIT: proveedorActualizado.CUIT,
      Direccion: proveedorActualizado.Direccion,
      Telefono: proveedorActualizado.Telefono,
      Mail: proveedorActualizado.Mail,
      LocalidadId: Number(proveedorActualizado.LocalidadId),
      Localidad: proveedorActualizado.Localidad?.Descripcion ?? null,
      DepartamentoId: Number(proveedorActualizado.Localidad?.Departamento?.Id ?? 0),
      Departamento: proveedorActualizado.Localidad?.Departamento?.Descripcion ?? null,
      ProvinciaId: Number(proveedorActualizado.Localidad?.Departamento?.Provincia?.Id ?? 0),
      Provincia: proveedorActualizado.Localidad?.Departamento?.Provincia?.Descripcion ?? null,
      CondicionIvaId: Number(proveedorActualizado.CondicionIvaId),
      CondicionIva: proveedorActualizado.CondicionIva?.Descripcion ?? null,
    };

    return NextResponse.json({ proveedor: proveedorResponse }, { status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}

// DELETE: Eliminar proveedor (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({
      req,
      permission: SET_PERMISSIONS.PROVEEDORES,
    });

    const searchParams = req.nextUrl.searchParams;
    const proveedorId = searchParams.get("Id");

    if (!proveedorId) {
      return NextResponse.json(
        { error: "ID de proveedor requerido" },
        { status: 400 },
      );
    }

    const idNumber = Number(proveedorId);
    if (!Number.isInteger(idNumber)) {
      return NextResponse.json(
        { error: "ID de proveedor inválido" },
        { status: 400 },
      );
    }

    const tenantIdBigInt = BigInt(tenantId);
    const primsaId = BigInt(idNumber);

    const existe = await prisma.proveedor.findFirst({
      where: {
        Id: primsaId,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
      select: { Id: true },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );
    }

    await prisma.proveedor.update({
        where: { Id: primsaId, TenantId: tenantIdBigInt },
        data: { EstaEliminado: true },
    });

    return NextResponse.json(
      { ok: true, Id: idNumber },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
