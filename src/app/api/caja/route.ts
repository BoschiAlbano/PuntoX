import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { parsePaginationParams, createPaginationResponse } from "@/lib/pagination";
import { handleError } from "@/lib/errors/handler";

// Schema para abrir caja
const abrirCajaSchema = z.object({
  montoInicial: z.number().min(0, "El monto inicial debe ser mayor o igual a 0"),
});

// Schema para cerrar caja
const cerrarCajaSchema = z.object({
  montoCierre: z.number().min(0, "El monto de cierre debe ser mayor o igual a 0"),
});

// Schema para agregar gasto
const agregarGastoSchema = z.object({
  conceptoGastoId: z.number(),
  descripcion: z.string().min(1, "La descripción es requerida"),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
});

// GET: Obtener caja actual o historial
export async function GET(req: NextRequest) {
  try {
    const { tenantId, error } = await getAuthUser();

    if (error) {
      return error;
    }

    const searchParams = req.nextUrl.searchParams;
    const cajaId = searchParams.get("id");
    const soloAbierta = searchParams.get("soloAbierta") === "true";
    const historial = searchParams.get("historial") === "true";
    const pagination = parsePaginationParams(req);

    // Si se solicita una caja específica
    if (cajaId) {
      const caja = await prisma.caja.findFirst({
        where: {
          Id: BigInt(cajaId),
          TenantId: BigInt(tenantId),
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
          { status: 404 }
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
          UsuarioCierreId: caja.UsuarioCierreId ? Number(caja.UsuarioCierreId) : null,
          UsuarioApertura: caja.Usuario_Caja_UsuarioAperturaIdToUsuario ? {
            Id: Number(caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Id),
            Nombre: caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Nombre,
            NombreCompleto: formatearNombreUsuario(caja.Usuario_Caja_UsuarioAperturaIdToUsuario),
          } : null,
          UsuarioCierre: caja.Usuario_Caja_UsuarioCierreIdToUsuario ? {
            Id: Number(caja.Usuario_Caja_UsuarioCierreIdToUsuario.Id),
            Nombre: caja.Usuario_Caja_UsuarioCierreIdToUsuario.Nombre,
            NombreCompleto: formatearNombreUsuario(caja.Usuario_Caja_UsuarioCierreIdToUsuario),
          } : null,
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
      const caja = await prisma.caja.findFirst({
        where: {
          TenantId: BigInt(tenantId),
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
          UsuarioApertura: caja.Usuario_Caja_UsuarioAperturaIdToUsuario ? {
            Id: Number(caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Id),
            Nombre: caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Nombre,
            NombreCompleto: formatearNombreUsuario(caja.Usuario_Caja_UsuarioAperturaIdToUsuario),
          } : null,
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

    // Historial de cajas
    const where: any = {
      TenantId: BigInt(tenantId),
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
      pagination
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

// POST: Abrir caja
export async function POST(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();

    if (authError) {
      return authError;
    }

    // Obtener usuario actual
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        { status: 401 }
      );
    }

    // Verificar si ya hay una caja abierta
    const cajaAbierta = await prisma.caja.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
        FechaCierre: null,
      },
    });

    if (cajaAbierta) {
      return NextResponse.json(
        { error: "Ya existe una caja abierta" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = abrirCajaSchema.parse(body);

    const nuevaCaja = await prisma.caja.create({
      data: {
        TenantId: BigInt(tenantId),
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
        { status: 400 }
      );
    }
    return handleError(error);
  }
}

// PATCH: Cerrar caja o agregar gasto
export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, error: authError } = await getAuthUser();

    if (authError) {
      return authError;
    }

    // Obtener usuario actual
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const accion = searchParams.get("accion");

    if (accion === "cerrar") {
      // Cerrar caja
      const cajaAbierta = await prisma.caja.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          FechaCierre: null,
        },
      });

      if (!cajaAbierta) {
        return NextResponse.json(
          { error: "No hay una caja abierta" },
          { status: 400 }
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
          UsuarioCierre: cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario ? {
            Id: Number(cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario.Id),
            Nombre: cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario.Nombre,
            NombreCompleto: formatearNombreUsuario(cajaCerrada.Usuario_Caja_UsuarioCierreIdToUsuario),
          } : null,
        },
      });
    } else if (accion === "gasto") {
      // Agregar gasto
      const cajaAbierta = await prisma.caja.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
          FechaCierre: null,
        },
      });

      if (!cajaAbierta) {
        return NextResponse.json(
          { error: "No hay una caja abierta" },
          { status: 400 }
        );
      }

      const body = await req.json();
      const data = agregarGastoSchema.parse(body);

      // Verificar que el concepto existe
      const concepto = await prisma.conceptoGastos.findFirst({
        where: {
          Id: BigInt(data.conceptoGastoId),
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
        },
      });

      if (!concepto) {
        return NextResponse.json(
          { error: "Concepto de gasto no encontrado" },
          { status: 404 }
        );
      }

      const nuevoGasto = await prisma.gasto.create({
        data: {
          TenantId: BigInt(tenantId),
          CajaId: cajaAbierta.Id,
          ConceptoGastoId: BigInt(data.conceptoGastoId),
          Fecha: new Date(),
          Descripcion: data.descripcion,
          Monto: data.monto,
          EstaEliminado: false,
        },
        include: {
          ConceptoGastos: {
            select: {
              Id: true,
              Descripcion: true,
            },
          },
        },
      });

      // Actualizar totales de salida en efectivo
      await prisma.caja.update({
        where: { Id: cajaAbierta.Id },
        data: {
          TotalSalidaEfectivo: {
            increment: data.monto,
          },
        },
      });

      return NextResponse.json({
        gasto: {
          ...nuevoGasto,
          Id: Number(nuevoGasto.Id),
          CajaId: Number(nuevoGasto.CajaId),
          ConceptoGastoId: Number(nuevoGasto.ConceptoGastoId),
          TenantId: Number(nuevoGasto.TenantId),
        },
      });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}

