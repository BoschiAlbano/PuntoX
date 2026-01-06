"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Spinner,
  Switch,
  Tabs,
  Tab,
  addToast,
} from "@heroui/react";
import { Lock, Shield, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { usePagePermission } from "@/lib/permissions/usePagePermission";
import { useQueryEnabled } from "@/lib/react-query/useQueryEnabled";
import { type PreferenciasVentaDTO } from "./actions-preferencias-venta";

type SectionKey =
  | "perfil"
  | "ventas"
  | "notificaciones"
  | "seguridad"
  | "fiscal";

interface SesionActiva {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  ipAddress: string | null;
  userAgent: string | null;
  dispositivo: string | null;
  ubicacion: string | null;
  fechaInicio: string;
  fechaUltimaActividad: string;
  esConfiable: boolean;
}

interface DispositivoConfiable {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  nombreDispositivo: string;
  userAgent: string | null;
  ipAddress: string | null;
  fechaRegistro: string;
  fechaUltimoUso: string;
}

interface AlertaSeguridad {
  tipo: "critico" | "advertencia" | "info";
  titulo: string;
  descripcion: string;
  ips?: string[];
}

const monedas = [
  { value: "ARS", label: "ARS - Peso argentino" },
  { value: "USD", label: "USD - Dolar" },
  { value: "BRL", label: "BRL - Real" },
];

const zonasHorarias = [
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Santiago",
  "America/Mexico_City",
];

const idiomas = [
  { value: "es-AR", label: "Espanol (AR)" },
  { value: "es-MX", label: "Espanol (MX)" },
  { value: "en-US", label: "English" },
];

function SectionPanel({
  id,
  title,
  description,
  summary,
  children,
}: {
  id: SectionKey;
  title: string;
  description: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      shadow="sm"
      className="rounded-2xl border border-slate-200"
      id={id}
    >
      <CardBody className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
          <p className="text-sm text-gray-700">{summary}</p>
          <Divider />
        </div>
        <div className="space-y-4">{children}</div>
      </CardBody>
    </Card>
  );
}

export default function Configuracion() {
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission(); // Proteger página con permisos
  const router = useRouter();
  
  // TODOS LOS HOOKS DEBEN IR ANTES DE LOS EARLY RETURNS
  const [openSection, setOpenSection] = useState<SectionKey>("perfil");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Usar helper para evitar cancelaciones cuando tieneAcceso cambia de undefined a true
  const enabledQueries = useQueryEnabled(tieneAcceso, isLoadingPermisos ?? false);
  
  // Usar TanStack Query hook
  // Optimización: Las queries tienen staleTime y refetchOnMount: false para evitar peticiones innecesarias
  // enabled solo se activa cuando tenemos acceso confirmado (evita cancelaciones por re-renders)
  const {
    tenant: tenantData,
    configuracion: configuracionData,
    preferenciasVenta: preferenciasVentaData,
    notificaciones: notificacionesData,
    seguridad: seguridadData,
    fiscal: fiscalData,
    branding: brandingData,
    isLoadingTenant,
    isLoadingConfiguracion,
    isLoadingPreferenciasVenta,
    saveTenant: saveTenantMutation,
    saveConfiguracion: saveConfiguracionMutation,
    savePreferenciasVenta: savePreferenciasVentaMutation,
    saveNotificaciones: saveNotificacionesMutation,
    saveSeguridad: saveSeguridadMutation,
    saveFiscal: saveFiscalMutation,
    isSavingTenant,
    isSavingConfiguracion,
    isSavingPreferenciasVenta,
    isSavingNotificaciones,
    isSavingSeguridad,
    isSavingFiscal,
    useProvincias,
    useDepartamentos,
    useLocalidades,
    useCondicionesIva,
  } = useConfiguracion({ enabled: enabledQueries }); // Solo habilitar cuando tenemos acceso confirmado

  // Estados locales para edición (se sincronizan con los datos del hook)
  const [configuracion, setConfiguracion] = useState<{
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
  }>({
    razonSocial: "",
    nombreFantasia: "",
    cuit: "",
    email: "",
    telefono: "",
    celular: "",
    direccion: "",
    localidadId: null,
    observacionPieFactura: "",
  });
  const [configuracionOriginal, setConfiguracionOriginal] = useState<typeof configuracion | null>(null);
  
  // Estados para selectores en cascada
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string | null>(null);
  
  // Hooks para ubicación en cascada
  const provinciasQuery = useProvincias();
  const departamentosQuery = useDepartamentos(provinciaSeleccionada);
  const localidadesQuery = useLocalidades(departamentoSeleccionado);
  const condicionesIvaQuery = useCondicionesIva();
  
  const provincias = provinciasQuery.data || [];
  const departamentos = departamentosQuery.data || [];
  const localidades = localidadesQuery.data || [];
  const condicionesIva = condicionesIvaQuery.data || [];

  const [regional, setRegional] = useState({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "",
    condicionIvaId: null as number | null,
    puntoVenta: "",
    inicioActividades: "",
  });
  const [regionalOriginal, setRegionalOriginal] = useState<typeof regional | null>(null);

  const [preferencias, setPreferencias] = useState<PreferenciasVentaDTO>({
    ticketDigitalPorCorreo: true,
    mostrarPreciosConIva: true,
    abrirCajonEfectivo: true,
    numerarPedidosPantalla: true,
  });
  const [preferenciasOriginales, setPreferenciasOriginales] =
    useState<PreferenciasVentaDTO | null>(null);

  // Configuración avanzada: Stock y compras
  const [configStock, setConfigStock] = useState<{
    facturaDescuentaStock: boolean;
    presupuestoDescuentaStock: boolean;
    remitoDescuentaStock: boolean;
    actualizaCostoDesdeCompra: boolean;
    modificaPrecioVentaDesdeCompra: boolean;
  } | null>(null);
  const [configStockOriginal, setConfigStockOriginal] = useState<typeof configStock | null>(null);

  // Configuración avanzada: Caja y pagos
  const [configCaja, setConfigCaja] = useState({
    tipoFormaPagoPorDefectoVenta: 0, // 0=Efectivo, 1=Débito, 2=Crédito, 3=QR
    tipoFormaPagoPorDefectoCompra: 0,
    ingresoManualCajaInicial: false,
    puestoCajaSeparado: false,
    activarRetiroDeCaja: false,
    montoMaximoRetiroCaja: 0,
  });
  const [configCajaOriginal, setConfigCajaOriginal] = useState<typeof configCaja | null>(null);

  // Configuración avanzada: Productos
  const [configProductos, setConfigProductos] = useState({
    unificarRenglonesIngresarMismoProducto: true,
  });
  const [configProductosOriginal, setConfigProductosOriginal] = useState<typeof configProductos | null>(null);

  // Configuración avanzada: Báscula
  const [configBascula, setConfigBascula] = useState({
    activarBascula: false,
    etiquetaPorPeso: false,
    codigoBascula: "",
  });
  const [configBasculaOriginal, setConfigBasculaOriginal] = useState<typeof configBascula | null>(null);

  const [notificaciones, setNotificaciones] = useState({
    push: true,
    resumenDiario: false,
    stockBajo: true,
  });
  const [notificacionesOriginales, setNotificacionesOriginales] = useState<typeof notificaciones | null>(null);

  const [seguridad, setSeguridad] = useState({
    dobleFactor: false,
    expirarSesiones30Dias: true,
    bloquearTrasIntentos: "5" as "nunca" | "5" | "10",
    alertarNuevoDispositivo: true,
    bloquearPorInactividad: false,
    tiempoInactividadMinutos: 30,
    recordarSesion30Dias: true,
  });
  const [seguridadOriginal, setSeguridadOriginal] = useState<typeof seguridad | null>(null);

  // Estados para sesiones y dispositivos
  const [sesionesActivas, setSesionesActivas] = useState<SesionActiva[]>([]);
  const [dispositivosConfiable, setDispositivosConfiable] = useState<DispositivoConfiable[]>([]);
  const [estadisticasSeguridad, setEstadisticasSeguridad] = useState({
    sesionesActivas: 0,
    dispositivosActivos: 0,
    ultimaActividad: null as string | null,
    intentosFallidos7Dias: 0,
    intentosExitosos7Dias: 0,
  });
  const [isLoadingSesiones, setIsLoadingSesiones] = useState(false);
  const [isLoadingDispositivos, setIsLoadingDispositivos] = useState(false);
  
  // Estados para modales de detalles
  const [modalDetalle, setModalDetalle] = useState<"sesiones" | "dispositivos" | "ultimoAcceso" | "intentosFallidos" | "intentosExitosos" | null>(null);
  const [intentosSospechosos, setIntentosSospechosos] = useState<{
    sospechosos: Array<{ ipAddress: string; intentos24Horas: number; ultimoIntento: string; esCritico: boolean }>;
    alertas: AlertaSeguridad[];
    ultimosIntentos: Array<{ id: number; fecha: string; ipAddress: string | null; usuarioNombre: string | null; usuarioId: number | null }>;
    estadisticas: { ipsUnicasUltimaHora: number; intentosFallidos24Horas: number };
  } | null>(null);
  const [isLoadingIntentosSospechosos, setIsLoadingIntentosSospechosos] = useState(false);
  
  // Estados para auditoría
  const [estadisticasAuditoria, setEstadisticasAuditoria] = useState({
    totalEventos: 0,
    eventosError: 0,
    eventosWarning: 0,
    eventosUltimos7Dias: 0,
    eventosUltimos30Dias: 0,
  });
  const [eventosRecientesAuditoria, setEventosRecientesAuditoria] = useState<Array<{
    id: number;
    fecha: string;
    accion: string;
    severidad: string;
    detalle: string | null;
    ipAddress: string | null;
    usuario: string;
  }>>([]);
  const [isLoadingAuditoria, setIsLoadingAuditoria] = useState(false);

  // Estado solo para el logo (integrado en perfil del negocio)
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoPreviewOriginal, setLogoPreviewOriginal] = useState<string>("");

  const [tenant, setTenant] = useState({
    nombre: "",
    dominio: "",
    planId: "",
    estaActivo: true,
    onboardingCompleto: false,
  });
  const [tenantOriginal, setTenantOriginal] = useState<typeof tenant | null>(null);

  // Sincronizar tenant desde el hook
  useEffect(() => {
    if (tenantData && Object.keys(tenantData).length > 0) {
      const newTenant = {
        nombre: tenantData.nombre ?? "",
        dominio: tenantData.dominio ?? "",
        planId: tenantData.planId ?? "",
        estaActivo: tenantData.estaActivo ?? true,
        onboardingCompleto: tenantData.onboardingCompleto ?? false,
      };
      // Reemplazar completamente el estado en lugar de hacer merge
      setTenant(newTenant);
      setTenantOriginal(newTenant);
    }
  }, [tenantData]);

  // Sincronizar configuración desde el hook
  useEffect(() => {
    if (configuracionData && Object.keys(configuracionData).length > 0) {
      const newConfiguracion = {
        razonSocial: configuracionData.razonSocial ?? "",
        nombreFantasia: configuracionData.nombreFantasia ?? "",
        cuit: configuracionData.cuit ?? "",
        email: configuracionData.email ?? "",
        telefono: configuracionData.telefono ?? "",
        celular: configuracionData.celular ?? "",
        direccion: configuracionData.direccion ?? "",
        localidadId: configuracionData.localidadId ?? null,
        departamentoId: configuracionData.departamentoId ?? null,
        provinciaId: configuracionData.provinciaId ?? null,
        observacionPieFactura: configuracionData.observacionPieFactura ?? "",
      };
      // Reemplazar completamente el estado en lugar de hacer merge
      setConfiguracion(newConfiguracion);
      setConfiguracionOriginal(newConfiguracion);
      
      // Cargar provincia y departamento si hay localidad
      if (configuracionData.provinciaId) {
        setProvinciaSeleccionada(String(configuracionData.provinciaId));
      }
      if (configuracionData.departamentoId) {
        setDepartamentoSeleccionado(String(configuracionData.departamentoId));
      }

      // Actualizar preferencias desde la configuración
      if (configuracionData.mostrarPreciosConIva !== undefined) {
        setPreferencias((prev) => ({
          ...prev,
          mostrarPreciosConIva: configuracionData.mostrarPreciosConIva ?? prev.mostrarPreciosConIva,
          abrirCajonEfectivo: configuracionData.abrirCajonEfectivo ?? prev.abrirCajonEfectivo,
          numerarPedidosPantalla: configuracionData.numerarPedidosPantalla ?? prev.numerarPedidosPantalla,
          ticketDigitalPorCorreo: configuracionData.ticketDigitalPorCorreo ?? prev.ticketDigitalPorCorreo,
        }));
      }

      // Actualizar configuración de stock
      if (
        configuracionData.facturaDescuentaStock !== undefined ||
        configuracionData.presupuestoDescuentaStock !== undefined ||
        configuracionData.remitoDescuentaStock !== undefined ||
        configuracionData.actualizaCostoDesdeCompra !== undefined ||
        configuracionData.modificaPrecioVentaDesdeCompra !== undefined
      ) {
        const stockConfig = {
          facturaDescuentaStock: configuracionData.facturaDescuentaStock ?? false,
          presupuestoDescuentaStock: configuracionData.presupuestoDescuentaStock ?? false,
          remitoDescuentaStock: configuracionData.remitoDescuentaStock ?? false,
          actualizaCostoDesdeCompra: configuracionData.actualizaCostoDesdeCompra ?? false,
          modificaPrecioVentaDesdeCompra: configuracionData.modificaPrecioVentaDesdeCompra ?? false,
        };
        setConfigStock(stockConfig);
        setConfigStockOriginal(stockConfig);
      }

      // Actualizar configuración de caja
      if (configuracionData.tipoFormaPagoPorDefectoVenta !== undefined) {
        setConfigCaja({
          tipoFormaPagoPorDefectoVenta: configuracionData.tipoFormaPagoPorDefectoVenta ?? 0,
          tipoFormaPagoPorDefectoCompra: configuracionData.tipoFormaPagoPorDefectoCompra ?? 0,
          ingresoManualCajaInicial: configuracionData.ingresoManualCajaInicial ?? false,
          puestoCajaSeparado: configuracionData.puestoCajaSeparado ?? false,
          activarRetiroDeCaja: configuracionData.activarRetiroDeCaja ?? false,
          montoMaximoRetiroCaja: configuracionData.montoMaximoRetiroCaja ?? 0,
        });
        setConfigCajaOriginal({
          tipoFormaPagoPorDefectoVenta: configuracionData.tipoFormaPagoPorDefectoVenta ?? 0,
          tipoFormaPagoPorDefectoCompra: configuracionData.tipoFormaPagoPorDefectoCompra ?? 0,
          ingresoManualCajaInicial: configuracionData.ingresoManualCajaInicial ?? false,
          puestoCajaSeparado: configuracionData.puestoCajaSeparado ?? false,
          activarRetiroDeCaja: configuracionData.activarRetiroDeCaja ?? false,
          montoMaximoRetiroCaja: configuracionData.montoMaximoRetiroCaja ?? 0,
        });
      }

      // Actualizar configuración de productos
      if (configuracionData.unificarRenglonesIngresarMismoProducto !== undefined) {
        setConfigProductos({
          unificarRenglonesIngresarMismoProducto: configuracionData.unificarRenglonesIngresarMismoProducto ?? true,
        });
        setConfigProductosOriginal({
          unificarRenglonesIngresarMismoProducto: configuracionData.unificarRenglonesIngresarMismoProducto ?? true,
        });
      }

      // Actualizar configuración de báscula
      if (configuracionData.activarBascula !== undefined) {
        setConfigBascula({
          activarBascula: configuracionData.activarBascula ?? false,
          etiquetaPorPeso: configuracionData.etiquetaPorPeso ?? false,
          codigoBascula: configuracionData.codigoBascula ?? "",
        });
        setConfigBasculaOriginal({
          activarBascula: configuracionData.activarBascula ?? false,
          etiquetaPorPeso: configuracionData.etiquetaPorPeso ?? false,
          codigoBascula: configuracionData.codigoBascula ?? "",
        });
      }
    }
  }, [configuracionData]);

  // Sincronizar preferencias de venta
  useEffect(() => {
    if (preferenciasVentaData) {
      setPreferencias(preferenciasVentaData);
      setPreferenciasOriginales(preferenciasVentaData);
    }
  }, [preferenciasVentaData]);

  // Sincronizar notificaciones
  useEffect(() => {
    if (notificacionesData) {
      setNotificaciones(notificacionesData);
      setNotificacionesOriginales(notificacionesData);
    }
  }, [notificacionesData]);

  // Sincronizar seguridad
  useEffect(() => {
    if (seguridadData) {
      setSeguridad(seguridadData);
      setSeguridadOriginal(seguridadData);
    }
  }, [seguridadData]);

  // Cargar sesiones, dispositivos y estadísticas cuando se abre la sección de seguridad
  useEffect(() => {
    if (openSection === "seguridad") {
      loadSesionesActivas();
      loadDispositivosConfiable();
      loadEstadisticasSeguridad();
      loadAuditoria();
      loadIntentosSospechosos();
    }
  }, [openSection]);

  const loadSesionesActivas = async () => {
    try {
      setIsLoadingSesiones(true);
      const response = await fetch("/api/configuracion/seguridad/sesiones", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSesionesActivas(data.sesiones || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData?.error === "string" 
          ? errorData.error 
          : (errorData?.error?.message || errorData?.message || "Error al cargar sesiones");
        console.error("Error cargando sesiones:", errorMessage);
        addToast({
          title: "Error",
          description: String(errorMessage),
          color: "warning",
        });
        setSesionesActivas([]);
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error);
      addToast({
        title: "Error",
        description: "No se pudo conectar con el servidor para cargar las sesiones",
        color: "danger",
      });
      setSesionesActivas([]);
    } finally {
      setIsLoadingSesiones(false);
    }
  };

  const loadDispositivosConfiable = async () => {
    try {
      setIsLoadingDispositivos(true);
      const response = await fetch("/api/configuracion/seguridad/dispositivos", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDispositivosConfiable(data.dispositivos || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData?.error === "string" 
          ? errorData.error 
          : (errorData?.error?.message || errorData?.message || "Error al cargar dispositivos");
        console.error("Error cargando dispositivos:", errorMessage);
        addToast({
          title: "Error",
          description: String(errorMessage),
          color: "warning",
        });
        setDispositivosConfiable([]);
      }
    } catch (error) {
      console.error("Error cargando dispositivos:", error);
      addToast({
        title: "Error",
        description: "No se pudo conectar con el servidor para cargar los dispositivos",
        color: "danger",
      });
      setDispositivosConfiable([]);
    } finally {
      setIsLoadingDispositivos(false);
    }
  };

  const loadEstadisticasSeguridad = async () => {
    try {
      const response = await fetch("/api/configuracion/seguridad/estadisticas", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEstadisticasSeguridad(data.estadisticas || {
          sesionesActivas: 0,
          dispositivosActivos: 0,
          ultimaActividad: null,
          intentosFallidos7Dias: 0,
          intentosExitosos7Dias: 0,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData?.error === "string" 
          ? errorData.error 
          : (errorData?.error?.message || errorData?.message || "Error al cargar estadísticas");
        console.error("Error cargando estadísticas:", String(errorMessage));
        // No mostrar toast para estadísticas, solo log
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      // Mantener estadísticas por defecto en caso de error
    }
  };

  const loadIntentosSospechosos = async () => {
    try {
      setIsLoadingIntentosSospechosos(true);
      const response = await fetch("/api/configuracion/seguridad/intentos-sospechosos", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setIntentosSospechosos(data);
        
        // Mostrar alertas si hay intentos sospechosos críticos
        if (data.alertas && Array.isArray(data.alertas) && data.alertas.length > 0) {
          data.alertas.forEach((alerta: AlertaSeguridad) => {
            if (alerta.tipo === "critico") {
              addToast({
                title: "⚠️ Alerta de seguridad",
                description: `${alerta.titulo}: ${alerta.descripcion}`,
                color: "danger",
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error cargando intentos sospechosos:", error);
    } finally {
      setIsLoadingIntentosSospechosos(false);
    }
  };

  const loadAuditoria = async () => {
    try {
      setIsLoadingAuditoria(true);
      const response = await fetch("/api/configuracion/seguridad/auditoria", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEstadisticasAuditoria(data.estadisticas || {
          totalEventos: 0,
          eventosError: 0,
          eventosWarning: 0,
          eventosUltimos7Dias: 0,
          eventosUltimos30Dias: 0,
        });
        setEventosRecientesAuditoria(data.eventosRecientes || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: "Error desconocido" } }));
        console.error("Error cargando auditoría:", errorData);
        // El error puede venir como { error: { code, message } } o { error: "string" }
        const errorMessage = typeof errorData.error === "string" 
          ? errorData.error 
          : errorData.error?.message || "No se pudieron cargar los datos de auditoría";
        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        // Si hay error, establecer valores por defecto
        setEstadisticasAuditoria({
          totalEventos: 0,
          eventosError: 0,
          eventosWarning: 0,
          eventosUltimos7Dias: 0,
          eventosUltimos30Dias: 0,
        });
        setEventosRecientesAuditoria([]);
      }
    } catch (error) {
      console.error("Error cargando auditoría:", error);
      addToast({
        title: "Error",
        description: "No se pudo conectar con el servidor para cargar los datos de auditoría",
        color: "danger",
      });
      setEstadisticasAuditoria({
        totalEventos: 0,
        eventosError: 0,
        eventosWarning: 0,
        eventosUltimos7Dias: 0,
        eventosUltimos30Dias: 0,
      });
      setEventosRecientesAuditoria([]);
    } finally {
      setIsLoadingAuditoria(false);
    }
  };

  const cerrarSesion = async (sesionId: number) => {
    try {
      const response = await fetch(`/api/configuracion/seguridad/sesiones?id=${sesionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Si es la sesión actual, hacer logout de Supabase
        if (data.requiereLogout) {
          const { getSupabaseBrowserClient } = await import("@/lib/supabase/browserClient");
          const supabase = getSupabaseBrowserClient();
          
          // Cerrar todas las sesiones en Supabase
          await supabase.auth.signOut();
          
          addToast({
            title: "Sesión cerrada",
            description: data.message || "Tu sesión ha sido cerrada. Serás redirigido al login.",
            color: "success",
          });
          
          // Redirigir al login después de un breve delay
          setTimeout(() => {
            window.location.href = "/signin";
          }, 1000);
          return;
        }
        
        // Si es otra sesión, mostrar mensaje y recargar
        addToast({
          title: "Sesión cerrada",
          description: `La sesión del usuario ha sido cerrada. Si estaba activa en otro dispositivo, será deslogueado automáticamente.`,
          color: "success",
        });
        
        // Recargar sesiones y estadísticas
        await loadSesionesActivas();
        await loadEstadisticasSeguridad();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error || "Error al cerrar sesión";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cerrar la sesión",
        color: "danger",
      });
    }
  };

  const eliminarDispositivo = async (dispositivoId: number) => {
    try {
      const response = await fetch(`/api/configuracion/seguridad/dispositivos?id=${dispositivoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        addToast({
          title: "Dispositivo eliminado",
          description: "El dispositivo se eliminó correctamente",
          color: "success",
        });
        loadDispositivosConfiable();
        loadEstadisticasSeguridad();
      } else {
        throw new Error("Error al eliminar dispositivo");
      }
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo eliminar el dispositivo",
        color: "danger",
      });
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Hace menos de un minuto";
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  };

  // Sincronizar fiscal
  useEffect(() => {
    if (fiscalData) {
      setRegional(fiscalData);
      setRegionalOriginal(fiscalData);
    }
  }, [fiscalData]);

  // Cargar logo desde branding (solo logo, sin slogan/color)
  useEffect(() => {
    if (brandingData?.logoPreview) {
      setLogoPreview(brandingData.logoPreview);
      setLogoPreviewOriginal(brandingData.logoPreview);
    }
  }, [brandingData]);

  // Las preferencias de venta se cargan automáticamente con TanStack Query
  // Se sincronizan en el useEffect anterior

  // Las preferencias de venta se guardan usando la mutación de TanStack Query
  // Se maneja en handleSavePerfil

  const descriptionMap: Record<SectionKey, string> = {
    perfil: "Datos visibles en tickets y comunicaciones.",
    ventas: "Ajustes rapidos para cajas y mostrador.",
    notificaciones: "Define que alertas reciben los usuarios.",
    seguridad: "Protege el panel y controla dispositivos.",
    fiscal: "Moneda, idioma y datos fiscales para comprobantes.",
  };
  const summaryPerfil = useMemo(
    () => `Nombre: ${tenant.nombre} | CUIT: ${configuracion.cuit}`,
    [tenant.nombre, configuracion.cuit]
  );
  const summaryVentas = useMemo(
    () => `Ticket digital: ${
      preferencias.ticketDigitalPorCorreo ? "activado" : "desactivado"
    } | Impuestos: ${preferencias.mostrarPreciosConIva ? "incluidos" : "excluidos"}`,
    [preferencias.ticketDigitalPorCorreo, preferencias.mostrarPreciosConIva]
  );

  // Detectar si hay cambios en preferencias (memoizado)
  const hasPreferenciasChanges = useMemo(() => {
    if (!preferenciasOriginales) return false;
    return (
      preferencias.ticketDigitalPorCorreo !== preferenciasOriginales.ticketDigitalPorCorreo ||
      preferencias.mostrarPreciosConIva !== preferenciasOriginales.mostrarPreciosConIva ||
      preferencias.abrirCajonEfectivo !== preferenciasOriginales.abrirCajonEfectivo ||
      preferencias.numerarPedidosPantalla !== preferenciasOriginales.numerarPedidosPantalla
    );
  }, [preferencias, preferenciasOriginales]);
  
  const hasNotificacionesChanges = useMemo(() => {
    if (!notificacionesOriginales) return false;
    return (
      notificaciones.push !== notificacionesOriginales.push ||
      notificaciones.resumenDiario !== notificacionesOriginales.resumenDiario ||
      notificaciones.stockBajo !== notificacionesOriginales.stockBajo
    );
  }, [notificaciones, notificacionesOriginales]);
  
  const hasSeguridadChanges = useMemo(() => {
    if (!seguridadOriginal) return false;
    return (
      seguridad.dobleFactor !== seguridadOriginal.dobleFactor ||
      seguridad.expirarSesiones30Dias !== seguridadOriginal.expirarSesiones30Dias ||
      seguridad.bloquearTrasIntentos !== seguridadOriginal.bloquearTrasIntentos ||
      seguridad.alertarNuevoDispositivo !== seguridadOriginal.alertarNuevoDispositivo ||
      seguridad.bloquearPorInactividad !== seguridadOriginal.bloquearPorInactividad ||
      seguridad.tiempoInactividadMinutos !== seguridadOriginal.tiempoInactividadMinutos ||
      seguridad.recordarSesion30Dias !== seguridadOriginal.recordarSesion30Dias
    );
  }, [seguridad, seguridadOriginal]);
  
  const hasFiscalChanges = useMemo(() => {
    if (!regionalOriginal) return false;
    return (
      regional.moneda !== regionalOriginal.moneda ||
      regional.zonaHoraria !== regionalOriginal.zonaHoraria ||
      regional.idioma !== regionalOriginal.idioma ||
      regional.tipoIva !== regionalOriginal.tipoIva ||
      regional.condicionIvaId !== regionalOriginal.condicionIvaId ||
      regional.puntoVenta !== regionalOriginal.puntoVenta ||
      regional.inicioActividades !== regionalOriginal.inicioActividades
    );
  }, [regional, regionalOriginal]);
  
  
  const hasStockChanges = useMemo(() => {
    if (!configStock || !configStockOriginal) return false;
    return (
      configStock.facturaDescuentaStock !== configStockOriginal.facturaDescuentaStock ||
      configStock.presupuestoDescuentaStock !== configStockOriginal.presupuestoDescuentaStock ||
      configStock.remitoDescuentaStock !== configStockOriginal.remitoDescuentaStock ||
      configStock.actualizaCostoDesdeCompra !== configStockOriginal.actualizaCostoDesdeCompra ||
      configStock.modificaPrecioVentaDesdeCompra !== configStockOriginal.modificaPrecioVentaDesdeCompra
    );
  }, [configStock, configStockOriginal]);
  
  const hasCajaChanges = useMemo(() => {
    if (!configCajaOriginal) return false;
    return (
      configCaja.tipoFormaPagoPorDefectoVenta !== configCajaOriginal.tipoFormaPagoPorDefectoVenta ||
      configCaja.tipoFormaPagoPorDefectoCompra !== configCajaOriginal.tipoFormaPagoPorDefectoCompra ||
      configCaja.ingresoManualCajaInicial !== configCajaOriginal.ingresoManualCajaInicial ||
      configCaja.puestoCajaSeparado !== configCajaOriginal.puestoCajaSeparado ||
      configCaja.activarRetiroDeCaja !== configCajaOriginal.activarRetiroDeCaja ||
      configCaja.montoMaximoRetiroCaja !== configCajaOriginal.montoMaximoRetiroCaja
    );
  }, [configCaja, configCajaOriginal]);
  
  const hasProductosChanges = useMemo(() => {
    if (!configProductosOriginal) return false;
    return (
      configProductos.unificarRenglonesIngresarMismoProducto !== configProductosOriginal.unificarRenglonesIngresarMismoProducto
    );
  }, [configProductos, configProductosOriginal]);
  
  const hasBasculaChanges = useMemo(() => {
    if (!configBasculaOriginal) return false;
    return (
      configBascula.activarBascula !== configBasculaOriginal.activarBascula ||
      configBascula.etiquetaPorPeso !== configBasculaOriginal.etiquetaPorPeso ||
      configBascula.codigoBascula !== configBasculaOriginal.codigoBascula
    );
  }, [configBascula, configBasculaOriginal]);
  
  const hasTenantChanges = useMemo(() => {
    if (!tenantOriginal) return false;
    return (
      tenant.nombre !== tenantOriginal.nombre ||
      tenant.dominio !== tenantOriginal.dominio
    );
  }, [tenant, tenantOriginal]);
  
  const hasConfiguracionChanges = useMemo(() => {
    if (!configuracionOriginal) return false;
    return (
      configuracion.razonSocial !== configuracionOriginal.razonSocial ||
      configuracion.nombreFantasia !== configuracionOriginal.nombreFantasia ||
      configuracion.cuit !== configuracionOriginal.cuit ||
      configuracion.email !== configuracionOriginal.email ||
      configuracion.telefono !== configuracionOriginal.telefono ||
      configuracion.celular !== configuracionOriginal.celular ||
      configuracion.direccion !== configuracionOriginal.direccion ||
      configuracion.localidadId !== configuracionOriginal.localidadId ||
      configuracion.observacionPieFactura !== configuracionOriginal.observacionPieFactura
    );
  }, [configuracion, configuracionOriginal]);

  // Detectar si hay cambios en el logo
  const hasLogoChanges = useMemo(() => {
    return logo !== null;
  }, [logo]);

  // Detectar si hay cambios en cualquier sección (memoizado)
  const hasAnyChanges = useMemo(() => 
    hasTenantChanges ||
    hasConfiguracionChanges ||
    hasPreferenciasChanges || 
    hasStockChanges || 
    hasCajaChanges || 
    hasProductosChanges || 
    hasBasculaChanges ||
    hasNotificacionesChanges ||
    hasSeguridadChanges ||
    hasFiscalChanges ||
    hasLogoChanges,
    [hasTenantChanges, hasConfiguracionChanges, hasPreferenciasChanges, hasStockChanges, hasCajaChanges, hasProductosChanges, hasBasculaChanges, hasNotificacionesChanges, hasSeguridadChanges, hasFiscalChanges, hasLogoChanges]
  );
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 5MB.",
          color: "danger",
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        addToast({
          title: "Error",
          description: "Solo se permiten archivos de imagen.",
          color: "danger",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(file);
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const summaryNotificaciones = useMemo(
    () => `Push: ${notificaciones.push ? "on" : "off"} | Resumen diario: ${
      notificaciones.resumenDiario ? "on" : "off"
    } | Stock bajo: ${notificaciones.stockBajo ? "on" : "off"}`,
    [notificaciones.push, notificaciones.resumenDiario, notificaciones.stockBajo]
  );
  const summarySeguridad = useMemo(
    () => `2FA: ${
      seguridad.dobleFactor ? "activo" : "pendiente"
    } | Bloqueo: ${seguridad.bloquearTrasIntentos === "nunca" ? "desactivado" : `${seguridad.bloquearTrasIntentos} intentos`} | Inactividad: ${seguridad.bloquearPorInactividad ? `${seguridad.tiempoInactividadMinutos} min` : "off"}`,
    [seguridad.dobleFactor, seguridad.bloquearTrasIntentos, seguridad.bloquearPorInactividad, seguridad.tiempoInactividadMinutos]
  );
  const summaryFiscal = useMemo(() => {
    const condicion = condicionesIva.find((c: { id: number; descripcion: string }) => c.id === regional.condicionIvaId);
    const condicionText = condicion?.descripcion || regional.tipoIva || "No definida";
    return `Moneda: ${regional.moneda} | IVA: ${condicionText} | Punto de venta: ${regional.puntoVenta || "No definido"}`;
  }, [regional.moneda, regional.tipoIva, regional.condicionIvaId, regional.puntoVenta, condicionesIva]);

  // saveTenant y saveConfiguracion ahora se manejan con las mutaciones de TanStack Query

  const handleConfirmSave = () => {
    setIsConfirmModalOpen(true);
  };

  const handleSavePerfil = async () => {
    setIsConfirmModalOpen(false);
    
    // Validar que la localidad esté seleccionada
    if (!configuracion.localidadId) {
      addToast({
        title: "Localidad requerida",
        description: "Por favor, seleccione una localidad para continuar.",
        color: "warning",
      });
      return;
    }
    
    try {
      // Preparar datos completos de configuración incluyendo stock, caja, productos y báscula
      // Asegurar que localidadId sea un número válido
      const localidadIdNum = configuracion.localidadId 
        ? (typeof configuracion.localidadId === "string" 
            ? Number(configuracion.localidadId) 
            : configuracion.localidadId)
        : null;

      if (!localidadIdNum || localidadIdNum <= 0) {
        addToast({
          title: "Localidad requerida",
          description: "Por favor, seleccione una localidad válida para continuar.",
          color: "warning",
        });
        return;
      }

      const configuracionCompleta = {
        ...configuracion,
        localidadId: localidadIdNum, // Asegurar que sea número
        // Preferencias básicas
        mostrarPreciosConIva: preferencias.mostrarPreciosConIva,
        abrirCajonEfectivo: preferencias.abrirCajonEfectivo,
        numerarPedidosPantalla: preferencias.numerarPedidosPantalla,
        imprimir: preferencias.ticketDigitalPorCorreo,
        // Stock y compras
        facturaDescuentaStock: configStock?.facturaDescuentaStock ?? false,
        presupuestoDescuentaStock: configStock?.presupuestoDescuentaStock ?? false,
        remitoDescuentaStock: configStock?.remitoDescuentaStock ?? false,
        actualizaCostoDesdeCompra: configStock?.actualizaCostoDesdeCompra ?? false,
        modificaPrecioVentaDesdeCompra: configStock?.modificaPrecioVentaDesdeCompra ?? false,
        // Caja y pagos
        tipoFormaPagoPorDefectoVenta: configCaja.tipoFormaPagoPorDefectoVenta,
        tipoFormaPagoPorDefectoCompra: configCaja.tipoFormaPagoPorDefectoCompra,
        ingresoManualCajaInicial: configCaja.ingresoManualCajaInicial,
        puestoCajaSeparado: configCaja.puestoCajaSeparado,
        activarRetiroDeCaja: configCaja.activarRetiroDeCaja,
        montoMaximoRetiroCaja: configCaja.montoMaximoRetiroCaja,
        // Productos
        unificarRenglonesIngresarMismoProducto: configProductos.unificarRenglonesIngresarMismoProducto,
        // Báscula
        activarBascula: configBascula.activarBascula,
        etiquetaPorPeso: configBascula.etiquetaPorPeso,
        codigoBascula: configBascula.codigoBascula,
      };

      // Guardar perfil (tenant y configuración completa) en paralelo (silent=true para no mostrar notificaciones individuales)
      await Promise.all([
        saveTenantMutation(tenant, true),
        saveConfiguracionMutation(configuracionCompleta, true),
      ]);
      
      // Actualizar estados originales de tenant y configuración
      setTenantOriginal(tenant);
      setConfiguracionOriginal(configuracion);
      
      // Si hay cambios en preferencias básicas, también guardarlas por separado (para compatibilidad)
      if (hasPreferenciasChanges) {
        await savePreferenciasVentaMutation(preferencias, true);
        setPreferenciasOriginales(preferencias);
      }
      
      // Actualizar estados originales de configuración avanzada (ya se guardaron en saveConfiguracion)
      if (hasStockChanges || hasCajaChanges || hasProductosChanges || hasBasculaChanges) {
        setConfigStockOriginal(configStock);
        setConfigCajaOriginal(configCaja);
        setConfigProductosOriginal(configProductos);
        setConfigBasculaOriginal(configBascula);
      }

      // Guardar notificaciones si hay cambios
      if (hasNotificacionesChanges) {
        await saveNotificacionesMutation(notificaciones, true);
        setNotificacionesOriginales(notificaciones);
      }

      // Guardar seguridad si hay cambios
      if (hasSeguridadChanges) {
        await saveSeguridadMutation(seguridad, true);
        setSeguridadOriginal(seguridad);
      }

      // Guardar fiscal si hay cambios
      if (hasFiscalChanges) {
        // Filtrar tipoIva ya que es solo informativo y no se guarda en la BD
        const { tipoIva: _tipoIva, ...fiscalData } = regional;
        await saveFiscalMutation(fiscalData, true);
        setRegionalOriginal(regional);
      }

      // Guardar logo si hay cambios
      if (hasLogoChanges && logo) {
        const formData = new FormData();
        formData.append("logo", logo);
        formData.append("slogan", ""); // No se usa, pero el endpoint lo requiere
        formData.append("color", "#90c472"); // No se usa, pero el endpoint lo requiere
        
        const response = await fetch("/api/configuracion/branding", {
          method: "PUT",
          credentials: "include",
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          setLogoPreviewOriginal(data.branding?.logoPreview || logoPreview);
          setLogo(null); // Limpiar el archivo después de guardar
        }
      }
      
      // Mostrar una sola notificación consolidada al final
      addToast({
        title: "Configuración actualizada",
        description: "Todos los datos se guardaron correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      // Los errores ya se manejan en las mutaciones individuales (onError en el hook)
    }
  };

  // EARLY RETURNS DESPUÉS DE TODOS LOS HOOKS
  // No renderizar contenido hasta que los permisos estén verificados
  if (isLoadingPermisos) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si tieneAcceso es undefined, aún está cargando
  if (tieneAcceso === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, no renderizar nada (usePagePermission ya redirige)
  if (tieneAcceso === false) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch justify-center">
      {/* Modal de confirmación */}
      <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Confirmar cambios</h3>
            <p className="text-sm text-gray-500">
              ¿Estás seguro de que deseas guardar los cambios?
            </p>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-700">
              Los cambios realizados en la configuración se aplicarán a todas las sucursales activas.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => setIsConfirmModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              color="primary" 
              onPress={handleSavePerfil}
              isLoading={isSavingTenant || isSavingConfiguracion || isSavingPreferenciasVenta || isSavingNotificaciones || isSavingSeguridad || isSavingFiscal}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Header de la página */}
      <Header 
        isLoadingTenant={isLoadingTenant}
        isLoadingConfiguracion={isLoadingConfiguracion}
        hasAnyChanges={hasAnyChanges}
        isSavingAll={isSavingTenant || isSavingConfiguracion || isSavingPreferenciasVenta || isSavingNotificaciones || isSavingSeguridad || isSavingFiscal}
        onSaveAll={handleConfirmSave}
        seguridad={seguridad}
      />
      
      {/* Tabs con las diferentes secciones */}
      <Tabs
        aria-label="Configuración"
        selectedKey={openSection}
        onSelectionChange={(key) => setOpenSection(key as SectionKey)}
        className="relative"
        classNames={{
          tabList: "bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
          tab: "data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-[#67afc3] data-[selected=true]:to-[#529aa6] data-[selected=true]:text-white data-[selected=true]:shadow-lg transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2",
          tabContent: "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
          cursor: "bg-gradient-to-r from-[#67afc3] to-[#529aa6] shadow-lg",
        }}
      >
        <Tab
          key="perfil"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 3.5A1.5 1.5 0 0 1 3.5 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .44 1.06V12.5A1.5 1.5 0 0 1 9.5 14h-7A1.5 1.5 0 0 1 2 12.5v-9Zm10.293 1.293a.75.75 0 0 1 1.414 0l3 3a.75.75 0 0 1 0 1.414l-3 3a.75.75 0 0 1-1.414-1.414L13.586 8.5H9.5a.75.75 0 0 1 0-1.5h4.086l-1.293-1.293a.75.75 0 0 1 0-1.414Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Perfil del negocio</span>
            </div>
          }
        >
          <div className="mt-6 space-y-3">
            <SectionPanel
              id="perfil"
              title="Perfil del negocio"
              description={descriptionMap.perfil}
              summary={summaryPerfil}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo del negocio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Logo del negocio</label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain border border-slate-200 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogo(null);
                          setLogoPreview(logoPreviewOriginal);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      variant="bordered"
                      classNames={{ inputWrapper: "bg-white border-slate-200" }}
                      onChange={handleLogoChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: JPG, PNG, GIF. Máximo 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <Input
                label="Nombre"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={tenant.nombre}
                onChange={(e) =>
                  setTenant((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
              />
              <Input
                label="Razón social"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.razonSocial}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    razonSocial: e.target.value,
                  }))
                }
                isRequired
                description="Campo obligatorio"
              />
              <Input
                label="Nombre de fantasía"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.nombreFantasia}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    nombreFantasia: e.target.value,
                  }))
                }
              />
              <Input
                label="Correo"
                type="email"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.email}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              <Input
                label="Telefono"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.telefono}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    telefono: e.target.value,
                  }))
                }
              />
              <Input
                label="Celular"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.celular}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    celular: e.target.value,
                  }))
                }
              />
              <Input
                label="Dominio"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={tenant.dominio ?? ""}
                onChange={(e) =>
                  setTenant((prev) => ({
                    ...prev,
                    dominio: e.target.value,
                  }))
                }
              />
              <Input
                label="CUIT"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.cuit}
                onChange={(e) =>
                  setConfiguracion((prev) => ({ ...prev, cuit: e.target.value }))
                }
                isRequired
                description="Campo obligatorio"
              />
              <Input
                label="Dirección"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.direccion}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    direccion: e.target.value,
                  }))
                }
                isRequired
                description="Campo obligatorio"
              />
              <div className="md:col-span-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Ubicación del negocio <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    Seleccione la ubicación completa de su negocio (Campo obligatorio)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="Provincia"
                    variant="bordered"
                    placeholder="Seleccione provincia"
                    selectedKeys={provinciaSeleccionada ? [provinciaSeleccionada] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setProvinciaSeleccionada(selected || null);
                      // Limpiar departamento y localidad al cambiar provincia
                      setDepartamentoSeleccionado(null);
                      setConfiguracion((prev) => ({
                        ...prev,
                        provinciaId: selected ? Number(selected) : null,
                        departamentoId: null,
                        localidadId: null,
                      }));
                    }}
                    classNames={{ trigger: "bg-white border-slate-200" }}
                    isRequired
                  >
                    {provincias.map((provincia) => (
                      <SelectItem key={provincia.Id.toString()}>
                        {provincia.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Departamento"
                    variant="bordered"
                    placeholder={
                      !provinciaSeleccionada
                        ? "Seleccione provincia"
                        : departamentosQuery.isLoading
                        ? "Cargando..."
                        : "Seleccione departamento"
                    }
                    selectedKeys={departamentoSeleccionado ? [departamentoSeleccionado] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setDepartamentoSeleccionado(selected || null);
                      // Limpiar localidad al cambiar departamento
                      setConfiguracion((prev) => ({
                        ...prev,
                        departamentoId: selected ? Number(selected) : null,
                        localidadId: null,
                      }));
                    }}
                    classNames={{ trigger: "bg-white border-slate-200" }}
                    isLoading={departamentosQuery.isLoading}
                    isDisabled={!provinciaSeleccionada || departamentosQuery.isLoading}
                    isRequired
                  >
                    {departamentos.length === 0 && !departamentosQuery.isLoading && provinciaSeleccionada ? (
                      <SelectItem key="no-items" isDisabled>
                        No hay departamentos
                      </SelectItem>
                    ) : (
                      departamentos.map((dep) => (
                        <SelectItem key={dep.Id.toString()}>
                          {dep.Descripcion}
                        </SelectItem>
                      ))
                    )}
                  </Select>
                  <Select
                    label="Localidad"
                    variant="bordered"
                    placeholder={
                      !departamentoSeleccionado
                        ? "Seleccione departamento"
                        : localidadesQuery.isLoading
                        ? "Cargando..."
                        : "Seleccione localidad"
                    }
                    selectedKeys={configuracion.localidadId ? [configuracion.localidadId.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setConfiguracion((prev) => ({
                        ...prev,
                        localidadId: selected ? Number(selected) : null,
                      }));
                    }}
                    classNames={{ trigger: "bg-white border-slate-200" }}
                    isLoading={localidadesQuery.isLoading}
                    isDisabled={!departamentoSeleccionado || localidadesQuery.isLoading}
                    isRequired
                  >
                    {localidades.length === 0 && !localidadesQuery.isLoading && departamentoSeleccionado ? (
                      <SelectItem key="no-items" isDisabled>
                        No hay localidades
                      </SelectItem>
                    ) : (
                      localidades.map((localidad) => {
                        const departamento = localidad.Departamento?.Descripcion;
                        const provincia = localidad.Departamento?.Provincia?.Descripcion;
                        
                        // Formato más elegante y compacto
                        let displayText = localidad.Descripcion;
                        if (departamento && provincia) {
                          // Usar separador visual más elegante
                          displayText = `${localidad.Descripcion} · ${departamento}, ${provincia}`;
                        } else if (departamento) {
                          displayText = `${localidad.Descripcion} · ${departamento}`;
                        }
                        
                        return (
                          <SelectItem 
                            key={localidad.Id.toString()}
                            textValue={localidad.Descripcion}
                          >
                            {displayText}
                          </SelectItem>
                        );
                      })
                    )}
                  </Select>
                </div>
                {!configuracion.localidadId && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Complete la selección de ubicación para continuar
                  </p>
                )}
              </div>
              <Input
                label="Observación en pie de factura"
                variant="bordered"
                className="md:col-span-2"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.observacionPieFactura}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    observacionPieFactura: e.target.value,
                  }))
                }
                placeholder="Ej: Gracias por tu compra. Vuelve pronto."
              />
            </div>
          </SectionPanel>
          </div>
        </Tab>

        <Tab
          key="ventas"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.645 48.645 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6a2.503 2.503 0 0 0-2.292 1.5H17.25a.75.75 0 0 1 0 1.5H2.76a.75.75 0 0 1-.748-.807 4.002 4.002 0 0 1 .252-1.996A2.5 2.5 0 0 0 3.912 8.5H1.75A.75.75 0 0 1 1 7.75ZM6 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                </svg>
              </span>
              <span>Preferencias de venta</span>
            </div>
          }
        >
          <div className="mt-6 space-y-3">
            <SectionPanel
              id="ventas"
              title="Preferencias de venta"
              description={descriptionMap.ventas}
              summary={summaryVentas}
            >
            <div className="space-y-6">
              {/* Módulo: Preferencias básicas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4 text-blue-600"
                    >
                      <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Preferencias básicas
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Configuración general del punto de venta y comportamiento de la aplicación
                </p>
                
                {/* Ticket Digital */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-green-600"
                        >
                          <path d="M3 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm2 6h10v8H5v-8Zm10-2V4H5v4h10Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Enviar ticket digital por correo
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Envía automáticamente el comprobante por email al cliente
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={preferencias.ticketDigitalPorCorreo}
                      onValueChange={(value) =>
                        setPreferencias((prev) => ({
                          ...prev,
                          ticketDigitalPorCorreo: value,
                        }))
                      }
                      aria-label="Enviar ticket digital por correo"
                      isDisabled={isLoadingPreferenciasVenta}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Mostrar Precios con IVA */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-blue-600"
                        >
                          <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273ZM5.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM3.5 13a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM5.5 17a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM9 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM14.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM17 11.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM16 16.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM12.955 3.41a.5.5 0 0 1 .09.59l-1.5 4a.5.5 0 0 1-.944 0l-1.5-4a.5.5 0 1 1 .895-.448L10 6.62l1.06-2.66a.5.5 0 0 1 .895.45ZM5.35 8.5a.5.5 0 0 0-.844.518l1 1.5a.5.5 0 0 0 .844-.518l-1-1.5ZM6 12.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5ZM8.5 5.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Mostrar precios con impuestos incluidos
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Los precios se mostrarán con IVA incluido en todas las pantallas
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={preferencias.mostrarPreciosConIva}
                      onValueChange={(value) =>
                        setPreferencias((prev) => ({
                          ...prev,
                          mostrarPreciosConIva: value,
                        }))
                      }
                      aria-label="Mostrar precios con impuestos incluidos"
                      isDisabled={isLoadingPreferenciasVenta}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Abrir Cajón */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-purple-600"
                        >
                          <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                          <path
                            fillRule="evenodd"
                            d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm5.22 1.97a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Zm6.28 0a.75.75 0 0 0-1.06 0l-2.25 2.25a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 1 0 1.06-1.06l-1.72-1.72 1.72-1.72a.75.75 0 0 0 0-1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Abrir cajón al cobrar en efectivo
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          El cajón se abrirá automáticamente al registrar un pago en efectivo
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={preferencias.abrirCajonEfectivo}
                      onValueChange={(value) =>
                        setPreferencias((prev) => ({
                          ...prev,
                          abrirCajonEfectivo: value,
                        }))
                      }
                      aria-label="Abrir cajon al cobrar en efectivo"
                      isDisabled={isLoadingPreferenciasVenta}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Numerar Pedidos */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-indigo-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Numerar pedidos y mostrar en pantalla
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Asigna números secuenciales a los pedidos y muéstralos en pantalla
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={preferencias.numerarPedidosPantalla}
                      onValueChange={(value) =>
                        setPreferencias((prev) => ({
                          ...prev,
                          numerarPedidosPantalla: value,
                        }))
                      }
                      aria-label="Numerar pedidos y mostrar en pantalla"
                      isDisabled={isLoadingPreferenciasVenta}
                    />
                  </div>
                </CardBody>
              </Card>
              </div>

              {/* Módulo: Stock y compras */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4 text-emerald-600"
                    >
                      <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                      <path
                        fillRule="evenodd"
                        d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm8.67 1.85a.75.75 0 1 0-1.34-.7l-2 3.75a.75.75 0 1 0 1.34.7l2-3.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Stock y compras
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Control de inventario y actualización automática de precios y costos
                </p>
              {/* Factura descuenta stock */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-red-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 0 0-1 1v2.101a7.002 7.002 0 0 1 11.601 5.566a1 1 0 1 1-1.885.666A5.002 5.002 0 0 0 5.999 7H9a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm.008 9.057a1 1 0 0 1 1.276.61A5.002 5.002 0 0 0 14.001 13H11a1 1 0 1 1 0-2h5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-2.101a7.002 7.002 0 0 1-11.601-5.566 1 1 0 0 1 .61-1.276Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Factura descuenta stock
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          El stock se reduce automáticamente al emitir una factura
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configStock?.facturaDescuentaStock ?? false}
                      onValueChange={(value) =>
                        setConfigStock((prev) => ({
                          ...(prev ?? {
                            facturaDescuentaStock: false,
                            presupuestoDescuentaStock: false,
                            remitoDescuentaStock: false,
                            actualizaCostoDesdeCompra: false,
                            modificaPrecioVentaDesdeCompra: false,
                          }),
                          facturaDescuentaStock: value,
                        }))
                      }
                      aria-label="Factura descuenta stock"
                      isDisabled={!configStock}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Presupuesto descuenta stock */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-orange-600"
                        >
                          <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Presupuesto descuenta stock
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          El stock se reduce al crear un presupuesto
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configStock?.presupuestoDescuentaStock ?? false}
                      onValueChange={(value) =>
                        setConfigStock((prev) => ({
                          ...(prev ?? {
                            facturaDescuentaStock: false,
                            presupuestoDescuentaStock: false,
                            remitoDescuentaStock: false,
                            actualizaCostoDesdeCompra: false,
                            modificaPrecioVentaDesdeCompra: false,
                          }),
                          presupuestoDescuentaStock: value,
                        }))
                      }
                      aria-label="Presupuesto descuenta stock"
                      isDisabled={!configStock}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Remito descuenta stock */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-teal-600"
                        >
                          <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                          <path
                            fillRule="evenodd"
                            d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm8.67 1.85a.75.75 0 1 0-1.34-.7l-2 3.75a.75.75 0 1 0 1.34.7l2-3.75Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Remito descuenta stock
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          El stock se reduce al emitir un remito
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configStock?.remitoDescuentaStock ?? false}
                      onValueChange={(value) =>
                        setConfigStock((prev) => ({
                          ...(prev ?? {
                            facturaDescuentaStock: false,
                            presupuestoDescuentaStock: false,
                            remitoDescuentaStock: false,
                            actualizaCostoDesdeCompra: false,
                            modificaPrecioVentaDesdeCompra: false,
                          }),
                          remitoDescuentaStock: value,
                        }))
                      }
                      aria-label="Remito descuenta stock"
                      isDisabled={!configStock}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Actualizar costo desde compra */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-emerald-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Actualizar costo desde compra
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          El costo del producto se actualiza automáticamente al registrar una compra
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configStock?.actualizaCostoDesdeCompra ?? false}
                      onValueChange={(value) =>
                        setConfigStock((prev) => ({
                          ...(prev ?? {
                            facturaDescuentaStock: false,
                            presupuestoDescuentaStock: false,
                            remitoDescuentaStock: false,
                            actualizaCostoDesdeCompra: false,
                            modificaPrecioVentaDesdeCompra: false,
                          }),
                          actualizaCostoDesdeCompra: value,
                        }))
                      }
                      aria-label="Actualizar costo desde compra"
                      isDisabled={!configStock}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Modificar precio de venta desde compra */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-cyan-600"
                        >
                          <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273ZM5.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM3.5 13a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM5.5 17a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM9 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM14.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM17 11.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1ZM16 16.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM12.955 3.41a.5.5 0 0 1 .09.59l-1.5 4a.5.5 0 0 1-.944 0l-1.5-4a.5.5 0 1 1 .895-.448L10 6.62l1.06-2.66a.5.5 0 0 1 .895.45ZM5.35 8.5a.5.5 0 0 0-.844.518l1 1.5a.5.5 0 0 0 .844-.518l-1-1.5ZM6 12.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5ZM8.5 5.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Modificar precio de venta desde compra
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          El precio de venta se ajusta automáticamente según el costo de compra
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configStock?.modificaPrecioVentaDesdeCompra ?? false}
                      onValueChange={(value) =>
                        setConfigStock((prev) => ({
                          ...(prev ?? {
                            facturaDescuentaStock: false,
                            presupuestoDescuentaStock: false,
                            remitoDescuentaStock: false,
                            actualizaCostoDesdeCompra: false,
                            modificaPrecioVentaDesdeCompra: false,
                          }),
                          modificaPrecioVentaDesdeCompra: value,
                        }))
                      }
                      aria-label="Modificar precio de venta desde compra"
                      isDisabled={!configStock}
                    />
                  </div>
                </CardBody>
              </Card>
              </div>

              {/* Módulo: Caja y pagos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-yellow-100 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4 text-yellow-600"
                    >
                      <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                      <path
                        fillRule="evenodd"
                        d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm8.67 1.85a.75.75 0 1 0-1.34-.7l-2 3.75a.75.75 0 1 0 1.34.7l2-3.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Caja y pagos
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Configuración de métodos de pago, gestión de caja y retiros
                </p>
              {/* Forma de pago por defecto (Ventas) */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-green-600"
                        >
                          <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273Z" />
                          <path
                            fillRule="evenodd"
                            d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 15.5 2h-11ZM10 8a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H11a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Forma de pago por defecto (Ventas)
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Selecciona el método de pago predeterminado para las ventas
                        </p>
                      </div>
                    </div>
                    <Select
                      selectedKeys={[configCaja.tipoFormaPagoPorDefectoVenta.toString()]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setConfigCaja((prev) => ({
                          ...prev,
                          tipoFormaPagoPorDefectoVenta: selected ? Number(selected) : 0,
                        }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                    >
                      <SelectItem key="0">Efectivo</SelectItem>
                      <SelectItem key="1">Débito</SelectItem>
                      <SelectItem key="2">Crédito</SelectItem>
                      <SelectItem key="3">QR</SelectItem>
                    </Select>
                  </div>
                </CardBody>
              </Card>

              {/* Forma de pago por defecto (Compras) */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-blue-600"
                        >
                          <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273Z" />
                          <path
                            fillRule="evenodd"
                            d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 15.5 2h-11ZM10 8a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H11a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Forma de pago por defecto (Compras)
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Selecciona el método de pago predeterminado para las compras
                        </p>
                      </div>
                    </div>
                    <Select
                      selectedKeys={[configCaja.tipoFormaPagoPorDefectoCompra.toString()]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setConfigCaja((prev) => ({
                          ...prev,
                          tipoFormaPagoPorDefectoCompra: selected ? Number(selected) : 0,
                        }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                    >
                      <SelectItem key="0">Efectivo</SelectItem>
                      <SelectItem key="1">Débito</SelectItem>
                      <SelectItem key="2">Crédito</SelectItem>
                      <SelectItem key="3">QR</SelectItem>
                    </Select>
                  </div>
                </CardBody>
              </Card>

              {/* Ingreso manual de caja inicial */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-yellow-600"
                        >
                          <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                          <path
                            fillRule="evenodd"
                            d="M2 7.5h16l-.811 7.71A2 2 0 0 1 15.189 17H4.811A2 2 0 0 1 2.81 15.21L2 7.5Zm8.67 1.85a.75.75 0 1 0-1.34-.7l-2 3.75a.75.75 0 1 0 1.34.7l2-3.75Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Ingreso manual de caja inicial
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Permite ingresar manualmente el monto inicial de la caja al abrir
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configCaja.ingresoManualCajaInicial}
                      onValueChange={(value) =>
                        setConfigCaja((prev) => ({
                          ...prev,
                          ingresoManualCajaInicial: value,
                        }))
                      }
                      aria-label="Ingreso manual de caja inicial"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Puesto de caja separado */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-pink-600"
                        >
                          <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm2.615 8.428a1.224 1.224 0 0 0 .569-1.175 6.002 6.002 0 0 0-11.908 0c-.058.467.172.92.57 1.174A9.953 9.953 0 0 0 13 18a9.953 9.953 0 0 0 5.385-1.572Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Puesto de caja separado
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Habilita la gestión de múltiples puestos de caja independientes
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configCaja.puestoCajaSeparado}
                      onValueChange={(value) =>
                        setConfigCaja((prev) => ({
                          ...prev,
                          puestoCajaSeparado: value,
                        }))
                      }
                      aria-label="Puesto de caja separado"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Activar retiro de caja */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-rose-100 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="size-5 text-rose-600"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.798 7.45c.512-.67 1.135-.95 1.702-.95s1.19.28 1.702.95a.75.75 0 0 0 1.192-.91C12.637 5.55 11.596 5 10.5 5s-2.137.55-2.894 1.54A.75.75 0 0 0 8.798 7.45ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-slate-900">
                            Activar retiro de caja
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Permite realizar retiros de efectivo de la caja con límite configurable
                          </p>
                        </div>
                      </div>
                      <Switch
                        isSelected={configCaja.activarRetiroDeCaja}
                        onValueChange={(value) =>
                          setConfigCaja((prev) => ({
                            ...prev,
                            activarRetiroDeCaja: value,
                          }))
                        }
                        aria-label="Activar retiro de caja"
                      />
                    </div>
                    {configCaja.activarRetiroDeCaja && (
                      <Input
                        label="Monto máximo de retiro de caja"
                        type="number"
                        step="0.01"
                        min="0"
                        variant="bordered"
                        classNames={{ inputWrapper: "bg-white border-slate-200" }}
                        value={configCaja.montoMaximoRetiroCaja.toString()}
                        onChange={(e) =>
                          setConfigCaja((prev) => ({
                            ...prev,
                            montoMaximoRetiroCaja: parseFloat(e.target.value) || 0,
                          }))
                        }
                      startContent={<span className="text-gray-500">$</span>}
                    />
                  )}
                  </div>
                </CardBody>
              </Card>
              </div>

              {/* Módulo: Productos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-violet-100 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4 text-violet-600"
                    >
                      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h13A1.5 1.5 0 0 1 18 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15.5v-11ZM10.5 6.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5ZM6.75 8a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0V8Zm6.5 0a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0V8Z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Productos
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Configuración de comportamiento y gestión de productos
                </p>
              {/* Unificar renglones */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-violet-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-violet-600"
                        >
                          <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h13A1.5 1.5 0 0 1 18 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15.5v-11ZM10.5 6.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5ZM6.75 8a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0V8Zm6.5 0a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0V8Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Unificar renglones al ingresar el mismo producto
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Agrupa automáticamente productos duplicados en un solo renglón con cantidad sumada
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={configProductos.unificarRenglonesIngresarMismoProducto}
                      onValueChange={(value) =>
                        setConfigProductos((prev) => ({
                          ...prev,
                          unificarRenglonesIngresarMismoProducto: value,
                        }))
                      }
                      aria-label="Unificar renglones al ingresar el mismo producto"
                    />
                  </div>
                </CardBody>
              </Card>
              </div>

              {/* Módulo: Báscula */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4 text-slate-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-3.536-3.536a.75.75 0 0 1 1.061 0 3.5 3.5 0 0 0 4.95 0 .75.75 0 1 1 1.06 1.06 5 5 0 0 1-7.07 0 .75.75 0 0 1 0-1.06ZM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5Zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5Zm-3 3.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm4.5-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Báscula
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Configuración de básculas para productos a granel y etiquetado
                </p>
              {/* Activar báscula */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="size-5 text-slate-600"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-3.536-3.536a.75.75 0 0 1 1.061 0 3.5 3.5 0 0 0 4.95 0 .75.75 0 1 1 1.06 1.06 5 5 0 0 1-7.07 0 .75.75 0 0 1 0-1.06ZM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5Zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5Zm-3 3.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm4.5-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-slate-900">
                            Activar báscula
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Habilita la integración con básculas para productos a granel
                          </p>
                        </div>
                      </div>
                      <Switch
                        isSelected={configBascula.activarBascula}
                        onValueChange={(value) =>
                          setConfigBascula((prev) => ({
                            ...prev,
                            activarBascula: value,
                          }))
                        }
                        aria-label="Activar báscula"
                      />
                    </div>
                    {configBascula.activarBascula && (
                      <>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="size-4 text-slate-500"
                              >
                                <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                                <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-900">
                                Etiqueta por peso
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Genera etiquetas con el peso del producto
                              </p>
                            </div>
                          </div>
                          <Switch
                            isSelected={configBascula.etiquetaPorPeso}
                            onValueChange={(value) =>
                              setConfigBascula((prev) => ({
                                ...prev,
                                etiquetaPorPeso: value,
                              }))
                            }
                            aria-label="Etiqueta por peso"
                          />
                        </div>
                        <Input
                          label="Código de báscula"
                          variant="bordered"
                          classNames={{ inputWrapper: "bg-white border-slate-200" }}
                          value={configBascula.codigoBascula}
                          onChange={(e) =>
                            setConfigBascula((prev) => ({
                              ...prev,
                              codigoBascula: e.target.value,
                            }))
                          }
                          placeholder="Ingrese el código de la báscula"
                        />
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
              </div>

            </div>
          </SectionPanel>
          </div>
        </Tab>

        <Tab
          key="notificaciones"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.94 32.94 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.933 32.933 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.717 11.717 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Notificaciones</span>
            </div>
          }
        >
          <div className="mt-6 space-y-3">
            <SectionPanel
              id="notificaciones"
              title="Notificaciones"
              description={descriptionMap.notificaciones}
              summary={summaryNotificaciones}
            >
            <div className="space-y-4">
              {/* Notificaciones Push */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-blue-600"
                        >
                          <path d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.94 32.94 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.933 32.933 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.717 11.717 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Notificaciones push en la app
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Recibe alertas instantáneas en tu dispositivo móvil
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={notificaciones.push}
                      onValueChange={(value) =>
                        setNotificaciones((prev) => ({ ...prev, push: value }))
                      }
                      aria-label="Notificaciones push en la app"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Stock Bajo */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-amber-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Avisar stock crítico y roturas
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Recibe alertas cuando el stock esté bajo o haya roturas
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={notificaciones.stockBajo}
                      onValueChange={(value) =>
                        setNotificaciones((prev) => ({ ...prev, stockBajo: value }))
                      }
                      aria-label="Avisar stock critico y roturas"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Resumen Diario */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-purple-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Enviar resumen diario
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Recibe un resumen diario de actividades a las 20:00
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={notificaciones.resumenDiario}
                      onValueChange={(value) =>
                        setNotificaciones((prev) => ({
                          ...prev,
                          resumenDiario: value,
                        }))
                      }
                      aria-label="Enviar resumen diario a las 20:00"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </SectionPanel>
          </div>
        </Tab>

        <Tab
          key="seguridad"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Seguridad y acceso</span>
            </div>
          }
        >
          <div className="mt-6 space-y-3">
            <SectionPanel
              id="seguridad"
              title="Seguridad y acceso"
              description={descriptionMap.seguridad}
              summary={summarySeguridad}
            >
            <div className="space-y-6">
              {/* Card: Acceso y autenticación */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="flex items-center gap-3 pb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Lock size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Acceso y autenticación
                    </h4>
                    <p className="text-xs text-gray-500">
                      Configura cómo los usuarios acceden al sistema
                    </p>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 pt-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Habilitar doble factor (2FA)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requiere que todos los usuarios configuren autenticación
                        de dos factores en su próxima sesión
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      isSelected={seguridad.dobleFactor}
                      onValueChange={(value) => {
                        setSeguridad((prev) => ({
                          ...prev,
                          dobleFactor: value,
                        }));
                      }}
                      aria-label="Habilitar doble factor de autenticación"
                    />
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Expirar sesiones después de 30 días
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Las sesiones inactivas se cerrarán automáticamente después de 30 días
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      isSelected={seguridad.expirarSesiones30Dias}
                      onValueChange={(value) => {
                        setSeguridad((prev) => ({
                          ...prev,
                          expirarSesiones30Dias: value,
                        }));
                      }}
                      aria-label="Expirar sesiones después de 30 días"
                    />
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Avisar inicio de sesión desde nuevos dispositivos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Envía notificaciones cuando un usuario inicie sesión
                        desde un dispositivo o ubicación no reconocida
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      isSelected={seguridad.alertarNuevoDispositivo}
                      onValueChange={(value) => {
                        setSeguridad((prev) => ({
                          ...prev,
                          alertarNuevoDispositivo: value,
                        }));
                      }}
                      aria-label="Avisar inicio de sesión desde nuevos dispositivos"
                    />
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Bloquear dashboard por inactividad
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cierra la sesión automáticamente después de un período de inactividad
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      isSelected={seguridad.bloquearPorInactividad}
                      onValueChange={(value) => {
                        setSeguridad((prev) => ({
                          ...prev,
                          bloquearPorInactividad: value,
                        }));
                      }}
                      aria-label="Bloquear dashboard por inactividad"
                    />
                  </div>
                  {seguridad.bloquearPorInactividad && (
                    <>
                      <Divider />
                      <div className="flex items-center justify-between py-2 pl-6">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            Tiempo de inactividad (minutos)
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Tiempo en minutos antes de cerrar la sesión por inactividad
                          </p>
                        </div>
                        <Input
                          type="number"
                          size="sm"
                          value={seguridad.tiempoInactividadMinutos.toString()}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 30;
                            setSeguridad((prev) => ({
                              ...prev,
                              tiempoInactividadMinutos: value,
                            }));
                          }}
                          className="w-24"
                          min={1}
                          max={1440}
                          aria-label="Tiempo de inactividad en minutos"
                        />
                      </div>
                    </>
                  )}
                  <Divider />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Bloquear cuenta tras intentos fallidos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Bloquea temporalmente la cuenta después de múltiples
                        intentos de inicio de sesión fallidos
                      </p>
                    </div>
                    <Select
                      size="sm"
                      selectedKeys={[seguridad.bloquearTrasIntentos]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSeguridad((prev) => ({
                          ...prev,
                          bloquearTrasIntentos: (selected || "5") as "nunca" | "5" | "10",
                        }));
                      }}
                      className="min-w-[140px]"
                      aria-label="Bloquear cuenta tras intentos fallidos"
                      label=""
                    >
                      <SelectItem key="nunca">Nunca</SelectItem>
                      <SelectItem key="5">5 intentos</SelectItem>
                      <SelectItem key="10">10 intentos</SelectItem>
                    </Select>
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Recordar sesión por 30 días en dispositivos confiables
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Mantiene la sesión activa durante 30 días en
                        dispositivos marcados como confiables
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      isSelected={seguridad.recordarSesion30Dias}
                      onValueChange={(value) => {
                        setSeguridad((prev) => ({
                          ...prev,
                          recordarSesion30Dias: value,
                        }));
                      }}
                      aria-label="Recordar sesión por 30 días en dispositivos confiables"
                    />
                  </div>
                </CardBody>
              </Card>
              

              {/* Card: Estado de seguridad */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Shield size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        Estado de seguridad
                      </h4>
                      <p className="text-xs text-gray-500">
                        Información sobre sesiones y dispositivos activos
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => {
                      loadEstadisticasSeguridad();
                      loadSesionesActivas();
                      loadDispositivosConfiable();
                      loadIntentosSospechosos();
                    }}
                    isLoading={isLoadingSesiones || isLoadingDispositivos || isLoadingIntentosSospechosos}
                  >
                    Actualizar
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => setModalDetalle("sesiones")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          Sesiones activas
                        </p>
                        <div className={`w-2 h-2 rounded-full ${
                          estadisticasSeguridad.sesionesActivas > 0 
                            ? "bg-green-500" 
                            : "bg-gray-300"
                        }`} />
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">
                        {estadisticasSeguridad.sesionesActivas}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Usuarios conectados ahora • Click para detalles
                      </p>
                    </div>
                    <div 
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => setModalDetalle("dispositivos")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          Dispositivos confiables
                        </p>
                        <div className={`w-2 h-2 rounded-full ${
                          estadisticasSeguridad.dispositivosActivos > 0 
                            ? "bg-blue-500" 
                            : "bg-gray-300"
                        }`} />
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">
                        {estadisticasSeguridad.dispositivosActivos}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Dispositivos marcados como confiables • Click para detalles
                      </p>
                    </div>
                    <div 
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => setModalDetalle("ultimoAcceso")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          Último acceso
                        </p>
                        <div className={`w-2 h-2 rounded-full ${
                          estadisticasSeguridad.ultimaActividad 
                            ? "bg-green-500" 
                            : "bg-gray-300"
                        }`} />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">
                        {estadisticasSeguridad.ultimaActividad 
                          ? formatFecha(estadisticasSeguridad.ultimaActividad)
                          : "N/A"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Última actividad registrada • Click para detalles
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div 
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        estadisticasSeguridad.intentosFallidos7Dias > 0 || (intentosSospechosos?.alertas && intentosSospechosos.alertas.length > 0)
                          ? "bg-red-50 border-red-300 hover:bg-red-100"
                          : "bg-red-50 border-red-200 hover:bg-red-100"
                      }`}
                      onClick={() => setModalDetalle("intentosFallidos")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-red-600 font-medium">
                          Intentos fallidos (7 días)
                        </p>
                        <div className="flex items-center gap-2">
                          {intentosSospechosos?.alertas && intentosSospechosos.alertas.length > 0 && (
                            <Chip size="sm" color="danger" variant="flat">
                              ⚠️ Alerta
                            </Chip>
                          )}
                          {estadisticasSeguridad.intentosFallidos7Dias > 0 && !intentosSospechosos?.alertas && (
                            <Chip size="sm" color="warning" variant="flat">
                              Atención
                            </Chip>
                          )}
                        </div>
                      </div>
                      <p className="text-xl font-semibold text-red-900">
                        {estadisticasSeguridad.intentosFallidos7Dias}
                      </p>
                      <p className="text-xs text-red-400 mt-1">
                        {estadisticasSeguridad.intentosFallidos7Dias === 0
                          ? "No hay intentos fallidos"
                          : intentosSospechosos?.alertas && intentosSospechosos.alertas.length > 0
                          ? "⚠️ Actividad sospechosa detectada • Click para detalles"
                          : "Revisar posibles intentos de acceso no autorizado • Click para detalles"}
                      </p>
                    </div>
                    <div 
                      className="p-4 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => setModalDetalle("intentosExitosos")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-green-600 font-medium">
                          Intentos exitosos (7 días)
                        </p>
                        {estadisticasSeguridad.intentosExitosos7Dias > 0 && (
                          <Chip size="sm" color="success" variant="flat">
                            Normal
                          </Chip>
                        )}
                      </div>
                      <p className="text-xl font-semibold text-green-900">
                        {estadisticasSeguridad.intentosExitosos7Dias}
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        Inicios de sesión exitosos en la última semana • Click para detalles
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Card: Sesiones activas */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Lock size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        Sesiones activas
                      </h4>
                      <p className="text-xs text-gray-500">
                        Gestiona las sesiones activas de los usuarios
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={loadSesionesActivas}
                    isLoading={isLoadingSesiones}
                  >
                    Actualizar
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4">
                  {isLoadingSesiones ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="sm" />
                    </div>
                  ) : sesionesActivas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No hay sesiones activas
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sesionesActivas.map((sesion) => (
                        <div
                          key={sesion.id}
                          className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {sesion.usuarioNombre}
                                </p>
                                {sesion.esConfiable && (
                                  <Chip size="sm" color="success" variant="flat">
                                    Confiable
                                  </Chip>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Dispositivo:</span>{" "}
                                  {sesion.dispositivo || "Desconocido"}
                                </div>
                                <div>
                                  <span className="font-medium">IP:</span> {sesion.ipAddress || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">Inicio:</span>{" "}
                                  {formatFecha(sesion.fechaInicio)}
                                </div>
                                <div>
                                  <span className="font-medium">Última actividad:</span>{" "}
                                  {formatFecha(sesion.fechaUltimaActividad)}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => cerrarSesion(sesion.id)}
                            >
                              Cerrar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Card: Dispositivos confiables */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Shield size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        Dispositivos confiables
                      </h4>
                      <p className="text-xs text-gray-500">
                        Dispositivos marcados como confiables por los usuarios
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={loadDispositivosConfiable}
                    isLoading={isLoadingDispositivos}
                  >
                    Actualizar
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4">
                  {isLoadingDispositivos ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="sm" />
                    </div>
                  ) : dispositivosConfiable.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No hay dispositivos confiables registrados
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dispositivosConfiable.map((dispositivo) => (
                        <div
                          key={dispositivo.id}
                          className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {dispositivo.nombreDispositivo}
                                </p>
                                <Chip size="sm" color="success" variant="flat">
                                  {dispositivo.usuarioNombre}
                                </Chip>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">IP:</span> {dispositivo.ipAddress || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">Registrado:</span>{" "}
                                  {formatFecha(dispositivo.fechaRegistro)}
                                </div>
                                <div>
                                  <span className="font-medium">Último uso:</span>{" "}
                                  {formatFecha(dispositivo.fechaUltimoUso)}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => eliminarDispositivo(dispositivo.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Card: Auditoría */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Eye size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        Auditoría
                      </h4>
                      <p className="text-xs text-gray-500">
                        Visualiza y monitorea la actividad de seguridad
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={loadAuditoria}
                    isLoading={isLoadingAuditoria}
                  >
                    Actualizar
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 pt-4">
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-gray-600 mb-1">Total eventos</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {estadisticasAuditoria.totalEventos}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-xs text-gray-600 mb-1">Errores</p>
                      <p className="text-lg font-semibold text-red-700">
                        {estadisticasAuditoria.eventosError}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <p className="text-xs text-gray-600 mb-1">Advertencias</p>
                      <p className="text-lg font-semibold text-yellow-700">
                        {estadisticasAuditoria.eventosWarning}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Últimos 7 días</p>
                      <p className="text-lg font-semibold text-blue-700">
                        {estadisticasAuditoria.eventosUltimos7Dias}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Últimos 30 días</p>
                      <p className="text-lg font-semibold text-green-700">
                        {estadisticasAuditoria.eventosUltimos30Dias}
                      </p>
                    </div>
                  </div>

                  {/* Eventos recientes */}
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 mb-3">
                      Eventos recientes
                    </h5>
                    {isLoadingAuditoria ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="sm" />
                      </div>
                    ) : eventosRecientesAuditoria.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm rounded-lg bg-slate-50 border border-slate-200">
                        No hay eventos de auditoría registrados
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {eventosRecientesAuditoria.map((evento) => (
                          <div
                            key={evento.id}
                            className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {evento.usuario}
                                  </p>
                                  <Chip
                                    size="sm"
                                    color={
                                      evento.severidad === "ERROR"
                                        ? "danger"
                                        : evento.severidad === "WARNING"
                                        ? "warning"
                                        : "default"
                                    }
                                    variant="flat"
                                  >
                                    {evento.severidad}
                                  </Chip>
                                </div>
                                <p className="text-sm text-slate-700 mb-1">
                                  {evento.accion}
                                </p>
                                {evento.detalle && (
                                  <p className="text-xs text-gray-600 mb-1 truncate">
                                    {evento.detalle}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{formatFecha(evento.fecha)}</span>
                                  {evento.ipAddress && (
                                    <>
                                      <span>•</span>
                                      <span>IP: {evento.ipAddress}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Información y acción */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-sm text-gray-700 mb-3">
                      El sistema registra automáticamente todos los eventos de
                      seguridad y accesos para mantener un historial completo
                      de la actividad del negocio. Los logs incluyen inicios de
                      sesión, cambios de configuración, intentos fallidos y
                      acciones administrativas.
                    </p>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => router.push("/analiticas?tab=logs")}
                      aria-label="Ver logs completos de auditoría"
                    >
                      Ver logs completos
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </SectionPanel>
          </div>
        </Tab>

        <Tab
          key="fiscal"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Facturacion y region</span>
            </div>
          }
        >
          <div className="mt-6 space-y-3">
            <SectionPanel
              id="fiscal"
              title="Facturacion y region"
              description={descriptionMap.fiscal}
              summary={summaryFiscal}
            >
            <div className="space-y-4">
              {/* Moneda */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-green-600"
                        >
                          <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.755-.514 1.352 0 .18.053.395.115.58.032.092.07.183.105.273Z" />
                          <path
                            fillRule="evenodd"
                            d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 15.5 2h-11ZM10 8a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H11a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Moneda
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Selecciona la moneda principal para tus transacciones
                        </p>
                      </div>
                    </div>
                    <Select
                      selectedKeys={[regional.moneda]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setRegional((prev) => ({ ...prev, moneda: selected || "ARS" }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                    >
                      {monedas.map((moneda) => (
                        <SelectItem key={moneda.value}>{moneda.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </CardBody>
              </Card>

              {/* Zona horaria */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-blue-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Zona horaria
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Configura la zona horaria para fechas y reportes
                        </p>
                      </div>
                    </div>
                    <Select
                      selectedKeys={[regional.zonaHoraria]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setRegional((prev) => ({
                          ...prev,
                          zonaHoraria: selected || "America/Argentina/Buenos_Aires",
                        }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                    >
                      {zonasHorarias.map((zona) => (
                        <SelectItem key={zona}>{zona}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </CardBody>
              </Card>

              {/* Idioma */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-purple-600"
                        >
                          <path d="M7.752 11.689a3.44 3.44 0 0 0 4.496 0l1.88-1.88c-1.133-1.133-2.64-1.88-4.496-1.88s-3.363.747-4.496 1.88l1.88 1.88Z" />
                          <path d="m2.33 9.663 1.88 1.88a3.44 3.44 0 0 0 4.496 0l1.881-1.88c.51.51 1.12.888 1.81 1.103v2.635a3.44 3.44 0 0 1-1.81 1.102l-1.88-1.88a3.44 3.44 0 0 0-4.496 0l-1.88 1.88A3.44 3.44 0 0 1 2.33 13.398V11.11c.69-.215 1.3-.593 1.81-1.103l-1.88-1.88a3.44 3.44 0 0 1 1.07-2.567ZM15.75 8.25a3.44 3.44 0 0 1 1.07 2.567l-1.88 1.88a3.44 3.44 0 0 0-4.496 0l-1.881 1.88a3.44 3.44 0 0 1-1.81-1.102v-2.635c.69.215 1.3.593 1.81 1.103l1.88-1.88a3.44 3.44 0 0 0 4.496 0l1.88-1.88a3.44 3.44 0 0 1 1.07 2.567Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Idioma
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Selecciona el idioma de la interfaz
                        </p>
                      </div>
                    </div>
                    <Select
                      selectedKeys={[regional.idioma]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setRegional((prev) => ({ ...prev, idioma: selected || "es-AR" }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                    >
                      {idiomas.map((idioma) => (
                        <SelectItem key={idioma.value}>{idioma.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </CardBody>
              </Card>

              {/* Condición IVA */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-amber-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Condición IVA
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Selecciona tu condición fiscal ante AFIP
                        </p>
                      </div>
                    </div>
                    <Select
                      selectedKeys={regional.condicionIvaId ? [regional.condicionIvaId.toString()] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        const condicion = condicionesIva.find((c: { id: number; descripcion: string }) => c.id.toString() === selected);
                        setRegional((prev) => ({
                          ...prev,
                          condicionIvaId: selected ? Number(selected) : null,
                          tipoIva: condicion?.descripcion || "",
                        }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                      placeholder={
                        condicionesIvaQuery.isLoading
                          ? "Cargando condiciones..."
                          : condicionesIva.length === 0
                          ? "No hay condiciones disponibles"
                          : "Selecciona una condición"
                      }
                      isLoading={condicionesIvaQuery.isLoading}
                      isDisabled={condicionesIvaQuery.isLoading}
                    >
                      {condicionesIva.length === 0 && !condicionesIvaQuery.isLoading ? (
                        <SelectItem key="no-items" isDisabled>
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-sm">No hay condiciones disponibles</span>
                            <span className="text-xs text-gray-500">
                              Ejecuta el seed: npm run db-seed
                            </span>
                          </div>
                        </SelectItem>
                      ) : (
                        condicionesIva.map((condicion: { id: number; descripcion: string }) => (
                          <SelectItem key={condicion.id.toString()}>
                            {condicion.descripcion}
                          </SelectItem>
                        ))
                      )}
                    </Select>
                    {condicionesIvaQuery.error && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Error al cargar condiciones: {condicionesIvaQuery.error instanceof Error ? condicionesIvaQuery.error.message : "Error desconocido"}
                      </p>
                    )}
                    {condicionesIva.length === 0 && !condicionesIvaQuery.isLoading && !condicionesIvaQuery.error && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        No hay condiciones de IVA. La API las creará automáticamente al recargar.
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Punto de venta */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-indigo-600"
                        >
                          <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Punto de venta
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Número de punto de venta asignado por AFIP
                        </p>
                      </div>
                    </div>
                    <Input
                      value={regional.puntoVenta}
                      onChange={(e) =>
                        setRegional((prev) => ({
                          ...prev,
                          puntoVenta: e.target.value,
                        }))
                      }
                      variant="bordered"
                      classNames={{ inputWrapper: "bg-white border-slate-200" }}
                      placeholder="Ej: 0001"
                      maxLength={10}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Inicio de actividades */}
              <Card className="shadow-sm border border-slate-200">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-teal-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1Zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Inicio de actividades
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Fecha de inicio de actividades según AFIP
                        </p>
                      </div>
                    </div>
                    <Input
                      type="date"
                      value={regional.inicioActividades}
                      onChange={(e) =>
                        setRegional((prev) => ({
                          ...prev,
                          inicioActividades: e.target.value,
                        }))
                      }
                      variant="bordered"
                      classNames={{ inputWrapper: "bg-white border-slate-200" }}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </SectionPanel>
          </div>
        </Tab>

      </Tabs>

      {/* Modales de detalles */}
      <Modal 
        isOpen={modalDetalle === "sesiones"} 
        onClose={() => setModalDetalle(null)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Sesiones Activas - Detalles</ModalHeader>
          <ModalBody>
            {isLoadingSesiones ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : sesionesActivas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay sesiones activas</p>
            ) : (
              <div className="space-y-3">
                {sesionesActivas.map((sesion) => (
                  <div key={sesion.id} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{sesion.usuarioNombre}</p>
                        {sesion.esConfiable && (
                          <Chip size="sm" color="success" variant="flat" className="mt-1">
                            Dispositivo confiable
                          </Chip>
                        )}
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => {
                          cerrarSesion(sesion.id);
                          setModalDetalle(null);
                        }}
                      >
                        Cerrar sesión
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                      <div>
                        <span className="font-medium">IP:</span> {sesion.ipAddress || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Dispositivo:</span> {sesion.dispositivo || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Inicio:</span> {formatFecha(sesion.fechaInicio)}
                      </div>
                      <div>
                        <span className="font-medium">Última actividad:</span> {formatFecha(sesion.fechaUltimaActividad)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setModalDetalle(null)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={modalDetalle === "dispositivos"} 
        onClose={() => setModalDetalle(null)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Dispositivos Confiables - Detalles</ModalHeader>
          <ModalBody>
            {isLoadingDispositivos ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : dispositivosConfiable.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay dispositivos confiables registrados</p>
            ) : (
              <div className="space-y-3">
                {dispositivosConfiable.map((dispositivo) => (
                  <div key={dispositivo.id} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{dispositivo.nombreDispositivo}</p>
                        <Chip size="sm" color="success" variant="flat" className="mt-1">
                          {dispositivo.usuarioNombre}
                        </Chip>
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => {
                          eliminarDispositivo(dispositivo.id);
                          setModalDetalle(null);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                      <div>
                        <span className="font-medium">IP:</span> {dispositivo.ipAddress || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Registrado:</span> {formatFecha(dispositivo.fechaRegistro)}
                      </div>
                      <div>
                        <span className="font-medium">Último uso:</span> {formatFecha(dispositivo.fechaUltimoUso)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setModalDetalle(null)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={modalDetalle === "intentosFallidos"} 
        onClose={() => setModalDetalle(null)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              Intentos Fallidos - Detalles
              {intentosSospechosos?.alertas && intentosSospechosos.alertas.length > 0 && (
                <Chip size="sm" color="danger" variant="flat">⚠️ Alertas activas</Chip>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            {isLoadingIntentosSospechosos ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Alertas */}
                {intentosSospechosos?.alertas && intentosSospechosos.alertas.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-red-700">⚠️ Alertas de Seguridad</h5>
                    {intentosSospechosos.alertas.map((alerta, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg border ${
                          alerta.tipo === "critico" 
                            ? "bg-red-50 border-red-300" 
                            : "bg-yellow-50 border-yellow-300"
                        }`}
                      >
                        <p className="font-semibold text-sm">{alerta.titulo}</p>
                        <p className="text-xs text-gray-600 mt-1">{alerta.descripcion}</p>
                        {alerta.ips && alerta.ips.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">IPs afectadas:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {alerta.ips.map((ip, i) => (
                                <Chip key={i} size="sm" variant="flat" className="text-xs">
                                  {ip}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* IPs sospechosas */}
                {intentosSospechosos?.sospechosos && intentosSospechosos.sospechosos.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">IPs con actividad sospechosa</h5>
                    <div className="space-y-2">
                      {intentosSospechosos.sospechosos.map((sospechoso, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border ${
                            sospechoso.esCritico 
                              ? "bg-red-50 border-red-300" 
                              : "bg-yellow-50 border-yellow-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{sospechoso.ipAddress}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {sospechoso.intentos24Horas} intentos fallidos en 24 horas
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Último intento: {formatFecha(sospechoso.ultimoIntento)}
                              </p>
                            </div>
                            {sospechoso.esCritico && (
                              <Chip size="sm" color="danger" variant="flat">
                                Crítico
                              </Chip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Últimos intentos fallidos */}
                {intentosSospechosos?.ultimosIntentos && intentosSospechosos.ultimosIntentos.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">Últimos intentos fallidos (24 horas)</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {intentosSospechosos.ultimosIntentos.map((intento) => (
                        <div key={intento.id} className="p-2 rounded border border-slate-200 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{intento.usuarioNombre || "Usuario desconocido"}</p>
                              <p className="text-xs text-gray-500">{intento.ipAddress || "IP desconocida"}</p>
                            </div>
                            <p className="text-xs text-gray-400">{formatFecha(intento.fecha)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!intentosSospechosos || (intentosSospechosos.sospechosos.length === 0 && intentosSospechosos.ultimosIntentos.length === 0)) && (
                  <p className="text-center text-gray-500 py-8">No hay intentos fallidos registrados</p>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setModalDetalle(null)}>Cerrar</Button>
            <Button 
              color="primary" 
              onPress={() => {
                loadIntentosSospechosos();
                loadEstadisticasSeguridad();
              }}
            >
              Actualizar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={modalDetalle === "intentosExitosos"} 
        onClose={() => setModalDetalle(null)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Intentos Exitosos - Detalles</ModalHeader>
          <ModalBody>
            <div className="space-y-2">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-semibold text-green-900">
                  {estadisticasSeguridad.intentosExitosos7Dias} inicios de sesión exitosos
                </p>
                <p className="text-xs text-green-600 mt-1">
                  En los últimos 7 días
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Los inicios de sesión exitosos indican actividad normal del sistema. 
                Todos los accesos están siendo registrados correctamente.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setModalDetalle(null)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={modalDetalle === "ultimoAcceso"} 
        onClose={() => setModalDetalle(null)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Último Acceso - Detalles</ModalHeader>
          <ModalBody>
            {estadisticasSeguridad.ultimaActividad ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">Última actividad registrada</p>
                  <p className="text-lg text-slate-700 mt-2">
                    {formatFecha(estadisticasSeguridad.ultimaActividad)}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Esta es la fecha y hora de la última sesión activa registrada en el sistema.
                </p>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No hay actividad registrada</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setModalDetalle(null)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function Header({
  isLoadingTenant,
  isLoadingConfiguracion,
  hasAnyChanges,
  isSavingAll,
  onSaveAll,
  seguridad,
}: {
  isLoadingTenant: boolean;
  isLoadingConfiguracion: boolean;
  hasAnyChanges: boolean;
  isSavingAll: boolean;
  onSaveAll: () => void;
  seguridad: { dobleFactor: boolean };
}) {
  return (
    <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200/50 bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] mb-10 transition-all duration-300 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)]">
      {/* Blurred circles decorativos para profundidad con parallax ligero (optimizado) */}
      <div className="absolute inset-0 overflow-hidden" style={{ willChange: 'transform' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl parallax-bg" style={{ willChange: 'transform' }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/8 rounded-full blur-2xl parallax-bg" style={{ animationDelay: '2s', willChange: 'transform' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl parallax-bg" style={{ animationDelay: '4s', willChange: 'transform' }} />
      </div>
      
      {/* Glass panel semitransparente con blur más suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm" />
      
      {/* Radial gradient overlay para más profundidad */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_50%)]" />
      
      <div className="relative p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <Chip 
              variant="flat" 
              className="bg-white/25 text-white backdrop-blur-sm border border-white/40 shadow-lg shadow-white/20 transition-all duration-300 hover:bg-white/30 hover:shadow-xl hover:shadow-white/30"
            >
              Configuración
            </Chip>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-white drop-shadow-lg">
                Configuración
              </h1>
              <p className="text-white/95 max-w-2xl md:text-lg leading-relaxed drop-shadow-md">
                Ajusta la identidad del negocio, preferencias de venta y seguridad desde un solo lugar. Los cambios afectan a todas las sucursales activas.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              color="primary"
              className="bg-white text-slate-900 hover:bg-white/90 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
              isLoading={isSavingAll}
              isDisabled={isLoadingTenant || isLoadingConfiguracion || !hasAnyChanges}
              onPress={onSaveAll}
            >
              Guardar todo
            </Button>
          </div>
          
          {/* Ícono grande de panel de control a la derecha (complementario al sidebar) */}
          <div className="hidden lg:flex items-center justify-center flex-shrink-0">
            <div className="relative group">
              {/* Glow alrededor del icono - efecto premium */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 rounded-full blur-xl group-hover:from-white/40 group-hover:to-white/30 transition-all duration-500" />
              {/* Blur suave de fondo */}
              <div className="absolute inset-0 bg-white/15 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300" />
              <svg
                className="w-32 h-32 md:w-40 md:h-40 text-white relative z-10 drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{
                  animation: 'fadeIn 0.4s ease-out 0.1s forwards',
                  willChange: 'transform, opacity',
                  opacity: 0
                }}
              >
                {/* Icono de panel de control - más elaborado que el engranaje del sidebar */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
          <div className="rounded-2xl bg-white/10 p-4 border border-white/10 h-full flex flex-col justify-between">
            <p className="text-sm text-white/80">Plan activo</p>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="text-lg font-semibold leading-tight">
                Business
              </span>
              <Chip
                size="sm"
                variant="flat"
                className="bg-white/20 text-white"
              >
                4 locales
              </Chip>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 border border-white/10 h-full flex flex-col justify-between">
            <p className="text-sm text-white/80">Respaldo</p>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="text-lg font-semibold leading-tight">
                Hoy 03:00
              </span>
              <Chip
                size="sm"
                variant="flat"
                className="bg-white/20 text-white"
              >
                Automático
              </Chip>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 border border-white/10 h-full flex flex-col justify-between">
            <p className="text-sm text-white/80">Seguridad</p>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="text-lg font-semibold leading-tight">
                2FA {seguridad.dobleFactor ? "activo" : "pendiente"}
              </span>
              <Chip
                size="sm"
                color={seguridad.dobleFactor ? "success" : "warning"}
                variant="flat"
                className="bg-white/20 text-white"
              >
                {seguridad.dobleFactor ? "Protegido" : "Habilitar"}
              </Chip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
