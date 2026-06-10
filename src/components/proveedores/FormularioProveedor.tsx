"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Proveedor } from "@/lib/validations/proveedor.schema";
import { Truck, MapPin, Save } from "lucide-react";

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

const proveedorPorDefecto: Partial<Proveedor> = {
  Id: 0,
  RazonSocial: "",
  CUIT: "",
  Direccion: "",
  Telefono: "",
  Mail: "",
  LocalidadId: 0,
  DepartamentoId: 0,
  ProvinciaId: 0,
  CondicionIvaId: 0,
};

interface FormularioProveedorProps {
  initialData: Proveedor | null;
  onSubmit: (data: Partial<Proveedor>) => void;
  isSaving: boolean;
  onCancel: () => void;
}

export default function FormularioProveedor({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: FormularioProveedorProps) {
  const [formData, setFormData] = useState<Partial<Proveedor>>(proveedorPorDefecto);

  // Queries
  const { data: condicionesIva = [], isLoading: isLoadingCondiciones } =
    useQuery({
      queryKey: ["condiciones-iva"],
      queryFn: fetchCondicionesIva,
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
        RazonSocial: initialData.RazonSocial,
        CUIT: initialData.CUIT,
        Direccion: initialData.Direccion,
        Telefono: initialData.Telefono || "",
        Mail: initialData.Mail,
        LocalidadId: initialData.LocalidadId,
        DepartamentoId: initialData.DepartamentoId,
        ProvinciaId: initialData.ProvinciaId,
        CondicionIvaId: initialData.CondicionIvaId,
      });
    } else {
      setFormData({ ...proveedorPorDefecto });
    }
  }, [initialData]);

  const handleChange = (field: keyof Proveedor, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

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
    const payload: Partial<Proveedor> = {
      RazonSocial: formData?.RazonSocial?.trim(),
      CUIT: formData?.CUIT?.trim(),
      Direccion: formData?.Direccion?.trim(),
      Telefono: formData?.Telefono?.trim() || null,
      Mail: formData?.Mail?.trim(),
      LocalidadId: Number(formData?.LocalidadId),
      CondicionIvaId: Number(formData?.CondicionIvaId),
    };

    onSubmit(payload);
  };

  const isEdit = !!initialData;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#67afc3] to-[#4899b0] shadow-sm">
            <Truck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
              {isEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit
                ? formData.RazonSocial || "Sin nombre"
                : "Completá la información del proveedor"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            onPress={onCancel}
            isDisabled={isSaving}
            className="font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-5 h-10"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            className="bg-[#0F2233] hover:bg-[#0F2233]/90 text-white font-bold rounded-xl shadow-md shadow-[#0F2233]/30 px-6 h-10"
          >
            {isEdit ? "Guardar Cambios" : "Crear Proveedor"}
          </Button>
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* DATOS DE LA EMPRESA */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Truck size={18} className="text-[#67afc3]" /> Datos de la Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Razón Social *"
                  placeholder="Empresa S.A."
                  autoFocus
                  value={formData.RazonSocial}
                  onChange={(e) => handleChange("RazonSocial", e.target.value)}
                  isRequired
                  classNames={inputClassNames}
                />
                <Input
                  label="CUIT *"
                  placeholder="30-12345678-9"
                  value={formData.CUIT}
                  onChange={(e) => handleChange("CUIT", e.target.value)}
                  isRequired
                  maxLength={15}
                  classNames={inputClassNames}
                />
                <Input
                  label="Email *"
                  type="email"
                  placeholder="contacto@empresa.com"
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
            </CardBody>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* UBICACIÓN Y FISCALIDAD */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <MapPin size={18} className="text-[#67afc3]" /> Ubicación y Fiscalidad
              </h3>
              <div className="flex flex-col gap-4">
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
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}