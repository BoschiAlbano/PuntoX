import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";

export interface Tenant {
  nombre: string;
  dominio: string | null;
  razonSocial: string | null;
  cuit: string | null;
  email: string | null;
  telefono: string | null;
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
  localidadId: number;
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
  email: boolean;
  push: boolean;
  resumenDiario: boolean;
  stockBajo: boolean;
}

export interface Seguridad {
  dobleFactor: boolean;
  alertarNuevoDispositivo: boolean;
  bloquearPorInactividad: boolean;
  bloquearTrasIntentos: "nunca" | "5" | "10";
  recordarSesion30Dias: boolean;
}

export interface Fiscal {
  moneda: string;
  zonaHoraria: string;
  idioma: string;
  tipoIva: string;
  puntoVenta: string;
  inicioActividades: string;
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
}

// Fetch functions
const fetchTenant = async ({ signal }: { signal: AbortSignal }): Promise<Tenant> => {
  const response = await fetch("/api/tenant", {
    signal,
    cache: "no-store",
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
  const response = await fetch("/api/configuracion", {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    // Si es 404, retornar objeto vacío en lugar de lanzar error
    if (response.status === 404) {
      return {} as Configuracion;
    }
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cargar configuración");
  }

  const data = await response.json();
  return data?.configuracion || ({} as Configuracion);
};

const fetchLocalidades = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Localidad[]> => {
  const response = await fetch("/api/localidades", {
    signal,
    cache: "no-store",
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
  const response = await fetch("/api/configuracion/preferencias", {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      email: true,
      push: true,
      resumenDiario: false,
      stockBajo: true,
    };
  }

  const data = await response.json();
  return data?.preferencias || {
    email: true,
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
  });

  if (!response.ok) {
    return {
      dobleFactor: false,
      alertarNuevoDispositivo: true,
      bloquearPorInactividad: true,
      bloquearTrasIntentos: "5",
      recordarSesion30Dias: true,
    };
  }

  const data = await response.json();
  return data?.seguridad || {
    dobleFactor: false,
    alertarNuevoDispositivo: true,
    bloquearPorInactividad: true,
    bloquearTrasIntentos: "5",
    recordarSesion30Dias: true,
  };
};

const fetchFiscal = async ({ signal }: { signal: AbortSignal }): Promise<Fiscal> => {
  const response = await fetch("/api/configuracion/fiscal", {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      moneda: "ARS",
      zonaHoraria: "America/Argentina/Buenos_Aires",
      idioma: "es-AR",
      tipoIva: "Responsable Inscripto",
      puntoVenta: "0001",
      inicioActividades: "",
    };
  }

  const data = await response.json();
  return data?.fiscal || {
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "Responsable Inscripto",
    puntoVenta: "0001",
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
  const response = await fetch("/api/configuracion/preferencias", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notificaciones),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar notificaciones");
  }

  const data = await response.json();
  return data?.preferencias;
};

const saveSeguridad = async (seguridad: Seguridad): Promise<Seguridad> => {
  const response = await fetch("/api/configuracion/seguridad", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(seguridad),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar seguridad");
  }

  const data = await response.json();
  return data?.seguridad;
};

const saveFiscal = async (fiscal: Fiscal): Promise<Fiscal> => {
  const response = await fetch("/api/configuracion/fiscal", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fiscal),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al guardar configuración fiscal");
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
  });

  const configuracionQuery = useQuery({
    queryKey: ["configuracion"],
    queryFn: ({ signal }) => fetchConfiguracion({ signal }),
    enabled,
  });

  const localidadesQuery = useQuery({
    queryKey: ["localidades"],
    queryFn: ({ signal }) => fetchLocalidades({ signal }),
    enabled,
  });

  const preferenciasVentaQuery = useQuery({
    queryKey: ["preferencias-venta"],
    queryFn: ({ signal }) => fetchPreferenciasVenta({ signal }),
    enabled,
  });

  const notificacionesQuery = useQuery({
    queryKey: ["notificaciones"],
    queryFn: ({ signal }) => fetchNotificaciones({ signal }),
    enabled,
  });

  const seguridadQuery = useQuery({
    queryKey: ["seguridad"],
    queryFn: ({ signal }) => fetchSeguridad({ signal }),
    enabled,
  });

  const fiscalQuery = useQuery({
    queryKey: ["fiscal"],
    queryFn: ({ signal }) => fetchFiscal({ signal }),
    enabled,
  });

  const brandingQuery = useQuery({
    queryKey: ["branding"],
    queryFn: ({ signal }) => fetchBranding({ signal }),
    enabled,
  });

  // Mutations
  const saveTenantMutation = useMutation({
    mutationFn: saveTenant,
    onSuccess: (data) => {
      queryClient.setQueryData(["tenant"], data);
      addToast({
        title: "Tenant actualizado",
        description: "Los datos del tenant se guardaron correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  const saveConfiguracionMutation = useMutation({
    mutationFn: saveConfiguracion,
    onSuccess: (data) => {
      queryClient.setQueryData(["configuracion"], data);
      addToast({
        title: "Configuración actualizada",
        description: "La configuración se guardó correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  const savePreferenciasVentaMutation = useMutation({
    mutationFn: savePreferenciasVenta,
    onSuccess: (data) => {
      queryClient.setQueryData(["preferencias-venta"], data);
      addToast({
        title: "Preferencias guardadas",
        description: "Las preferencias de venta se guardaron correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  const saveNotificacionesMutation = useMutation({
    mutationFn: saveNotificaciones,
    onSuccess: (data) => {
      queryClient.setQueryData(["notificaciones"], data);
      addToast({
        title: "Notificaciones guardadas",
        description: "Las preferencias de notificaciones se guardaron correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  const saveSeguridadMutation = useMutation({
    mutationFn: saveSeguridad,
    onSuccess: (data) => {
      queryClient.setQueryData(["seguridad"], data);
      addToast({
        title: "Seguridad actualizada",
        description: "La configuración de seguridad se guardó correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  const saveFiscalMutation = useMutation({
    mutationFn: saveFiscal,
    onSuccess: (data) => {
      queryClient.setQueryData(["fiscal"], data);
      addToast({
        title: "Configuración fiscal guardada",
        description: "Los datos fiscales se guardaron correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  const saveBrandingMutation = useMutation({
    mutationFn: saveBranding,
    onSuccess: (data) => {
      queryClient.setQueryData(["branding"], data);
      addToast({
        title: "Branding actualizado",
        description: "La configuración de branding se guardó correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  return {
    // Data
    tenant: tenantQuery.data,
    configuracion: configuracionQuery.data,
    localidades: localidadesQuery.data || [],
    preferenciasVenta: preferenciasVentaQuery.data,
    notificaciones: notificacionesQuery.data,
    seguridad: seguridadQuery.data,
    fiscal: fiscalQuery.data,
    branding: brandingQuery.data,

    // Loading states
    isLoadingTenant: tenantQuery.isLoading,
    isLoadingConfiguracion: configuracionQuery.isLoading,
    isLoadingLocalidades: localidadesQuery.isLoading,
    isLoadingPreferenciasVenta: preferenciasVentaQuery.isLoading,
    isLoadingNotificaciones: notificacionesQuery.isLoading,
    isLoadingSeguridad: seguridadQuery.isLoading,
    isLoadingFiscal: fiscalQuery.isLoading,
    isLoadingBranding: brandingQuery.isLoading,

    // Error states
    errorTenant: tenantQuery.error,
    errorConfiguracion: configuracionQuery.error,
    errorLocalidades: localidadesQuery.error,
    errorPreferenciasVenta: preferenciasVentaQuery.error,
    errorNotificaciones: notificacionesQuery.error,
    errorSeguridad: seguridadQuery.error,
    errorFiscal: fiscalQuery.error,
    errorBranding: brandingQuery.error,

    // Refetch functions
    refetchTenant: tenantQuery.refetch,
    refetchConfiguracion: configuracionQuery.refetch,
    refetchLocalidades: localidadesQuery.refetch,
    refetchPreferenciasVenta: preferenciasVentaQuery.refetch,
    refetchNotificaciones: notificacionesQuery.refetch,
    refetchSeguridad: seguridadQuery.refetch,
    refetchFiscal: fiscalQuery.refetch,
    refetchBranding: brandingQuery.refetch,

    // Mutations
    saveTenant: saveTenantMutation.mutate,
    saveConfiguracion: saveConfiguracionMutation.mutate,
    savePreferenciasVenta: savePreferenciasVentaMutation.mutate,
    saveNotificaciones: saveNotificacionesMutation.mutate,
    saveSeguridad: saveSeguridadMutation.mutate,
    saveFiscal: saveFiscalMutation.mutate,
    saveBranding: saveBrandingMutation.mutate,

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

