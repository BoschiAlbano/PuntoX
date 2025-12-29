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
  Switch,
  Tabs,
  Tab,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { Lock, Shield, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { usePagePermission } from "@/lib/permissions/usePagePermission";
import { type PreferenciasVentaDTO } from "./actions-preferencias-venta";

type SectionKey =
  | "perfil"
  | "ventas"
  | "notificaciones"
  | "seguridad"
  | "fiscal"
  | "branding";

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
  usePagePermission(); // Proteger página con permisos
  const router = useRouter();
  const [openSection, setOpenSection] = useState<SectionKey>("perfil");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Usar TanStack Query hook
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
    saveBranding: saveBrandingMutation,
    isSavingTenant,
    isSavingConfiguracion,
    isSavingPreferenciasVenta,
    isSavingNotificaciones,
    isSavingSeguridad,
    isSavingFiscal,
    isSavingBranding,
    useProvincias,
    useDepartamentos,
    useLocalidades,
    useCondicionesIva,
  } = useConfiguracion({ enabled: true });

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
  const [configStockOriginal, setConfigStockOriginal] = useState<typeof configStock>(null);

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
    alertarNuevoDispositivo: true,
    bloquearPorInactividad: true,
    bloquearTrasIntentos: "5" as "nunca" | "5" | "10",
    recordarSesion30Dias: true,
  });
  const [seguridadOriginal, setSeguridadOriginal] = useState<typeof seguridad | null>(null);

  const [branding, setBranding] = useState({
    slogan: "Mejor precio, mejor servicio.",
    color: "#90c472",
    logo: null as File | null,
    logoPreview: "",
  });
  const [brandingOriginal, setBrandingOriginal] = useState<{slogan: string, color: string, logoPreview: string} | null>(null);

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
    if (tenantData) {
      const newTenant = {
        nombre: tenantData.nombre ?? "",
        dominio: tenantData.dominio ?? "",
        planId: tenantData.planId ?? "",
        estaActivo: tenantData.estaActivo ?? true,
        onboardingCompleto: tenantData.onboardingCompleto ?? false,
      };
      setTenant((prev) => ({
        ...prev,
        ...newTenant,
      }));
      setTenantOriginal(newTenant);
    }
  }, [tenantData]);

  // Sincronizar configuración desde el hook
  useEffect(() => {
    if (configuracionData) {
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
      setConfiguracion((prev) => ({
        ...prev,
        ...newConfiguracion,
      }));
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

  // Sincronizar fiscal
  useEffect(() => {
    if (fiscalData) {
      setRegional(fiscalData);
      setRegionalOriginal(fiscalData);
    }
  }, [fiscalData]);

  // Sincronizar branding
  useEffect(() => {
    if (brandingData) {
      setBranding((prev) => ({
        ...prev,
        slogan: brandingData.slogan ?? prev.slogan,
        color: brandingData.color ?? prev.color,
        logoPreview: brandingData.logoPreview ?? prev.logoPreview,
      }));
      setBrandingOriginal({
        slogan: brandingData.slogan ?? "",
        color: brandingData.color ?? "#90c472",
        logoPreview: brandingData.logoPreview ?? "",
      });
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
    branding: "Ajusta la imagen de tu negocio en el panel y tickets.",
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
      seguridad.alertarNuevoDispositivo !== seguridadOriginal.alertarNuevoDispositivo ||
      seguridad.bloquearPorInactividad !== seguridadOriginal.bloquearPorInactividad ||
      seguridad.bloquearTrasIntentos !== seguridadOriginal.bloquearTrasIntentos ||
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
  
  const hasBrandingChanges = useMemo(() => {
    if (!brandingOriginal) return false;
    return (
      branding.slogan !== brandingOriginal.slogan || 
      branding.color !== brandingOriginal.color ||
      branding.logo !== null ||
      branding.logoPreview !== brandingOriginal.logoPreview
    );
  }, [branding, brandingOriginal]);
  
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
    hasBrandingChanges,
    [hasTenantChanges, hasConfiguracionChanges, hasPreferenciasChanges, hasStockChanges, hasCajaChanges, hasProductosChanges, hasBasculaChanges, hasNotificacionesChanges, hasSeguridadChanges, hasFiscalChanges, hasBrandingChanges]
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
        setBranding((prev) => ({
          ...prev,
          logo: file,
          logoPreview: reader.result as string,
        }));
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
    } | Bloqueo: ${seguridad.bloquearTrasIntentos === "nunca" ? "desactivado" : `${seguridad.bloquearTrasIntentos} intentos`} | Recordar sesión: ${seguridad.recordarSesion30Dias ? "30 días" : "off"}`,
    [seguridad.dobleFactor, seguridad.bloquearTrasIntentos, seguridad.recordarSesion30Dias]
  );
  const summaryFiscal = useMemo(() => {
    const condicion = condicionesIva.find((c: { id: number; descripcion: string }) => c.id === regional.condicionIvaId);
    const condicionText = condicion?.descripcion || regional.tipoIva || "No definida";
    return `Moneda: ${regional.moneda} | IVA: ${condicionText} | Punto de venta: ${regional.puntoVenta || "No definido"}`;
  }, [regional.moneda, regional.tipoIva, regional.condicionIvaId, regional.puntoVenta, condicionesIva]);
  const summaryBranding = useMemo(
    () => `Color: ${branding.color} | Logo: pendiente`,
    [branding.color]
  );

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
      const configuracionCompleta = {
        ...configuracion,
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
        await saveFiscalMutation(regional, true);
        setRegionalOriginal(regional);
      }

      // Guardar branding si hay cambios
      if (hasBrandingChanges) {
        const brandingData = await saveBrandingMutation(branding, true);
        setBrandingOriginal({
          slogan: branding.slogan,
          color: branding.color,
          logoPreview: brandingData.logoPreview ?? branding.logoPreview,
        });
        setBranding((prev) => ({ ...prev, logo: null }));
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
              isLoading={isSavingTenant || isSavingConfiguracion || isSavingPreferenciasVenta || isSavingNotificaciones || isSavingSeguridad || isSavingFiscal || isSavingBranding}
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
        isSavingAll={isSavingTenant || isSavingConfiguracion || isSavingPreferenciasVenta || isSavingNotificaciones || isSavingSeguridad || isSavingFiscal || isSavingBranding}
        onSaveAll={handleConfirmSave}
        seguridad={seguridad}
      />
      
      {/* Tabs con las diferentes secciones */}
      <Tabs
        aria-label="Configuración"
        selectedKey={openSection}
        onSelectionChange={(key) => setOpenSection(key as SectionKey)}
        className="relative"
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
                label="Razon social"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.razonSocial}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    razonSocial: e.target.value,
                  }))
                }
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
              />
              <div className="md:col-span-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Ubicación del negocio <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    Seleccione la ubicación completa de su negocio
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
                        Cierra la sesión automáticamente después de 10 minutos
                        de inactividad
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
                      onChange={(e) => {
                        setSeguridad((prev) => ({
                          ...prev,
                          bloquearTrasIntentos: e.target.value as "nunca" | "5" | "10",
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
                <CardHeader className="flex items-center gap-3 pb-3">
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
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 pt-4">
                  {/* TODO: Reemplazar con datos reales del API cuando esté disponible */}
                  {/* Endpoint esperado: GET /api/configuracion/seguridad/estado */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Sesiones activas
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">8</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Dispositivos activos
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">5</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Último acceso
                      </p>
                      <p className="text-lg font-semibold text-slate-900">
                        Hace 12 minutos
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Card: Auditoría */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="flex items-center gap-3 pb-3">
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
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 pt-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-sm text-gray-700">
                      El sistema registra automáticamente todos los eventos de
                      seguridad y accesos para mantener un historial completo
                      de la actividad del negocio. Los logs incluyen inicios de
                      sesión, cambios de configuración, intentos fallidos y
                      acciones administrativas.
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Para ver los logs completos, visita la sección de
                      Analíticas
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

        <Tab
          key="branding"
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
                    d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 1-.707.293H2a1 1 0 0 1-1-1V4Zm1.5 0v12.086l5.707-5.707A1 1 0 0 1 9 10.5V4H2.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Branding</span>
            </div>
          }
        >
          <div className="mt-6 space-y-3">
            <SectionPanel
              id="branding"
              title="Branding"
              description={descriptionMap.branding}
              summary={summaryBranding}
            >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Logo</label>
                  <div className="flex items-center gap-4">
                    {branding.logoPreview && (
                      <div className="relative">
                        <img
                          src={branding.logoPreview}
                          alt="Logo preview"
                          className="w-24 h-24 object-contain border border-slate-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBranding((prev) => ({
                              ...prev,
                              logo: null,
                              logoPreview: brandingOriginal?.logoPreview || "",
                            }));
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
                  type="color"
                  label="Color principal"
                  variant="bordered"
                  classNames={{ inputWrapper: "bg-white border-slate-200 h-12" }}
                  value={branding.color}
                  onChange={(e) =>
                    setBranding((prev) => ({ ...prev, color: e.target.value }))
                  }
                />
              </div>
              <Input
                label="Slogan del negocio"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={branding.slogan}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, slogan: e.target.value }))
                }
                placeholder="Ej: Mejor precio, mejor servicio."
              />
            </div>
          </SectionPanel>
          </div>
        </Tab>
      </Tabs>
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
    <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-500 to-[#90c472] text-white shadow-xl mb-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="relative p-4 md:p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Chip variant="flat" className="bg-white/10 text-white">
              Configuración
            </Chip>
            <h1 className="text-3xl md:text-[32px] font-bold">
              Configuración
            </h1>
            <p className="text-white max-w-3xl">
              Ajustes rápidos de identidad, ventas y seguridad en un solo lugar. Los cambios aplican a todas las sucursales activas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              color="primary"
              className="bg-white text-slate-900"
              isLoading={isSavingAll}
              isDisabled={isLoadingTenant || isLoadingConfiguracion || !hasAnyChanges}
              onPress={onSaveAll}
            >
              Guardar todo
            </Button>
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
