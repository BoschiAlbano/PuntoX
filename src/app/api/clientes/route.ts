import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

// Schema para crear cliente
const createClienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  dni: z.string().optional().nullable(),
  direccion: z.string().min(1, "La dirección es requerida"),
  telefono: z.string().optional().nullable(),
  mail: z.string().email("Email inválido"),
  localidadId: z.union([z.number(), z.string()]),
  condicionIvaId: z.union([z.number(), z.string()]),
  activarCtaCte: z.boolean().optional().default(false),
  tieneLimiteCompra: z.boolean().optional().default(false),
  montoMaximoCtaCte: z.number().min(0).optional().default(0),
});

// Schema para actualizar cliente
const updateClienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  dni: z.string().optional().nullable(),
  direccion: z.string().min(1).optional(),
  telefono: z.string().optional().nullable(),
  mail: z.string().email().optional(),
  localidadId: z.union([z.number(), z.string()]).optional(),
  condicionIvaId: z.union([z.number(), z.string()]).optional(),
  activarCtaCte: z.boolean().optional(),
  tieneLimiteCompra: z.boolean().optional(),
  montoMaximoCtaCte: z.number().min(0).optional(),
});

import { parsePaginationParams, createPaginationResponse } from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";

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
    const total = await prisma.persona.count({ where });

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
      orderBy: {
        Apellido: "asc",
      },
    });

    const response = clientes.map((persona) => {
      const cliente = persona.Persona_Cliente;
      return {
        id: Number(persona.Id),
        nombre: persona.Nombre,
        apellido: persona.Apellido,
        nombreCompleto: `${persona.Nombre} ${persona.Apellido}`,
        dni: persona.Dni,
        direccion: persona.Direccion,
        telefono: persona.Telefono,
        mail: persona.Mail,
        localidadId: Number(persona.LocalidadId),
        localidad: persona.Localidad?.Descripcion ?? null,
        departamento: persona.Localidad?.Departamento?.Descripcion ?? null,
        provincia: persona.Localidad?.Departamento?.Provincia?.Descripcion ?? null,
        condicionIvaId: cliente ? Number(cliente.CondicionIvaId) : null,
        condicionIva: cliente?.CondicionIva?.Descripcion ?? null,
        activarCtaCte: cliente?.ActivarCtaCte ?? false,
        tieneLimiteCompra: cliente?.TieneLimiteCompra ?? false,
        montoMaximoCtaCte: cliente?.MontoMaximoCtaCte
          ? Number(cliente.MontoMaximoCtaCte)
          : 0,
      };
    });

    const paginatedResponse = createPaginationResponse(response, total, pagination);

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
    const localidadIdNumber = Number(data.localidadId);
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
    const condicionIvaIdNumber = Number(data.condicionIvaId);
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
    const mailNormalized = data.mail.trim().toLowerCase();
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

    // Crear Persona + Persona_Cliente en transacción
    const created = await prisma.$transaction(async (tx) => {
      // Crear Persona
      const persona = await tx.persona.create({
        data: {
          TenantId: tenantIdBigInt,
          Nombre: data.nombre.trim(),
          Apellido: data.apellido.trim(),
          Dni: data.dni?.trim() || null,
          Direccion: data.direccion.trim(),
          Telefono: data.telefono?.trim() || null,
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
          ActivarCtaCte: data.activarCtaCte ?? false,
          TieneLimiteCompra: data.tieneLimiteCompra ?? false,
          MontoMaximoCtaCte: data.montoMaximoCtaCte ?? 0,
        },
      });

      return persona;
    });

    // Obtener datos completos del cliente creado
    const clienteCompleto = await prisma.persona.findUnique({
      where: { Id: created.Id },
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

    const json = await req.json().catch(() => null);
    const parsed = updateClienteSchema.safeParse(json);

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
    const searchParams = req.nextUrl.searchParams;
    const clienteId = searchParams.get("id");

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
    if (data.localidadId !== undefined) {
      localidadIdNumber = Number(data.localidadId);
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
    if (data.condicionIvaId !== undefined) {
      condicionIvaIdNumber = Number(data.condicionIvaId);
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
    if (data.mail !== undefined) {
      const mailNormalized = data.mail.trim().toLowerCase();
      const existingPersona = await prisma.persona.findFirst({
        where: {
          Mail: mailNormalized,
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          Id: { not: personaId },
        },
      });

      if (existingPersona) {
        return NextResponse.json(
          { error: "El correo ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Actualizar Persona y Persona_Cliente en transacción
    const updated = await prisma.$transaction(async (tx) => {
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
      if (data.nombre !== undefined) updatePersonaData.Nombre = data.nombre.trim();
      if (data.apellido !== undefined)
        updatePersonaData.Apellido = data.apellido.trim();
      if (data.dni !== undefined) updatePersonaData.Dni = data.dni?.trim() || undefined;
      if (data.direccion !== undefined)
        updatePersonaData.Direccion = data.direccion.trim();
      if (data.telefono !== undefined)
        updatePersonaData.Telefono = data.telefono?.trim() || undefined;
      if (data.mail !== undefined)
        updatePersonaData.Mail = data.mail.trim().toLowerCase();
      if (localidadIdNumber !== null)
        updatePersonaData.LocalidadId = BigInt(localidadIdNumber);

      const persona = await tx.persona.update({
        where: { Id: personaId, TenantId: tenantIdBigInt },
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
      if (data.activarCtaCte !== undefined)
        updateClienteData.ActivarCtaCte = data.activarCtaCte;
      if (data.tieneLimiteCompra !== undefined)
        updateClienteData.TieneLimiteCompra = data.tieneLimiteCompra;
      if (data.montoMaximoCtaCte !== undefined)
        updateClienteData.MontoMaximoCtaCte = data.montoMaximoCtaCte;

      await tx.persona_Cliente.update({
        where: { Id: personaId },
        data: updateClienteData,
      });

      return persona;
    });

    // Obtener datos completos del cliente actualizado
    const clienteCompleto = await prisma.persona.findUnique({
      where: { Id: updated.Id },
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
        clienteCompleto!.Localidad?.Departamento?.Provincia?.Descripcion ?? null,
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
    const clienteId = searchParams.get("id");

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



