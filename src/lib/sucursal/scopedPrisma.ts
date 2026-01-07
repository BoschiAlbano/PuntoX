/**
 * =====================================================
 * PRISMA CON SCOPE DE TENANT Y SUCURSAL
 * =====================================================
 *
 * Wrapper utilitario para queries de Prisma que automáticamente
 * aplica filtros de TenantId y SucursalId.
 *
 * USO:
 * ```typescript
 * const scoped = withScope({ tenantId, sucursalId });
 *
 * // Queries automáticamente filtradas
 * const cajas = await scoped.caja.findMany();
 * const comprobantes = await scoped.comprobante.findMany({ where: { ... } });
 * ```
 *
 * =====================================================
 */

import prisma from "@/DB/prisma";
import type { Prisma } from "../../../prisma/generated/prisma";

/**
 * Parámetros de scope
 */
export type ScopeParams = {
  tenantId: bigint | string;
  sucursalId?: bigint | string | null;
};

/**
 * Convierte el valor a BigInt de forma segura
 */
function toBigInt(value: bigint | string | number): bigint {
  if (typeof value === "bigint") return value;
  return BigInt(value);
}

/**
 * Crea un cliente Prisma con scope de tenant y sucursal
 *
 * @param params - TenantId y opcionalmente SucursalId
 * @returns Objeto con helpers para queries con scope
 */
export function withScope(params: ScopeParams) {
  const tenantId = toBigInt(params.tenantId);
  const sucursalId = params.sucursalId ? toBigInt(params.sucursalId) : null;

  /**
   * Crea el filtro base con TenantId y opcionalmente SucursalId
   */
  const baseWhere = (includeBranch: boolean = true) => ({
    TenantId: tenantId,
    ...(includeBranch && sucursalId ? { SucursalId: sucursalId } : {}),
  });

  /**
   * Combina el filtro base con filtros adicionales
   */
  const mergeWhere = <T extends Record<string, unknown>>(
    additionalWhere?: T,
    includeBranch: boolean = true
  ): T & { TenantId: bigint; SucursalId?: bigint } =>
    ({
      ...baseWhere(includeBranch),
      ...(additionalWhere || {}),
    } as T & { TenantId: bigint; SucursalId?: bigint });

  return {
    // =====================================================
    // DATOS DEL SCOPE
    // =====================================================
    tenantId,
    sucursalId,

    // =====================================================
    // CAJA - Queries con scope de sucursal
    // =====================================================
    caja: {
      /**
       * Buscar cajas de la sucursal
       */
      findMany: async (
        args?: Omit<Prisma.CajaFindManyArgs, "where"> & {
          where?: Prisma.CajaWhereInput;
        }
      ) => {
        return prisma.caja.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },

      /**
       * Buscar caja abierta de la sucursal
       */
      findOpen: async () => {
        return prisma.caja.findFirst({
          where: {
            ...baseWhere(),
            FechaCierre: null,
            EstaEliminado: false,
          },
        });
      },

      /**
       * Buscar caja por ID (valida que pertenezca al scope)
       */
      findById: async (id: bigint) => {
        return prisma.caja.findFirst({
          where: {
            Id: id,
            ...baseWhere(),
          },
        });
      },

      /**
       * Crear caja en la sucursal
       */
      create: async (
        data: Omit<
          Prisma.CajaUncheckedCreateInput,
          | "TenantId"
          | "SucursalId"
          | "FechaApertura"
          | "TotalEntradaEfectivo"
          | "TotalSalidaEfectivo"
          | "TotalEntradaTarjeta"
          | "TotalSalidaTarjeta"
          | "TotalEntradaCheque"
          | "TotalSalidaCheque"
          | "TotalEntradaCtaCte"
          | "TotalSalidaCtaCte"
          | "TotalEntradaTransf"
          | "TotalSalidaTransf"
          | "EstaEliminado"
          | "Ganancia"
        >
      ) => {
        return prisma.caja.create({
          data: {
            ...data,
            TenantId: tenantId,
            SucursalId: sucursalId,
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
          } as Prisma.CajaUncheckedCreateInput,
        });
      },
    },

    // =====================================================
    // COMPROBANTE - Queries con scope de sucursal
    // =====================================================
    comprobante: {
      /**
       * Buscar comprobantes de la sucursal
       */
      findMany: async (
        args?: Omit<Prisma.ComprobanteFindManyArgs, "where"> & {
          where?: Prisma.ComprobanteWhereInput;
        }
      ) => {
        return prisma.comprobante.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },

      /**
       * Buscar comprobante por ID
       */
      findById: async (id: bigint) => {
        return prisma.comprobante.findFirst({
          where: {
            Id: id,
            ...baseWhere(),
          },
        });
      },

      /**
       * Contar comprobantes
       */
      count: async (where?: Prisma.ComprobanteWhereInput) => {
        return prisma.comprobante.count({
          where: mergeWhere(where),
        });
      },
    },

    // =====================================================
    // MOVIMIENTO - Queries con scope de sucursal
    // =====================================================
    movimiento: {
      /**
       * Buscar movimientos de la sucursal
       */
      findMany: async (
        args?: Omit<Prisma.MovimientoFindManyArgs, "where"> & {
          where?: Prisma.MovimientoWhereInput;
        }
      ) => {
        return prisma.movimiento.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },

      /**
       * Crear movimiento en la sucursal
       */
      create: async (
        data: Omit<
          Prisma.MovimientoUncheckedCreateInput,
          "TenantId" | "SucursalId"
        >
      ) => {
        return prisma.movimiento.create({
          data: {
            ...data,
            TenantId: tenantId,
            SucursalId: sucursalId,
          },
        });
      },
    },

    // =====================================================
    // GASTO - Queries con scope de sucursal
    // =====================================================
    gasto: {
      /**
       * Buscar gastos de la sucursal
       */
      findMany: async (
        args?: Omit<Prisma.GastoFindManyArgs, "where"> & {
          where?: Prisma.GastoWhereInput;
        }
      ) => {
        return prisma.gasto.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },

      /**
       * Crear gasto en la sucursal
       */
      create: async (
        data: Omit<Prisma.GastoUncheckedCreateInput, "TenantId" | "SucursalId">
      ) => {
        return prisma.gasto.create({
          data: {
            ...data,
            TenantId: tenantId,
            SucursalId: sucursalId,
          },
        });
      },
    },

    // =====================================================
    // ARTICULO STOCK - Queries con scope de sucursal
    // =====================================================
    articuloStock: {
      /**
       * Obtener stock de un artículo en la sucursal
       */
      findByArticulo: async (articuloId: bigint) => {
        if (!sucursalId) {
          throw new Error("SucursalId requerido para consultar stock");
        }
        return prisma.articuloStock.findUnique({
          where: {
            ArticuloId_SucursalId: {
              ArticuloId: articuloId,
              SucursalId: sucursalId,
            },
          },
        });
      },

      /**
       * Obtener todos los stocks de la sucursal
       */
      findMany: async (
        args?: Omit<Prisma.ArticuloStockFindManyArgs, "where"> & {
          where?: Prisma.ArticuloStockWhereInput;
        }
      ) => {
        return prisma.articuloStock.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },

      /**
       * Actualizar stock de un artículo
       */
      updateStock: async (
        articuloId: bigint,
        cantidad: number,
        operacion: "incrementar" | "decrementar"
      ) => {
        if (!sucursalId) {
          throw new Error("SucursalId requerido para actualizar stock");
        }

        return prisma.articuloStock.upsert({
          where: {
            ArticuloId_SucursalId: {
              ArticuloId: articuloId,
              SucursalId: sucursalId,
            },
          },
          update: {
            Stock: {
              [operacion === "incrementar" ? "increment" : "decrement"]:
                cantidad,
            },
          },
          create: {
            ArticuloId: articuloId,
            SucursalId: sucursalId,
            TenantId: tenantId,
            Stock: operacion === "incrementar" ? cantidad : -cantidad,
          },
        });
      },
    },

    // =====================================================
    // CONTADOR - Queries con scope de sucursal
    // =====================================================
    contador: {
      /**
       * Obtener siguiente número de comprobante
       */
      getNextNumber: async (tipoComprobante: number) => {
        if (!sucursalId) {
          throw new Error(
            "SucursalId requerido para obtener número de comprobante"
          );
        }

        // Buscar o crear contador
        const contador = await prisma.contador.upsert({
          where: {
            TenantId_SucursalId_TipoComprobante: {
              TenantId: tenantId,
              SucursalId: sucursalId,
              TipoComprobante: tipoComprobante,
            },
          },
          update: {
            Valor: { increment: 1 },
          },
          create: {
            TenantId: tenantId,
            SucursalId: sucursalId,
            TipoComprobante: tipoComprobante,
            Valor: 1,
            EstaEliminado: false,
          },
        });

        return contador.Valor;
      },
    },

    // =====================================================
    // BAJA ARTICULO - Queries con scope de sucursal
    // =====================================================
    bajaArticulo: {
      /**
       * Buscar bajas de la sucursal
       */
      findMany: async (
        args?: Omit<Prisma.BajaArticuloFindManyArgs, "where"> & {
          where?: Prisma.BajaArticuloWhereInput;
        }
      ) => {
        return prisma.bajaArticulo.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },

      /**
       * Crear baja en la sucursal
       */
      create: async (
        data: Omit<
          Prisma.BajaArticuloUncheckedCreateInput,
          "TenantId" | "SucursalId"
        >
      ) => {
        return prisma.bajaArticulo.create({
          data: {
            ...data,
            TenantId: tenantId,
            SucursalId: sucursalId,
          },
        });
      },
    },

    // =====================================================
    // CHEQUES - Queries con scope de sucursal
    // =====================================================
    cheques: {
      findMany: async (
        args?: Omit<Prisma.ChequeFindManyArgs, "where"> & {
          where?: Prisma.ChequeWhereInput;
        }
      ) => {
        return prisma.cheque.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },
      findById: async (id: bigint) => {
        return prisma.cheque.findFirst({
          where: {
            Id: id,
            ...baseWhere(),
          },
        });
      },
      create: async (
        data: Omit<Prisma.ChequeUncheckedCreateInput, "TenantId" | "SucursalId">
      ) => {
        return prisma.cheque.create({
          data: {
            ...data,
            TenantId: tenantId,
            SucursalId: sucursalId,
          } as Prisma.ChequeUncheckedCreateInput,
        });
      },
    },

    // =====================================================
    // DEPOSITO CHEQUES - Queries con scope de sucursal
    // =====================================================
    depositoCheques: {
      findMany: async (
        args?: Omit<Prisma.DepositoChequesFindManyArgs, "where"> & {
          where?: Prisma.DepositoChequesWhereInput;
        }
      ) => {
        return prisma.depositoCheques.findMany({
          ...args,
          where: mergeWhere(args?.where),
        });
      },
      findById: async (id: bigint) => {
        return prisma.depositoCheques.findFirst({
          where: {
            Id: id,
            ...baseWhere(),
          },
        });
      },
      create: async (
        data: Omit<
          Prisma.DepositoChequesUncheckedCreateInput,
          "TenantId" | "SucursalId"
        >
      ) => {
        return prisma.depositoCheques.create({
          data: {
            ...data,
            TenantId: tenantId,
            SucursalId: sucursalId,
          } as Prisma.DepositoChequesUncheckedCreateInput,
        });
      },
    },

    // =====================================================
    // QUERIES GLOBALES (solo por tenant, sin sucursal)
    // =====================================================
    global: {
      /**
       * Buscar artículos del tenant (catálogo global)
       */
      articulos: {
        findMany: async (
          args?: Omit<Prisma.ArticuloFindManyArgs, "where"> & {
            where?: Prisma.ArticuloWhereInput;
          }
        ) => {
          return prisma.articulo.findMany({
            ...args,
            where: mergeWhere(args?.where, false), // Sin filtro de sucursal
          });
        },
      },

      /**
       * Buscar clientes del tenant
       */
      /**
       * Buscar clientes del tenant
       */
      clientes: {
        findMany: async (args?: Prisma.Persona_ClienteFindManyArgs) => {
          // Persona_Cliente no tiene TenantId directo, lo hereda de Persona
          const where = args?.where || {};
          const personaFilter = where.Persona || {};

          return prisma.persona_Cliente.findMany({
            ...args,
            where: {
              ...where,
              Persona: {
                is: {
                  ...personaFilter,
                  TenantId: tenantId,
                },
              },
            },
          });
        },

        /**
         * Buscar cliente por ID
         */
        findById: async (id: bigint) => {
          return prisma.persona_Cliente.findFirst({
            where: {
              Id: id,
              Persona: {
                TenantId: tenantId,
              },
            },
          });
        },

        count: async (where?: Prisma.Persona_ClienteWhereInput) => {
          const personaFilter = where?.Persona || {};
          return prisma.persona_Cliente.count({
            where: {
              ...where,
              Persona: {
                is: {
                  ...personaFilter,
                  TenantId: tenantId,
                },
              },
            },
          });
        },
      },

      /**
       * Buscar proveedores del tenant
       */
      proveedores: {
        findMany: async (
          args?: Omit<Prisma.ProveedorFindManyArgs, "where"> & {
            where?: Prisma.ProveedorWhereInput;
          }
        ) => {
          return prisma.proveedor.findMany({
            ...args,
            where: mergeWhere(args?.where, false),
          });
        },
        findById: async (id: bigint) => {
          return prisma.proveedor.findFirst({
            where: {
              Id: id,
              ...baseWhere(false),
            },
          });
        },
      },

      /**
       * Buscar bancos del tenant
       */
      bancos: {
        findMany: async (
          args?: Omit<Prisma.BancoFindManyArgs, "where"> & {
            where?: Prisma.BancoWhereInput;
          }
        ) => {
          return prisma.banco.findMany({
            ...args,
            where: mergeWhere(args?.where, false),
          });
        },
      },

      /**
       * Buscar tarjetas del tenant
       */
      tarjetas: {
        findMany: async (
          args?: Omit<Prisma.TarjetaFindManyArgs, "where"> & {
            where?: Prisma.TarjetaWhereInput;
          }
        ) => {
          return prisma.tarjeta.findMany({
            ...args,
            where: mergeWhere(args?.where, false),
          });
        },
      },

      /**
       * Buscar unidades de medida del tenant
       */
      unidadesMedida: {
        findMany: async (
          args?: Omit<Prisma.UnidadMedidaFindManyArgs, "where"> & {
            where?: Prisma.UnidadMedidaWhereInput;
          }
        ) => {
          return prisma.unidadMedida.findMany({
            ...args,
            where: mergeWhere(args?.where, false),
          });
        },
      },

      /**
       * Buscar conceptos de gasto del tenant
       */
      conceptosGastos: {
        findMany: async (
          args?: Omit<Prisma.ConceptoGastosFindManyArgs, "where"> & {
            where?: Prisma.ConceptoGastosWhereInput;
          }
        ) => {
          return prisma.conceptoGastos.findMany({
            ...args,
            where: mergeWhere(args?.where, false),
          });
        },
      },

      /**
       * Configuración del tenant
       */
      configuracion: {
        findFirst: async () => {
          return prisma.configuracion.findFirst({
            where: {
              TenantId: tenantId,
              EstaEliminado: false,
            },
          });
        },
      },

      /**
       * Buscar marcas del tenant
       */
      marcas: {
        findMany: async (
          args?: Omit<Prisma.MarcaFindManyArgs, "where"> & {
            where?: Prisma.MarcaWhereInput;
          }
        ) => {
          return prisma.marca.findMany({
            ...args,
            where: mergeWhere(args?.where, false),
          });
        },
      },

      /**
       * Buscar rubros del tenant
       */
      rubros: {
        findMany: async (
          args?: Omit<Prisma.RubroFindManyArgs, "where"> & {
            where?: Prisma.RubroWhereInput;
          }
        ) => {
          return prisma.rubro.findMany({
            ...args,
            where: mergeWhere(args?.where, false),
          });
        },
      },
    },

    // =====================================================
    // TRANSACCIONES
    // =====================================================
    /**
     * Ejecutar transacción con el scope actual
     */
    $transaction: prisma.$transaction.bind(prisma),
  };
}

/**
 * Tipo del cliente con scope
 */
export type ScopedPrisma = ReturnType<typeof withScope>;
