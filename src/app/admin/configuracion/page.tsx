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
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import {
  getPerfilNegocio,
  savePerfilNegocio,
  type PerfilNegocioDTO,
} from "./actions-perfil-negocio";
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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [openSection, setOpenSection] = useState<SectionKey | "">("perfil");
  
  // Estados para Perfil del negocio
  const [perfil, setPerfil] = useState({
    nombre: "",
    razonSocial: "",
    correo: "",
    telefono: "",
    dominio: "",
    cuit: "",
  });
  const [perfilOriginal, setPerfilOriginal] = useState<PerfilNegocioDTO | null>(null);
  
  // Estados para Preferencias de venta
  const [preferencias, setPreferencias] = useState<PreferenciasVentaDTO | null>(null);
  const [preferenciasOriginal, setPreferenciasOriginal] = useState<PreferenciasVentaDTO | null>(null);
  const [regional, setRegional] = useState({
    moneda: "ARS",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    idioma: "es-AR",
    tipoIva: "Responsable Inscripto",
    puntoVenta: "0001",
    inicioActividades: "",
  });
  // Estados para otros tabs (mantener por ahora)
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

  // Cargar datos al montar
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Cargar Perfil del negocio
        const perfilData = await getPerfilNegocio();
        setPerfil({
          nombre: perfilData.nombre,
          razonSocial: perfilData.razonSocial,
          correo: perfilData.correo,
          telefono: perfilData.telefono,
          dominio: perfilData.dominio,
          cuit: perfilData.cuit,
        });
        setPerfilOriginal(perfilData);

        // Cargar Preferencias de venta
        const ventasData = await getPreferenciasVenta();
        setPreferencias(ventasData);
        setPreferenciasOriginal(ventasData);
      } catch (error: any) {
        console.error("Error cargando datos:", error);
        addToast({
          title: "Error",
          description: error?.message || "No se pudieron cargar los datos",
          color: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!branding.logo) {
      setBranding((prev) => ({ ...prev, logoPreview: "" }));
    }
  }, [branding.logo]);

  // Dirty state por tab
  const dirtyPerfil = useMemo(() => {
    if (!perfilOriginal) return false;
    return (
      perfil.nombre !== perfilOriginal.nombre ||
      perfil.razonSocial !== perfilOriginal.razonSocial ||
      perfil.correo !== perfilOriginal.correo ||
      perfil.telefono !== perfilOriginal.telefono ||
      perfil.dominio !== perfilOriginal.dominio ||
      perfil.cuit !== perfilOriginal.cuit
    );
  }, [perfil, perfilOriginal]);

  const dirtyVentas = useMemo(() => {
    if (!preferencias || !preferenciasOriginal) return false;
    return JSON.stringify(preferencias) !== JSON.stringify(preferenciasOriginal);
  }, [preferencias, preferenciasOriginal]);

  const hasAnyChanges = dirtyPerfil || dirtyVentas;

  const handleLogoChange = (file: File | null) => {
    if (!file) {
      setBranding((prev) => ({ ...prev, logo: null, logoPreview: "" }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setBranding((prev) => ({ ...prev, logo: file, logoPreview: previewUrl }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const errors: string[] = [];
    const successes: string[] = [];

    try {
      // Guardar Perfil del negocio si hay cambios
      if (dirtyPerfil) {
        const result = await savePerfilNegocio({
          nombre: perfil.nombre,
          razonSocial: perfil.razonSocial,
          correo: perfil.correo,
          telefono: perfil.telefono,
          dominio: perfil.dominio,
          cuit: perfil.cuit,
        });
        if (result.success) {
          successes.push("Perfil del negocio");
          // Recargar perfil para actualizar original
          const perfilData = await getPerfilNegocio();
          setPerfilOriginal(perfilData);
          setPerfil({
            nombre: perfilData.nombre,
            razonSocial: perfilData.razonSocial,
            correo: perfilData.correo,
            telefono: perfilData.telefono,
            dominio: perfilData.dominio,
            cuit: perfilData.cuit,
          });
        } else {
          errors.push(`Perfil del negocio: ${result.error}`);
        }
      }

      // Guardar Preferencias de venta si hay cambios
      if (dirtyVentas && preferencias) {
        const result = await savePreferenciasVenta(preferencias);
        if (result.success) {
          successes.push("Preferencias de venta");
          // Recargar preferencias para actualizar original
          const ventasData = await getPreferenciasVenta();
          setPreferenciasOriginal(ventasData);
          setPreferencias(ventasData);
        } else {
          if (result.code === "CONFIG_MISSING") {
            errors.push("Preferencias de venta: Completa primero el Perfil del negocio");
          } else {
            errors.push(`Preferencias de venta: ${result.error}`);
          }
        }
      }

      // Mostrar toasts
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
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error?.message || "No se pudieron guardar los cambios",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (id: SectionKey) => {
    setOpenSection((prev) => (prev === id ? "" : id));
  };

  const summaryPerfil = `${perfil.nombre || "Sin nombre"} | CUIT ${perfil.cuit || "Sin CUIT"}`;
  const summaryVentas = preferencias
    ? `Imprimir: ${preferencias.imprimir ? "sí" : "no"} | IVA: ${preferencias.mostrarPreciosConIva ? "incluido" : "excluido"} | Stock: ${preferencias.facturaDescuentaStock ? "descuenta" : "no descuenta"}`
    : "Cargando...";
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
            <div className="space-y-3">
              <Chip color="warning" variant="flat" className="bg-yellow-100 text-yellow-800">
                Completa primero el Perfil del negocio para habilitar estas preferencias
              </Chip>
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
