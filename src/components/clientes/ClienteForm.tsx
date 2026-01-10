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
} from "@heroui/react";
import { GenericFormProps } from "../shared/GenericCrud";
import { useQuery } from "@tanstack/react-query";
import { Cliente } from "@/lib/validations/cliente.schema";

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
      console.log(initialData);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
    >
      <ModalContent>
        <ModalHeader>
          {initialData ? "Editar Cliente" : "Nuevo Cliente"}
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              placeholder="Juan"
              value={formData.Nombre}
              onChange={(e) => handleChange("Nombre", e.target.value)}
              isRequired
            />
            <Input
              label="Apellido *"
              placeholder="Pérez"
              value={formData.Apellido}
              onChange={(e) => handleChange("Apellido", e.target.value)}
              isRequired
            />
            <Input
              label="DNI"
              placeholder="12345678"
              value={formData?.Dni || ""}
              onChange={(e) => handleChange("Dni", e.target.value)}
            />
            <Input
              label="Email *"
              type="email"
              placeholder="cliente@ejemplo.com"
              value={formData?.Mail}
              onChange={(e) => handleChange("Mail", e.target.value)}
              isRequired
            />
            <Input
              label="Teléfono"
              placeholder="+54 11 1234-5678"
              value={formData?.Telefono || ""}
              onChange={(e) => handleChange("Telefono", e.target.value)}
            />
            <Input
              label="Dirección *"
              placeholder="Calle 123"
              value={formData.Direccion}
              onChange={(e) => handleChange("Direccion", e.target.value)}
              isRequired
            />

            {/* Ubicación Selectors */}
            <Select
              label="Provincia"
              selectedKeys={
                formData.ProvinciaId ? [String(formData.ProvinciaId)] : []
              }
              onChange={(e) => {
                if (e.target.value) {
                  handleChange("ProvinciaId", e.target.value);
                }
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
              onChange={(e) => {
                if (e.target.value) {
                  handleChange("DepartamentoId", e.target.value);
                }
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
              onChange={(e) => {
                if (e.target.value) {
                  handleChange("LocalidadId", e.target.value);
                }
              }}
              placeholder="Selecciona una localidad"
              isDisabled={!formData.DepartamentoId}
              isLoading={isLoadingLocalidades}
            >
              {localidades.map((loc: any) => (
                <SelectItem key={String(loc.Id)} textValue={loc.Descripcion}>
                  {loc.Descripcion}
                </SelectItem>
              )) || []}
            </Select>

            <Select
              label="Condición IVA *"
              selectedKeys={
                formData.CondicionIvaId ? [String(formData.CondicionIvaId)] : []
              }
              onChange={(e) => {
                if (e.target.value) {
                  handleChange("CondicionIvaId", e.target.value);
                }
              }}
              placeholder="Condición frente al IVA"
              isRequired
              isLoading={isLoadingCondiciones}
            >
              {condicionesIva.map((cond: any) => (
                <SelectItem key={String(cond.id)} textValue={cond.descripcion}>
                  {cond.descripcion}
                </SelectItem>
              ))}
            </Select>

            <div className="md:col-span-2 pt-2 border-t mt-2">
              <h3 className="text-sm font-semibold mb-3">Cuenta Corriente</h3>
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
                      className="mt-2"
                    >
                      Limitar Compra
                    </Switch>
                    {formData.TieneLimiteCompra && (
                      <NumberInput
                        label="Monto Máximo"
                        placeholder="0.00"
                        startContent="$"
                        value={formData?.MontoMaximoCtaCte || 0}
                        onValueChange={(value) =>
                          handleChange("MontoMaximoCtaCte", value)
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSaving}>
            {initialData ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
