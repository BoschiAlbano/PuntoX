"use client";

import { useState, useEffect } from "react";
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
} from "@heroui/react";
import { GenericFormProps } from "@/components/shared/GenericCrud";
import { useQuery } from "@tanstack/react-query";
import { Usuario } from "./UsuariosCRUD";
import { Sucursal } from "../../../prisma/generated/prisma";
import { useSucursales } from "@/hooks/useSucursales";

// Funciones de fetch para los selects
const fetchProvincias = async () => {
  const res = await fetch("/api/provincias");
  if (!res.ok) throw new Error("Error fetching provincias");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchDepartamentos = async (provinciaId: number | string) => {
  const res = await fetch(`/api/departamentos?provinciaId=${provinciaId}`);
  if (!res.ok) throw new Error("Error fetching departamentos");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchLocalidades = async (departamentoId: number | string) => {
  const res = await fetch(`/api/localidades?departamentoId=${departamentoId}`);
  if (!res.ok) throw new Error("Error fetching localidades");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchRoles = async () => {
  const res = await fetch("/api/roles");
  if (!res.ok) throw new Error("Error fetching roles");
  const data = await res.json();
  return Array.isArray(data?.roles) ? data.roles : [];
};

interface UsuarioFormData {
  nombre: string;
  apellido: string;
  dni: string | null;
  direccion: string;
  telefono: string | null;
  mail?: string;
  localidadId: number | string;
  departamentoId?: number | string | null;
  provinciaId?: number | string | null;
  nombreUsuario?: string;
  password?: string;
  rolId?: number | string | null;
  sucursales?: Sucursal[] | null;
  personaId?: number | string;
}

const defaultFormData: UsuarioFormData = {
  nombre: "",
  apellido: "",
  dni: null,
  direccion: "",
  telefono: null,
  mail: "",
  localidadId: "",
  departamentoId: null,
  provinciaId: null,
  nombreUsuario: "",
  password: "",
  rolId: null,
  sucursales: null,
};

export default function UsuarioForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Usuario>) {
  const [formData, setFormData] = useState<UsuarioFormData>(defaultFormData);
  const isEdit = !!initialData;

  // Queries
  const { data: provincias = [], isLoading: isLoadingProvincias } = useQuery({
    queryKey: ["provincias"],
    queryFn: fetchProvincias,
    enabled: isOpen,
  });

  const { data: departamentos = [], isLoading: isLoadingDepartamentos } =
    useQuery({
      queryKey: ["departamentos", formData.provinciaId],
      queryFn: () => fetchDepartamentos(formData.provinciaId!),
      enabled: isOpen && !!formData.provinciaId,
    });

  const { data: localidades = [], isLoading: isLoadingLocalidades } = useQuery({
    queryKey: ["localidades", formData.departamentoId],
    queryFn: () => fetchLocalidades(formData.departamentoId!),
    enabled: isOpen && !!formData.departamentoId,
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    enabled: isOpen,
  });

  const { data: sucursales = [], isLoading: isLoadingSucursales } =
    useSucursales();

  // Initialization
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          nombre: initialData.nombre || "",
          apellido: initialData.apellido || "",
          dni: initialData.dni || null,
          direccion: initialData.direccion || "",
          telefono: initialData.telefono || null,
          mail: initialData.email || "",
          localidadId: initialData.localidadId || "",
          departamentoId: initialData.departamentoId || null,
          provinciaId: initialData.provinciaId || null,
          rolId: initialData.rolId || null,
          sucursales: initialData.sucursales || null,
          personaId: initialData.personaId || initialData.id,
          nombreUsuario: initialData.username || "", // Aunque no se edite, para mantener consistencia
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [initialData, isOpen]);

  const handleChange = (field: keyof UsuarioFormData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Cascade resets
      if (field === "provinciaId") {
        newData.departamentoId = null;
        newData.localidadId = "";
      } else if (field === "departamentoId") {
        newData.localidadId = "";
      }

      return newData;
    });
  };

  const handleSubmit = () => {
    // Preparar payload según si es creación o edición
    if (isEdit) {
      const payload: any = {
        personaId: formData.personaId,
      };

      if (formData.nombre) payload.nombre = formData.nombre;
      if (formData.apellido) payload.apellido = formData.apellido;
      if (formData.dni !== undefined) payload.dni = formData.dni;
      if (formData.direccion) payload.direccion = formData.direccion;
      if (formData.telefono !== undefined) payload.telefono = formData.telefono;
      if (formData.localidadId) payload.localidadId = formData.localidadId;
      if (formData.departamentoId !== undefined)
        payload.departamentoId = formData.departamentoId;
      if (formData.provinciaId !== undefined)
        payload.provinciaId = formData.provinciaId;
      if (formData.rolId !== undefined) payload.rolId = formData.rolId;
      if (formData.sucursales !== undefined)
        payload.sucursalId = formData.sucursales?.map((s: any) => s.Id || s.id);

      onSubmit(payload);
    } else {
      const payload: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        direccion: formData.direccion,
        localidadId: formData.localidadId,
        nombreUsuario: formData.nombreUsuario,
        password: formData.password,
      };

      if (formData.dni) payload.dni = formData.dni;
      if (formData.telefono) payload.telefono = formData.telefono;
      if (formData.mail) payload.mail = formData.mail;
      if (formData.departamentoId)
        payload.departamentoId = formData.departamentoId;
      if (formData.provinciaId) payload.provinciaId = formData.provinciaId;
      if (formData.rolId) payload.rolId = formData.rolId;

      if (formData.sucursales && formData.sucursales.length > 0) {
        payload.sucursalId = formData.sucursales.map((s: any) => s.Id || s.id);
      }

      onSubmit(payload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Información Personal */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  placeholder="Ingrese el nombre"
                  value={formData.nombre}
                  onValueChange={(value) => handleChange("nombre", value)}
                  isRequired
                  isDisabled={isSaving}
                />
                <Input
                  label="Apellido"
                  placeholder="Ingrese el apellido"
                  value={formData.apellido}
                  onValueChange={(value) => handleChange("apellido", value)}
                  isRequired
                  isDisabled={isSaving}
                />
                <Input
                  label="DNI"
                  placeholder="Ingrese el DNI (opcional)"
                  value={formData.dni || ""}
                  onValueChange={(value) => handleChange("dni", value || null)}
                  isDisabled={isSaving}
                />
                <Input
                  label="Teléfono"
                  placeholder="Ingrese el teléfono (opcional)"
                  value={formData.telefono || ""}
                  onValueChange={(value) =>
                    handleChange("telefono", value || null)
                  }
                  isDisabled={isSaving}
                />
                <Input
                  label="Dirección"
                  placeholder="Ingrese la dirección"
                  value={formData.direccion}
                  onValueChange={(value) => handleChange("direccion", value)}
                  isRequired
                  isDisabled={isSaving}
                  className="md:col-span-2"
                />
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Ubicación
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Provincia"
                  placeholder="Seleccione una provincia"
                  selectedKeys={
                    formData.provinciaId
                      ? [formData.provinciaId.toString()]
                      : []
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange("provinciaId", Number(e.target.value));
                    }
                  }}
                  isLoading={isLoadingProvincias}
                  isDisabled={isSaving}
                >
                  {provincias.map((provincia: any) => (
                    <SelectItem
                      key={String(provincia.id || provincia.Id)}
                      textValue={provincia.Descripcion || provincia.descripcion}
                    >
                      {provincia.Descripcion || provincia.descripcion}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Departamento"
                  placeholder="Seleccione un departamento"
                  selectedKeys={
                    formData.departamentoId
                      ? [formData.departamentoId.toString()]
                      : []
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange("departamentoId", Number(e.target.value));
                    }
                  }}
                  isLoading={isLoadingDepartamentos}
                  isDisabled={isSaving || !formData.provinciaId}
                >
                  {departamentos.map((departamento: any) => (
                    <SelectItem
                      key={String(departamento.id || departamento.Id)}
                      textValue={
                        departamento.Descripcion || departamento.descripcion
                      }
                    >
                      {departamento.Descripcion || departamento.descripcion}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Localidad"
                  placeholder="Seleccione una localidad"
                  selectedKeys={
                    formData.localidadId
                      ? [formData.localidadId.toString()]
                      : []
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange("localidadId", Number(e.target.value));
                    }
                  }}
                  isLoading={isLoadingLocalidades}
                  isDisabled={isSaving || !formData.departamentoId}
                  isRequired
                >
                  {localidades.map((localidad: any) => (
                    <SelectItem
                      key={String(localidad.id || localidad.Id)}
                      textValue={localidad.Descripcion || localidad.descripcion}
                    >
                      {localidad.Descripcion || localidad.descripcion}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Información de Usuario */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Información de Usuario
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isEdit && (
                  <>
                    <Input
                      label="Nombre de Usuario"
                      placeholder="Ingrese el nombre de usuario"
                      value={formData.nombreUsuario || ""}
                      onValueChange={(value) =>
                        handleChange("nombreUsuario", value)
                      }
                      isRequired
                      isDisabled={isSaving}
                    />
                    <Input
                      label="Contraseña"
                      placeholder="Mínimo 8 caracteres"
                      type="password"
                      value={formData.password || ""}
                      onValueChange={(value) => handleChange("password", value)}
                      isRequired
                      isDisabled={isSaving}
                    />
                  </>
                )}
                {!isEdit && (
                  <Input
                    label="Email (Opcional)"
                    placeholder="Ingrese el email (opcional)"
                    type="email"
                    value={formData.mail || ""}
                    onValueChange={(value) =>
                      handleChange("mail", value || undefined)
                    }
                    isDisabled={isSaving}
                    className="md:col-span-2"
                    description="Si no se proporciona, se generará automáticamente"
                  />
                )}
                <Select
                  label="Rol"
                  placeholder="Seleccione un rol (opcional)"
                  selectedKeys={
                    formData.rolId ? [formData.rolId.toString()] : []
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      handleChange("rolId", Number(e.target.value));
                    }
                  }}
                  isLoading={isLoadingRoles}
                  isDisabled={isSaving}
                >
                  {roles.map((rol: any) => (
                    <SelectItem
                      key={String(rol.id || rol.Id)}
                      textValue={
                        rol.nombre || rol.Descripcion || rol.descripcion
                      }
                    >
                      {rol.nombre || rol.Descripcion || rol.descripcion}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Sucursal"
                  placeholder="Seleccione las sucursales"
                  selectionMode="multiple"
                  selectedKeys={
                    formData.sucursales
                      ? formData.sucursales.map((s: any) =>
                          (s.Id || s.sucursalId || s.id).toString(),
                        )
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedIds = Array.from(keys).map((k) => Number(k));
                    const selectedSucursales = sucursales.filter((s: any) =>
                      selectedIds.includes(Number(s.Id || s.id)),
                    );
                    handleChange("sucursales", selectedSucursales);
                  }}
                  isLoading={isLoadingSucursales}
                  isDisabled={isSaving}
                >
                  {sucursales.map((sucursal: any) => (
                    <SelectItem
                      key={sucursal.id || sucursal.Id}
                      textValue={
                        sucursal.nombre ||
                        sucursal.Nombre ||
                        sucursal.descripcion
                      }
                    >
                      {sucursal.nombre ||
                        sucursal.Nombre ||
                        sucursal.descripcion}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSaving}
            isDisabled={
              !formData.nombre ||
              !formData.apellido ||
              !formData.direccion ||
              !formData.localidadId ||
              (!isEdit && (!formData.nombreUsuario || !formData.password))
            }
          >
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
