import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import { handleError } from "@/lib/auth/errorHandler";

// Contador para controlar si se muestran notificaciones en las mutaciones
// Si silentCount > 0, no se muestran notificaciones
let silentCount = 0;

export interface Tenant {
  nombre: string;
  dominio: string | null;
  planId?: string;
  estaActivo?: boolean;
  onboardingCompleto?: boolean;
}

export interface Configuracion {
  razonSocial: string;
  nombreFantasia: string;
  cuit: string;
  email: string;
  telefono: string;
  celular: string;
  direccion: string;
  localidadId: number | null;
  departamentoId?: number | null;
  provinciaId?: number | null;
  observacionPieFactura: string;
  mostrarPreciosConIva?: boolean;
  abrirCajonEfectivo?: boolean;
  numerarPedidosPantalla?: boolean;
  ticketDigitalPorCorreo?: boolean;
  facturaDescuentaStock?: boolean;
  presupuestoDescuentaStock?: boolean;
  remitoDescuentaStock?: boolean;
  actualizaCostoDesdeCompra?: boolean;
  modificaPrecioVentaDesdeCompra?: boolean;
  tipoFormaPagoPorDefectoVenta?: number;
  tipoFormaPagoPorDefectoCompra?: number;
  ingresoManualCajaInicial?: boolean;
  puestoCajaSeparado?: boolean;
  activarRetiroDeCaja?: boolean;
  montoMaximoRetiroCaja?: number;
  unificarRenglonesIngresarMismoProducto?: boolean;
  activarBascula?: boolean;
  etiquetaPorPeso?: boolean;
  codigoBascula?: string;
}

export interface PreferenciasVenta {
  ticketDigitalPorCorreo: boolean;
  mostrarPreciosConIva: boolean;
  abrirCajonEfectivo: boolean;
  numerarPedidosPantalla: boolean;
}

export interface Notificaciones {
  push: boolean;
  resumenDiario: boolean;
  stockBajo: boolean;
}

export interface Seguridad {
  dobleFactor: boolean;
  expirarSesiones30Dias: boolean;
  bloquearTrasIntentos: "nunca" | "5" | "10";
  alertarNuevoDispositivo: boolean;
  bloquearPorInactividad: boolean;
  tiempoInactividadMinutos: number;
  recordarSesion30Dias: boolean;
}

export interface Fiscal {
  moneda: string;
  zonaHoraria: string;
  idioma: string;
  tipoIva: string;
  condicionIvaId: number | null;
  puntoVenta: string;
  inicioActividades: string;
}

export interface CondicionIva {
  id: number;
  descripcion: string;
}

export interface Branding {
  slogan: string;
  color: string;
  logo?: File | null;
  logoPreview?: string;
}

export interface Localidad {
  Id: number;
  Descripcion: string;
  DepartamentoId?: number;
  Departamento?: {
    Id: number;
    Descripcion: string;
    Provincia?: {
      Id: number;
      Descripcion: string;
    };
  };
}

export interface Provincia {
  Id: number;
  Descripcion: string;
}

export interface Departamento {
  Id: number;
  Descripcion: string;
  ProvinciaId: number;
}

// Fetch functions
const fetchTenant = async ({ signal }: { signal: AbortSignal }): Promise<Tenant> => {
  const response = await fetch("/api/tenant", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cargar tenant");
  }

  const data = await response.json();
  return data?.tenant || {};
};

const fetchConfiguracion = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Configuracion> => {
  try {
    const response = await fetch("/api/configuracion", {
      signal,
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      // Si es 404, retornar objeto vacío en lugar de lanzar error
      if (response.status === 404) {
        return {} as Configuracion;
      }
      // Si es 500 u otro error, intentar parsear el error pero no cancelar
      const error = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(error?.error || `Error al cargar configuración (${response.status})`);
    }

    const data = await response.json();
    return data?.configuracion || ({} as Configuracion);
  } catch (error) {
    // Si el error es por cancelación (AbortError), relanzarlo
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    // Para otros errores, también relanzarlos pero con más información
    throw error;
  }
};

const fetchProvincias = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Provincia[]> => {
  const response = await fetch("/api/provincias", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const fetchDepartamentos = async ({
  signal,
  provinciaId,
}: {
  signal: AbortSignal;
  provinciaId: string;
}): Promise<Departamento[]> => {
  const response = await fetch(`/api/departamentos?provinciaId=${provinciaId}`, {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const fetchLocalidades = async ({
  signal,
  departamentoId,
}: {
  signal: AbortSignal;
  departamentoId: string;
}): Promise<Localidad[]> => {
  const response = await fetch(`/api/localidades?departamentoId=${departamentoId}`, {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const fetchCondicionesIva = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<CondicionIva[]> => {
  const response = await fetch("/api/condiciones-iva", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const fetchPreferenciasVenta = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<PreferenciasVenta> => {
  const response = await fetch("/api/configuracion/preferencias", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    // Retornar valores por defecto si falla
    return {
      ticketDigitalPorCorreo: true,
      mostrarPreciosConIva: true,
      abrirCajonEfectivo: true,
      numerarPedidosPantalla: true,
    };
  }

  const data = await response.json();
  return data?.preferencias || {
    ticketDigitalPorCorreo: true,
    mostrarPreciosConIva: true,
    abrirCajonEfectivo: true,
    numerarPedidosPantalla: true,
  };
};

const fetchNotificaciones = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Notificaciones> => {
  const response = await fetch("/api/configuracion/notificaciones", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return {
      push: true,
      resumenDiario: false,
      stockBajo: true,
    };
  }

  const data = await response.json();
  return data?.notificaciones || {
    push: true,
    resumenDiario: false,
    stockBajo: true,
  };
};

const fetchSeguridad = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Seguridad> => {
  const response = await fetch("/api/configuracion/seguridad", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return {
      dobleFactor: false,
      expirarSesiones30Dias: true,
      bloquearTrasIntentos: "5",
      alertarNuevoDispositivo: true,
      bloquearPorInactividad: false,
      tiempoInactividadMinutos: 30,
      recordarSesion30Dias: true,
    };
  }

  const data = await response.json();
  // El GET y PUT retornan los datos directamente, no envueltos en 'seguridad'
  return data || {
    dobleFactor: false,
    expirarSesiones30Dias: true,
    bloquearTrasIntentos: "5",
    alertarNuevoDispositivo: true,
    bloquearPorInactividad: false,
    tiempoInactividadMinutos: 30,
    recordarSesion30Dias: true,
  };
};

const fetchFiscal = async ({ signal }: { signal: AbortSignal }): Promise<Fiscal> => {
  const response = await fetch("/api/configuracion/fiscal", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return {
      moneda: "ARS",
      zonaHoraria: "America/Argentina/Buenos_Aires",
      idioma: "es-AR",
      tipoIva: "",
      condicionIvaId: null,
      puntoVenta: "",
      inicioActividades: "",
    };
  }

  const data = await response.json();
  return data?.fiscal || {
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "",
    condicionIvaId: null,
    puntoVenta: "",
    inicioActividades: "",
  };
};

const fetchBranding = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Omit<Branding, "logo">> => {
  const response = await fetch("/api/configuracion/branding", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return {
      slogan: "Mejor precio, mejor servicio.",
      color: "#90c472",
      logoPreview: "",
    };
  }

  const data = await response.json();
  return data?.branding || {
    slogan: "Mejor precio, mejor servicio.",
    color: "#90c472",
    logoPreview: "",
  };
};

// Mutation functions
const saveTenant = async (tenantData: Partial<Tenant>): Promise<Tenant> => {
  const response = await fetch("/api/tenant", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(tenantData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar tenant");
  }

  const data = await response.json();
  return data?.tenant;
};

const saveConfiguracion = async (
  configData: Partial<Configuracion>
): Promise<Configuracion> => {
  const response = await fetch("/api/configuracion", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(configData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar configuración");
  }

  const data = await response.json();
  return data?.configuracion;
};

const savePreferenciasVenta = async (
  preferencias: PreferenciasVenta
): Promise<PreferenciasVenta> => {
  const response = await fetch("/api/configuracion/preferencias", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(preferencias),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar preferencias");
  }

  const data = await response.json();
  return data?.preferencias;
};

const saveNotificaciones = async (
  notificaciones: Notificaciones
): Promise<Notificaciones> => {
  const response = await fetch("/api/configuracion/notificaciones", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(notificaciones),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar notificaciones");
  }

  const data = await response.json();
  return data?.notificaciones;
};

const saveSeguridad = async (seguridad: Seguridad): Promise<Seguridad> => {
  const response = await fetch("/api/configuracion/seguridad", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(seguridad),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar seguridad");
  }

  const data = await response.json();
  // El PUT retorna los datos directamente, no envueltos en 'seguridad'
  return data;
};

const saveFiscal = async (fiscal: Omit<Fiscal, "tipoIva">): Promise<Fiscal> => {
  const response = await fetch("/api/configuracion/fiscal", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(fiscal),
  });

  if (!response.ok) {
    let errorMessage = "Error al guardar configuración fiscal";
    try {
      const error = await response.json();
      if (typeof error === "object" && error !== null) {
        if ("error" in error && typeof error.error === "string") {
          errorMessage = error.error;
        } else if ("message" in error && typeof error.message === "string") {
          errorMessage = error.message;
        } else if (Array.isArray(error.details)) {
          errorMessage = error.details.map((d: any) => d.message || String(d)).join(", ");
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }
    } catch {
      // Si no se puede parsear el error, usar el mensaje por defecto
      errorMessage = `Error al guardar configuración fiscal (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data?.fiscal;
};

const saveBranding = async (branding: Branding): Promise<Omit<Branding, "logo">> => {
  const formData = new FormData();
  formData.append("slogan", branding.slogan);
  formData.append("color", branding.color);
  if (branding.logo) {
    formData.append("logo", branding.logo);
  }

  const response = await fetch("/api/configuracion/branding", {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar branding");
  }

  const data = await response.json();
  return data?.branding;
};

// Hook principal
export function useConfiguracion({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  // Queries
  const tenantQuery = useQuery({
    queryKey: ["tenant"],
    queryFn: ({ signal }) => fetchTenant({ signal }),
    enabled,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // No refetch si los datos están frescos (staleTime)
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos - los datos de tenant no cambian frecuentemente
    gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache más tiempo
    // Evitar cancelación innecesaria de queries
    networkMode: "online",
  });

  const configuracionQuery = useQuery({
    queryKey: ["configuracion"],
    queryFn: ({ signal }) => fetchConfiguracion({ signal }),
    enabled,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // No refetch si los datos están frescos (staleTime)
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos - la configuración no cambia frecuentemente
    gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache más tiempo
    networkMode: "online",
  });

  // Queries en cascada para ubicación (provincia → departamento → localidad)
  // Estas queries se manejan desde el componente que las necesita

  const preferenciasVentaQuery = useQuery({
    queryKey: ["preferencias-venta"],
    queryFn: ({ signal }) => fetchPreferenciasVenta({ signal }),
    enabled,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // No refetch si los datos están frescos
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    networkMode: "online",
  });

  const notificacionesQuery = useQuery({
    queryKey: ["notificaciones"],
    queryFn: ({ signal }) => fetchNotificaciones({ signal }),
    enabled,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // No refetch si los datos están frescos
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    networkMode: "online",
  });

  const seguridadQuery = useQuery({
    queryKey: ["seguridad"],
    queryFn: ({ signal }) => fetchSeguridad({ signal }),
    enabled,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // No refetch si los datos están frescos
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    networkMode: "online",
  });

  const fiscalQuery = useQuery({
    queryKey: ["fiscal"],
    queryFn: ({ signal }) => fetchFiscal({ signal }),
    enabled,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // No refetch si los datos están frescos
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    networkMode: "online",
  });

  const brandingQuery = useQuery({
    queryKey: ["branding"],
    queryFn: ({ signal }) => fetchBranding({ signal }),
    enabled,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // No refetch si los datos están frescos
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    networkMode: "online",
  });

  // Mutations
  const saveTenantMutation = useMutation({
    mutationFn: saveTenant,
    onSuccess: (data) => {
      queryClient.setQueryData(["tenant"], data);
      if (silentCount === 0) {
        addToast({
          title: "Tenant actualizado",
          description: "Los datos del tenant se guardaron correctamente.",
          color: "success",
        });
      }
    },
    onError: (error: Error) => {
      handleError(error, "Error al guardar configuración");
    },
  });

  const saveConfiguracionMutation = useMutation({
    mutationFn: saveConfiguracion,
    onSuccess: (data) => {
      queryClient.setQueryData(["configuracion"], data);
      if (silentCount === 0) {
        addToast({
          title: "Configuración actualizada",
          description: "La configuración se guardó correctamente.",
          color: "success",
        });
      }
    },
    onError: (error: Error) => {
      handleError(error, "Error al guardar configuración");
    },
  });

  const savePreferenciasVentaMutation = useMutation({
    mutationFn: savePreferenciasVenta,
    onSuccess: (data) => {
      queryClient.setQueryData(["preferencias-venta"], data);
      if (silentCount === 0) {
        addToast({
          title: "Preferencias guardadas",
          description: "Las preferencias de venta se guardaron correctamente.",
          color: "success",
        });
      }
    },
    onError: (error: Error) => {
      handleError(error, "Error al guardar configuración");
    },
  });

  const saveNotificacionesMutation = useMutation({
    mutationFn: saveNotificaciones,
    onSuccess: (data) => {
      queryClient.setQueryData(["notificaciones"], data);
      if (silentCount === 0) {
        addToast({
          title: "Notificaciones guardadas",
          description: "Las preferencias de notificaciones se guardaron correctamente.",
          color: "success",
        });
      }
    },
    onError: (error: Error) => {
      handleError(error, "Error al guardar configuración");
    },
  });

  const saveSeguridadMutation = useMutation({
    mutationFn: saveSeguridad,
    onSuccess: (data) => {
      queryClient.setQueryData(["seguridad"], data);
      if (silentCount === 0) {
        addToast({
          title: "Seguridad actualizada",
          description: "La configuración de seguridad se guardó correctamente.",
          color: "success",
        });
      }
    },
    onError: (error: Error) => {
      handleError(error, "Error al guardar configuración");
    },
  });

  const saveFiscalMutation = useMutation({
    mutationFn: saveFiscal,
    onSuccess: (data) => {
      queryClient.setQueryData(["fiscal"], data);
      if (silentCount === 0) {
        addToast({
          title: "Configuración fiscal guardada",
          description: "Los datos fiscales se guardaron correctamente.",
          color: "success",
        });
      }
    },
    onError: (error: Error) => {
      handleError(error, "Error al guardar configuración");
    },
  });

  const saveBrandingMutation = useMutation({
    mutationFn: saveBranding,
    onSuccess: (data) => {
      queryClient.setQueryData(["branding"], data);
      if (silentCount === 0) {
        addToast({
          title: "Branding actualizado",
          description: "La configuración de branding se guardó correctamente.",
          color: "success",
        });
      }
    },
    onError: (error: Error) => {
      handleError(error, "Error al guardar configuración");
    },
  });

  // Helper hooks para ubicación en cascada
  const useProvincias = () => {
    return useQuery({
      queryKey: ["provincias"],
      queryFn: ({ signal }) => fetchProvincias({ signal }),
      enabled,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 60 * 1000, // 30 minutos - las provincias nunca cambian
      gcTime: 60 * 60 * 1000, // 1 hora - mantener en cache mucho tiempo
      networkMode: "online",
    });
  };

  const useDepartamentos = (provinciaId: string | null) => {
    return useQuery({
      queryKey: ["departamentos", provinciaId],
      queryFn: ({ signal }) => fetchDepartamentos({ signal, provinciaId: provinciaId! }),
      enabled: enabled && !!provinciaId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 60 * 1000, // 30 minutos - los departamentos nunca cambian
    });
  };

  const useLocalidades = (departamentoId: string | null) => {
    return useQuery({
      queryKey: ["localidades", departamentoId],
      queryFn: ({ signal }) => fetchLocalidades({ signal, departamentoId: departamentoId! }),
      enabled: enabled && !!departamentoId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 60 * 1000, // 30 minutos - las localidades nunca cambian
    });
  };

  const useCondicionesIva = () => {
    return useQuery({
      queryKey: ["condiciones-iva"],
      queryFn: ({ signal }) => fetchCondicionesIva({ signal }),
      enabled,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutos - las condiciones IVA no cambian frecuentemente
      gcTime: 30 * 60 * 1000, // 30 minutos
      networkMode: "online",
    });
  };

  return {
    // Data
    tenant: tenantQuery.data,
    configuracion: configuracionQuery.data,
    preferenciasVenta: preferenciasVentaQuery.data,
    notificaciones: notificacionesQuery.data,
    seguridad: seguridadQuery.data,
    fiscal: fiscalQuery.data,
    branding: brandingQuery.data,

    // Loading states
    isLoadingTenant: tenantQuery.isLoading,
    isLoadingConfiguracion: configuracionQuery.isLoading,
    isLoadingPreferenciasVenta: preferenciasVentaQuery.isLoading,
    isLoadingNotificaciones: notificacionesQuery.isLoading,
    isLoadingSeguridad: seguridadQuery.isLoading,
    isLoadingFiscal: fiscalQuery.isLoading,
    isLoadingBranding: brandingQuery.isLoading,

    // Error states
    errorTenant: tenantQuery.error,
    errorConfiguracion: configuracionQuery.error,
    errorPreferenciasVenta: preferenciasVentaQuery.error,
    errorNotificaciones: notificacionesQuery.error,
    errorSeguridad: seguridadQuery.error,
    errorFiscal: fiscalQuery.error,
    errorBranding: brandingQuery.error,

    // Refetch functions
    refetchTenant: tenantQuery.refetch,
    refetchConfiguracion: configuracionQuery.refetch,
    refetchPreferenciasVenta: preferenciasVentaQuery.refetch,
    refetchNotificaciones: notificacionesQuery.refetch,
    refetchSeguridad: seguridadQuery.refetch,
    refetchFiscal: fiscalQuery.refetch,
    refetchBranding: brandingQuery.refetch,

    // Helper hooks para ubicación
    useProvincias,
    useDepartamentos,
    useLocalidades,
    useCondicionesIva,

    // Mutations (use mutateAsync para await, mutate para fire-and-forget)
    saveTenant: async (data: Partial<Tenant>, silent?: boolean) => {
      if (silent) {
        silentCount++;
      }
      try {
        return await saveTenantMutation.mutateAsync(data);
      } finally {
        if (silent) {
          silentCount--;
        }
      }
    },
    saveConfiguracion: async (data: Partial<Configuracion>, silent?: boolean) => {
      if (silent) {
        silentCount++;
      }
      try {
        return await saveConfiguracionMutation.mutateAsync(data);
      } finally {
        if (silent) {
          silentCount--;
        }
      }
    },
    savePreferenciasVenta: async (data: PreferenciasVenta, silent?: boolean) => {
      if (silent) {
        silentCount++;
      }
      try {
        return await savePreferenciasVentaMutation.mutateAsync(data);
      } finally {
        if (silent) {
          silentCount--;
        }
      }
    },
    saveNotificaciones: async (data: Notificaciones, silent?: boolean) => {
      if (silent) {
        silentCount++;
      }
      try {
        return await saveNotificacionesMutation.mutateAsync(data);
      } finally {
        if (silent) {
          silentCount--;
        }
      }
    },
    saveSeguridad: async (data: Seguridad, silent?: boolean) => {
      if (silent) {
        silentCount++;
      }
      try {
        return await saveSeguridadMutation.mutateAsync(data);
      } finally {
        if (silent) {
          silentCount--;
        }
      }
    },
    saveFiscal: async (data: Omit<Fiscal, "tipoIva">, silent?: boolean) => {
      if (silent) {
        silentCount++;
      }
      try {
        return await saveFiscalMutation.mutateAsync(data);
      } finally {
        if (silent) {
          silentCount--;
        }
      }
    },
    saveBranding: async (data: Branding, silent?: boolean) => {
      if (silent) {
        silentCount++;
      }
      try {
        return await saveBrandingMutation.mutateAsync(data);
      } finally {
        if (silent) {
          silentCount--;
        }
      }
    },

    // Mutation states
    isSavingTenant: saveTenantMutation.isPending,
    isSavingConfiguracion: saveConfiguracionMutation.isPending,
    isSavingPreferenciasVenta: savePreferenciasVentaMutation.isPending,
    isSavingNotificaciones: saveNotificacionesMutation.isPending,
    isSavingSeguridad: saveSeguridadMutation.isPending,
    isSavingFiscal: saveFiscalMutation.isPending,
    isSavingBranding: saveBrandingMutation.isPending,
  };
}

