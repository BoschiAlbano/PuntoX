"use client";

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
  Accordion,
  AccordionItem,
  Chip,
} from "@heroui/react";
import { GenericFormProps } from "../shared/GenericCrud";
import { useQuery } from "@tanstack/react-query";
import { Cliente } from "@/lib/validations/cliente.schema";
import { useCurrency } from "@/hooks/useCurrency";
import { getCurrencyFormatOptions } from "@/lib/utils/formatCurrency";
import { User, MapPin, CreditCard } from "lucide-react";

// Fetchers
const fetchCondicionesIva = async () => {
  const res = await fetch("/api/condiciones-iva");
  if (!res.ok) throw new Error("Error fetching condiciones iva");
  const data = await res.json();
  return Array.isArray(data) ? data : data?.condicionesIva || [];
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
};

export default function ClienteForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Cliente>) {
  const [formData, setFormData] = useState<Partial<Cliente>>(clientePorDefecto);
  const currency = useCurrency();

  // Queries
  const { data: condicionesIva = [], isLoading: isLoadingCondiciones } =
    useQuery({
      queryKey: ["condiciones-iva"],
      queryFn: fetchCondicionesIva,
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

  const SectionTitle = ({
    icon: Icon,
    label,
    isComplete,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isComplete: boolean;
  }) => (
    <div className="flex items-center justify-between w-full gap-2 pr-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-[#67afc3] shrink-0" />
        <span>{label}</span>
      </div>
      <Chip
        size="sm"
        variant="flat"
        className={
          isComplete
            ? "bg-[#90c472]/15 text-[#90c472] border-0 shrink-0"
            : "bg-[#f59e0b]/15 text-[#f59e0b] border-0 shrink-0"
        }
      >
        {isComplete ? "Completo" : "Pendiente"}
      </Chip>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="center"
      backdrop="opaque"
      isDismissable={!isSaving}
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "font-sans bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-[#e5e7eb] max-w-[820px] max-h-[90vh] overflow-hidden",
        header:
          "border-t-[3px] border-t-[#67afc3] border-b border-[#e5e7eb] bg-[#67afc3]/5 rounded-t-2xl",
        body: "py-0 overflow-y-auto overflow-x-hidden",
        footer: "border-t border-[#e5e7eb] bg-[#f8fafc] rounded-b-2xl",
        closeButton:
          "hover:bg-[#67afc3]/10 hover:text-[#67afc3] rounded-full p-1.5 transition-colors text-[#6b7280]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 py-6 px-6">
          <h3 className="text-[28px] font-bold text-[#0f172a] leading-tight">
            {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
          </h3>
          {!isEdit && (
            <p className="text-sm text-[#6b7280] mt-1">
              Completa la información del cliente
            </p>
          )}
        </ModalHeader>
        <ModalBody className="p-0">
          <div className="px-6 py-6">
            <Accordion
              aria-label="Opciones del cliente"
              defaultSelectedKeys={["datos"]}
              selectionMode="single"
              variant="bordered"
              motionProps={{
                transition: { duration: 0.18, ease: "easeInOut" },
              }}
              className="gap-3 overflow-visible"
            >
              <AccordionItem
                key="datos"
                aria-label="Datos personales"
                title={
                  <SectionTitle
                    icon={User}
                    label="Datos personales"
                    isComplete={sectionStatus.datosPersonales}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre *"
                      placeholder="Juan"
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
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="ubicacion"
                aria-label="Ubicación"
                title={
                  <SectionTitle
                    icon={MapPin}
                    label="Ubicación"
                    isComplete={sectionStatus.ubicacion}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Provincia"
                      selectedKeys={
                        formData.ProvinciaId ? [String(formData.ProvinciaId)] : []
                      }
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0];
                        if (val) handleChange("ProvinciaId", Number(val));
                      }}
                      placeholder="Selecciona una provincia"
                      isLoading={isLoadingProvincias}
                    >
                      {provincias.map((prov: any) => (
                        <SelectItem key={String(prov.Id)} textValue={prov.Descripcion}>
                          {prov.Descripcion}
                        </SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Departamento"
                      selectedKeys={
                        formData.DepartamentoId ? [String(formData.DepartamentoId)] : []
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
                        <SelectItem key={String(dept.Id)} textValue={dept.Descripcion}>
                          {dept.Descripcion}
                        </SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Localidad *"
                      selectedKeys={
                        formData.LocalidadId ? [String(formData.LocalidadId)] : []
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
                        <SelectItem key={String(loc.Id)} textValue={loc.Descripcion}>
                          {loc.Descripcion}
                        </SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Condición IVA *"
                      selectedKeys={
                        formData.CondicionIvaId ? [String(formData.CondicionIvaId)] : []
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
                        <SelectItem key={String(cond.id ?? cond.Id)} textValue={cond.descripcion ?? cond.Descripcion}>
                          {cond.descripcion ?? cond.Descripcion}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="cuentacte"
                aria-label="Cuenta Corriente"
                title={
                  <SectionTitle
                    icon={CreditCard}
                    label="Cuenta Corriente"
                    isComplete={sectionStatus.cuentaCorriente}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  <div className="flex flex-col gap-4">
                    <Switch
                      isSelected={formData.ActivarCtaCte}
                      onValueChange={(val) => handleChange("ActivarCtaCte", val)}
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
                </div>
              </AccordionItem>
            </Accordion>
          </div>
        </ModalBody>
        <ModalFooter className="py-5 px-6 gap-3">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="font-medium text-[#6b7280] hover:bg-[#f1f5f9] h-11 px-5 rounded-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
          >
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
