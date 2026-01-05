import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { createError } from "@/lib/errors/types";
import {
  createClienteSchema,
  updateClienteSchema,
} from "@/lib/validations/cliente.schema";

// GET: Listar clientes
export async function GET(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const pagination = parsePaginationParams(req);
    const searchParams = req.nextUrl.searchParams;
    const busqueda = searchParams.get("q")?.trim() || "";

    const where: {
      TenantId: bigint;
      EstaEliminado: boolean;
      Persona_Cliente?: { isNot: null };
      OR?: Array<{
        Nombre?: { contains: string; mode: "insensitive" };
        Apellido?: { contains: string; mode: "insensitive" };
        Mail?: { contains: string; mode: "insensitive" };
        Dni?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
      Persona_Cliente: { isNot: null },
    };

    // Si hay búsqueda, filtrar por nombre, apellido, email o DNI
    if (busqueda) {
      where.OR = [
        { Nombre: { contains: busqueda, mode: "insensitive" } },
        { Apellido: { contains: busqueda, mode: "insensitive" } },
        { Mail: { contains: busqueda, mode: "insensitive" } },
        { Dni: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    // Obtener total para paginación
    // Nota: Para mejor performance, considerar índices en: TenantId, EstaEliminado, Apellido, Nombre, Mail, Dni
    const total = await prisma.persona.count({ where });

    // Optimización: Usar select específico para reducir datos transferidos
    const clientes = await prisma.persona.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        Id: true,
        Nombre: true,
        Apellido: true,
        Dni: true,
        Direccion: true,
        Telefono: true,
        Mail: true,
        LocalidadId: true,
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
        Persona_Cliente: {
          select: {
            CondicionIvaId: true,
            ActivarCtaCte: true,
            TieneLimiteCompra: true,
            MontoMaximoCtaCte: true,
            CondicionIva: {
              select: {
                Id: true,
                Descripcion: true,
              },
            },
          },
        },
      },
      orderBy: {
        Apellido: "asc",
      },
    });

    const paginatedResponse = createPaginationResponse(
      clientes,
      total,
      pagination
    );

    return NextResponse.json(paginatedResponse, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

// POST: Crear cliente
export async function POST(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const json = await req.json().catch(() => null);
    const parsed = createClienteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const tenantIdBigInt = BigInt(tenantId);

    // Validar localidad
    const localidadIdNumber = Number(data.LocalidadId);
    if (!Number.isInteger(localidadIdNumber)) {
      return NextResponse.json(
        { error: "Localidad inválida" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    // Validar condición IVA
    const condicionIvaIdNumber = Number(data.CondicionIvaId);
    if (!Number.isInteger(condicionIvaIdNumber)) {
      return NextResponse.json(
        { error: "Condición IVA inválida" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    // Validar email único
    const mailNormalized = data.Mail.trim().toLowerCase();
    const existingPersona = await prisma.persona.findFirst({
      where: {
        Mail: mailNormalized,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
      },
    });

    if (existingPersona) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // Crear Persona + Persona_Cliente en transacción y retornar datos completos
    const clienteCompleto = await prisma.$transaction(async (tx) => {
      // Crear Persona
      const persona = await tx.persona.create({
        data: {
          TenantId: tenantIdBigInt,
          Nombre: data.Nombre.trim(),
          Apellido: data.Apellido.trim(),
          Dni: data.Dni?.trim() || null,
          Direccion: data.Direccion.trim(),
          Telefono: data.Telefono?.trim() || null,
          Mail: mailNormalized,
          LocalidadId: BigInt(localidadIdNumber),
          EstaEliminado: false,
        },
      });

      // Crear Persona_Cliente
      await tx.persona_Cliente.create({
        data: {
          Id: persona.Id,
          CondicionIvaId: BigInt(condicionIvaIdNumber),
          ActivarCtaCte: data.ActivarCtaCte ?? false,
          TieneLimiteCompra: data.TieneLimiteCompra ?? false,
          MontoMaximoCtaCte: data.MontoMaximoCtaCte ?? 0,
        },
      });

      // Retornar datos completos directamente de la transacción
      return await tx.persona.findUnique({
        where: { Id: persona.Id },
        select: {
          Id: true,
          Nombre: true,
          Apellido: true,
          Dni: true,
          Direccion: true,
          Telefono: true,
          Mail: true,
          LocalidadId: true,
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
          Persona_Cliente: {
            select: {
              CondicionIvaId: true,
              ActivarCtaCte: true,
              TieneLimiteCompra: true,
              MontoMaximoCtaCte: true,
              CondicionIva: {
                select: {
                  Descripcion: true,
                },
              },
            },
          },
        },
      });
    });

    const clienteResponse = {
      id: Number(clienteCompleto!.Id),
      nombre: clienteCompleto!.Nombre,
      apellido: clienteCompleto!.Apellido,
      nombreCompleto: `${clienteCompleto!.Nombre} ${clienteCompleto!.Apellido}`,
      dni: clienteCompleto!.Dni,
      direccion: clienteCompleto!.Direccion,
      telefono: clienteCompleto!.Telefono,
      mail: clienteCompleto!.Mail,
      localidadId: Number(clienteCompleto!.LocalidadId),
      localidad: clienteCompleto!.Localidad?.Descripcion ?? null,
      departamentoId: Number(clienteCompleto!.Localidad?.Departamento?.Id ?? 0),
      departamento:
        clienteCompleto!.Localidad?.Departamento?.Descripcion ?? null,
      provinciaId: Number(
        clienteCompleto!.Localidad?.Departamento?.Provincia?.Id ?? 0
      ),
      provincia:
        clienteCompleto!.Localidad?.Departamento?.Provincia?.Descripcion ??
        null,
      condicionIvaId: Number(
        clienteCompleto!.Persona_Cliente?.CondicionIvaId ?? 0
      ),
      condicionIva:
        clienteCompleto!.Persona_Cliente?.CondicionIva?.Descripcion ?? null,
      activarCtaCte: clienteCompleto!.Persona_Cliente?.ActivarCtaCte ?? false,
      tieneLimiteCompra:
        clienteCompleto!.Persona_Cliente?.TieneLimiteCompra ?? false,
      montoMaximoCtaCte: clienteCompleto!.Persona_Cliente?.MontoMaximoCtaCte
        ? Number(clienteCompleto!.Persona_Cliente.MontoMaximoCtaCte)
        : 0,
    };

    return NextResponse.json({ cliente: clienteResponse }, { status: 201 });
  } catch (error: unknown) {
    return handleError(error);
  }
}

// PATCH: Actualizar cliente
export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    if (!tenantId || tenantId <= 0) {
      throw createError.unauthorized("TenantId inválido o no proporcionado");
    }

    const body = await req.json();

    const validarCliente = updateClienteSchema.parse(body);

    const tenantIdBigInt = BigInt(tenantId);

    // Verificar que el cliente existe y pertenece al tenant
    const clienteExistente = await prisma.persona.findFirst({
      where: {
        Id: BigInt(validarCliente.Id),
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Persona_Cliente: { isNot: null },
      },
      select: {
        Id: true,
        Persona_Cliente: {
          select: {
            Id: true,
          },
        },
      },
    });

    if (!clienteExistente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Validar localidad si se proporciona
    let localidadIdNumber: number | null = null;
    if (validarCliente.LocalidadId !== undefined) {
      localidadIdNumber = Number(validarCliente.LocalidadId);
      if (!Number.isInteger(localidadIdNumber)) {
        return NextResponse.json(
          { error: "Localidad inválida" },
          { status: 400 }
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
          { status: 400 }
        );
      }
    }

    // Validar condición IVA si se proporciona
    let condicionIvaIdNumber: number | null = null;
    if (validarCliente.CondicionIvaId !== undefined) {
      condicionIvaIdNumber = Number(validarCliente.CondicionIvaId);
      if (!Number.isInteger(condicionIvaIdNumber)) {
        return NextResponse.json(
          { error: "Condición IVA inválida" },
          { status: 400 }
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
          { status: 400 }
        );
      }
    }

    // Validar email único si se proporciona
    if (validarCliente.Mail !== undefined) {
      const mailNormalized = validarCliente.Mail.trim().toLowerCase();
      const existingPersona = await prisma.persona.findFirst({
        where: {
          Mail: mailNormalized,
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          Id: { not: BigInt(validarCliente.Id) },
        },
      });

      if (existingPersona) {
        return NextResponse.json(
          { error: "El correo ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Actualizar Persona y Persona_Cliente en transacción y retornar datos completos
    const clienteCompleto = await prisma.$transaction(async (tx) => {
      // Actualizar Persona
      const updatePersonaData: {
        Nombre?: string;
        Apellido?: string;
        Dni?: string;
        Telefono?: string;
        Mail?: string;
        Direccion?: string;
        LocalidadId?: bigint;
      } = {};
      if (validarCliente.Nombre !== undefined)
        updatePersonaData.Nombre = validarCliente.Nombre.trim();
      if (validarCliente.Apellido !== undefined)
        updatePersonaData.Apellido = validarCliente.Apellido.trim();
      if (validarCliente.Dni !== undefined)
        updatePersonaData.Dni = validarCliente.Dni?.trim() || undefined;
      if (validarCliente.Direccion !== undefined)
        updatePersonaData.Direccion = validarCliente.Direccion.trim();
      if (validarCliente.Telefono !== undefined)
        updatePersonaData.Telefono =
          validarCliente.Telefono?.trim() || undefined;
      if (validarCliente.Mail !== undefined)
        updatePersonaData.Mail = validarCliente.Mail.trim().toLowerCase();
      if (localidadIdNumber !== null)
        updatePersonaData.LocalidadId = BigInt(localidadIdNumber);

      await tx.persona.update({
        where: { Id: BigInt(validarCliente.Id), TenantId: tenantIdBigInt },
        data: updatePersonaData,
      });

      // Actualizar Persona_Cliente
      const updateClienteData: {
        CondicionIvaId?: bigint;
        ActivarCtaCte?: boolean;
        TieneLimiteCompra?: boolean;
        LimiteCompra?: number;
        MontoMaximoCtaCte?: number;
      } = {};
      if (condicionIvaIdNumber !== null)
        updateClienteData.CondicionIvaId = BigInt(condicionIvaIdNumber);
      if (validarCliente.ActivarCtaCte !== undefined)
        updateClienteData.ActivarCtaCte = validarCliente.ActivarCtaCte;
      if (validarCliente.TieneLimiteCompra !== undefined)
        updateClienteData.TieneLimiteCompra = validarCliente.TieneLimiteCompra;
      if (validarCliente.MontoMaximoCtaCte !== undefined)
        updateClienteData.MontoMaximoCtaCte = validarCliente.MontoMaximoCtaCte;

      await tx.persona_Cliente.update({
        where: { Id: BigInt(validarCliente.Id) },
        data: updateClienteData,
      });

      // Retornar datos completos directamente de la transacción
      return await tx.persona.findUnique({
        where: { Id: BigInt(validarCliente.Id) },
        select: {
          Id: true,
          Nombre: true,
          Apellido: true,
          Dni: true,
          Direccion: true,
          Telefono: true,
          Mail: true,
          LocalidadId: true,
          Localidad: {
            select: {
              Descripcion: true,
              Departamento: {
                select: {
                  Descripcion: true,
                  Provincia: {
                    select: {
                      Descripcion: true,
                    },
                  },
                },
              },
            },
          },
          Persona_Cliente: {
            select: {
              CondicionIvaId: true,
              ActivarCtaCte: true,
              TieneLimiteCompra: true,
              MontoMaximoCtaCte: true,
              CondicionIva: {
                select: {
                  Descripcion: true,
                },
              },
            },
          },
        },
      });
    });

    const clienteResponse = {
      id: Number(clienteCompleto!.Id),
      nombre: clienteCompleto!.Nombre,
      apellido: clienteCompleto!.Apellido,
      nombreCompleto: `${clienteCompleto!.Nombre} ${clienteCompleto!.Apellido}`,
      dni: clienteCompleto!.Dni,
      direccion: clienteCompleto!.Direccion,
      telefono: clienteCompleto!.Telefono,
      mail: clienteCompleto!.Mail,
      localidadId: Number(clienteCompleto!.LocalidadId),
      localidad: clienteCompleto!.Localidad?.Descripcion ?? null,
      departamento:
        clienteCompleto!.Localidad?.Departamento?.Descripcion ?? null,
      provincia:
        clienteCompleto!.Localidad?.Departamento?.Provincia?.Descripcion ??
        null,
      condicionIvaId: Number(
        clienteCompleto!.Persona_Cliente?.CondicionIvaId ?? 0
      ),
      condicionIva:
        clienteCompleto!.Persona_Cliente?.CondicionIva?.Descripcion ?? null,
      activarCtaCte: clienteCompleto!.Persona_Cliente?.ActivarCtaCte ?? false,
      tieneLimiteCompra:
        clienteCompleto!.Persona_Cliente?.TieneLimiteCompra ?? false,
      montoMaximoCtaCte: clienteCompleto!.Persona_Cliente?.MontoMaximoCtaCte
        ? Number(clienteCompleto!.Persona_Cliente.MontoMaximoCtaCte)
        : 0,
    };

    return NextResponse.json({ cliente: clienteResponse }, { status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}

// DELETE: Eliminar cliente (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const searchParams = req.nextUrl.searchParams;
    const clienteId = searchParams.get("Id");

    if (!clienteId) {
      return NextResponse.json(
        { error: "ID de cliente requerido" },
        { status: 400 }
      );
    }

    const clienteIdNumber = Number(clienteId);
    if (!Number.isInteger(clienteIdNumber)) {
      return NextResponse.json(
        { error: "ID de cliente inválido" },
        { status: 400 }
      );
    }

    const tenantIdBigInt = BigInt(tenantId);
    const personaId = BigInt(clienteIdNumber);

    // Verificar que el cliente existe y pertenece al tenant
    const clienteExistente = await prisma.persona.findFirst({
      where: {
        Id: personaId,
        TenantId: tenantIdBigInt,
        EstaEliminado: false,
        Persona_Cliente: { isNot: null },
      },
      select: {
        Id: true,
      },
    });

    if (!clienteExistente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete: marcar como eliminado en transacción
    await prisma.$transaction(async (tx) => {
      await tx.persona.update({
        where: { Id: personaId, TenantId: tenantIdBigInt },
        data: { EstaEliminado: true },
      });
    });

    return NextResponse.json(
      { ok: true, clienteId: clienteIdNumber },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
