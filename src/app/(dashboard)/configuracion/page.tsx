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
    razonSocial: "Punto X Market",
    nombreFantasia: "PX Liniers",
    cuit: "20-12345678-9",
    email: "admin@puntox.com",
    telefono: "+54 11 5555 0000",
    direccion: "Av. Siempre Viva 742",
    localidadId: "Buenos Aires, CABA",
    observacionPieFactura: "Gracias por tu compra. Vuelve pronto.",
  });

  const [regional, setRegional] = useState({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "Responsable Inscripto",
    puntoVenta: "0001",
    inicioActividades: "",
  });

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

  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: true,
    resumenDiario: false,
    stockBajo: true,
  });

  const [seguridad, setSeguridad] = useState({
    dobleFactor: false,
    alertarNuevoDispositivo: true,
    bloquearPorInactividad: true,
    bloquearTrasIntentos: "5", // "nunca" | "5" | "10"
    recordarSesion30Dias: true,
  });

  const [branding, setBranding] = useState({
    slogan: "Mejor precio, mejor servicio.",
    color: "#90c472",
  });

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
          } else {
            // Otros errores (404, 500, etc.)
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
            direccion: json.configuracion.direccion ?? prev.direccion,
            observacionPieFactura:
              json.configuracion.observacionPieFactura ??
              prev.observacionPieFactura,
          }));
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

    loadTenant();
    loadConfig();
    loadPreferenciasVenta();
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
      const result = await savePreferenciasVenta(preferencias);
      if (result.success) {
        setPreferenciasOriginales(preferencias);
        addToast({
          title: "Preferencias guardadas",
          description: "Las preferencias de venta se guardaron correctamente.",
          color: "success",
        });
      } else {
        addToast({
          title: "Error al guardar",
          description: result.error || "No se pudieron guardar las preferencias.",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error guardando preferencias de venta:", error);
      addToast({
        title: "Error al guardar",
        description: "Ocurrió un error inesperado al guardar las preferencias.",
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
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razonSocial: configuracion.razonSocial,
        nombreFantasia: configuracion.nombreFantasia,
        cuit: configuracion.cuit,
        email: configuracion.email,
        telefono: configuracion.telefono,
        direccion: configuracion.direccion,
        observacionPieFactura: configuracion.observacionPieFactura,
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
      await saveTenant();
      await saveConfiguracion();
      addToast({
        title: "Perfil actualizado",
        description: "Datos guardados correctamente.",
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
                isDisabled={isLoadingTenant || isLoadingConfig || isOffline}
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
                value={tenant.razonSocial ?? ""}
                onChange={(e) =>
                  setTenant((prev) => ({
                    ...prev,
                    razonSocial: e.target.value,
                  }))
                }
              />
              <Input
                label="Correo"
                type="email"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={tenant.email ?? ""}
                onChange={(e) =>
                  setTenant((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              <Input
                label="Telefono"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={tenant.telefono ?? ""}
                onChange={(e) =>
                  setTenant((prev) => ({
                    ...prev,
                    telefono: e.target.value,
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
                value={tenant.cuit ?? ""}
                onChange={(e) =>
                  setTenant((prev) => ({ ...prev, cuit: e.target.value }))
                }
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
            <div className="space-y-4">
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
              <div className="space-y-3">
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
              </div>
              {hasPreferenciasChanges && (
                <div className="flex justify-end pt-2">
                  <Button
                    color="primary"
                    onPress={handleSavePreferenciasVenta}
                    isLoading={isSavingPreferencias}
                    isDisabled={isOffline}
                  >
                    Guardar cambios
                  </Button>
                </div>
              )}
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
                        // TODO: Implementar guardado en API cuando esté disponible
                        // await fetch('/api/configuracion/seguridad', { method: 'PATCH', body: JSON.stringify({ dobleFactor: value }) })
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
                        // TODO: Implementar guardado en API cuando esté disponible
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
                        // TODO: Implementar guardado en API cuando esté disponible
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
                          bloquearTrasIntentos: e.target.value,
                        }));
                        // TODO: Implementar guardado en API cuando esté disponible
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
                        // TODO: Implementar guardado en API cuando esté disponible
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
          </SectionPanel>

          <SectionPanel
            id="branding"
            title="Branding"
            description={descriptionMap.branding}
            summary={summaryBranding}
            isActive={openSection === "branding"}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="file"
                label="Logo"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
              />
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
              <Input
                label="Slogan del negocio"
                variant="bordered"
                className="md:col-span-2"
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
      </main>
    </div>
  );
}
