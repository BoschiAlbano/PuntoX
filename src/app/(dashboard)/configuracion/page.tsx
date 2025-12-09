"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/react";

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
  const [isSaving, setIsSaving] = useState(false);
  const [openSection, setOpenSection] = useState<SectionKey>("perfil");

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

  const [preferencias, setPreferencias] = useState({
    ticketDigital: true,
    mostrarPrecios: true,
    aperturaCaja: true,
    numerarPedidos: true,
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
  });

  const descriptionMap: Record<SectionKey, string> = {
    perfil: "Datos visibles en tickets y comunicaciones.",
    ventas: "Ajustes r\\u00e1pidos para cajas y mostrador.",
    notificaciones: "Define qu\\u00e9 alertas reciben los usuarios.",
    seguridad: "Protege el panel y controla dispositivos.",
    fiscal: "Moneda, idioma y datos fiscales para comprobantes.",
    branding: "Ajusta la imagen de tu negocio en el panel y tickets.",
  };

  const summaryPerfil = `${configuracion.razonSocial} | CUIT ${configuracion.cuit} | ${configuracion.localidadId}`;
  const summaryVentas = `Ticket digital: ${
    preferencias.ticketDigital ? "on" : "off"
  } | Impuestos: ${preferencias.mostrarPrecios ? "incluidos" : "excluidos"}`;
  const summaryNotificaciones = `Correo: ${
    notificaciones.email ? "on" : "off"
  } | Push: ${notificaciones.push ? "on" : "off"} | Resumen diario: ${
    notificaciones.resumenDiario ? "on" : "off"
  }`;
  const summarySeguridad = `2FA: ${
    seguridad.dobleFactor ? "activo" : "pendiente"
  } | Bloqueo: 10 min | Recordar sesi\u00f3n: 30 d\u00edas`;
  const summaryFiscal = `${regional.moneda} | ${
    idiomas.find((i) => i.value === regional.idioma)?.label || "Idioma"
  } | ${regional.tipoIva} | PV ${regional.puntoVenta}`;
  const summaryBranding = `Color: ${branding.color} | Logo: pendiente`;

  const handleSave = (seccion: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        title: "Cambios guardados",
        description: `${seccion} actualizada`,
        color: "success",
      });
    }, 500);
  };

  const sectionsNav = [
    { id: "perfil", label: "Perfil del negocio" },
    { id: "ventas", label: "Preferencias de venta" },
    { id: "notificaciones", label: "Notificaciones" },
    { id: "seguridad", label: "Seguridad y acceso" },
    { id: "fiscal", label: "Facturaci\u00f3n y regi\u00f3n" },
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
                Configuraci\u00f3n
              </h1>
              <p className="text-white max-w-3xl">
                Ajustes r\u00e1pidos de identidad, ventas y seguridad en un solo
                lugar. Los cambios aplican a todas las sucursales activas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                color="primary"
                className="bg-white text-slate-900"
                isLoading={isSaving}
                onPress={() => handleSave("Configuraci\u00f3n general")}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10 h-full flex flex-col justify-between">
              <p className="text-sm text-white/80">Plan activo</p>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="text-lg font-semibold leading-tight">
                  Business
                </span>
                <Chip size="sm" variant="flat" className="bg-white/20 text-white">
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
                <Chip size="sm" variant="flat" className="bg-white/20 text-white">
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

      <main className="settings-two-column-layout">
        <nav className="settings-nav-tabs">
          {sectionsNav.map((section) => {
            const isActive = openSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setOpenSection(section.id as SectionKey)}
                className={`nav-tab-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-tab-label">{section.label}</span>
              </button>
            );
          })}
        </nav>

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
                label="Nombre fiscal"
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
                label="Nombre de fantasia"
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
                label="Direccion"
                variant="bordered"
                className="md:col-span-2"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.direccion}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    direccion: e.target.value,
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
                label="Localidad"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                value={configuracion.localidadId}
                onChange={(e) =>
                  setConfiguracion((prev) => ({
                    ...prev,
                    localidadId: e.target.value,
                  }))
                }
              />
            </div>
            <Textarea
              label="Mensaje en ticket"
              placeholder="Ej: Gracias por elegirnos"
              minRows={3}
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={configuracion.observacionPieFactura}
              onChange={(e) =>
                setConfiguracion((prev) => ({
                  ...prev,
                  observacionPieFactura: e.target.value,
                }))
              }
            />
            <div className="flex justify-end">
              <Button
                color="primary"
                isLoading={isSaving}
                onPress={() => handleSave("Perfil del negocio")}
              >
                Guardar perfil
              </Button>
            </div>
          </SectionPanel>

          <SectionPanel
            id="ventas"
            title="Preferencias de venta"
            description={descriptionMap.ventas}
            summary={summaryVentas}
            isActive={openSection === "ventas"}
          >
            <div className="space-y-3">
              <Switch
                isSelected={preferencias.ticketDigital}
                onValueChange={(value) =>
                  setPreferencias((prev) => ({ ...prev, ticketDigital: value }))
                }
                className="px-1 py-1"
              >
                Enviar ticket digital por correo
              </Switch>
              <Switch
                isSelected={preferencias.mostrarPrecios}
                onValueChange={(value) =>
                  setPreferencias((prev) => ({ ...prev, mostrarPrecios: value }))
                }
                className="px-1 py-1"
              >
                Mostrar precios con impuestos incluidos
              </Switch>
              <Switch
                isSelected={preferencias.aperturaCaja}
                onValueChange={(value) =>
                  setPreferencias((prev) => ({ ...prev, aperturaCaja: value }))
                }
                className="px-1 py-1"
              >
                Abrir cajon al cobrar en efectivo
              </Switch>
              <Switch
                isSelected={preferencias.numerarPedidos}
                onValueChange={(value) =>
                  setPreferencias((prev) => ({ ...prev, numerarPedidos: value }))
                }
                className="px-1 py-1"
              >
                Numerar pedidos y mostrar en pantalla
              </Switch>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                color="primary"
                isLoading={isSaving}
                onPress={() => handleSave("Preferencias de venta")}
              >
                Aplicar preferencias
              </Button>
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
            <div className="pt-2 flex justify-end">
              <Button
                color="primary"
                isLoading={isSaving}
                onPress={() => handleSave("Notificaciones")}
              >
                Guardar alertas
              </Button>
            </div>
          </SectionPanel>

          <SectionPanel
            id="seguridad"
            title="Seguridad y acceso"
            description={descriptionMap.seguridad}
            summary={summarySeguridad}
            isActive={openSection === "seguridad"}
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
                Avisar inicio de sesi\u00f3n desde nuevos dispositivos
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
                Recordar sesi\u00f3n por 30 d\u00edas en dispositivos confiables
              </Switch>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 justify-end">
              <Button
                color="primary"
                isLoading={isSaving}
                onPress={() => handleSave("Seguridad")}
              >
                Actualizar seguridad
              </Button>
              <Button
                variant="bordered"
                color="danger"
                className="border-danger"
                onPress={() => handleSave("Sesiones cerradas")}
              >
                Cerrar todas las sesiones
              </Button>
            </div>
          </SectionPanel>

          <SectionPanel
            id="fiscal"
            title="Facturaci\u00f3n y regi\u00f3n"
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
                    setRegional((prev) => ({ ...prev, tipoIva: e.target.value }))
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
              <div className="flex justify-end">
                <Button
                  color="primary"
                  isLoading={isSaving}
                  onPress={() => handleSave("Facturaci\u00f3n y regi\u00f3n")}
                >
                  Guardar configuraci\u00f3n fiscal
                </Button>
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
            <div className="flex justify-end">
              <Button
                color="primary"
                isLoading={isSaving}
                onPress={() => handleSave("Branding")}
              >
                Guardar branding
              </Button>
            </div>
          </SectionPanel>
        </div>
      </main>
    </div>
  );
}











