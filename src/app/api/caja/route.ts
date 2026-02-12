import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import {
  parsePaginationParams,
  createPaginationResponse,
} from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";

/** Límite máximo razonable para montos de caja (evita overflow/DoS) */
const MONTO_CAJA_MAX = 999_999_999_999;

// Schema para abrir caja (exportado para tests de validación)
export const abrirCajaSchema = z.object({
  montoInicial: z
    .number()
    .min(0, "El monto inicial debe ser mayor o igual a 0")
    .max(MONTO_CAJA_MAX, "El monto inicial no puede exceder el límite permitido"),
});

// Schema para cerrar caja (exportado para tests de validación)
export const cerrarCajaSchema = z.object({
  montoCierre: z
    .number()
    .min(0, "El monto de cierre debe ser mayor o igual a 0")
    .max(MONTO_CAJA_MAX, "El monto de cierre no puede exceder el límite permitido"),
});

// GET: Obtener caja actual o historial
export async function GET(req: NextRequest) {
  try {
    const { tenantId, user, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const searchParams = req.nextUrl.searchParams;
    const cajaId = searchParams.get("id");
    const soloAbierta = searchParams.get("soloAbierta") === "true";
    const historial = searchParams.get("historial") === "true";
    const resumenDia = searchParams.get("resumenDia") === "true";
    const pagination = parsePaginationParams(req);

    const sucursalIdParam = req.nextUrl.searchParams.get("sucursalId");

    console.log(
      "sucursalIdParam **************************************",
      sucursalIdParam,
    );

    let sucursalId: bigint | null = null;
    let sucursalNombre: string | null = null;

    if (sucursalIdParam) {
      const access = await verifyUserBranchAccess(
        BigInt(tenantId),
        user.id,
        sucursalIdParam,
      );
      if (access) {
        sucursalId = access.sucursal.Id;
        sucursalNombre = access.sucursal.Nombre;
      }
    }

    // Si se solicita una caja específica
    if (cajaId) {
      const caja = await prisma.caja.findFirst({
        where: {
          Id: BigInt(cajaId),
          TenantId: BigInt(tenantId),
          SucursalId: sucursalId,
          EstaEliminado: false,
        },
        include: {
          Usuario_Caja_UsuarioAperturaIdToUsuario: {
            select: {
              Id: true,
              Nombre: true,
              Persona_Empleado: {
                select: {
                  Persona: {
                    select: {
                      Nombre: true,
                      Apellido: true,
                    },
                  },
                },
              },
            },
          },
          Usuario_Caja_UsuarioCierreIdToUsuario: {
            select: {
              Id: true,
              Nombre: true,
              Persona_Empleado: {
                select: {
                  Persona: {
                    select: {
                      Nombre: true,
                      Apellido: true,
                    },
                  },
                },
              },
            },
          },
          DetalleCaja: {
            where: { EstaEliminado: false },
          },
          Gasto: {
            where: { EstaEliminado: false },
            include: {
              ConceptoGastos: {
                select: {
                  Id: true,
                  Descripcion: true,
                },
              },
              FormaPago: {
                where: { EstaEliminado: false },
              },
            },
            orderBy: { Fecha: "desc" },
          },
          Movimiento: {
            where: { EstaEliminado: false },
            include: {
              Comprobante: {
                select: {
                  Id: true,
                  Numero: true,
                  TipoComprobante: true,
                  Total: true,
                  Fecha: true,
                },
              },
              Usuario: {
                select: {
                  Id: true,
                  Nombre: true,
                },
              },
            },
            orderBy: { Fecha: "desc" },
            take: 50,
          },
        },
      });

      if (!caja) {
        return NextResponse.json(
          { error: "Caja no encontrada" },
          { status: 404 },
        );
      }

      // Formatear nombre completo del usuario
      const formatearNombreUsuario = (usuario: any) => {
        if (!usuario) return null;
        const persona = usuario.Persona_Empleado?.[0]?.Persona;
        if (persona) {
          return `${persona.Nombre} ${persona.Apellido}`.trim();
        }
        return usuario.Nombre || null;
      };

      return NextResponse.json({
        caja: {
          ...caja,
          Id: Number(caja.Id),
          TenantId: Number(caja.TenantId),
          UsuarioAperturaId: Number(caja.UsuarioAperturaId),
          UsuarioCierreId: caja.UsuarioCierreId
            ? Number(caja.UsuarioCierreId)
            : null,
          UsuarioApertura: caja.Usuario_Caja_UsuarioAperturaIdToUsuario
            ? {
                Id: Number(caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Id),
                Nombre: caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Nombre,
                NombreCompleto: formatearNombreUsuario(
                  caja.Usuario_Caja_UsuarioAperturaIdToUsuario,
                ),
              }
            : null,
          UsuarioCierre: caja.Usuario_Caja_UsuarioCierreIdToUsuario
            ? {
                Id: Number(caja.Usuario_Caja_UsuarioCierreIdToUsuario.Id),
                Nombre: caja.Usuario_Caja_UsuarioCierreIdToUsuario.Nombre,
                NombreCompleto: formatearNombreUsuario(
                  caja.Usuario_Caja_UsuarioCierreIdToUsuario,
                ),
              }
            : null,
          DetalleCaja: caja.DetalleCaja.map((d) => ({
            ...d,
            Id: Number(d.Id),
            CajaId: Number(d.CajaId),
            TenantId: Number(d.TenantId),
          })),
          Gasto: caja.Gasto.map((g) => ({
            ...g,
            Id: Number(g.Id),
            CajaId: Number(g.CajaId),
            ConceptoGastoId: Number(g.ConceptoGastoId),
            TenantId: Number(g.TenantId),
            FormaPago: g.FormaPago.map((p) => ({
              ...p,
              Id: Number(p.Id),
              GastoId: Number(p.GastoId),
              TenantId: Number(p.TenantId),
              TipoPago: Number(p.TipoPago),
              Monto: Number(p.Monto),
            })),
          })),
          Movimiento: caja.Movimiento.map((m) => ({
            ...m,
            Id: Number(m.Id),
            CajaId: Number(m.CajaId),
            ComprobanteId: Number(m.ComprobanteId),
            UsuarioId: Number(m.UsuarioId),
            TenantId: Number(m.TenantId),
            Comprobante: {
              ...m.Comprobante,
              Id: Number(m.Comprobante.Id),
            },
            Usuario: {
              ...m.Usuario,
              Id: Number(m.Usuario.Id),
            },
          })),
        },
      });
    }

    // Si se solicita solo la caja abierta
    if (soloAbierta) {
      const usuarioIdParam = searchParams.get("usuarioId");

      if (!usuarioIdParam) {
        return NextResponse.json(
          { error: "usuarioId es requerido para obtener caja abierta" },
          { status: 400 },
        );
      }

      // Buscar el usuario en la base de datos
      const usuario = await prisma.usuario.findFirst({
        where: {
          Id: BigInt(usuarioIdParam),
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
        },
      });

      if (!usuario) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 },
        );
      }

      const caja = await prisma.caja.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          SucursalId: sucursalId,
          UsuarioAperturaId: usuario.Id,
          EstaEliminado: false,
          FechaCierre: null,
        },
        include: {
          Usuario_Caja_UsuarioAperturaIdToUsuario: {
            select: {
              Id: true,
              Nombre: true,
              Persona_Empleado: {
                select: {
                  Persona: {
                    select: {
                      Nombre: true,
                      Apellido: true,
                    },
                  },
                },
              },
            },
          },
          DetalleCaja: {
            where: { EstaEliminado: false },
          },
          Gasto: {
            where: { EstaEliminado: false },
            include: {
              ConceptoGastos: {
                select: {
                  Id: true,
                  Descripcion: true,
                },
              },
              FormaPago: {
                where: { EstaEliminado: false },
              },
            },
            orderBy: { Fecha: "desc" },
          },
          Movimiento: {
            where: { EstaEliminado: false },
            include: {
              Comprobante: {
                select: {
                  Id: true,
                  Numero: true,
                  TipoComprobante: true,
                  Total: true,
                  Fecha: true,
                },
              },
              Usuario: {
                select: {
                  Id: true,
                  Nombre: true,
                },
              },
            },
            orderBy: { Fecha: "desc" },
            take: 50,
          },
        },
      });

      if (!caja) {
        return NextResponse.json({ caja: null });
      }

      // Formatear nombre completo del usuario
      const formatearNombreUsuario = (usuario: any) => {
        if (!usuario) return null;
        const persona = usuario.Persona_Empleado?.[0]?.Persona;
        if (persona) {
          return `${persona.Nombre} ${persona.Apellido}`.trim();
        }
        return usuario.Nombre || null;
      };

      return NextResponse.json({
        caja: {
          ...caja,
          Id: Number(caja.Id),
          TenantId: Number(caja.TenantId),
          UsuarioAperturaId: Number(caja.UsuarioAperturaId),
          UsuarioCierreId: null,
          UsuarioApertura: caja.Usuario_Caja_UsuarioAperturaIdToUsuario
            ? {
                Id: Number(caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Id),
                Nombre: caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Nombre,
                NombreCompleto: formatearNombreUsuario(
                  caja.Usuario_Caja_UsuarioAperturaIdToUsuario,
                ),
              }
            : null,
          UsuarioCierre: null,
          DetalleCaja: caja.DetalleCaja.map((d) => ({
            ...d,
            Id: Number(d.Id),
            CajaId: Number(d.CajaId),
            TenantId: Number(d.TenantId),
          })),
          Gasto: caja.Gasto.map((g) => ({
            ...g,
            Id: Number(g.Id),
            CajaId: Number(g.CajaId),
            ConceptoGastoId: Number(g.ConceptoGastoId),
            TenantId: Number(g.TenantId),
            FormaPago: g.FormaPago.map((p) => ({
              ...p,
              Id: Number(p.Id),
              GastoId: Number(p.GastoId),
              TenantId: Number(p.TenantId),
              TipoPago: Number(p.TipoPago),
              Monto: Number(p.Monto),
            })),
          })),
          Movimiento: caja.Movimiento.map((m) => ({
            ...m,
            Id: Number(m.Id),
            CajaId: Number(m.CajaId),
            ComprobanteId: Number(m.ComprobanteId),
            UsuarioId: Number(m.UsuarioId),
            TenantId: Number(m.TenantId),
            Comprobante: {
              ...m.Comprobante,
              Id: Number(m.Comprobante.Id),
            },
            Usuario: {
              ...m.Usuario,
              Id: Number(m.Usuario.Id),
            },
          })),
        },
      });
    }

    // Resumen del día (todas las cajas del día actual)
    if (resumenDia) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const cajasDelDia = await prisma.caja.findMany({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          FechaApertura: {
            gte: hoy,
            lt: manana,
          },
        },
        include: {
          Usuario_Caja_UsuarioAperturaIdToUsuario: {
            select: {
              Id: true,
              Nombre: true,
              Persona_Empleado: {
                select: {
                  Persona: {
                    select: {
                      Nombre: true,
                      Apellido: true,
                    },
                  },
                },
              },
            },
          },
          Usuario_Caja_UsuarioCierreIdToUsuario: {
            select: {
              Id: true,
              Nombre: true,
              Persona_Empleado: {
                select: {
                  Persona: {
                    select: {
                      Nombre: true,
                      Apellido: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { FechaApertura: "asc" },
      });

      // Calcular totales del día
      const totalesDia = cajasDelDia.reduce(
        (acc, caja) => ({
          montoInicial: acc.montoInicial + Number(caja.MontoInicial),
          totalEntradaEfectivo:
            acc.totalEntradaEfectivo + Number(caja.TotalEntradaEfectivo),
          totalSalidaEfectivo:
            acc.totalSalidaEfectivo + Number(caja.TotalSalidaEfectivo),
          totalEntradaTarjeta:
            acc.totalEntradaTarjeta + Number(caja.TotalEntradaTarjeta),
          totalSalidaTarjeta:
            acc.totalSalidaTarjeta + Number(caja.TotalSalidaTarjeta),
          totalEntradaCheque:
            acc.totalEntradaCheque + Number(caja.TotalEntradaCheque),
          totalSalidaCheque:
            acc.totalSalidaCheque + Number(caja.TotalSalidaCheque),
          totalEntradaCtaCte:
            acc.totalEntradaCtaCte + Number(caja.TotalEntradaCtaCte),
          totalSalidaCtaCte:
            acc.totalSalidaCtaCte + Number(caja.TotalSalidaCtaCte),
          totalEntradaTransf:
            acc.totalEntradaTransf + Number(caja.TotalEntradaTransf),
          totalSalidaTransf:
            acc.totalSalidaTransf + Number(caja.TotalSalidaTransf),
          ganancia: acc.ganancia + Number(caja.Ganancia),
        }),
        {
          montoInicial: 0,
          totalEntradaEfectivo: 0,
          totalSalidaEfectivo: 0,
          totalEntradaTarjeta: 0,
          totalSalidaTarjeta: 0,
          totalEntradaCheque: 0,
          totalSalidaCheque: 0,
          totalEntradaCtaCte: 0,
          totalSalidaCtaCte: 0,
          totalEntradaTransf: 0,
          totalSalidaTransf: 0,
          ganancia: 0,
        },
      );

      // Formatear nombre completo del usuario
      const formatearNombreUsuario = (usuario: any) => {
        if (!usuario) return null;
        const persona = usuario.Persona_Empleado?.[0]?.Persona;
        if (persona) {
          return `${persona.Nombre} ${persona.Apellido}`.trim();
        }
        return usuario.Nombre || null;
      };

      return NextResponse.json({
        resumenDia: {
          fecha: hoy.toISOString(),
          cantidadCajas: cajasDelDia.length,
          totales: {
            ...totalesDia,
            efectivo:
              totalesDia.montoInicial +
              totalesDia.totalEntradaEfectivo -
              totalesDia.totalSalidaEfectivo,
            tarjeta:
              totalesDia.totalEntradaTarjeta - totalesDia.totalSalidaTarjeta,
            cheque:
              totalesDia.totalEntradaCheque - totalesDia.totalSalidaCheque,
            cuentaCorriente:
              totalesDia.totalEntradaCtaCte - totalesDia.totalSalidaCtaCte,
            transferencia:
              totalesDia.totalEntradaTransf - totalesDia.totalSalidaTransf,
            totalCaja:
              totalesDia.montoInicial +
              totalesDia.totalEntradaEfectivo -
              totalesDia.totalSalidaEfectivo +
              totalesDia.totalEntradaTarjeta -
              totalesDia.totalSalidaTarjeta +
              totalesDia.totalEntradaCheque -
              totalesDia.totalSalidaCheque +
              totalesDia.totalEntradaCtaCte -
              totalesDia.totalSalidaCtaCte +
              totalesDia.totalEntradaTransf -
              totalesDia.totalSalidaTransf,
          },
          cajas: cajasDelDia.map((c) => ({
            Id: Number(c.Id),
            FechaApertura: c.FechaApertura,
            FechaCierre: c.FechaCierre,
            MontoInicial: Number(c.MontoInicial),
            MontoCierre: c.MontoCierre ? Number(c.MontoCierre) : null,
            TotalEntradaEfectivo: Number(c.TotalEntradaEfectivo),
            TotalSalidaEfectivo: Number(c.TotalSalidaEfectivo),
            Ganancia: Number(c.Ganancia),
            estaCerrada: !!c.FechaCierre,
            UsuarioApertura: c.Usuario_Caja_UsuarioAperturaIdToUsuario
              ? {
                  Id: Number(c.Usuario_Caja_UsuarioAperturaIdToUsuario.Id),
                  Nombre: c.Usuario_Caja_UsuarioAperturaIdToUsuario.Nombre,
                  NombreCompleto: formatearNombreUsuario(
                    c.Usuario_Caja_UsuarioAperturaIdToUsuario,
                  ),
                }
              : null,
            UsuarioCierre: c.Usuario_Caja_UsuarioCierreIdToUsuario
              ? {
                  Id: Number(c.Usuario_Caja_UsuarioCierreIdToUsuario.Id),
                  Nombre: c.Usuario_Caja_UsuarioCierreIdToUsuario.Nombre,
                  NombreCompleto: formatearNombreUsuario(
                    c.Usuario_Caja_UsuarioCierreIdToUsuario,
                  ),
                }
              : null,
          })),
        },
      });
    }

    // Historial de cajas
    const where: any = {
      TenantId: BigInt(tenantId),
      SucursalId: sucursalId,
      EstaEliminado: false,
    };

    if (historial) {
      where.FechaCierre = { isNot: null };
    }

    const total = await prisma.caja.count({ where });

    const cajas = await prisma.caja.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        Usuario_Caja_UsuarioAperturaIdToUsuario: {
          select: {
            Id: true,
            Nombre: true,
            Persona_Empleado: {
              select: {
                Persona: {
                  select: {
                    Nombre: true,
                    Apellido: true,
                  },
                },
              },
            },
          },
        },
        Usuario_Caja_UsuarioCierreIdToUsuario: {
          select: {
            Id: true,
            Nombre: true,
            Persona_Empleado: {
              select: {
                Persona: {
                  select: {
                    Nombre: true,
                    Apellido: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { FechaApertura: "desc" },
    });

    const response = createPaginationResponse(
      cajas.map((c) => ({
        ...c,
        Id: Number(c.Id),
        TenantId: Number(c.TenantId),
        UsuarioAperturaId: Number(c.UsuarioAperturaId),
        UsuarioCierreId: c.UsuarioCierreId ? Number(c.UsuarioCierreId) : null,
      })),
      total,
      pagination,
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

// POST: Abrir caja
export async function POST(req: NextRequest) {
  try {
    const { tenantId, user, error } = await getAuthUser();

    if (error) {
      return error;
    }

    // Obtener usuario actual
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: { Id: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 },
      );
    }

    const sucursalIdParam = req.nextUrl.searchParams.get("sucursalId");

    let sucursalId: bigint | null = null;
    let sucursalNombre: string | null = null;

    if (sucursalIdParam) {
      const access = await verifyUserBranchAccess(
        BigInt(tenantId),
        user.id,
        sucursalIdParam,
      );
      if (access) {
        sucursalId = access.sucursal.Id;
        sucursalNombre = access.sucursal.Nombre;
      }
    }

    // Verificar si el usuario ya tiene una caja abierta en esta sucursal
    const cajaAbierta = await prisma.caja.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        SucursalId: sucursalId,
        UsuarioAperturaId: usuario.Id,
        EstaEliminado: false,
        FechaCierre: null,
      },
    });

    if (cajaAbierta) {
      return NextResponse.json(
        { error: "Ya tienes una caja abierta en esta sucursal" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const data = abrirCajaSchema.parse(body);

    const nuevaCaja = await prisma.caja.create({
      data: {
        TenantId: BigInt(tenantId),
        SucursalId: sucursalId,
        UsuarioAperturaId: usuario.Id,
        MontoInicial: data.montoInicial,
        FechaApertura: new Date(),
        TotalEntradaEfectivo: 0,
        TotalSalidaEfectivo: 0,
        TotalEntradaTarjeta: 0,
        TotalSalidaTarjeta: 0,
        TotalEntradaCheque: 0,
        TotalSalidaCheque: 0,
        TotalEntradaCtaCte: 0,
        TotalSalidaCtaCte: 0,
        TotalEntradaTransf: 0,
        TotalSalidaTransf: 0,
        EstaEliminado: false,
        Ganancia: 0,
      },
      include: {
        Usuario_Caja_UsuarioAperturaIdToUsuario: {
          select: {
            Id: true,
            Nombre: true,
            Persona_Empleado: {
              select: {
                Persona: {
                  select: {
                    Nombre: true,
                    Apellido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      caja: {
        ...nuevaCaja,
        Id: Number(nuevaCaja.Id),
        TenantId: Number(nuevaCaja.TenantId),
        UsuarioAperturaId: Number(nuevaCaja.UsuarioAperturaId),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

// PATCH: Cerrar caja o agregar gasto
export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, user, error } = await getAuthUser();

    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { AuthUserId: user.id, EstaEliminado: false },
      select: { Id: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 },
      );
    }

    const sucursalIdParam = req.nextUrl.searchParams.get("sucursalId");

    let sucursalId: bigint | null = null;
    let sucursalNombre: string | null = null;

    if (sucursalIdParam) {
      const access = await verifyUserBranchAccess(
        BigInt(tenantId),
        user.id,
        sucursalIdParam,
      );
      if (access) {
        sucursalId = access.sucursal.Id;
        sucursalNombre = access.sucursal.Nombre;
      }
    }

    const searchParams = req.nextUrl.searchParams;
    const accion = searchParams.get("accion");

    if (accion === "cerrar") {
      // Cerrar caja
      const cajaAbierta = await prisma.caja.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          SucursalId: sucursalId,
          UsuarioAperturaId: usuario.Id,
          EstaEliminado: false,
          FechaCierre: null,
        },
      });

      if (!cajaAbierta) {
        return NextResponse.json(
          { error: "No tienes una caja abierta" },
          { status: 400 },
        );
      }

      const body = await req.json();
      const data = cerrarCajaSchema.parse(body);

      const cajaCerrada = await prisma.caja.update({
        where: { Id: cajaAbierta.Id },
        data: {
          UsuarioCierreId: usuario.Id,
          FechaCierre: new Date(),
          MontoCierre: data.montoCierre,
        },
        include: {
          Usuario_Caja_UsuarioCierreIdToUsuario: {
            select: {
              Id: true,
              Nombre: true,
              Persona_Empleado: {
                select: {
                  Persona: {
                    select: {
                      Nombre: true,
                      Apellido: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Formatear nombre completo del usuario
      const formatearNombreUsuario = (usuario: any) => {
        if (!usuario) return null;
        const persona = usuario.Persona_Empleado?.[0]?.Persona;
        if (persona) {
          return `${persona.Nombre} ${persona.Apellido}`.trim();
        }
        return usuario.Nombre || null;
      };

      return NextResponse.json({
        caja: {
          ...cajaCerrada,
          Id: Number(cajaCerrada.Id),
          TenantId: Number(cajaCerrada.TenantId),
          UsuarioAperturaId: Number(cajaCerrada.UsuarioAperturaId),
          UsuarioCierreId: Number(cajaCerrada.UsuarioCierreId),
          UsuarioCierre: cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario
            ? {
                Id: Number(
                  cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario.Id,
                ),
                Nombre:
                  cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario.Nombre,
                NombreCompleto: formatearNombreUsuario(
                  cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario,
                ),
              }
            : null,
        },
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}
