import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { requirePermiso } from "@/lib/requirePermiso";
import { handleError } from "@/lib/errors/handler";

/**
 * GET /api/analiticas/alertas
 * 
 * Retorna alertas y acciones pendientes
 * Query params:
 * - tipo: "stock" | "cobranzas" | "actividad" | "cheques" | "cajas" | "todos" (default: "todos")
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requirePermiso("analiticas");
    const searchParams = req.nextUrl.searchParams;
    const tipo = searchParams.get("tipo") || "todos";

    const tenantIdBigInt = BigInt(tenantId);

    const alertas: any = {};

    // 1. Productos faltantes/críticos
    if (tipo === "todos" || tipo === "stock") {
      // Primero obtener todos los productos y filtrar en memoria
      // (Prisma no soporta comparación directa entre columnas en where)
      const todosProductos = await prisma.articulo.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
        },
        select: {
          Id: true,
          Descripcion: true,
          Stock: true,
          StockMinimo: true,
          CodigoBarra: true,
        },
      });

      // Filtrar productos críticos (Stock <= StockMinimo o Stock <= 0)
      const productosCriticos = todosProductos
        .filter(
          (p) => Number(p.Stock) <= Number(p.StockMinimo) || Number(p.Stock) <= 0
        )
        .slice(0, 50)
        .sort((a, b) => Number(a.Stock) - Number(b.Stock));

      // Calcular tiempo estimado de agotamiento basado en ventas promedio
      const productosIds = productosCriticos.map((p) => p.Id);
      const ventasPromedio = await prisma.detalleComprobante.groupBy({
        by: ["ArticuloId"],
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          ArticuloId: { in: productosIds },
          Comprobante: {
            EstaEliminado: false,
            Fecha: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
            },
          },
        },
        _avg: {
          Cantidad: true,
        },
      });

      const ventasPorProducto: Record<string, number> = {};
      ventasPromedio.forEach((v) => {
        ventasPorProducto[v.ArticuloId.toString()] = Number(v._avg.Cantidad || 0) / 30; // Promedio diario
      });

      alertas.stock = productosCriticos.map((prod) => {
        const ventaDiaria = ventasPorProducto[prod.Id.toString()] || 0;
        const diasHastaAgotar = ventaDiaria > 0 ? Number(prod.Stock) / ventaDiaria : null;
        const esUrgente = Number(prod.Stock) <= 0 || Number(prod.Stock) < Number(prod.StockMinimo) * 0.5;

        return {
          id: Number(prod.Id),
          nombre: prod.Descripcion,
          codigo: prod.CodigoBarra,
          stock: Number(prod.Stock),
          stockMinimo: Number(prod.StockMinimo),
          diasHastaAgotar: diasHastaAgotar ? Math.ceil(diasHastaAgotar) : null,
          esUrgente,
        };
      });
    }

    // 2. Alertas de cobranzas vencidas
    if (tipo === "todos" || tipo === "cobranzas") {
      // Obtener movimientos de cuenta corriente con saldo pendiente
      const movimientosPendientes = await prisma.movimiento_CuentaCorriente.findMany({
        where: {
          Movimiento: {
            TenantId: tenantIdBigInt,
            EstaEliminado: false,
            TipoMovimiento: 2, // Salida (deuda)
          },
        },
        include: {
          Movimiento: {
            select: {
              Fecha: true,
              Monto: true,
            },
          },
          Persona_Cliente: {
            select: {
              Persona: {
                select: {
                  Id: true,
                  Nombre: true,
                  Apellido: true,
                  Mail: true,
                  Telefono: true,
                },
              },
            },
          },
        },
        take: 100,
      });

      // Calcular saldo pendiente por cliente
      const saldosPorCliente: Record<string, {
        id: bigint;
        nombre: string;
        email: string;
        telefono: string | null;
        saldo: number;
        fechaUltimoMovimiento: Date;
        diasVencido: number;
      }> = {};

      movimientosPendientes.forEach((mov) => {
        const clienteId = mov.ClienteId.toString();
        const persona = mov.Persona_Cliente.Persona;
        const monto = Number(mov.Movimiento.Monto);
        const fecha = mov.Movimiento.Fecha;
        const diasVencido = Math.floor((Date.now() - fecha.getTime()) / (24 * 60 * 60 * 1000));

        if (!saldosPorCliente[clienteId]) {
          saldosPorCliente[clienteId] = {
            id: mov.ClienteId,
            nombre: `${persona.Nombre} ${persona.Apellido}`,
            email: persona.Mail,
            telefono: persona.Telefono,
            saldo: 0,
            fechaUltimoMovimiento: fecha,
            diasVencido: 0,
          };
        }

        saldosPorCliente[clienteId].saldo += monto;
        if (diasVencido > saldosPorCliente[clienteId].diasVencido) {
          saldosPorCliente[clienteId].diasVencido = diasVencido;
          saldosPorCliente[clienteId].fechaUltimoMovimiento = fecha;
        }
      });

      alertas.cobranzas = Object.values(saldosPorCliente)
        .filter((c) => c.saldo > 0)
        .sort((a, b) => b.diasVencido - a.diasVencido)
        .map((c) => ({
          id: Number(c.id),
          nombre: c.nombre,
          email: c.email,
          telefono: c.telefono,
          saldo: c.saldo,
          diasVencido: c.diasVencido,
          fechaUltimoMovimiento: c.fechaUltimoMovimiento.toISOString(),
          esVencido: c.diasVencido > 30, // Considerar vencido después de 30 días
        }));
    }

    // 3. Actividad del equipo (auditorías con severidad alta)
    if (tipo === "todos" || tipo === "actividad") {
      const auditoriasCriticas = await prisma.auditoriaEmpleado.findMany({
        where: {
          TenantId: tenantIdBigInt,
          Severidad: {
            in: ["ERROR", "WARNING", "CRITICAL"],
          },
          Fecha: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          },
        },
        include: {
          Usuario: {
            select: {
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
        orderBy: {
          Fecha: "desc",
        },
        take: 20,
      });

      alertas.actividad = auditoriasCriticas.map((aud) => ({
        id: Number(aud.Id),
        fecha: aud.Fecha.toISOString(),
        accion: aud.Accion,
        severidad: aud.Severidad,
        detalle: aud.Detalle,
        usuario: aud.Usuario.Persona_Empleado
          ? `${aud.Usuario.Persona_Empleado.Persona.Nombre} ${aud.Usuario.Persona_Empleado.Persona.Apellido}`
          : "Desconocido",
        ipAddress: aud.IpAddress,
      }));
    }

    // 4. Cheques próximos a vencer
    if (tipo === "todos" || tipo === "cheques") {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 7); // Próximos 7 días

      const chequesProximos = await prisma.cheque.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          EstaRechazado: false,
          FechaVencimiento: {
            lte: fechaLimite,
            gte: new Date(),
          },
        },
        include: {
          Persona_Cliente: {
            select: {
              Persona: {
                select: {
                  Nombre: true,
                  Apellido: true,
                },
              },
            },
          },
          Banco: {
            select: {
              Descripcion: true,
            },
          },
        },
        orderBy: {
          FechaVencimiento: "asc",
        },
        take: 50,
      });

      alertas.cheques = chequesProximos.map((cheque) => {
        const diasHastaVencimiento = Math.ceil(
          (cheque.FechaVencimiento.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        return {
          id: Number(cheque.Id),
          numero: cheque.Numero,
          banco: cheque.Banco.Descripcion,
          cliente: `${cheque.Persona_Cliente.Persona.Nombre} ${cheque.Persona_Cliente.Persona.Apellido}`,
          fechaVencimiento: cheque.FechaVencimiento.toISOString(),
          diasHastaVencimiento,
          esUrgente: diasHastaVencimiento <= 3,
        };
      });
    }

    // 5. Cajas abiertas sin actividad
    if (tipo === "todos" || tipo === "cajas") {
      const cajasAbiertas = await prisma.caja.findMany({
        where: {
          TenantId: tenantIdBigInt,
          EstaEliminado: false,
          FechaCierre: null,
        },
        include: {
          Usuario_Caja_UsuarioAperturaIdToUsuario: {
            select: {
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
          Movimiento: {
            where: {
              EstaEliminado: false,
            },
            orderBy: {
              Fecha: "desc",
            },
            take: 1,
            select: {
              Fecha: true,
            },
          },
        },
      });

      alertas.cajas = cajasAbiertas.map((caja) => {
        const fechaUltimoMovimiento = caja.Movimiento[0]?.Fecha || caja.FechaApertura;
        const horasSinActividad = (Date.now() - fechaUltimoMovimiento.getTime()) / (1000 * 60 * 60);
        const empleado = caja.Usuario_Caja_UsuarioAperturaIdToUsuario.Persona_Empleado;

        return {
          id: Number(caja.Id),
          fechaApertura: caja.FechaApertura.toISOString(),
          empleado: empleado
            ? `${empleado.Persona.Nombre} ${empleado.Persona.Apellido}`
            : "Desconocido",
          horasSinActividad: Math.floor(horasSinActividad),
          requiereAtencion: horasSinActividad > 24,
        };
      });
    }

    // Resumen de alertas
    const resumen = {
      stock: alertas.stock?.length || 0,
      stockUrgentes: alertas.stock?.filter((s: any) => s.esUrgente).length || 0,
      cobranzas: alertas.cobranzas?.length || 0,
      cobranzasVencidas: alertas.cobranzas?.filter((c: any) => c.esVencido).length || 0,
      actividad: alertas.actividad?.length || 0,
      cheques: alertas.cheques?.length || 0,
      chequesUrgentes: alertas.cheques?.filter((c: any) => c.esUrgente).length || 0,
      cajas: alertas.cajas?.length || 0,
      cajasSinActividad: alertas.cajas?.filter((c: any) => c.requiereAtencion).length || 0,
    };

    return NextResponse.json({
      alertas,
      resumen,
    });
  } catch (error) {
    return handleError(error);
  }
}

