"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/react";

// Types
type PerfilNegocioDTO = {
  existsConfiguracion: boolean;
  nombre: string;
  razonSocial: string;
  correo: string;
  telefono: string;
  dominio: string;
  cuit: string;
};

type PreferenciasVentaDTO = {
  existsConfiguracion: boolean;
  imprimir: boolean;
  unificarRenglonesProducto: boolean;
  tipoFormaPagoDefault: number;
  facturaDescuentaStock: boolean;
  presupuestoDescuentaStock: boolean;
  remitoDescuentaStock: boolean;
  ingresoManualCajaInicial: boolean;
  puestoCajaSeparado: boolean;
  activarRetiroDeCaja: boolean;
  montoMaximoRetiroCaja: number;
  activarBascula: boolean;
  etiquetaPorPeso: boolean;
  codigoBascula: string | null;
  mostrarPreciosConIva: boolean;
  abrirCajonEfectivo: boolean;
  numerarPedidosPantalla: boolean;
};

// API functions
async function fetchPerfilNegocio(): Promise<PerfilNegocioDTO> {
  const res = await fetch("/api/admin/configuracion/perfil");
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Error al cargar perfil");
  }
  return res.json();
}

async function savePerfilNegocio(data: {
  nombre: string;
  razonSocial: string;
  correo: string;
  telefono: string;
  dominio: string;
  cuit: string;
}): Promise<PerfilNegocioDTO> {
  const res = await fetch("/api/admin/configuracion/perfil", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Error al guardar perfil");
  }
  return res.json();
}

async function fetchPreferenciasVenta(): Promise<PreferenciasVentaDTO> {
  const res = await fetch("/api/admin/configuracion/preferencias-venta");
  if (!res.ok) {
    const error = await res.json();
    if (error.code === "CONFIG_MISSING") {
      // Retornar objeto con existsConfiguracion: false
      return {
        existsConfiguracion: false,
        imprimir: false,
        unificarRenglonesProducto: true,
        tipoFormaPagoDefault: 0,
        facturaDescuentaStock: true,
        presupuestoDescuentaStock: false,
        remitoDescuentaStock: true,
        ingresoManualCajaInicial: false,
        puestoCajaSeparado: false,
        activarRetiroDeCaja: false,
        montoMaximoRetiroCaja: 0,
        activarBascula: false,
        etiquetaPorPeso: false,
        codigoBascula: null,
        mostrarPreciosConIva: true,
        abrirCajonEfectivo: true,
        numerarPedidosPantalla: true,
      };
    }
    throw new Error(error.error || "Error al cargar preferencias");
  }
  return res.json();
}

async function savePreferenciasVenta(
  data: Omit<PreferenciasVentaDTO, "existsConfiguracion">
): Promise<PreferenciasVentaDTO> {
  const res = await fetch("/api/admin/configuracion/preferencias-venta", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Error al guardar preferencias");
  }
  return res.json();
}

type SectionKey =
  | "perfil"
  | "ventas"
  | "notificaciones"
  | "seguridad"
  | "fiscal"
  | "branding"
  | "usuarios";

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

function AccordionSection({
  id,
  title,
  description,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  id: SectionKey;
  title: string;
  description: string;
  summary: string;
  isOpen: boolean;
  onToggle: (id: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <Card shadow="sm" className="rounded-2xl border border-slate-200">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full text-left focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      >
        <CardHeader className="flex justify-between items-start gap-3 p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <Chip size="sm" variant="flat" className="bg-slate-100">
                {isOpen ? "Editando" : "Resumido"}
              </Chip>
            </div>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-sm text-gray-700 line-clamp-2">{summary}</p>
          </div>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white transition-transform ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            <svg
              className="w-4 h-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </CardHeader>
      </button>
      {isOpen ? (
        <>
          <Divider />
          <CardBody className="p-3 space-y-4">{children}</CardBody>
        </>
      ) : null}
    </Card>
  );
}

export default function AdminConfiguracionPage() {
  const queryClient = useQueryClient();
  const [openSection, setOpenSection] = useState<SectionKey | "">("perfil");
  
  // TanStack Query hooks
  const {
    data: perfilData,
    isLoading: isLoadingPerfil,
    error: errorPerfil,
  } = useQuery({
    queryKey: ["perfil-negocio"],
    queryFn: fetchPerfilNegocio,
  });

  const {
    data: preferenciasData,
    isLoading: isLoadingPreferencias,
    error: errorPreferencias,
  } = useQuery({
    queryKey: ["preferencias-venta"],
    queryFn: fetchPreferenciasVenta,
  });

  // Mutations (sin toasts aquí, se manejan en handleSaveAll)
  // Los datos se actualizan en el cache, lo que automáticamente actualiza perfilData y preferenciasData
  // y los useEffect sincronizan los estados locales, marcando como limpio
  const mutationPerfil = useMutation({
    mutationFn: savePerfilNegocio,
    onSuccess: (data) => {
      queryClient.setQueryData(["perfil-negocio"], data);
      // Los estados locales se sincronizarán automáticamente vía useEffect
    },
  });

  const mutationPreferencias = useMutation({
    mutationFn: savePreferenciasVenta,
    onSuccess: (data) => {
      queryClient.setQueryData(["preferencias-venta"], data);
      // Los estados locales se sincronizarán automáticamente vía useEffect
    },
  });

  // Estados locales para edición
  const [perfil, setPerfil] = useState({
    nombre: "",
    razonSocial: "",
    correo: "",
    telefono: "",
    dominio: "",
    cuit: "",
  });

  const [preferencias, setPreferencias] = useState<PreferenciasVentaDTO | null>(null);

  // Sincronizar estados locales con datos de query
  useEffect(() => {
    if (perfilData) {
      setPerfil({
        nombre: perfilData.nombre,
        razonSocial: perfilData.razonSocial,
        correo: perfilData.correo,
        telefono: perfilData.telefono,
        dominio: perfilData.dominio,
        cuit: perfilData.cuit,
      });
    }
  }, [perfilData]);

  useEffect(() => {
    if (preferenciasData) {
      setPreferencias(preferenciasData);
    }
  }, [preferenciasData]);

  const [regional, setRegional] = useState({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "Responsable Inscripto",
    puntoVenta: "0001",
    inicioActividades: "",
  });
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: true,
    resumenDiario: false,
    stockBajo: true,
  });
  const [seguridad, setSeguridad] = useState({
    dobleFactor: false,
    bloqueoAutomatico: true,
    recordarSesion: true,
    alertarDispositivo: true,
  });
  const [branding, setBranding] = useState({
    slogan: "Mejor precio, mejor servicio.",
    color: "#90c472",
    logo: null as File | null,
    logoPreview: "",
  });

  useEffect(() => {
    if (!branding.logo) {
      setBranding((prev) => ({ ...prev, logoPreview: "" }));
    }
  }, [branding.logo]);

  // Dirty state por tab
  const dirtyPerfil = useMemo(() => {
    if (!perfilData) return false;
    return (
      perfil.nombre !== perfilData.nombre ||
      perfil.razonSocial !== perfilData.razonSocial ||
      perfil.correo !== perfilData.correo ||
      perfil.telefono !== perfilData.telefono ||
      perfil.dominio !== perfilData.dominio ||
      perfil.cuit !== perfilData.cuit
    );
  }, [perfil, perfilData]);

  const dirtyVentas = useMemo(() => {
    if (!preferencias || !preferenciasData) return false;
    return JSON.stringify(preferencias) !== JSON.stringify(preferenciasData);
  }, [preferencias, preferenciasData]);

  const hasAnyChanges = dirtyPerfil || dirtyVentas;
  const isLoading = isLoadingPerfil || isLoadingPreferencias;
  const isSaving = mutationPerfil.isPending || mutationPreferencias.isPending;

  const handleLogoChange = (file: File | null) => {
    if (!file) {
      setBranding((prev) => ({ ...prev, logo: null, logoPreview: "" }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setBranding((prev) => ({ ...prev, logo: file, logoPreview: previewUrl }));
  };

  const handleSaveAll = async () => {
    const tasks: Array<{ name: string; promise: Promise<any> }> = [];

    // Guardar Perfil del negocio si hay cambios
    if (dirtyPerfil) {
      tasks.push({
        name: "Perfil del negocio",
        promise: mutationPerfil.mutateAsync({
          nombre: perfil.nombre,
          razonSocial: perfil.razonSocial,
          correo: perfil.correo,
          telefono: perfil.telefono,
          dominio: perfil.dominio,
          cuit: perfil.cuit,
        }),
      });
    }

    // Guardar Preferencias de venta si hay cambios
    if (dirtyVentas && preferencias) {
      const { existsConfiguracion, ...preferenciasData } = preferencias;
      tasks.push({
        name: "Preferencias de venta",
        promise: mutationPreferencias.mutateAsync(preferenciasData),
      });
    }

    if (tasks.length === 0) return;

    // Ejecutar todas las mutations en paralelo con Promise.allSettled
    const results = await Promise.allSettled(tasks.map((t) => t.promise));

    const successes: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      const taskName = tasks[index].name;
      if (result.status === "fulfilled") {
        successes.push(taskName);
      } else {
        const errorMessage =
          result.reason?.message || `No se pudo guardar ${taskName}`;
        errors.push(`${taskName}: ${errorMessage}`);
      }
    });

    // Mostrar toasts de resultados parciales
    if (successes.length > 0) {
      addToast({
        title: "Cambios guardados",
        description: `${successes.join(", ")} actualizado${successes.length > 1 ? "s" : ""}`,
        color: "success",
      });
    }

    if (errors.length > 0) {
      errors.forEach((error) => {
        addToast({
          title: "Error",
          description: error,
          color: "danger",
        });
      });
    }
  };

  const toggleSection = (id: SectionKey) => {
    setOpenSection((prev) => (prev === id ? "" : id));
  };

  const summaryPerfil = useMemo(() => {
    if (!perfilData) return "Cargando...";
    return `${perfilData.nombre || "Sin nombre"} | CUIT ${perfilData.cuit || "Sin CUIT"}`;
  }, [perfilData]);

  const summaryVentas = useMemo(() => {
    if (!preferenciasData) return "Cargando...";
    return `Imprimir: ${preferenciasData.imprimir ? "sí" : "no"} | IVA: ${preferenciasData.mostrarPreciosConIva ? "incluido" : "excluido"} | Stock: ${preferenciasData.facturaDescuentaStock ? "descuenta" : "no descuenta"}`;
  }, [preferenciasData]);
  const summaryNotificaciones = `Correo: ${
    notificaciones.email ? "activado" : "desactivado"
  } | Push app: ${notificaciones.push ? "activado" : "desactivado"} | Resumen diario: ${
    notificaciones.resumenDiario ? "activado" : "desactivado"
  }`;
  const summarySeguridad = `2FA: ${
    seguridad.dobleFactor ? "activo" : "pendiente"
  } | Bloqueo: 10 min | Recordar sesion: 30 dias`;
  const summaryFiscal = `${regional.moneda} | ${
    idiomas.find((i) => i.value === regional.idioma)?.label || "Idioma"
  } | ${regional.tipoIva} | Punto de venta ${regional.puntoVenta}`;
  const summaryBranding = `Logo: ${
    branding.logo ? "cargado" : "no cargado"
  } | Color principal: ${branding.color}`;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-800 to-[#90c472] text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative p-4 md:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Chip variant="flat" color="success" className="bg-white/10">
                Panel de control
              </Chip>
              <h1 className="text-3xl md:text-[32px] font-bold">
                Configuracion
              </h1>
              <p className="text-white/70 max-w-3xl">
                Ajusta la identidad del negocio, preferencias de venta y
                seguridad desde un solo lugar. Los cambios afectan a todas las
                sucursales activas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {hasAnyChanges && (
                <Chip size="sm" variant="flat" color="warning" className="bg-yellow-100 text-yellow-800">
                  Cambios sin guardar
                </Chip>
              )}
              <Button
                color="primary"
                className="bg-white text-slate-900"
                isLoading={isSaving}
                isDisabled={!hasAnyChanges}
                onPress={handleSaveAll}
              >
                Guardar todo
              </Button>
              <Button
                variant="bordered"
                className="border-white/40 text-white"
                onPress={() => handleSave("Actividad revisada")}
              >
                Ver actividad
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto space-y-4 pb-10">
        <AccordionSection
          id="perfil"
          title="🏢 Perfil del negocio"
          description="Datos visibles en tickets y comunicaciones."
          summary={summaryPerfil}
          isOpen={openSection === "perfil"}
          onToggle={toggleSection}
        >
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={perfil.nombre}
                onChange={(e) =>
                  setPerfil((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Nombre del negocio"
              />
              <Input
                label="Dominio"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={perfil.dominio}
                onChange={(e) =>
                  setPerfil((prev) => ({ ...prev, dominio: e.target.value }))
                }
                placeholder="dominio.com"
              />
              <Input
                label="Razón social"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={perfil.razonSocial}
                onChange={(e) =>
                  setPerfil((prev) => ({ ...prev, razonSocial: e.target.value }))
                }
                placeholder="Razón social fiscal"
              />
              <Input
                label="CUIT"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={perfil.cuit}
                onChange={(e) =>
                  setPerfil((prev) => ({ ...prev, cuit: e.target.value }))
                }
                placeholder="20-12345678-9"
              />
              <Input
                label="Correo"
                type="email"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={perfil.correo}
                onChange={(e) =>
                  setPerfil((prev) => ({ ...prev, correo: e.target.value }))
                }
                placeholder="correo@ejemplo.com"
              />
              <Input
                label="Teléfono"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={perfil.telefono}
                onChange={(e) =>
                  setPerfil((prev) => ({ ...prev, telefono: e.target.value }))
                }
                placeholder="+54 11 5555 0000"
              />
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          id="ventas"
          title="🛒 Preferencias de venta"
          description="Ajustes rapidos para cajas y mostrador."
          summary={summaryVentas}
          isOpen={openSection === "ventas"}
          onToggle={toggleSection}
        >
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Cargando...</div>
          ) : !preferencias?.existsConfiguracion ? (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Chip color="warning" variant="flat" className="bg-yellow-100 text-yellow-800 mb-2">
                Configuración requerida
              </Chip>
              <p className="text-sm text-gray-700">
                Para habilitar las preferencias de venta, primero debes completar el{" "}
                <button
                  type="button"
                  onClick={() => setOpenSection("perfil")}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Perfil del negocio
                </button>{" "}
                o la sección de{" "}
                <button
                  type="button"
                  onClick={() => setOpenSection("fiscal")}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Facturación
                </button>
                .
              </p>
            </div>
          ) : preferencias ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Caja y Ticket</h4>
                <Switch
                  isSelected={preferencias.imprimir}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, imprimir: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Imprimir ticket automáticamente"
                >
                  Imprimir ticket automáticamente
                </Switch>
                <Switch
                  isSelected={preferencias.abrirCajonEfectivo}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, abrirCajonEfectivo: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Abrir cajón al cobrar en efectivo"
                >
                  Abrir cajón al cobrar en efectivo
                </Switch>
                <Switch
                  isSelected={preferencias.numerarPedidosPantalla}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, numerarPedidosPantalla: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Numerar pedidos y mostrar en pantalla"
                >
                  Numerar pedidos y mostrar en pantalla
                </Switch>
                <Switch
                  isSelected={preferencias.unificarRenglonesProducto}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, unificarRenglonesProducto: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Unificar renglones del mismo producto"
                >
                  Unificar renglones del mismo producto
                </Switch>
              </div>
              <Divider />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Precios</h4>
                <Switch
                  isSelected={preferencias.mostrarPreciosConIva}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, mostrarPreciosConIva: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Mostrar precios con IVA incluido"
                >
                  Mostrar precios con impuestos incluidos
                </Switch>
              </div>
              <Divider />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Stock</h4>
                <Switch
                  isSelected={preferencias.facturaDescuentaStock}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, facturaDescuentaStock: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Factura descuenta stock"
                >
                  Factura descuenta stock
                </Switch>
                <Switch
                  isSelected={preferencias.presupuestoDescuentaStock}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, presupuestoDescuentaStock: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Presupuesto descuenta stock"
                >
                  Presupuesto descuenta stock
                </Switch>
                <Switch
                  isSelected={preferencias.remitoDescuentaStock}
                  onValueChange={(value) =>
                    setPreferencias((prev) => prev ? { ...prev, remitoDescuentaStock: value } : null)
                  }
                  className="px-1 py-1"
                  aria-label="Remito descuenta stock"
                >
                  Remito descuenta stock
                </Switch>
              </div>
              <Divider />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Forma de pago</h4>
                <Select
                  label="Forma de pago por defecto"
                  selectedKeys={[preferencias.tipoFormaPagoDefault.toString()]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setPreferencias((prev) => prev ? { ...prev, tipoFormaPagoDefault: parseInt(value) || 0 } : null);
                  }}
                  aria-label="Forma de pago por defecto"
                >
                  <SelectItem key="0">Efectivo</SelectItem>
                  <SelectItem key="1">Débito</SelectItem>
                  <SelectItem key="2">Crédito</SelectItem>
                  <SelectItem key="3">QR</SelectItem>
                </Select>
              </div>
            </div>
          ) : null}
        </AccordionSection>

        <AccordionSection
          id="notificaciones"
          title="🔔 Notificaciones"
          description="Define que alertas reciben los usuarios."
          summary={summaryNotificaciones}
          isOpen={openSection === "notificaciones"}
          onToggle={toggleSection}
        >
          <div className="space-y-3">
            <Switch
              isSelected={notificaciones.email}
              onValueChange={(value) =>
                setNotificaciones((prev) => ({ ...prev, email: value }))
              }
            >
              Enviar alertas por correo
            </Switch>
            <Switch
              isSelected={notificaciones.push}
              onValueChange={(value) =>
                setNotificaciones((prev) => ({ ...prev, push: value }))
              }
            >
              Notificaciones push en la app
            </Switch>
            <Switch
              isSelected={notificaciones.stockBajo}
              onValueChange={(value) =>
                setNotificaciones((prev) => ({ ...prev, stockBajo: value }))
              }
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
            >
              Enviar resumen diario a las 20:00
            </Switch>
          </div>
        </AccordionSection>

        <AccordionSection
          id="seguridad"
          title="🔐 Seguridad y acceso"
          description="Protege el panel y controla dispositivos."
          summary={summarySeguridad}
          isOpen={openSection === "seguridad"}
          onToggle={toggleSection}
        >
          <div className="space-y-3">
            <Switch
              isSelected={seguridad.dobleFactor}
              onValueChange={(value) =>
                setSeguridad((prev) => ({ ...prev, dobleFactor: value }))
              }
            >
              Habilitar doble factor para usuarios
            </Switch>
            <Switch
              isSelected={seguridad.alertarDispositivo}
              onValueChange={(value) =>
                setSeguridad((prev) => ({
                  ...prev,
                  alertarDispositivo: value,
                }))
              }
            >
              Avisar inicio de sesion desde nuevos dispositivos
            </Switch>
            <Switch
              isSelected={seguridad.bloqueoAutomatico}
              onValueChange={(value) =>
                setSeguridad((prev) => ({ ...prev, bloqueoAutomatico: value }))
              }
            >
              Bloquear dashboard despues de 10 minutos
            </Switch>
            <Switch
              isSelected={seguridad.recordarSesion}
              onValueChange={(value) =>
                setSeguridad((prev) => ({ ...prev, recordarSesion: value }))
              }
            >
              Recordar sesion por 30 dias en dispositivos confiables
            </Switch>
          </div>
        </AccordionSection>

        <AccordionSection
          id="fiscal"
          title="🧾 Facturacion y region"
          description="Moneda, idioma y datos fiscales para comprobantes."
          summary={summaryFiscal}
          isOpen={openSection === "fiscal"}
          onToggle={toggleSection}
        >
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
                setRegional((prev) => ({ ...prev, tipoIva: e.target.value }))
              }
            />
            <Input
              label="Punto de venta"
              value={regional.puntoVenta}
              onChange={(e) =>
                setRegional((prev) => ({ ...prev, puntoVenta: e.target.value }))
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
        </AccordionSection>

        <AccordionSection
          id="branding"
          title="🎨 Branding"
          description="Ajusta la imagen de tu negocio en el panel y tickets."
          summary={summaryBranding}
          isOpen={openSection === "branding"}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-3">
              <Input
                type="file"
                label="Logo"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
              />
              {branding.logoPreview ? (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-white">
                    <img
                      src={branding.logoPreview}
                      alt="Logo preview"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {branding.logo?.name || "Logo cargado"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay logo cargado.</p>
              )}
            </div>
            <div className="space-y-3">
              <Input
                type="color"
                label="Color principal"
                variant="bordered"
                classNames={{
                  inputWrapper: "bg-white border-slate-200 h-12",
                }}
                value={branding.color}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, color: e.target.value }))
                }
              />
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
          </div>
        </AccordionSection>

        <AccordionSection
          id="usuarios"
          title="Usuarios y roles"
          description="Administra accesos del equipo."
          summary="Proximamente"
          isOpen={openSection === "usuarios"}
          onToggle={toggleSection}
        >
          <div className="text-sm text-gray-600">
            Proximamente: gestion de usuarios, roles y permisos.
          </div>
          <div className="flex justify-end">
            <Button variant="flat" color="default" isDisabled>
              Disponible pronto
            </Button>
          </div>
        </AccordionSection>
      </main>
    </div>
  );
}
