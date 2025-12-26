"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Switch,
  Tabs,
  Tab,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { Lock, Shield, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getPreferenciasVenta,
  savePreferenciasVenta,
  type PreferenciasVentaDTO,
} from "./actions-preferencias-venta";
import { useConfiguracion } from "@/hooks/useConfiguracion";

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
  isActive,
  children,
}: {
  id: SectionKey;
  title: string;
  description: string;
  summary: string;
  isActive: boolean;
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
  const router = useRouter();
  const [openSection, setOpenSection] = useState<SectionKey>("perfil");
  const [isOffline, setIsOffline] = useState(false);

  // Usar TanStack Query hook
  const {
    tenant: tenantData,
    configuracion: configuracionData,
    localidades: localidadesData,
    preferenciasVenta: preferenciasVentaData,
    notificaciones: notificacionesData,
    seguridad: seguridadData,
    fiscal: fiscalData,
    branding: brandingData,
    isLoadingTenant,
    isLoadingConfiguracion,
    isLoadingLocalidades,
    isLoadingPreferenciasVenta,
    isLoadingNotificaciones,
    isLoadingSeguridad,
    isLoadingFiscal,
    isLoadingBranding,
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
  } = useConfiguracion({ enabled: true });

  // Estados locales para edición (se sincronizan con los datos del hook)
  const [configuracion, setConfiguracion] = useState({
    razonSocial: "",
    nombreFantasia: "",
    cuit: "",
    email: "",
    telefono: "",
    celular: "",
    direccion: "",
    localidadId: 0,
    observacionPieFactura: "",
  });
  
  const localidades = localidadesData || [];

  const [regional, setRegional] = useState({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "Responsable Inscripto",
    puntoVenta: "0001",
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
  const [configStock, setConfigStock] = useState({
    facturaDescuentaStock: true,
    presupuestoDescuentaStock: false,
    remitoDescuentaStock: true,
    actualizaCostoDesdeCompra: true,
    modificaPrecioVentaDesdeCompra: false,
  });
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
    email: true,
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
    razonSocial: "",
    cuit: "",
    email: "",
    telefono: "",
    planId: "",
    estaActivo: true,
    onboardingCompleto: false,
  });

  // Sincronizar tenant desde el hook
  useEffect(() => {
    if (tenantData) {
      setTenant((prev) => ({
        ...prev,
        nombre: tenantData.nombre ?? prev.nombre,
        dominio: tenantData.dominio ?? prev.dominio,
        razonSocial: tenantData.razonSocial ?? prev.razonSocial,
        cuit: tenantData.cuit ?? prev.cuit,
        email: tenantData.email ?? prev.email,
        telefono: tenantData.telefono ?? prev.telefono,
      }));
    }
  }, [tenantData]);

  // Sincronizar configuración desde el hook
  useEffect(() => {
    if (configuracionData) {
      setConfiguracion((prev) => ({
        ...prev,
        razonSocial: configuracionData.razonSocial ?? prev.razonSocial,
        nombreFantasia: configuracionData.nombreFantasia ?? prev.nombreFantasia,
        cuit: configuracionData.cuit ?? prev.cuit,
        email: configuracionData.email ?? prev.email,
        telefono: configuracionData.telefono ?? prev.telefono,
        celular: configuracionData.celular ?? prev.celular,
        direccion: configuracionData.direccion ?? prev.direccion,
        localidadId: configuracionData.localidadId ?? prev.localidadId,
        observacionPieFactura: configuracionData.observacionPieFactura ?? prev.observacionPieFactura,
      }));

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
      if (configuracionData.facturaDescuentaStock !== undefined) {
        setConfigStock({
          facturaDescuentaStock: configuracionData.facturaDescuentaStock ?? true,
          presupuestoDescuentaStock: configuracionData.presupuestoDescuentaStock ?? false,
          remitoDescuentaStock: configuracionData.remitoDescuentaStock ?? true,
          actualizaCostoDesdeCompra: configuracionData.actualizaCostoDesdeCompra ?? true,
          modificaPrecioVentaDesdeCompra: configuracionData.modificaPrecioVentaDesdeCompra ?? false,
        });
        setConfigStockOriginal({
          facturaDescuentaStock: configuracionData.facturaDescuentaStock ?? true,
          presupuestoDescuentaStock: configuracionData.presupuestoDescuentaStock ?? false,
          remitoDescuentaStock: configuracionData.remitoDescuentaStock ?? true,
          actualizaCostoDesdeCompra: configuracionData.actualizaCostoDesdeCompra ?? true,
          modificaPrecioVentaDesdeCompra: configuracionData.modificaPrecioVentaDesdeCompra ?? false,
        });
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
  const summaryPerfil = `Nombre: ${tenant.nombre} | CUIT: ${tenant.cuit}`;
  const summaryVentas = `Ticket digital: ${
    preferencias.ticketDigitalPorCorreo ? "activado" : "desactivado"
  } | Impuestos: ${preferencias.mostrarPreciosConIva ? "incluidos" : "excluidos"}`;

  // Detectar si hay cambios en preferencias
  const hasPreferenciasChanges = preferenciasOriginales
    ? JSON.stringify(preferencias) !== JSON.stringify(preferenciasOriginales)
    : false;
  
  const hasNotificacionesChanges = notificacionesOriginales
    ? JSON.stringify(notificaciones) !== JSON.stringify(notificacionesOriginales)
    : false;
  
  const hasSeguridadChanges = seguridadOriginal
    ? JSON.stringify(seguridad) !== JSON.stringify(seguridadOriginal)
    : false;
  
  const hasFiscalChanges = regionalOriginal
    ? JSON.stringify(regional) !== JSON.stringify(regionalOriginal)
    : false;
  
  const hasBrandingChanges = brandingOriginal
    ? branding.slogan !== brandingOriginal.slogan || 
      branding.color !== brandingOriginal.color ||
      branding.logo !== null ||
      branding.logoPreview !== brandingOriginal.logoPreview
    : false;
  
  const hasStockChanges = configStockOriginal
    ? JSON.stringify(configStock) !== JSON.stringify(configStockOriginal)
    : false;
  
  const hasCajaChanges = configCajaOriginal
    ? JSON.stringify(configCaja) !== JSON.stringify(configCajaOriginal)
    : false;
  
  const hasProductosChanges = configProductosOriginal
    ? JSON.stringify(configProductos) !== JSON.stringify(configProductosOriginal)
    : false;
  
  const hasBasculaChanges = configBasculaOriginal
    ? JSON.stringify(configBascula) !== JSON.stringify(configBasculaOriginal)
    : false;

  // Detectar si hay cambios en cualquier sección
  const hasAnyChanges = 
    hasPreferenciasChanges || 
    hasStockChanges || 
    hasCajaChanges || 
    hasProductosChanges || 
    hasBasculaChanges ||
    hasNotificacionesChanges ||
    hasSeguridadChanges ||
    hasFiscalChanges ||
    hasBrandingChanges;
  
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
  const summaryNotificaciones = `Correo: ${
    notificaciones.email ? "on" : "off"
  } | Push: ${notificaciones.push ? "on" : "off"} | Resumen diario: ${
    notificaciones.resumenDiario ? "on" : "off"
  }`;
  const summarySeguridad = `2FA: ${
    seguridad.dobleFactor ? "activo" : "pendiente"
  } | Bloqueo: ${seguridad.bloquearTrasIntentos === "nunca" ? "desactivado" : `${seguridad.bloquearTrasIntentos} intentos`} | Recordar sesión: ${seguridad.recordarSesion30Dias ? "30 días" : "off"}`;
  const summaryFiscal = `Moneda: ${regional.moneda} | IVA: ${regional.tipoIva} | Punto de venta: ${regional.puntoVenta}`;
  const summaryBranding = `Color: ${branding.color} | Logo: pendiente`;

  // saveTenant y saveConfiguracion ahora se manejan con las mutaciones de TanStack Query

  const handleSavePerfil = async () => {
    try {
      // Guardar perfil (tenant y configuración básica)
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          saveTenantMutation(tenant, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        }),
        new Promise<void>((resolve, reject) => {
          saveConfiguracionMutation(configuracion, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        }),
      ]);
      
      // Si hay cambios en preferencias básicas, guardarlas también
      if (hasPreferenciasChanges) {
        await new Promise<void>((resolve, reject) => {
          savePreferenciasVentaMutation(preferencias, {
            onSuccess: () => {
              setPreferenciasOriginales(preferencias);
              resolve();
            },
            onError: (error) => reject(error),
          });
        });
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
        await new Promise<void>((resolve, reject) => {
          saveNotificacionesMutation(notificaciones, {
            onSuccess: () => {
              setNotificacionesOriginales(notificaciones);
              resolve();
            },
            onError: (error) => reject(error),
          });
        });
      }

      // Guardar seguridad si hay cambios
      if (hasSeguridadChanges) {
        await new Promise<void>((resolve, reject) => {
          saveSeguridadMutation(seguridad, {
            onSuccess: () => {
              setSeguridadOriginal(seguridad);
              resolve();
            },
            onError: (error) => reject(error),
          });
        });
      }

      // Guardar fiscal si hay cambios
      if (hasFiscalChanges) {
        await new Promise<void>((resolve, reject) => {
          saveFiscalMutation(regional, {
            onSuccess: () => {
              setRegionalOriginal(regional);
              resolve();
            },
            onError: (error) => reject(error),
          });
        });
      }

      // Guardar branding si hay cambios
      if (hasBrandingChanges) {
        await new Promise<void>((resolve, reject) => {
          saveBrandingMutation(branding, {
            onSuccess: (data) => {
              setBrandingOriginal({
                slogan: branding.slogan,
                color: branding.color,
                logoPreview: data.logoPreview ?? branding.logoPreview,
              });
              setBranding((prev) => ({ ...prev, logo: null }));
              resolve();
            },
            onError: (error) => reject(error),
          });
        });
      }
      
      addToast({
        title: "Configuración actualizada",
        description: "Todos los datos se guardaron correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      // Los errores ya se manejan en las mutaciones individuales
    }
  };

  const handleSaveNotificaciones = async () => {
    saveNotificacionesMutation(notificaciones, {
      onSuccess: () => {
        setNotificacionesOriginales(notificaciones);
      },
    });
  };

  const handleSaveSeguridad = async () => {
    saveSeguridadMutation(seguridad, {
      onSuccess: () => {
        setSeguridadOriginal(seguridad);
      },
    });
  };

  const handleSaveFiscal = async () => {
    saveFiscalMutation(regional, {
      onSuccess: () => {
        setRegionalOriginal(regional);
      },
    });
  };

  const handleSaveBranding = async () => {
    saveBrandingMutation(branding, {
      onSuccess: (data) => {
        setBrandingOriginal({
          slogan: branding.slogan,
          color: branding.color,
          logoPreview: data.logoPreview ?? branding.logoPreview,
        });
        setBranding((prev) => ({ ...prev, logo: null }));
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch justify-center">
      {/* Header de la página */}
      <Header 
        isOffline={isOffline}
        isLoadingTenant={isLoadingTenant}
        isLoadingConfiguracion={isLoadingConfiguracion}
        hasAnyChanges={hasAnyChanges}
        isSavingAll={isSavingTenant || isSavingConfiguracion || isSavingPreferenciasVenta || isSavingNotificaciones || isSavingSeguridad || isSavingFiscal || isSavingBranding}
        onSaveAll={handleSavePerfil}
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
              isActive={true}
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
              <Select
                label="Localidad"
                variant="bordered"
                selectedKeys={configuracion.localidadId ? [configuracion.localidadId.toString()] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  setConfiguracion((prev) => ({
                    ...prev,
                    localidadId: selected ? Number(selected) : 0,
                  }));
                }}
                classNames={{ trigger: "bg-white border-slate-200" }}
              >
                {localidades.map((localidad) => (
                  <SelectItem key={localidad.Id.toString()}>
                    {localidad.Descripcion}
                  </SelectItem>
                ))}
              </Select>
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
              isActive={true}
            >
            <div className="space-y-6">
              {isOffline && (
                <Chip
                  variant="flat"
                  color="warning"
                  size="sm"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Modo offline: valores por defecto
                </Chip>
              )}

              {/* Sección: Preferencias básicas */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="pb-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    Preferencias básicas
                  </h4>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-3 pt-4">
                  <Switch
                    isSelected={preferencias.ticketDigitalPorCorreo}
                    onValueChange={(value) =>
                      setPreferencias((prev) => ({
                        ...prev,
                        ticketDigitalPorCorreo: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Enviar ticket digital por correo"
                    isDisabled={isLoadingPreferenciasVenta || isOffline}
                  >
                    Enviar ticket digital por correo
                  </Switch>
                  <Switch
                    isSelected={preferencias.mostrarPreciosConIva}
                    onValueChange={(value) =>
                      setPreferencias((prev) => ({
                        ...prev,
                        mostrarPreciosConIva: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Mostrar precios con impuestos incluidos"
                    isDisabled={isLoadingPreferenciasVenta || isOffline}
                  >
                    Mostrar precios con impuestos incluidos
                  </Switch>
                  <Switch
                    isSelected={preferencias.abrirCajonEfectivo}
                    onValueChange={(value) =>
                      setPreferencias((prev) => ({
                        ...prev,
                        abrirCajonEfectivo: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Abrir cajon al cobrar en efectivo"
                    isDisabled={isLoadingPreferenciasVenta || isOffline}
                  >
                    Abrir cajon al cobrar en efectivo
                  </Switch>
                  <Switch
                    isSelected={preferencias.numerarPedidosPantalla}
                    onValueChange={(value) =>
                      setPreferencias((prev) => ({
                        ...prev,
                        numerarPedidosPantalla: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Numerar pedidos y mostrar en pantalla"
                    isDisabled={isLoadingPreferenciasVenta || isOffline}
                  >
                    Numerar pedidos y mostrar en pantalla
                  </Switch>
                </CardBody>
              </Card>

              {/* Sección: Stock y compras */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="pb-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    Stock y compras
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Configura cómo se maneja el stock en diferentes tipos de comprobantes
                  </p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-3 pt-4">
                  <Switch
                    isSelected={configStock.facturaDescuentaStock}
                    onValueChange={(value) =>
                      setConfigStock((prev) => ({
                        ...prev,
                        facturaDescuentaStock: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Factura descuenta stock"
                    isDisabled={isOffline}
                  >
                    Factura descuenta stock
                  </Switch>
                  <Switch
                    isSelected={configStock.presupuestoDescuentaStock}
                    onValueChange={(value) =>
                      setConfigStock((prev) => ({
                        ...prev,
                        presupuestoDescuentaStock: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Presupuesto descuenta stock"
                    isDisabled={isOffline}
                  >
                    Presupuesto descuenta stock
                  </Switch>
                  <Switch
                    isSelected={configStock.remitoDescuentaStock}
                    onValueChange={(value) =>
                      setConfigStock((prev) => ({
                        ...prev,
                        remitoDescuentaStock: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Remito descuenta stock"
                    isDisabled={isOffline}
                  >
                    Remito descuenta stock
                  </Switch>
                  <Switch
                    isSelected={configStock.actualizaCostoDesdeCompra}
                    onValueChange={(value) =>
                      setConfigStock((prev) => ({
                        ...prev,
                        actualizaCostoDesdeCompra: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Actualizar costo desde compra"
                    isDisabled={isOffline}
                  >
                    Actualizar costo desde compra
                  </Switch>
                  <Switch
                    isSelected={configStock.modificaPrecioVentaDesdeCompra}
                    onValueChange={(value) =>
                      setConfigStock((prev) => ({
                        ...prev,
                        modificaPrecioVentaDesdeCompra: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Modificar precio de venta desde compra"
                    isDisabled={isOffline}
                  >
                    Modificar precio de venta desde compra
                  </Switch>
                </CardBody>
              </Card>

              {/* Sección: Caja y pagos */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="pb-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    Caja y pagos
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Configuración de caja y formas de pago por defecto
                  </p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Forma de pago por defecto (Ventas)"
                      selectedKeys={[configCaja.tipoFormaPagoPorDefectoVenta.toString()]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setConfigCaja((prev) => ({
                          ...prev,
                          tipoFormaPagoPorDefectoVenta: selected ? Number(selected) : 0,
                        }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                      isDisabled={isOffline}
                    >
                      <SelectItem key="0">Efectivo</SelectItem>
                      <SelectItem key="1">Débito</SelectItem>
                      <SelectItem key="2">Crédito</SelectItem>
                      <SelectItem key="3">QR</SelectItem>
                    </Select>
                    <Select
                      label="Forma de pago por defecto (Compras)"
                      selectedKeys={[configCaja.tipoFormaPagoPorDefectoCompra.toString()]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setConfigCaja((prev) => ({
                          ...prev,
                          tipoFormaPagoPorDefectoCompra: selected ? Number(selected) : 0,
                        }));
                      }}
                      classNames={{ trigger: "bg-white border-slate-200" }}
                      isDisabled={isOffline}
                    >
                      <SelectItem key="0">Efectivo</SelectItem>
                      <SelectItem key="1">Débito</SelectItem>
                      <SelectItem key="2">Crédito</SelectItem>
                      <SelectItem key="3">QR</SelectItem>
                    </Select>
                  </div>
                  <Switch
                    isSelected={configCaja.ingresoManualCajaInicial}
                    onValueChange={(value) =>
                      setConfigCaja((prev) => ({
                        ...prev,
                        ingresoManualCajaInicial: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Ingreso manual de caja inicial"
                    isDisabled={isOffline}
                  >
                    Ingreso manual de caja inicial
                  </Switch>
                  <Switch
                    isSelected={configCaja.puestoCajaSeparado}
                    onValueChange={(value) =>
                      setConfigCaja((prev) => ({
                        ...prev,
                        puestoCajaSeparado: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Puesto de caja separado"
                    isDisabled={isOffline}
                  >
                    Puesto de caja separado
                  </Switch>
                  <Switch
                    isSelected={configCaja.activarRetiroDeCaja}
                    onValueChange={(value) =>
                      setConfigCaja((prev) => ({
                        ...prev,
                        activarRetiroDeCaja: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Activar retiro de caja"
                    isDisabled={isOffline}
                  >
                    Activar retiro de caja
                  </Switch>
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
                      isDisabled={isOffline}
                    />
                  )}
                </CardBody>
              </Card>

              {/* Sección: Productos */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="pb-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    Productos
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Configuración de comportamiento de productos
                  </p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-3 pt-4">
                  <Switch
                    isSelected={configProductos.unificarRenglonesIngresarMismoProducto}
                    onValueChange={(value) =>
                      setConfigProductos((prev) => ({
                        ...prev,
                        unificarRenglonesIngresarMismoProducto: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Unificar renglones al ingresar el mismo producto"
                    isDisabled={isOffline}
                  >
                    Unificar renglones al ingresar el mismo producto
                  </Switch>
                </CardBody>
              </Card>

              {/* Sección: Báscula */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="pb-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    Báscula
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Configuración de báscula para productos a granel
                  </p>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 pt-4">
                  <Switch
                    isSelected={configBascula.activarBascula}
                    onValueChange={(value) =>
                      setConfigBascula((prev) => ({
                        ...prev,
                        activarBascula: value,
                      }))
                    }
                    className="px-1 py-1"
                    aria-label="Activar báscula"
                    isDisabled={isOffline}
                  >
                    Activar báscula
                  </Switch>
                  {configBascula.activarBascula && (
                    <>
                      <Switch
                        isSelected={configBascula.etiquetaPorPeso}
                        onValueChange={(value) =>
                          setConfigBascula((prev) => ({
                            ...prev,
                            etiquetaPorPeso: value,
                          }))
                        }
                        className="px-1 py-1"
                        aria-label="Etiqueta por peso"
                        isDisabled={isOffline}
                      >
                        Etiqueta por peso
                      </Switch>
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
                        isDisabled={isOffline}
                      />
                    </>
                  )}
                </CardBody>
              </Card>

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
              isActive={true}
            >
            <div className="space-y-3">
              <Switch
                isSelected={notificaciones.email}
                onValueChange={(value) =>
                  setNotificaciones((prev) => ({ ...prev, email: value }))
                }
                aria-label="Enviar alertas por correo"
              >
                Enviar alertas por correo
              </Switch>
              <Switch
                isSelected={notificaciones.push}
                onValueChange={(value) =>
                  setNotificaciones((prev) => ({ ...prev, push: value }))
                }
                aria-label="Notificaciones push en la app"
              >
                Notificaciones push en la app
              </Switch>
              <Switch
                isSelected={notificaciones.stockBajo}
                onValueChange={(value) =>
                  setNotificaciones((prev) => ({ ...prev, stockBajo: value }))
                }
                aria-label="Avisar stock critico y roturas"
              >
                Avisar stock critico y roturas
              </Switch>
              <Switch
                isSelected={notificaciones.resumenDiario}
                onValueChange={(value) =>
                  setNotificaciones((prev) => ({
                    ...prev,
                    resumenDiario: value,
                  }))
                }
                aria-label="Enviar resumen diario a las 20:00"
              >
                Enviar resumen diario a las 20:00
              </Switch>
            </div>
            {hasNotificacionesChanges && (
              <div className="flex justify-end pt-2">
                <Button
                  color="primary"
                  onPress={handleSaveNotificaciones}
                  isLoading={isSavingNotificaciones}
                  isDisabled={isOffline}
                >
                  Guardar cambios
                </Button>
              </div>
            )}
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
              isActive={true}
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
              
              {hasSeguridadChanges && (
                <div className="flex justify-end pt-2">
                  <Button
                    color="primary"
                    onPress={handleSaveSeguridad}
                    isLoading={isSavingSeguridad}
                    isDisabled={isOffline}
                  >
                    Guardar cambios de seguridad
                  </Button>
                </div>
              )}

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
              isActive={true}
            >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Moneda"
                  selectedKeys={[regional.moneda]}
                  onChange={(e) =>
                    setRegional((prev) => ({ ...prev, moneda: e.target.value }))
                  }
                >
                  {monedas.map((moneda) => (
                    <SelectItem key={moneda.value}>{moneda.label}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Zona horaria"
                  selectedKeys={[regional.zonaHoraria]}
                  onChange={(e) =>
                    setRegional((prev) => ({
                      ...prev,
                      zonaHoraria: e.target.value,
                    }))
                  }
                >
                  {zonasHorarias.map((zona) => (
                    <SelectItem key={zona}>{zona}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Idioma"
                  selectedKeys={[regional.idioma]}
                  onChange={(e) =>
                    setRegional((prev) => ({ ...prev, idioma: e.target.value }))
                  }
                >
                  {idiomas.map((idioma) => (
                    <SelectItem key={idioma.value}>{idioma.label}</SelectItem>
                  ))}
                </Select>
                <Input
                  label="Condicion IVA"
                  value={regional.tipoIva}
                  onChange={(e) =>
                    setRegional((prev) => ({
                      ...prev,
                      tipoIva: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Punto de venta"
                  value={regional.puntoVenta}
                  onChange={(e) =>
                    setRegional((prev) => ({
                      ...prev,
                      puntoVenta: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Inicio de actividades"
                  placeholder="DD/MM/AAAA"
                  value={regional.inicioActividades}
                  onChange={(e) =>
                    setRegional((prev) => ({
                      ...prev,
                      inicioActividades: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {hasFiscalChanges && (
              <div className="flex justify-end pt-2">
                <Button
                  color="primary"
                  onPress={handleSaveFiscal}
                  isLoading={isSavingFiscal}
                  isDisabled={isOffline}
                >
                  Guardar cambios
                </Button>
              </div>
            )}
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
              isActive={true}
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
            {hasBrandingChanges && (
              <div className="flex justify-end pt-2">
                <Button
                  color="primary"
                  onPress={handleSaveBranding}
                  isLoading={isSavingBranding}
                  isDisabled={isOffline}
                >
                  Guardar cambios
                </Button>
              </div>
            )}
          </SectionPanel>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

function Header({
  isOffline,
  isLoadingTenant,
  isLoadingConfiguracion,
  hasAnyChanges,
  isSavingAll,
  onSaveAll,
  seguridad,
}: {
  isOffline: boolean;
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
            {isOffline && (
              <Chip
                variant="flat"
                color="warning"
                size="sm"
                className="bg-yellow-100 text-yellow-800"
              >
                Modo offline
              </Chip>
            )}
            <Button
              color="primary"
              className="bg-white text-slate-900"
              isLoading={isSavingAll}
              isDisabled={isLoadingTenant || isLoadingConfiguracion || isOffline || !hasAnyChanges}
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
