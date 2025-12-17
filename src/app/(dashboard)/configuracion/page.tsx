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
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { Lock, Shield, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getPreferenciasVenta,
  savePreferenciasVenta,
  type PreferenciasVentaDTO,
} from "./actions-preferencias-venta";

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
      className={`rounded-2xl border border-slate-200 ${
        isActive ? "block" : "hidden"
      }`}
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
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [openSection, setOpenSection] = useState<SectionKey>("perfil");
  const [isOffline, setIsOffline] = useState(false);

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
  
  const [localidades, setLocalidades] = useState<Array<{Id: number, Descripcion: string}>>([]);

  const [regional, setRegional] = useState({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "Responsable Inscripto",
    puntoVenta: "0001",
    inicioActividades: "",
  });
  const [regionalOriginal, setRegionalOriginal] = useState<typeof regional | null>(null);
  const [isLoadingFiscal, setIsLoadingFiscal] = useState(false);
  const [isSavingFiscal, setIsSavingFiscal] = useState(false);

  const [preferencias, setPreferencias] = useState<PreferenciasVentaDTO>({
    ticketDigitalPorCorreo: true,
    mostrarPreciosConIva: true,
    abrirCajonEfectivo: true,
    numerarPedidosPantalla: true,
  });
  const [preferenciasOriginales, setPreferenciasOriginales] =
    useState<PreferenciasVentaDTO | null>(null);
  const [isLoadingPreferencias, setIsLoadingPreferencias] = useState(true);
  const [isSavingPreferencias, setIsSavingPreferencias] = useState(false);

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
  const [isLoadingNotificaciones, setIsLoadingNotificaciones] = useState(false);
  const [isSavingNotificaciones, setIsSavingNotificaciones] = useState(false);

  const [seguridad, setSeguridad] = useState({
    dobleFactor: false,
    alertarNuevoDispositivo: true,
    bloquearPorInactividad: true,
    bloquearTrasIntentos: "5" as "nunca" | "5" | "10",
    recordarSesion30Dias: true,
  });
  const [seguridadOriginal, setSeguridadOriginal] = useState<typeof seguridad | null>(null);
  const [isLoadingSeguridad, setIsLoadingSeguridad] = useState(false);
  const [isSavingSeguridad, setIsSavingSeguridad] = useState(false);

  const [branding, setBranding] = useState({
    slogan: "Mejor precio, mejor servicio.",
    color: "#90c472",
    logo: null as File | null,
    logoPreview: "",
  });
  const [brandingOriginal, setBrandingOriginal] = useState<{slogan: string, color: string, logoPreview: string} | null>(null);
  const [isLoadingBranding, setIsLoadingBranding] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const [tenant, setTenant] = useState({
    nombre: "PX Liniers",
    dominio: "puntox.com",
    razonSocial: "Punto X Market",
    cuit: "20-12345678-9",
    email: "admin@puntox.com",
    telefono: "+54 11 5555 0000",
    planId: "BUSINESS",
    estaActivo: true,
    onboardingCompleto: false,
  });

  useEffect(() => {
    const loadTenant = async () => {
      setIsLoadingTenant(true);
      try {
        const res = await fetch("/api/tenant");
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const errorMessage =
            errorData?.error ?? "No se pudo cargar el tenant";
          
          // Diferenciar entre errores de conexión (503) y errores de permisos (401/403)
          if (res.status === 503) {
            // Error de conexión a la base de datos
            setIsOffline(true);
            console.error("Error de conexión a la base de datos:", errorMessage);
            addToast({
              title: "Modo offline",
              description:
                "No se pudo conectar a la base de datos. Se están usando valores por defecto.",
              color: "warning",
            });
          } else if (res.status === 401 || res.status === 403) {
            // Error de autenticación/autorización
            setIsOffline(false);
            console.error("Error de permisos:", errorMessage);
            addToast({
              title: "Sin permisos",
              description: errorMessage || "No tienes permisos para acceder a estos datos.",
              color: "danger",
            });
          } else {
            // Otros errores (404, 500, etc.)
            setIsOffline(false);
            console.error("Error cargando tenant:", errorMessage);
            addToast({
              title: "Error",
              description: errorMessage,
              color: "danger",
            });
          }
          return;
        }
        
        // Si llegamos aquí, la conexión fue exitosa
        setIsOffline(false);
        const json = await res.json();
        if (json?.tenant) {
          setTenant((prev) => ({
            ...prev,
            nombre: json.tenant.nombre ?? prev.nombre,
            dominio: json.tenant.dominio ?? prev.dominio,
            razonSocial: json.tenant.razonSocial ?? prev.razonSocial,
            cuit: json.tenant.cuit ?? prev.cuit,
            email: json.tenant.email ?? prev.email,
            telefono: json.tenant.telefono ?? prev.telefono,
          }));
        }
      } catch (error) {
        // Errores de red o timeouts también se consideran offline
        setIsOffline(true);
        console.error("Error inesperado cargando tenant:", error);
        addToast({
          title: "Modo offline",
          description:
            "No se pudo conectar al servidor. La página continuará con valores por defecto.",
          color: "warning",
        });
      } finally {
        setIsLoadingTenant(false);
      }
    };

    const loadConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const res = await fetch("/api/configuracion");
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const errorMessage =
            errorData?.error ?? "No se pudo cargar la configuracion";
          
          // Diferenciar entre errores de conexión (503) y errores de permisos (401/403)
          if (res.status === 503) {
            // Error de conexión a la base de datos
            setIsOffline(true);
            console.error("Error de conexión a la base de datos:", errorMessage);
            // No mostrar toast duplicado si ya se mostró en loadTenant
            if (!isLoadingTenant) {
              addToast({
                title: "Modo offline",
                description:
                  "No se pudo conectar a la base de datos. Se están usando valores por defecto.",
                color: "warning",
              });
            }
          } else if (res.status === 401 || res.status === 403) {
            // Error de autenticación/autorización
            setIsOffline(false);
            console.error("Error de permisos:", errorMessage);
            addToast({
              title: "Sin permisos",
              description: errorMessage || "No tienes permisos para acceder a esta configuración.",
              color: "danger",
            });
          } else if (res.status === 404) {
            // No hay configuración, usar valores por defecto
            setIsOffline(false);
            console.log("No se encontró configuración, usando valores por defecto");
            // No mostrar error, simplemente usar valores por defecto
          } else {
            // Otros errores (500, etc.)
            setIsOffline(false);
            console.error("Error cargando configuración:", errorMessage);
            addToast({
              title: "Error",
              description: errorMessage,
              color: "danger",
            });
          }
          return;
        }
        
        // Si llegamos aquí, la conexión fue exitosa
        setIsOffline(false);
        const json = await res.json();
        if (json?.configuracion) {
          setConfiguracion((prev) => ({
            ...prev,
            razonSocial: json.configuracion.razonSocial ?? prev.razonSocial,
            nombreFantasia:
              json.configuracion.nombreFantasia ?? prev.nombreFantasia,
            cuit: json.configuracion.cuit ?? prev.cuit,
            email: json.configuracion.email ?? prev.email,
            telefono: json.configuracion.telefono ?? prev.telefono,
            celular: json.configuracion.celular ?? prev.celular,
            direccion: json.configuracion.direccion ?? prev.direccion,
            localidadId: json.configuracion.localidadId ?? prev.localidadId,
            observacionPieFactura:
              json.configuracion.observacionPieFactura ??
              prev.observacionPieFactura,
          }));
          
          // Actualizar preferencias desde la configuración
          if (json.configuracion.mostrarPreciosConIva !== undefined) {
            setPreferencias((prev) => ({
              ...prev,
              mostrarPreciosConIva: json.configuracion.mostrarPreciosConIva,
              abrirCajonEfectivo: json.configuracion.abrirCajonEfectivo ?? prev.abrirCajonEfectivo,
              numerarPedidosPantalla: json.configuracion.numerarPedidosPantalla ?? prev.numerarPedidosPantalla,
              ticketDigitalPorCorreo: json.configuracion.imprimir ?? prev.ticketDigitalPorCorreo,
            }));
          }

          // Actualizar configuración de stock
          if (json.configuracion.facturaDescuentaStock !== undefined) {
            setConfigStock({
              facturaDescuentaStock: json.configuracion.facturaDescuentaStock ?? true,
              presupuestoDescuentaStock: json.configuracion.presupuestoDescuentaStock ?? false,
              remitoDescuentaStock: json.configuracion.remitoDescuentaStock ?? true,
              actualizaCostoDesdeCompra: json.configuracion.actualizaCostoDesdeCompra ?? true,
              modificaPrecioVentaDesdeCompra: json.configuracion.modificaPrecioVentaDesdeCompra ?? false,
            });
            setConfigStockOriginal({
              facturaDescuentaStock: json.configuracion.facturaDescuentaStock ?? true,
              presupuestoDescuentaStock: json.configuracion.presupuestoDescuentaStock ?? false,
              remitoDescuentaStock: json.configuracion.remitoDescuentaStock ?? true,
              actualizaCostoDesdeCompra: json.configuracion.actualizaCostoDesdeCompra ?? true,
              modificaPrecioVentaDesdeCompra: json.configuracion.modificaPrecioVentaDesdeCompra ?? false,
            });
          }

          // Actualizar configuración de caja
          if (json.configuracion.tipoFormaPagoPorDefectoVenta !== undefined) {
            setConfigCaja({
              tipoFormaPagoPorDefectoVenta: json.configuracion.tipoFormaPagoPorDefectoVenta ?? 0,
              tipoFormaPagoPorDefectoCompra: json.configuracion.tipoFormaPagoPorDefectoCompra ?? 0,
              ingresoManualCajaInicial: json.configuracion.ingresoManualCajaInicial ?? false,
              puestoCajaSeparado: json.configuracion.puestoCajaSeparado ?? false,
              activarRetiroDeCaja: json.configuracion.activarRetiroDeCaja ?? false,
              montoMaximoRetiroCaja: json.configuracion.montoMaximoRetiroCaja ?? 0,
            });
            setConfigCajaOriginal({
              tipoFormaPagoPorDefectoVenta: json.configuracion.tipoFormaPagoPorDefectoVenta ?? 0,
              tipoFormaPagoPorDefectoCompra: json.configuracion.tipoFormaPagoPorDefectoCompra ?? 0,
              ingresoManualCajaInicial: json.configuracion.ingresoManualCajaInicial ?? false,
              puestoCajaSeparado: json.configuracion.puestoCajaSeparado ?? false,
              activarRetiroDeCaja: json.configuracion.activarRetiroDeCaja ?? false,
              montoMaximoRetiroCaja: json.configuracion.montoMaximoRetiroCaja ?? 0,
            });
          }

          // Actualizar configuración de productos
          if (json.configuracion.unificarRenglonesIngresarMismoProducto !== undefined) {
            setConfigProductos({
              unificarRenglonesIngresarMismoProducto: json.configuracion.unificarRenglonesIngresarMismoProducto ?? true,
            });
            setConfigProductosOriginal({
              unificarRenglonesIngresarMismoProducto: json.configuracion.unificarRenglonesIngresarMismoProducto ?? true,
            });
          }

          // Actualizar configuración de báscula
          if (json.configuracion.activarBascula !== undefined) {
            setConfigBascula({
              activarBascula: json.configuracion.activarBascula ?? false,
              etiquetaPorPeso: json.configuracion.etiquetaPorPeso ?? false,
              codigoBascula: json.configuracion.codigoBascula ?? "",
            });
            setConfigBasculaOriginal({
              activarBascula: json.configuracion.activarBascula ?? false,
              etiquetaPorPeso: json.configuracion.etiquetaPorPeso ?? false,
              codigoBascula: json.configuracion.codigoBascula ?? "",
            });
          }
        }
      } catch (error) {
        // Errores de red o timeouts también se consideran offline
        setIsOffline(true);
        console.error("Error inesperado cargando configuración:", error);
        // No mostrar toast duplicado si ya se mostró en loadTenant
        if (!isLoadingTenant) {
          addToast({
            title: "Modo offline",
            description:
              "No se pudo conectar al servidor. La página continuará con valores por defecto.",
            color: "warning",
          });
        }
      } finally {
        setIsLoadingConfig(false);
      }
    };

    const loadLocalidades = async () => {
      try {
        const res = await fetch("/api/localidades");
        if (res.ok) {
          const data = await res.json();
          setLocalidades(data);
        }
      } catch (error) {
        console.error("Error cargando localidades:", error);
      }
    };

    const loadNotificaciones = async () => {
      setIsLoadingNotificaciones(true);
      try {
        const res = await fetch("/api/configuracion/preferencias");
        if (res.ok) {
          const json = await res.json();
          if (json?.preferencias) {
            setNotificaciones(json.preferencias);
            setNotificacionesOriginales(json.preferencias);
          }
        }
      } catch (error) {
        console.error("Error cargando notificaciones:", error);
      } finally {
        setIsLoadingNotificaciones(false);
      }
    };

    const loadSeguridad = async () => {
      setIsLoadingSeguridad(true);
      try {
        const res = await fetch("/api/configuracion/seguridad");
        if (res.ok) {
          const json = await res.json();
          if (json?.seguridad) {
            setSeguridad(json.seguridad);
            setSeguridadOriginal(json.seguridad);
          }
        }
      } catch (error) {
        console.error("Error cargando seguridad:", error);
      } finally {
        setIsLoadingSeguridad(false);
      }
    };

    const loadFiscal = async () => {
      setIsLoadingFiscal(true);
      try {
        const res = await fetch("/api/configuracion/fiscal");
        if (res.ok) {
          const json = await res.json();
          if (json?.fiscal) {
            setRegional(json.fiscal);
            setRegionalOriginal(json.fiscal);
          }
        }
      } catch (error) {
        console.error("Error cargando fiscal:", error);
      } finally {
        setIsLoadingFiscal(false);
      }
    };

    const loadBranding = async () => {
      setIsLoadingBranding(true);
      try {
        const res = await fetch("/api/configuracion/branding");
        if (res.ok) {
          const json = await res.json();
          if (json?.branding) {
            setBranding({
              slogan: json.branding.slogan || "",
              color: json.branding.color || "#90c472",
              logo: null,
              logoPreview: json.branding.logoPreview || "",
            });
            setBrandingOriginal({
              slogan: json.branding.slogan || "",
              color: json.branding.color || "#90c472",
              logoPreview: json.branding.logoPreview || "",
            });
          }
        }
      } catch (error) {
        console.error("Error cargando branding:", error);
      } finally {
        setIsLoadingBranding(false);
      }
    };

    loadTenant();
    loadConfig();
    loadPreferenciasVenta();
    loadLocalidades();
    loadNotificaciones();
    loadSeguridad();
    loadFiscal();
    loadBranding();
  }, []);

  const loadPreferenciasVenta = async () => {
    setIsLoadingPreferencias(true);
    try {
      const data = await getPreferenciasVenta();
      setPreferencias(data);
      setPreferenciasOriginales(data);
    } catch (error) {
      console.error("Error cargando preferencias de venta:", error);
      addToast({
        title: "Error",
        description:
          "No se pudieron cargar las preferencias de venta. Se usarán valores por defecto.",
        color: "warning",
      });
    } finally {
      setIsLoadingPreferencias(false);
    }
  };

  const handleSavePreferenciasVenta = async () => {
    setIsSavingPreferencias(true);
    try {
      // Guardar preferencias básicas
      const result = await savePreferenciasVenta(preferencias);
      if (!result.success) {
        throw new Error(result.error || "No se pudieron guardar las preferencias básicas");
      }

      // Guardar configuración avanzada usando la API de configuración
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razonSocial: configuracion.razonSocial,
          nombreFantasia: configuracion.nombreFantasia,
          cuit: configuracion.cuit,
          email: configuracion.email,
          telefono: configuracion.telefono,
          celular: configuracion.celular,
          direccion: configuracion.direccion,
          localidadId: configuracion.localidadId,
          observacionPieFactura: configuracion.observacionPieFactura,
          mostrarPreciosConIva: preferencias.mostrarPreciosConIva,
          abrirCajonEfectivo: preferencias.abrirCajonEfectivo,
          numerarPedidosPantalla: preferencias.numerarPedidosPantalla,
          imprimir: preferencias.ticketDigitalPorCorreo,
          facturaDescuentaStock: configStock.facturaDescuentaStock,
          presupuestoDescuentaStock: configStock.presupuestoDescuentaStock,
          remitoDescuentaStock: configStock.remitoDescuentaStock,
          actualizaCostoDesdeCompra: configStock.actualizaCostoDesdeCompra,
          modificaPrecioVentaDesdeCompra: configStock.modificaPrecioVentaDesdeCompra,
          tipoFormaPagoPorDefectoVenta: configCaja.tipoFormaPagoPorDefectoVenta,
          tipoFormaPagoPorDefectoCompra: configCaja.tipoFormaPagoPorDefectoCompra,
          ingresoManualCajaInicial: configCaja.ingresoManualCajaInicial,
          puestoCajaSeparado: configCaja.puestoCajaSeparado,
          activarRetiroDeCaja: configCaja.activarRetiroDeCaja,
          montoMaximoRetiroCaja: configCaja.montoMaximoRetiroCaja,
          unificarRenglonesIngresarMismoProducto: configProductos.unificarRenglonesIngresarMismoProducto,
          activarBascula: configBascula.activarBascula,
          etiquetaPorPeso: configBascula.etiquetaPorPeso,
          codigoBascula: configBascula.codigoBascula,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo guardar la configuración avanzada");
      }

      // Actualizar estados originales
      setPreferenciasOriginales(preferencias);
      setConfigStockOriginal(configStock);
      setConfigCajaOriginal(configCaja);
      setConfigProductosOriginal(configProductos);
      setConfigBasculaOriginal(configBascula);

      addToast({
        title: "Preferencias guardadas",
        description: "Todas las preferencias de venta se guardaron correctamente.",
        color: "success",
      });
    } catch (error: unknown) {
      console.error("Error guardando preferencias de venta:", error);
      addToast({
        title: "Error al guardar",
        description: (error instanceof Error ? error.message : String(error)) || "Ocurrió un error inesperado al guardar las preferencias.",
        color: "danger",
      });
    } finally {
      setIsSavingPreferencias(false);
    }
  };

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

  const saveTenant = async () => {
    const res = await fetch("/api/tenant", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: tenant.nombre,
        razonSocial: tenant.razonSocial,
        dominio: tenant.dominio,
        email: tenant.email,
        telefono: tenant.telefono,
        cuit: tenant.cuit,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "No se pudo guardar el tenant");
    }
  };

  const saveConfiguracion = async () => {
    if (!configuracion.localidadId) {
      throw new Error("Debe seleccionar una localidad");
    }
    
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razonSocial: configuracion.razonSocial,
        nombreFantasia: configuracion.nombreFantasia,
        cuit: configuracion.cuit,
        email: configuracion.email,
        telefono: configuracion.telefono,
        celular: configuracion.celular,
        direccion: configuracion.direccion,
        localidadId: configuracion.localidadId,
        observacionPieFactura: configuracion.observacionPieFactura,
        mostrarPreciosConIva: preferencias.mostrarPreciosConIva,
        abrirCajonEfectivo: preferencias.abrirCajonEfectivo,
        numerarPedidosPantalla: preferencias.numerarPedidosPantalla,
        imprimir: preferencias.ticketDigitalPorCorreo,
        // Stock y compras
        facturaDescuentaStock: configStock.facturaDescuentaStock,
        presupuestoDescuentaStock: configStock.presupuestoDescuentaStock,
        remitoDescuentaStock: configStock.remitoDescuentaStock,
        actualizaCostoDesdeCompra: configStock.actualizaCostoDesdeCompra,
        modificaPrecioVentaDesdeCompra: configStock.modificaPrecioVentaDesdeCompra,
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
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "No se pudo guardar la configuracion");
    }
  };

  const handleSavePerfil = async () => {
    setIsSavingAll(true);
    try {
      // Guardar perfil (tenant y configuración básica)
      await saveTenant();
      await saveConfiguracion();
      
      // Si hay cambios en preferencias básicas, guardarlas también
      if (hasPreferenciasChanges) {
        const result = await savePreferenciasVenta(preferencias);
        if (result.success) {
          setPreferenciasOriginales(preferencias);
        }
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
        const res = await fetch("/api/configuracion/preferencias", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notificaciones),
        });
        if (res.ok) {
          setNotificacionesOriginales(notificaciones);
        }
      }

      // Guardar seguridad si hay cambios
      if (hasSeguridadChanges) {
        const res = await fetch("/api/configuracion/seguridad", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seguridad),
        });
        if (res.ok) {
          setSeguridadOriginal(seguridad);
        }
      }

      // Guardar fiscal si hay cambios
      if (hasFiscalChanges) {
        const res = await fetch("/api/configuracion/fiscal", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regional),
        });
        if (res.ok) {
          setRegionalOriginal(regional);
        }
      }

      // Guardar branding si hay cambios
      if (hasBrandingChanges) {
        const formData = new FormData();
        formData.append("slogan", branding.slogan);
        formData.append("color", branding.color);
        if (branding.logo) {
          formData.append("logo", branding.logo);
        }
        const res = await fetch("/api/configuracion/branding", {
          method: "PUT",
          body: formData,
        });
        if (res.ok) {
          setBrandingOriginal({
            slogan: branding.slogan,
            color: branding.color,
            logoPreview: branding.logoPreview,
          });
          setBranding((prev) => ({ ...prev, logo: null }));
        }
      }
      
      addToast({
        title: "Configuración actualizada",
        description: "Todos los datos se guardaron correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error al guardar",
        description: "Revisa los datos e intenta nuevamente.",
        color: "danger",
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSaveNotificaciones = async () => {
    setIsSavingNotificaciones(true);
    try {
      const res = await fetch("/api/configuracion/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificaciones),
      });
      if (!res.ok) {
        throw new Error("No se pudieron guardar las notificaciones");
      }
      setNotificacionesOriginales(notificaciones);
      addToast({
        title: "Notificaciones guardadas",
        description: "Las preferencias de notificaciones se guardaron correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error al guardar",
        description: "No se pudieron guardar las notificaciones.",
        color: "danger",
      });
    } finally {
      setIsSavingNotificaciones(false);
    }
  };

  const handleSaveSeguridad = async () => {
    setIsSavingSeguridad(true);
    try {
      const res = await fetch("/api/configuracion/seguridad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seguridad),
      });
      if (!res.ok) {
        throw new Error("No se pudo guardar la configuración de seguridad");
      }
      setSeguridadOriginal(seguridad);
      addToast({
        title: "Seguridad actualizada",
        description: "La configuración de seguridad se guardó correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración de seguridad.",
        color: "danger",
      });
    } finally {
      setIsSavingSeguridad(false);
    }
  };

  const handleSaveFiscal = async () => {
    setIsSavingFiscal(true);
    try {
      const res = await fetch("/api/configuracion/fiscal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regional),
      });
      if (!res.ok) {
        throw new Error("No se pudo guardar la configuración fiscal");
      }
      setRegionalOriginal(regional);
      addToast({
        title: "Configuración fiscal guardada",
        description: "Los datos fiscales se guardaron correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración fiscal.",
        color: "danger",
      });
    } finally {
      setIsSavingFiscal(false);
    }
  };

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    try {
      const formData = new FormData();
      formData.append("slogan", branding.slogan);
      formData.append("color", branding.color);
      if (branding.logo) {
        formData.append("logo", branding.logo);
      }

      const res = await fetch("/api/configuracion/branding", {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("No se pudo guardar el branding");
      }
      setBrandingOriginal({
        slogan: branding.slogan,
        color: branding.color,
        logoPreview: branding.logoPreview,
      });
      setBranding((prev) => ({ ...prev, logo: null }));
      addToast({
        title: "Branding guardado",
        description: "La configuración de branding se guardó correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error al guardar",
        description: "No se pudo guardar el branding.",
        color: "danger",
      });
    } finally {
      setIsSavingBranding(false);
    }
  };

  const sectionsNav = [
    { id: "perfil", label: "Perfil del negocio" },
    { id: "ventas", label: "Preferencias de venta" },
    { id: "notificaciones", label: "Notificaciones" },
    { id: "seguridad", label: "Seguridad y acceso" },
    { id: "fiscal", label: "Facturacion y region" },
    { id: "branding", label: "Branding" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-800 to-[#90c472] text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative p-4 md:p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Chip variant="flat" color="success" className="bg-white/10">
                Panel de control
              </Chip>
              <h1 className="text-3xl md:text-[32px] font-bold">
                Configuración
              </h1>
              <p className="text-white max-w-3xl">
                Configuracion Ajustes rapidos de identidad, ventas y seguridad
                en un solo lugar. Los cambios aplican a todas las sucursales
                activas.
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
                  Modo offline: valores por defecto
                </Chip>
              )}
              <Button
                color="primary"
                className="bg-white text-slate-900"
                isLoading={isSavingAll}
                isDisabled={isLoadingTenant || isLoadingConfig || isOffline || !hasAnyChanges}
                onPress={handleSavePerfil}
              >
                Guardar todo
              </Button>
              <Button
                variant="bordered"
                className="border-white/40 text-white"
                onPress={() =>
                  addToast({
                    title: "Actividad",
                    description: "Historial de cambios disponible pronto.",
                  })
                }
              >
                Ver actividad
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
                  Automatico
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

      <main className="settings-single-column">
        <div
          className="settings-tab-bar"
          role="tablist"
          aria-label="Configuración"
        >
          {sectionsNav.map((section) => {
            const isActive = openSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setOpenSection(section.id as SectionKey)}
                className={`tab-pill ${isActive ? "active" : ""}`}
                role="tab"
                aria-selected={isActive}
              >
                <span className="tab-pill-label">{section.label}</span>
              </button>
            );
          })}
        </div>

        <div className="settings-content-pane space-y-3">
          <SectionPanel
            id="perfil"
            title="Perfil del negocio"
            description={descriptionMap.perfil}
            summary={summaryPerfil}
            isActive={openSection === "perfil"}
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

          <SectionPanel
            id="ventas"
            title="Preferencias de venta"
            description={descriptionMap.ventas}
            summary={summaryVentas}
            isActive={openSection === "ventas"}
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
                    isDisabled={isLoadingPreferencias || isOffline}
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
                    isDisabled={isLoadingPreferencias || isOffline}
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
                    isDisabled={isLoadingPreferencias || isOffline}
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
                    isDisabled={isLoadingPreferencias || isOffline}
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

          <SectionPanel
            id="notificaciones"
            title="Notificaciones"
            description={descriptionMap.notificaciones}
            summary={summaryNotificaciones}
            isActive={openSection === "notificaciones"}
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

          <SectionPanel
            id="seguridad"
            title="Seguridad y acceso"
            description={descriptionMap.seguridad}
            summary={summarySeguridad}
            isActive={openSection === "seguridad"}
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

          <SectionPanel
            id="fiscal"
            title="Facturacion y region"
            description={descriptionMap.fiscal}
            summary={summaryFiscal}
            isActive={openSection === "fiscal"}
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

          <SectionPanel
            id="branding"
            title="Branding"
            description={descriptionMap.branding}
            summary={summaryBranding}
            isActive={openSection === "branding"}
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
      </main>
    </div>
  );
}
