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
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/react";

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
  const [openSection, setOpenSection] = useState<SectionKey | "">("perfil");
  const [perfil, setPerfil] = useState({
    negocio: "Punto X Market",
    fantasia: "PX Liniers",
    email: "admin@puntox.com",
    telefono: "+54 11 5555 0000",
    direccion: "Av. Siempre Viva 742",
    mensajeTicket: "Gracias por tu compra. Vuelve pronto.",
    cuit: "20-12345678-9",
    condicionIva: "Responsable Inscripto",
    provincia: "Buenos Aires, CABA",
    sitio: "https://puntox.com",
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
    logo: null as File | null,
    logoPreview: "",
  });

  useEffect(() => {
    if (!branding.logo) {
      setBranding((prev) => ({ ...prev, logoPreview: "" }));
    }
  }, [branding.logo]);

  const handleLogoChange = (file: File | null) => {
    if (!file) {
      setBranding((prev) => ({ ...prev, logo: null, logoPreview: "" }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setBranding((prev) => ({ ...prev, logo: file, logoPreview: previewUrl }));
  };

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

  const toggleSection = (id: SectionKey) => {
    setOpenSection((prev) => (prev === id ? "" : id));
  };

  const summaryPerfil = `${perfil.negocio} | CUIT ${perfil.cuit} | ${perfil.provincia}`;
  const summaryVentas = `Ticket digital: ${
    preferencias.ticketDigital ? "activado" : "desactivado"
  } | Precios con impuestos: ${
    preferencias.mostrarPrecios ? "activado" : "desactivado"
  }`;
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
              <Button
                color="primary"
                className="bg-white text-slate-900"
                isLoading={isSaving}
                onPress={() => handleSave("Configuracion general")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre fiscal"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.negocio}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, negocio: e.target.value }))
              }
            />
            <Input
              label="Nombre de fantasia"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.fantasia}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, fantasia: e.target.value }))
              }
            />
            <Input
              label="Correo"
              type="email"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.email}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <Input
              label="Telefono"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.telefono}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, telefono: e.target.value }))
              }
            />
            <Input
              label="Direccion"
              variant="bordered"
              className="md:col-span-2"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.direccion}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, direccion: e.target.value }))
              }
            />
            <Input
              label="CUIT"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.cuit}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, cuit: e.target.value }))
              }
            />
            <Input
              label="Condicion IVA"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.condicionIva}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, condicionIva: e.target.value }))
              }
            />
            <Input
              label="Provincia / Localidad"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.provincia}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, provincia: e.target.value }))
              }
            />
            <Input
              label="Sitio web"
              variant="bordered"
              classNames={{ inputWrapper: "bg-white border-slate-200" }}
              value={perfil.sitio}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, sitio: e.target.value }))
              }
            />
          </div>
          <Textarea
            label="Mensaje en ticket"
            placeholder="Ej: Gracias por elegirnos"
            minRows={3}
            variant="bordered"
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
            value={perfil.mensajeTicket}
            onChange={(e) =>
              setPerfil((prev) => ({ ...prev, mensajeTicket: e.target.value }))
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
        </AccordionSection>

        <AccordionSection
          id="ventas"
          title="🛒 Preferencias de venta"
          description="Ajustes rapidos para cajas y mostrador."
          summary={summaryVentas}
          isOpen={openSection === "ventas"}
          onToggle={toggleSection}
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
          <div className="pt-2 flex justify-end">
            <Button
              color="primary"
              isLoading={isSaving}
              onPress={() => handleSave("Notificaciones")}
            >
              Guardar alertas
            </Button>
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
          <div className="flex justify-end">
            <Button
              color="primary"
              isLoading={isSaving}
              onPress={() => handleSave("Facturacion y region")}
            >
              Guardar configuracion fiscal
            </Button>
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
          <div className="flex justify-end">
            <Button
              color="primary"
              isLoading={isSaving}
              onPress={() => handleSave("Branding")}
            >
              Guardar branding
            </Button>
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
