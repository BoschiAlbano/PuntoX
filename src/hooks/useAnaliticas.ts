import { useQuery } from "@tanstack/react-query";
import { analyticsQueryOptions } from "@/lib/react-query/queryDefaults";

export interface KPIData {
  periodo: {
    desde: string;
    hasta: string;
    tipo: "semanal" | "mensual";
  };
  kpis: {
    ingresosNetos: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    descuentos: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    ivaFacturado: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    tickets: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    notasCredito: {
      valor: number;
      periodoAnterior: number;
    };
    margenGanancia: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    ticketPromedio: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    productosVendidos: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    clientesActivos: {
      valor: number;
      variacion: number;
      periodoAnterior: number;
    };
    estadoCaja: {
      estaAbierta: boolean;
      fechaApertura: string;
      fechaCierre: string | null;
      totalEntrada: number;
      totalSalida: number;
      montoInicial: number;
      montoCierre: number | null;
    } | null;
  };
}

export interface GraficaData {
  tipo: string;
  datos: any[];
}

export interface ComplementariosData {
  gastos?: {
    total: number;
    totalGanancia: number;
    eficiencia: number;
    porConcepto: Array<{
      concepto: string;
      monto: number;
      porcentaje: number;
    }>;
    cajasAbiertas: number;
    cajasCerradas: number;
  };
}

const fetchKPIs = async ({
  fechaDesde,
  fechaHasta,
  periodo,
  signal,
}: {
  fechaDesde?: string;
  fechaHasta?: string;
  periodo?: "semanal" | "mensual";
  signal?: AbortSignal;
}): Promise<KPIData> => {
  const params = new URLSearchParams();
  if (fechaDesde) params.append("fechaDesde", fechaDesde);
  if (fechaHasta) params.append("fechaHasta", fechaHasta);
  if (periodo) params.append("periodo", periodo);

  const response = await fetch(`/api/analiticas/kpis?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cargar KPIs");
  }

  return response.json();
};

const fetchGraficas = async ({
  tipo,
  fechaDesde,
  fechaHasta,
  agrupacion,
  signal,
}: {
  tipo: string;
  fechaDesde?: string;
  fechaHasta?: string;
  agrupacion?: "dia" | "semana" | "mes";
  signal?: AbortSignal;
}): Promise<GraficaData> => {
  const params = new URLSearchParams();
  params.append("tipo", tipo);
  if (fechaDesde) params.append("fechaDesde", fechaDesde);
  if (fechaHasta) params.append("fechaHasta", fechaHasta);
  if (agrupacion) params.append("agrupacion", agrupacion);

  const response = await fetch(
    `/api/analiticas/graficas?${params.toString()}`,
    {
      signal,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cargar gráficas");
  }

  return response.json();
};

const fetchComplementarios = async ({
  tipo,
  fechaDesde,
  fechaHasta,
  signal,
}: {
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  signal?: AbortSignal;
}): Promise<ComplementariosData> => {
  const params = new URLSearchParams();
  if (tipo) params.append("tipo", tipo);
  if (fechaDesde) params.append("fechaDesde", fechaDesde);
  if (fechaHasta) params.append("fechaHasta", fechaHasta);

  const response = await fetch(
    `/api/analiticas/complementarios?${params.toString()}`,
    {
      signal,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cargar datos complementarios");
  }

  return response.json();
};

export function useKPIs({
  fechaDesde,
  fechaHasta,
  periodo = "mensual",
  enabled = true,
}: {
  fechaDesde?: string;
  fechaHasta?: string;
  periodo?: "semanal" | "mensual";
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["analiticas", "kpis", fechaDesde, fechaHasta, periodo],
    queryFn: ({ signal }) =>
      fetchKPIs({ fechaDesde, fechaHasta, periodo, signal }),
    enabled: enabled && !!fechaDesde && !!fechaHasta, // Solo ejecutar si las fechas están definidas
    refetchInterval: 120000, // 2 minutos
    ...analyticsQueryOptions,
  });
}

export function useGraficas({
  tipo,
  fechaDesde,
  fechaHasta,
  agrupacion = "dia",
  enabled = true,
}: {
  tipo: string;
  fechaDesde?: string;
  fechaHasta?: string;
  agrupacion?: "dia" | "semana" | "mes";
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      "analiticas",
      "graficas",
      tipo,
      fechaDesde,
      fechaHasta,
      agrupacion,
    ],
    queryFn: ({ signal }) =>
      fetchGraficas({ tipo, fechaDesde, fechaHasta, agrupacion, signal }),
    enabled: enabled && !!fechaDesde && !!fechaHasta, // Solo ejecutar si las fechas están definidas
    ...analyticsQueryOptions,
  });
}

export function useComplementarios({
  tipo,
  fechaDesde,
  fechaHasta,
  enabled = true,
}: {
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["analiticas", "complementarios", tipo, fechaDesde, fechaHasta],
    queryFn: ({ signal }) =>
      fetchComplementarios({ tipo, fechaDesde, fechaHasta, signal }),
    enabled: enabled && !!fechaDesde && !!fechaHasta, // Solo ejecutar si las fechas están definidas
    ...analyticsQueryOptions,
  });
}
