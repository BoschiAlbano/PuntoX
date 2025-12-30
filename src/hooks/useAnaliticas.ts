import { useQuery } from "@tanstack/react-query";

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

export interface AlertasData {
  alertas: {
    stock?: Array<{
      id: number;
      nombre: string;
      codigo: string;
      stock: number;
      stockMinimo: number;
      diasHastaAgotar: number | null;
      esUrgente: boolean;
    }>;
    cobranzas?: Array<{
      id: number;
      nombre: string;
      email: string;
      telefono: string | null;
      saldo: number;
      diasVencido: number;
      fechaUltimoMovimiento: string;
      esVencido: boolean;
    }>;
    actividad?: Array<{
      id: number;
      fecha: string;
      accion: string;
      severidad: string;
      detalle: string | null;
      usuario: string;
      ipAddress: string | null;
    }>;
    cheques?: Array<{
      id: number;
      numero: string;
      banco: string;
      cliente: string;
      fechaVencimiento: string;
      diasHastaVencimiento: number;
      esUrgente: boolean;
    }>;
    cajas?: Array<{
      id: number;
      fechaApertura: string;
      empleado: string;
      horasSinActividad: number;
      requiereAtencion: boolean;
    }>;
  };
  resumen: {
    stock: number;
    stockUrgentes: number;
    cobranzas: number;
    cobranzasVencidas: number;
    actividad: number;
    cheques: number;
    chequesUrgentes: number;
    cajas: number;
    cajasSinActividad: number;
  };
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
  usuarios?: {
    activosAhora: number;
    porDia: Array<{
      fecha: string;
      cantidad: number;
    }>;
    dispositivosNoConfiables: Array<{
      id: number;
      usuario: string;
      dispositivo: string | null;
      ubicacion: string | null;
      ipAddress: string | null;
      fechaUltimaActividad: string;
    }>;
  };
  auditoria?: Array<{
    id: number;
    fecha: string;
    accion: string;
    severidad: string;
    detalle: string | null;
    usuario: string;
    empleadoAfectado: string | null;
    ipAddress: string | null;
  }>;
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
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
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

  const response = await fetch(`/api/analiticas/graficas?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cargar gráficas");
  }

  return response.json();
};

const fetchAlertas = async ({
  tipo,
  signal,
}: {
  tipo?: string;
  signal?: AbortSignal;
}): Promise<AlertasData> => {
  const params = new URLSearchParams();
  if (tipo) params.append("tipo", tipo);

  const response = await fetch(`/api/analiticas/alertas?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cargar alertas");
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

  const response = await fetch(`/api/analiticas/complementarios?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
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
    queryFn: ({ signal }) => fetchKPIs({ fechaDesde, fechaHasta, periodo, signal }),
    enabled,
    staleTime: 60000, // 1 minuto
    refetchInterval: 120000, // 2 minutos
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
    queryKey: ["analiticas", "graficas", tipo, fechaDesde, fechaHasta, agrupacion],
    queryFn: ({ signal }) => fetchGraficas({ tipo, fechaDesde, fechaHasta, agrupacion, signal }),
    enabled,
    staleTime: 60000,
  });
}

export function useAlertas({
  tipo,
  enabled = true,
}: {
  tipo?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["analiticas", "alertas", tipo],
    queryFn: ({ signal }) => fetchAlertas({ tipo, signal }),
    enabled,
    staleTime: 30000, // 30 segundos (más frecuente para alertas)
    refetchInterval: 60000, // 1 minuto
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
    queryFn: ({ signal }) => fetchComplementarios({ tipo, fechaDesde, fechaHasta, signal }),
    enabled,
    staleTime: 60000,
  });
}

