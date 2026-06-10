"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  NumberInput,
  Card,
  CardBody,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Cliente } from "@/lib/validations/cliente.schema";
import { useCurrency } from "@/hooks/useCurrency";
import { getCurrencyFormatOptions } from "@/lib/utils/formatCurrency";
import { User, MapPin, CreditCard, Save } from "lucide-react";

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

interface ClienteFormProps {
  initialData: Cliente | null;
  onSubmit: (data: Partial<Cliente>) => void;
  isSaving: boolean;
  onCancel: () => void;
}

export default function ClienteForm({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: ClienteFormProps) {
  const [formData, setFormData] = useState<Partial<Cliente>>(clientePorDefecto);
  const currency = useCurrency();

  // Queries
  const { data: condicionesIva = [], isLoading: isLoadingCondiciones } =
    useQuery({
      queryKey: ["condiciones-iva"],
      queryFn: fetchCondicionesIva,
    });

  const { data: listasPrecios = [], isLoading: isLoadingListas } = useQuery({
    queryKey: ["listas-precios-generic"],
    queryFn: fetchListasPrecios,
  });

  const { data: provincias = [], isLoading: isLoadingProvincias } = useQuery({
    queryKey: ["provincias"],
    queryFn: fetchProvincias,
  });

  const { data: departamentos = [], isLoading: isLoadingDepartamentos } =
    useQuery({
      queryKey: ["departamentos", formData.ProvinciaId],
      queryFn: () => fetchDepartamentos(formData.ProvinciaId?.toString() || ""),
      enabled: !!formData.ProvinciaId,
    });

  const { data: localidades = [], isLoading: isLoadingLocalidades } = useQuery({
    queryKey: ["localidades", formData.DepartamentoId],
    queryFn: () => fetchLocalidades(formData.DepartamentoId?.toString() || ""),
    enabled: !!formData.DepartamentoId,
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
      setFormData({ ...clientePorDefecto });
    }
  }, [initialData]);

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
      ListaPrecioId: formData?.ListaPrecioId
        ? Number(formData.ListaPrecioId)
        : null,
      ActivarCtaCte: formData?.ActivarCtaCte,
      TieneLimiteCompra: formData?.TieneLimiteCompra,
      MontoMaximoCtaCte: formData?.TieneLimiteCompra
        ? Number(formData?.MontoMaximoCtaCte) || 0
        : 0,
    };

    onSubmit(payload);
  };

  const isEdit = !!initialData;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0F2233] to-[#1a364d] shadow-sm flex-shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isEdit
                ? "Actualiza la información del cliente"
                : "Completa los datos para registrar un nuevo cliente"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="flat"
            onPress={onCancel}
            isDisabled={isSaving}
            className="flex-1 sm:flex-none font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            isDisabled={!formData.Nombre || !formData.Apellido || !formData.Direccion || !formData.LocalidadId || !formData.Mail || !formData.CondicionIvaId}
            className="flex-1 sm:flex-none bg-[#0F2233] hover:bg-[#1a364d] text-white font-semibold shadow-md shadow-[#0F2233]/20"
          >
            {isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* DATOS PERSONALES */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <User size={18} className="text-[#67afc3]" /> Datos Personales
              </h3>
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
                  placeholder="Lista por defecto"
                  isLoading={isLoadingListas}
                  classNames={{ trigger: inputClassNames.inputWrapper }}
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
            </CardBody>
          </Card>

          {/* UBICACIÓN */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <MapPin size={18} className="text-[#67afc3]" /> Ubicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Dirección *"
                  placeholder="Calle 123"
                  value={formData.Direccion}
                  onChange={(e) => handleChange("Direccion", e.target.value)}
                  isRequired
                  classNames={inputClassNames}
                />
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
                  classNames={{ trigger: inputClassNames.inputWrapper }}
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
                  classNames={{ trigger: inputClassNames.inputWrapper }}
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
                    formData.LocalidadId ? [String(formData.LocalidadId)] : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) handleChange("LocalidadId", Number(val));
                  }}
                  placeholder="Selecciona una localidad"
                  isDisabled={!formData.DepartamentoId}
                  isLoading={isLoadingLocalidades}
                  classNames={{ trigger: inputClassNames.inputWrapper }}
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
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* IVA */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <CreditCard size={18} className="text-[#67afc3]" /> Condición IVA
              </h3>
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
                classNames={{ trigger: inputClassNames.inputWrapper }}
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
            </CardBody>
          </Card>

          {/* CUENTA CORRIENTE */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <CreditCard size={18} className="text-[#67afc3]" /> Cuenta Corriente
              </h3>
              <div className="flex flex-col gap-6">
                <Switch
                  isSelected={formData.ActivarCtaCte}
                  onValueChange={(val) => handleChange("ActivarCtaCte", val)}
                  classNames={{
                    label: "text-sm text-slate-700 font-medium ml-2",
                  }}
                >
                  Activar Cuenta Corriente
                </Switch>
                
                {formData.ActivarCtaCte && (
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/80 space-y-4">
                    <Switch
                      isSelected={formData.TieneLimiteCompra}
                      onValueChange={(val) =>
                        handleChange("TieneLimiteCompra", val)
                      }
                      size="sm"
                      classNames={{
                        label: "text-sm text-slate-700 font-medium ml-2",
                      }}
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
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
