import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";
import {
  dynamicDataQueryOptions,
  staticDataQueryOptions,
} from "@/lib/react-query/queryDefaults";

// Tipos
export type UsuarioCaja = {
  Id: number;
  Nombre: string;
  NombreCompleto: string | null;
};

export type DetalleCaja = {
  Id: number;
  CajaId: number;
  TipoPago: number;
  Monto: number;
  EstaEliminado: boolean;
  TenantId: number;
};

export type Caja = {
  Id: number;
  UsuarioAperturaId: number;
  MontoInicial: number;
  FechaApertura: string;
  UsuarioCierreId: number | null;
  FechaCierre: string | null;
  MontoCierre: number | null;
  TotalEntradaEfectivo: number;
  TotalSalidaEfectivo: number;
  TotalEntradaTarjeta: number;
  TotalSalidaTarjeta: number;
  TotalEntradaCheque: number;
  TotalSalidaCheque: number;
  TotalEntradaCtaCte: number;
  TotalSalidaCtaCte: number;
  TotalEntradaTransf: number;
  TotalSalidaTransf: number;
  Ganancia: number;
  EstaEliminado: boolean;
  UsuarioApertura?: UsuarioCaja | null;
  UsuarioCierre?: UsuarioCaja | null;
  DetalleCaja?: DetalleCaja[];
  Movimiento?: Movimiento[];
  Gasto?: Gasto[];
};

export type Movimiento = {
  Id: number;
  CajaId: number;
  ComprobanteId: number;
  UsuarioId: number;
  Monto: number;
  Fecha: string;
  Descripcion: string;
  TipoMovimiento: number;
  EstaEliminado: boolean;
  Comprobante?: {
    Id: number;
    Numero: number;
    TipoComprobante: number;
    Total: number;
    Fecha: string;
  };
  Usuario?: {
    Id: number;
    Nombre: string;
  };
};

export type Gasto = {
  Id: number;
  CajaId: number;
  ConceptoGastoId: number;
  Fecha: string;
  Descripcion: string;
  Monto: number;
  EstaEliminado: boolean;
  ConceptoGastos?: {
    Id: number;
    Descripcion: string;
  };
};

export type ConceptoGasto = {
  Id: number;
  Descripcion: string;
};

export type ResumenDiaCaja = {
  Id: number;
  FechaApertura: string;
  FechaCierre: string | null;
  MontoInicial: number;
  MontoCierre: number | null;
  TotalEntradaEfectivo: number;
  TotalSalidaEfectivo: number;
  Ganancia: number;
  estaCerrada: boolean;
  UsuarioApertura?: {
    Id: number;
    Nombre: string;
    NombreCompleto: string | null;
  } | null;
  UsuarioCierre?: {
    Id: number;
    Nombre: string;
    NombreCompleto: string | null;
  } | null;
};

export type ResumenDia = {
  fecha: string;
  cantidadCajas: number;
  totales: {
    montoInicial: number;
    totalEntradaEfectivo: number;
    totalSalidaEfectivo: number;
    totalEntradaTarjeta: number;
    totalSalidaTarjeta: number;
    totalEntradaCheque: number;
    totalSalidaCheque: number;
    totalEntradaCtaCte: number;
    totalSalidaCtaCte: number;
    totalEntradaTransf: number;
    totalSalidaTransf: number;
    ganancia: number;
    efectivo: number;
    tarjeta: number;
    cheque: number;
    cuentaCorriente: number;
    transferencia: number;
    totalCaja: number;
  };
  cajas: ResumenDiaCaja[];
};

// Fetchers
const fetchCajaActual = async (
  sucursalId: number | undefined,
): Promise<Caja | null> => {
  if (!sucursalId) return null;
  const response = await fetch(
    `/api/caja?soloAbierta=true&sucursalId=${sucursalId}`,
  );
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) return null;
    const error = await response.json();
    throw new Error(error.error || "Error al obtener caja actual");
  }
  const data = await response.json();
  return data.caja || null;
};

const fetchConceptosGastos = async (
  sucursalId: number | undefined,
): Promise<ConceptoGasto[]> => {
  if (!sucursalId) return [];
  const response = await fetch(
    `/api/conceptos-gastos?sucursalId=${sucursalId}`,
  );
  if (!response.ok) throw new Error("Error al obtener conceptos de gastos");
  const data = await response.json();
  return data.conceptosGasto || [];
};

const fetchResumenDia = async (
  sucursalId: number | undefined,
): Promise<ResumenDia | null> => {
  if (!sucursalId) return null;
  const response = await fetch(
    `/api/caja?resumenDia=true&sucursalId=${sucursalId}`,
  );
  if (!response.ok) throw new Error("Error al obtener resumen del día");
  const data = await response.json();
  return data.resumenDia || null;
};

// Hook principal
export function useCaja(options?: {
  enableCaja?: boolean;
  enableConceptos?: boolean;
  enableResumen?: boolean;
}) {
  const {
    enableCaja = false,
    enableConceptos = false,
    enableResumen = false,
  } = options || {};

  const { currentBranch } = useUserStore();
  const queryClient = useQueryClient();
  const sucursalId = currentBranch?.Id ? Number(currentBranch.Id) : undefined;

  // Query Caja Actual (Abierta)
  const cajaQuery = useQuery({
    queryKey: ["caja", "actual", sucursalId],
    queryFn: () => fetchCajaActual(sucursalId),
    enabled: !!sucursalId && enableCaja,
    ...dynamicDataQueryOptions,
  });

  // Query Conceptos de Gasto
  const conceptosQuery = useQuery({
    queryKey: ["conceptos-gastos", sucursalId],
    queryFn: () => fetchConceptosGastos(sucursalId),
    enabled: !!sucursalId && enableConceptos,
    ...staticDataQueryOptions,
  });

  // Query Resumen del Día
  const resumenQuery = useQuery({
    queryKey: ["caja", "resumen-dia", sucursalId],
    queryFn: () => fetchResumenDia(sucursalId),
    enabled: !!sucursalId && enableResumen,
    ...dynamicDataQueryOptions,
  });

  // Mutations
  const abrirCajaMutation = useMutation({
    mutationFn: async (montoInicial: number) => {
      if (!sucursalId) throw new Error("No hay sucursal seleccionada");
      const response = await fetch(`/api/caja?sucursalId=${sucursalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montoInicial }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al abrir la caja");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caja"] });
    },
  });

  const cerrarCajaMutation = useMutation({
    mutationFn: async (montoCierre: number) => {
      if (!sucursalId) throw new Error("No hay sucursal seleccionada");
      const response = await fetch(
        `/api/caja?accion=cerrar&sucursalId=${sucursalId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ montoCierre }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cerrar la caja");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caja"] });
    },
  });

  const agregarGastoMutation = useMutation({
    mutationFn: async ({
      conceptoId,
      descripcion,
      monto,
    }: {
      conceptoId: number;
      descripcion: string;
      monto: number;
    }) => {
      if (!sucursalId) throw new Error("No hay sucursal seleccionada");
      const response = await fetch(
        `/api/caja?accion=gasto&sucursalId=${sucursalId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conceptoGastoId: conceptoId,
            descripcion,
            monto,
          }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar el gasto");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caja"] });
    },
  });

  return {
    // Data
    cajaActual: cajaQuery.data,
    conceptosGasto: conceptosQuery.data || [],
    resumenDia: resumenQuery.data,

    // Status
    isLoading:
      cajaQuery.isLoading || conceptosQuery.isLoading || resumenQuery.isLoading,
    isError:
      cajaQuery.isError || conceptosQuery.isError || resumenQuery.isError,

    // Helper para verificar estado
    isCajaAbierta: !!cajaQuery.data && !cajaQuery.data.FechaCierre,

    // Mutations
    abrirCaja: abrirCajaMutation.mutateAsync,
    cerrarCaja: cerrarCajaMutation.mutateAsync,
    agregarGasto: agregarGastoMutation.mutateAsync,

    // Loading states for actions
    isOpening: abrirCajaMutation.isPending,
    isClosing: cerrarCajaMutation.isPending,
    isAddingGasto: agregarGastoMutation.isPending,

    // Refetch
    refetch: async () => {
      const promises = [];
      if (enableCaja) promises.push(cajaQuery.refetch());
      if (enableConceptos) promises.push(conceptosQuery.refetch());
      if (enableResumen) promises.push(resumenQuery.refetch());
      await Promise.all(promises);
    },
  };
}
