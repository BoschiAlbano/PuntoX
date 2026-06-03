"use client";

import { modalMotionProps } from "@/lib/motionConfig";
import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  NumberInput,
} from "@heroui/react";
import { GenericFormProps } from "../shared/GenericCrud";
import { useQuery } from "@tanstack/react-query";
import { Cliente } from "@/lib/validations/cliente.schema";
import { useCurrency } from "@/hooks/useCurrency";
import { getCurrencyFormatOptions } from "@/lib/utils/formatCurrency";
import { User, MapPin, CreditCard, X } from "lucide-react";

// Fetchers
const fetchCondicionesIva = async () => {
  const res = await fetch("/api/condiciones-iva");
  if (!res.ok) throw new Error("Error fetching condiciones iva");
  const data = await res.json();
  return Array.isArray(data) ? data : data?.condicionesIva || [];
};

const fetchListasPrecios = async () => {
  const res = await fetch("/api/listas-precios");
  if (!res.ok) throw new Error("Error fetching listas precios");
  const data = await res.json();
  return data.data || [];
};

const fetchProvincias = async () => {
  const res = await fetch("/api/provincias");
  if (!res.ok) throw new Error("Error fetching provincias");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchDepartamentos = async (provinciaId: string) => {
  const res = await fetch(`/api/departamentos?provinciaId=${provinciaId}`);
  if (!res.ok) throw new Error("Error fetching departamentos");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchLocalidades = async (departamentoId: string) => {
  const res = await fetch(`/api/localidades?departamentoId=${departamentoId}`);
  if (!res.ok) throw new Error("Error fetching localidades");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const inputClassNames = {
  inputWrapper:
    "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
};

function getClienteSectionStatus(formData: Partial<Cliente>) {
  const datosPersonales =
    (formData.Nombre?.trim() ?? "").length > 0 &&
    (formData.Apellido?.trim() ?? "").length > 0 &&
    (formData.Mail?.trim() ?? "").length > 0 &&
    (formData.Direccion?.trim() ?? "").length > 0;
  const ubicacion =
    (formData.LocalidadId ?? 0) > 0 && (formData.CondicionIvaId ?? 0) > 0;
  const cuentaCorriente =
    !formData.ActivarCtaCte ||
    !formData.TieneLimiteCompra ||
    (formData.MontoMaximoCtaCte ?? 0) >= 0;
  return { datosPersonales, ubicacion, cuentaCorriente };
}

const clientePorDefecto: Partial<Cliente> = {
  Id: 0,
  Nombre: "",
  Apellido: "",
  Dni: "",
  Direccion: "",
  Telefono: "",
  Mail: "",
  LocalidadId: 0,
  DepartamentoId: 0,
  ProvinciaId: 0,
  CondicionIvaId: 0,
  ActivarCtaCte: false,
  TieneLimiteCompra: false,
  MontoMaximoCtaCte: 0,
  ListaPrecioId: null,
};

export default function ClienteForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Cliente>) {
  const [formData, setFormData] = useState<Partial<Cliente>>(clientePorDefecto);
  const [activeSection, setActiveSection] = useState<"datos" | "ubicacion" | "cuentacte">("datos");
  const currency = useCurrency();
  // Queries
  const { data: condicionesIva = [], isLoading: isLoadingCondiciones } =
    useQuery({
      queryKey: ["condiciones-iva"],
      queryFn: fetchCondicionesIva,
      enabled: isOpen,
    });

  const { data: listasPrecios = [], isLoading: isLoadingListas } = useQuery({
    queryKey: ["listas-precios-generic"],
    queryFn: fetchListasPrecios,
    enabled: isOpen,
  });

  const { data: provincias = [], isLoading: isLoadingProvincias } = useQuery({
    queryKey: ["provincias"],
    queryFn: fetchProvincias,
    enabled: isOpen,
  });

  const { data: departamentos = [], isLoading: isLoadingDepartamentos } =
    useQuery({
      queryKey: ["departamentos", formData.ProvinciaId],
      queryFn: () => fetchDepartamentos(formData.ProvinciaId?.toString() || ""),
      enabled: isOpen && !!formData.ProvinciaId,
    });

  const { data: localidades = [], isLoading: isLoadingLocalidades } = useQuery({
    queryKey: ["localidades", formData.DepartamentoId],
    queryFn: () => fetchLocalidades(formData.DepartamentoId?.toString() || ""),
    enabled: isOpen && !!formData.DepartamentoId,
  });

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        Id: initialData.Id,
        Nombre: initialData.Nombre,
        Apellido: initialData.Apellido,
        Dni: initialData.Dni || "",
        Direccion: initialData.Direccion,
        Telefono: initialData.Telefono || "",
        Mail: initialData.Mail,
        LocalidadId: initialData.LocalidadId,
        DepartamentoId: initialData.DepartamentoId,
        ProvinciaId: initialData.ProvinciaId,
        CondicionIvaId: initialData.CondicionIvaId,
        ActivarCtaCte: initialData.ActivarCtaCte,
        TieneLimiteCompra: initialData.TieneLimiteCompra,
        MontoMaximoCtaCte: initialData.MontoMaximoCtaCte,
        ListaPrecioId: initialData.ListaPrecioId,
      });
    } else {
      setFormData({
        Id: 0,
        Nombre: "",
        Apellido: "",
        Dni: "",
        Direccion: "",
        Telefono: "",
        Mail: "",
        LocalidadId: 0,
        DepartamentoId: 0,
        ProvinciaId: 0,
        CondicionIvaId: 0,
        ActivarCtaCte: false,
        TieneLimiteCompra: false,
        MontoMaximoCtaCte: 0,
        ListaPrecioId: null,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (field: keyof Cliente, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset dependent fields when parent changes
      if (field === "ProvinciaId") {
        newData.DepartamentoId = 0;
        newData.LocalidadId = 0;
      } else if (field === "DepartamentoId") {
        newData.LocalidadId = 0;
      }

      return newData;
    });
  };

  const handleSubmit = () => {
    const payload: Partial<Cliente> = {
      Nombre: formData?.Nombre?.trim(),
      Apellido: formData?.Apellido?.trim(),
      Dni: formData?.Dni?.trim() || null,
      Direccion: formData?.Direccion?.trim(),
      Telefono: formData?.Telefono?.trim() || null,
      Mail: formData?.Mail?.trim(),
      LocalidadId: Number(formData?.LocalidadId),
      CondicionIvaId: Number(formData?.CondicionIvaId),
      ListaPrecioId: formData?.ListaPrecioId ? Number(formData.ListaPrecioId) : null,
      ActivarCtaCte: formData?.ActivarCtaCte,
      TieneLimiteCompra: formData?.TieneLimiteCompra,
      MontoMaximoCtaCte: formData?.TieneLimiteCompra
        ? Number(formData?.MontoMaximoCtaCte) || 0
        : 0,
    };

    onSubmit(payload);
  };

  const isEdit = !!initialData;
  const sectionStatus = getClienteSectionStatus(formData);

  const navSections: { key: "datos" | "ubicacion" | "cuentacte"; label: string; icon: any; isComplete: boolean }[] = [
    { key: "datos", label: "Datos Personales", icon: User, isComplete: sectionStatus.datosPersonales },
    { key: "ubicacion", label: "Ubicación", icon: MapPin, isComplete: sectionStatus.ubicacion },
    { key: "cuentacte", label: "Cuenta Corriente", icon: CreditCard, isComplete: sectionStatus.cuentaCorriente },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      isDismissable={!isSaving}
      motionProps={modalMotionProps}
      classNames={{
        backdrop: "bg-slate-900/60 backdrop-blur-sm",
        wrapper: "items-end sm:items-center",
        base: "font-sans bg-white shadow-2xl border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl w-full sm:max-w-[920px] h-[100dvh] sm:h-[84vh] m-0 sm:m-auto",
      }}
    >
      <ModalContent className="flex flex-col h-full overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────── */}
        <ModalHeader className="flex items-center gap-3 py-4 px-5 border-b border-slate-100 flex-none">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#67afc3" }}
          >
            <User size={18} className="text-white" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-base font-bold text-slate-800 leading-tight">
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </span>
            <span className="text-xs text-slate-400 font-normal truncate">
              {isEdit
                ? (formData.Nombre ? formData.Nombre + " " + (formData.Apellido || "") : "Sin nombre")
                : "Completá la información del cliente"}
            </span>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl shrink-0"
          >
            <X size={16} />
          </Button>
        </ModalHeader>

        {/* ── Body ───────────────────────────────────────────────── */}
        <ModalBody className="p-0 flex flex-col sm:flex-row flex-1 overflow-hidden relative">
          {/* Nav — horizontal scrollable en mobile, sidebar en desktop */}
          <nav className="flex-none
            flex flex-row sm:flex-col
            border-b sm:border-b-0 sm:border-r border-slate-100
            bg-slate-50/60
            overflow-x-auto sm:overflow-x-hidden overflow-y-hidden sm:overflow-y-auto
            py-2 sm:py-3 px-2 gap-0.5
            sm:w-44 scrollbar-none">
            {navSections.map(({ key, label, icon: Icon, isComplete }) => {
              const isActive = activeSection === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl text-left transition-all shrink-0 sm:w-full ${
                    isActive
                      ? "bg-[#67afc3]/10 text-[#67afc3]"
                      : "text-slate-500 hover:bg-white hover:text-slate-700"
                  }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 ${isActive ? "text-[#67afc3]" : "text-slate-400"}`}
                  />
                  <span className={`text-xs sm:text-sm whitespace-nowrap leading-none ${isActive ? "font-semibold" : "font-medium"}`}>
                    {label}
                  </span>
                  <div
                    className={`hidden sm:block w-1.5 h-1.5 rounded-full shrink-0 ml-auto transition-colors ${
                      isComplete ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4">
            
            {/* ── DATOS PERSONALES ──────────────────────────────────────── */}
            {activeSection === "datos" && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                  Datos Personales
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    placeholder="Juan"
                    autoFocus
                    value={formData.Nombre}
                    onChange={(e) => handleChange("Nombre", e.target.value)}
                    isRequired
                    classNames={inputClassNames}
                  />
                  <Input
                    label="Apellido *"
                    placeholder="Pérez"
                    value={formData.Apellido}
                    onChange={(e) => handleChange("Apellido", e.target.value)}
                    isRequired
                    classNames={inputClassNames}
                  />
                  <Input
                    label="DNI"
                    placeholder="12345678"
                    maxLength={8}
                    value={formData?.Dni || ""}
                    onChange={(e) => handleChange("Dni", e.target.value)}
                    classNames={inputClassNames}
                  />
                  <Input
                    label="Email *"
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={formData?.Mail}
                    onChange={(e) => handleChange("Mail", e.target.value)}
                    isRequired
                    classNames={inputClassNames}
                  />
                  <Input
                    label="Teléfono"
                    placeholder="+54 11 1234-5678"
                    value={formData?.Telefono || ""}
                    maxLength={25}
                    onChange={(e) => handleChange("Telefono", e.target.value)}
                    classNames={inputClassNames}
                  />
                  <Input
                    label="Dirección *"
                    placeholder="Calle 123"
                    value={formData.Direccion}
                    onChange={(e) => handleChange("Direccion", e.target.value)}
                    isRequired
                    classNames={inputClassNames}
                  />
                  <Select
                    label="Lista de Precios (Opcional)"
                    selectedKeys={
                      formData.ListaPrecioId
                        ? [String(formData.ListaPrecioId)]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      handleChange("ListaPrecioId", val ? Number(val) : null);
                    }}
                    placeholder="Lista por defecto (Opcional)"
                    isLoading={isLoadingListas}
                  >
                    {listasPrecios.map((lista: any) => (
                      <SelectItem
                        key={String(lista.Id)}
                        textValue={lista.Nombre}
                      >
                        {lista.Nombre}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {/* ── UBICACIÓN ──────────────────────────────────────── */}
            {activeSection === "ubicacion" && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                  Ubicación
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Provincia"
                    selectedKeys={
                      formData.ProvinciaId
                        ? [String(formData.ProvinciaId)]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      if (val) handleChange("ProvinciaId", Number(val));
                    }}
                    placeholder="Selecciona una provincia"
                    isLoading={isLoadingProvincias}
                  >
                    {provincias.map((prov: any) => (
                      <SelectItem
                        key={String(prov.Id)}
                        textValue={prov.Descripcion}
                      >
                        {prov.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Departamento"
                    selectedKeys={
                      formData.DepartamentoId
                        ? [String(formData.DepartamentoId)]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      if (val) handleChange("DepartamentoId", Number(val));
                    }}
                    placeholder="Selecciona un departamento"
                    isDisabled={!formData.ProvinciaId}
                    isLoading={isLoadingDepartamentos}
                  >
                    {departamentos.map((dept: any) => (
                      <SelectItem
                        key={String(dept.Id)}
                        textValue={dept.Descripcion}
                      >
                        {dept.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Localidad *"
                    selectedKeys={
                      formData.LocalidadId
                        ? [String(formData.LocalidadId)]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      if (val) handleChange("LocalidadId", Number(val));
                    }}
                    placeholder="Selecciona una localidad"
                    isDisabled={!formData.DepartamentoId}
                    isLoading={isLoadingLocalidades}
                  >
                    {localidades.map((loc: any) => (
                      <SelectItem
                        key={String(loc.Id)}
                        textValue={loc.Descripcion}
                      >
                        {loc.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Condición IVA *"
                    selectedKeys={
                      formData.CondicionIvaId
                        ? [String(formData.CondicionIvaId)]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      if (val) handleChange("CondicionIvaId", Number(val));
                    }}
                    placeholder="Condición frente al IVA"
                    isRequired
                    isLoading={isLoadingCondiciones}
                  >
                    {condicionesIva.map((cond: any) => (
                      <SelectItem
                        key={String(cond.id ?? cond.Id)}
                        textValue={cond.descripcion ?? cond.Descripcion}
                      >
                        {cond.descripcion ?? cond.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {/* ── CUENTA CORRIENTE ──────────────────────────────────────── */}
            {activeSection === "cuentacte" && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                  Cuenta Corriente
                </p>
                <div className="flex flex-col gap-4">
                  <Switch
                    isSelected={formData.ActivarCtaCte}
                    onValueChange={(val) =>
                      handleChange("ActivarCtaCte", val)
                    }
                  >
                    Activar Cuenta Corriente
                  </Switch>
                  {formData.ActivarCtaCte && (
                    <div className="flex flex-col md:flex-row gap-4">
                      <Switch
                        isSelected={formData.TieneLimiteCompra}
                        onValueChange={(val) =>
                          handleChange("TieneLimiteCompra", val)
                        }
                      >
                        Limitar Compra
                      </Switch>
                      {formData.TieneLimiteCompra && (
                        <NumberInput
                          label="Monto Máximo"
                          placeholder="0,00"
                          value={formData?.MontoMaximoCtaCte || 0}
                          onValueChange={(value) =>
                            handleChange("MontoMaximoCtaCte", value)
                          }
                          formatOptions={getCurrencyFormatOptions(currency)}
                          classNames={inputClassNames}
                        />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="py-4 px-5 border-t border-slate-100 flex-none gap-3">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="font-medium text-[#6b7280] hover:bg-[#f1f5f9] h-10 px-5 rounded-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-10 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
          >
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
