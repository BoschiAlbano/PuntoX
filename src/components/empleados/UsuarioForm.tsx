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

// Tipos para los datos del formulario
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
  sucursalId?: number | string | null;
  personaId?: number | string; // Solo para edición
}

// Funciones de fetch para los selects
const fetchProvincias = async () => {
  const res = await fetch("/api/provincias");
  if (!res.ok) throw new Error("Error fetching provincias");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchDepartamentos = async (provinciaId: number | null) => {
  if (!provinciaId) return [];
  const res = await fetch(`/api/departamentos?provinciaId=${provinciaId}`);
  if (!res.ok) throw new Error("Error fetching departamentos");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const fetchLocalidades = async (departamentoId: number | null) => {
  if (!departamentoId) return [];
  const res = await fetch(`/api/localidades?departamentoId=${departamentoId}`);
  if (!res.ok) throw new Error("Error fetching localidades");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

// Función para obtener una localidad específica con su departamento y provincia
const fetchLocalidadById = async (localidadId: number) => {
  // Obtener todas las localidades y buscar la que coincide
  // Nota: Idealmente debería haber un endpoint /api/localidades/:id, pero por ahora usamos este método
  const res = await fetch(`/api/localidades`);
  if (!res.ok) throw new Error("Error fetching localidades");
  const data = await res.json();
  const localidades = Array.isArray(data) ? data : [];
  return localidades.find((loc: any) => (loc.id || loc.Id) === localidadId);
};

const fetchRoles = async () => {
  const res = await fetch("/api/roles");
  if (!res.ok) throw new Error("Error fetching roles");
  const data = await res.json();
  return Array.isArray(data?.roles) ? data.roles : [];
};

const fetchSucursales = async () => {
  const res = await fetch("/api/sucursales/mis-sucursales");
  if (!res.ok) throw new Error("Error fetching sucursales");
  const data = await res.json();
  return Array.isArray(data?.sucursales) ? data.sucursales : [];
};

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
  sucursalId: null,
};

export default function UsuarioForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Usuario>) {
  const [formData, setFormData] = useState<UsuarioFormData>(defaultFormData);
  const [selectedProvinciaId, setSelectedProvinciaId] = useState<number | null>(null);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<number | null>(null);

  const isEdit = !!initialData;

  // Queries para llenar los selects
  const { data: provincias = [], isLoading: isLoadingProvincias } = useQuery({
    queryKey: ["provincias"],
    queryFn: fetchProvincias,
    enabled: isOpen,
  });

  const { data: departamentos = [], isLoading: isLoadingDepartamentos } = useQuery({
    queryKey: ["departamentos", selectedProvinciaId],
    queryFn: () => fetchDepartamentos(selectedProvinciaId),
    enabled: isOpen && !!selectedProvinciaId,
  });

  const { data: localidades = [], isLoading: isLoadingLocalidades } = useQuery({
    queryKey: ["localidades", selectedDepartamentoId],
    queryFn: () => fetchLocalidades(selectedDepartamentoId),
    enabled: isOpen && !!selectedDepartamentoId,
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    enabled: isOpen,
  });

  const { data: sucursales = [], isLoading: isLoadingSucursales } = useQuery({
    queryKey: ["sucursales"],
    queryFn: fetchSucursales,
    enabled: isOpen,
  });

  // Cargar datos iniciales o resetear
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Modo edición: cargar datos del usuario
        const localidadId = initialData.localidadId;
        const departamentoId = initialData.departamentoId;
        const provinciaId = initialData.provinciaId;
        
        setFormData({
          nombre: initialData.nombre || "",
          apellido: initialData.apellido || "",
          dni: initialData.dni || null,
          direccion: initialData.direccion || "",
          telefono: initialData.telefono || null,
          mail: initialData.email || "",
          localidadId: localidadId || "",
          departamentoId: departamentoId || null,
          provinciaId: provinciaId || null,
          rolId: initialData.rolId || null,
          sucursalId: initialData.sucursalId || null,
          personaId: initialData.personaId || initialData.id,
        });
        
        // Si tenemos localidadId pero no provinciaId/departamentoId, obtenerlos
        if (localidadId && (!provinciaId || !departamentoId)) {
          fetchLocalidadById(Number(localidadId))
            .then((localidad) => {
              if (localidad) {
                const deptId = localidad.Departamento?.Id || localidad.departamento?.id;
                const provId = localidad.Departamento?.Provincia?.Id || localidad.departamento?.provincia?.id;
                
                if (deptId && provId) {
                  setSelectedProvinciaId(Number(provId));
                  setSelectedDepartamentoId(Number(deptId));
                  setFormData((prev) => ({
                    ...prev,
                    provinciaId: Number(provId),
                    departamentoId: Number(deptId),
                  }));
                }
              }
            })
            .catch((err) => {
              console.error("Error obteniendo localidad:", err);
            });
        } else {
          // Establecer valores para cascada si ya los tenemos
          if (provinciaId) {
            setSelectedProvinciaId(Number(provinciaId));
          }
          if (departamentoId) {
            setSelectedDepartamentoId(Number(departamentoId));
          }
        }
      } else {
        // Modo creación: resetear
        setFormData(defaultFormData);
        setSelectedProvinciaId(null);
        setSelectedDepartamentoId(null);
      }
    }
  }, [initialData, isOpen]);

  // Cuando cambia la provincia, resetear departamento y localidad
  useEffect(() => {
    if (selectedProvinciaId) {
      setSelectedDepartamentoId(null);
      setFormData((prev) => ({ ...prev, departamentoId: null, localidadId: "" }));
    }
  }, [selectedProvinciaId]);

  // Cuando cambia el departamento, resetear localidad
  useEffect(() => {
    if (selectedDepartamentoId) {
      setFormData((prev) => ({ ...prev, localidadId: "" }));
    }
  }, [selectedDepartamentoId]);

  const handleSubmit = () => {
    // Preparar payload según si es creación o edición
    if (isEdit) {
      // Para edición, usar el schema de actualización
      const payload: any = {
        personaId: formData.personaId,
      };
      
      if (formData.nombre) payload.nombre = formData.nombre;
      if (formData.apellido) payload.apellido = formData.apellido;
      if (formData.dni !== undefined) payload.dni = formData.dni;
      if (formData.direccion) payload.direccion = formData.direccion;
      if (formData.telefono !== undefined) payload.telefono = formData.telefono;
      if (formData.localidadId) payload.localidadId = formData.localidadId;
      if (formData.departamentoId !== undefined) payload.departamentoId = formData.departamentoId;
      if (formData.provinciaId !== undefined) payload.provinciaId = formData.provinciaId;
      if (formData.rolId !== undefined) payload.rolId = formData.rolId;
      if (formData.sucursalId !== undefined) payload.sucursalId = formData.sucursalId;

      onSubmit(payload);
    } else {
      // Para creación, usar el schema de creación
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
      if (formData.departamentoId) payload.departamentoId = formData.departamentoId;
      if (formData.provinciaId) payload.provinciaId = formData.provinciaId;
      if (formData.rolId) payload.rolId = formData.rolId;
      // sucursalId solo se envía en edición, no en creación
      if (isEdit && formData.sucursalId !== undefined) payload.sucursalId = formData.sucursalId;

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
                  onValueChange={(value) =>
                    setFormData({ ...formData, nombre: value })
                  }
                  isRequired
                  isDisabled={isSaving}
                />
                <Input
                  label="Apellido"
                  placeholder="Ingrese el apellido"
                  value={formData.apellido}
                  onValueChange={(value) =>
                    setFormData({ ...formData, apellido: value })
                  }
                  isRequired
                  isDisabled={isSaving}
                />
                <Input
                  label="DNI"
                  placeholder="Ingrese el DNI (opcional)"
                  value={formData.dni || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dni: value || null })
                  }
                  isDisabled={isSaving}
                />
                <Input
                  label="Teléfono"
                  placeholder="Ingrese el teléfono (opcional)"
                  value={formData.telefono || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, telefono: value || null })
                  }
                  isDisabled={isSaving}
                />
                <Input
                  label="Dirección"
                  placeholder="Ingrese la dirección"
                  value={formData.direccion}
                  onValueChange={(value) =>
                    setFormData({ ...formData, direccion: value })
                  }
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
                    selectedProvinciaId
                      ? [selectedProvinciaId.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    const provinciaId = selected ? Number(selected) : null;
                    setSelectedProvinciaId(provinciaId);
                    setFormData((prev) => ({
                      ...prev,
                      provinciaId: provinciaId,
                    }));
                  }}
                  isLoading={isLoadingProvincias}
                  isDisabled={isSaving}
                >
                  {provincias.map((provincia: any) => (
                    <SelectItem
                      key={provincia.id || provincia.Id}
                    >
                      {provincia.Descripcion || provincia.descripcion}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Departamento"
                  placeholder="Seleccione un departamento"
                  selectedKeys={
                    selectedDepartamentoId
                      ? [selectedDepartamentoId.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    const departamentoId = selected ? Number(selected) : null;
                    setSelectedDepartamentoId(departamentoId);
                    setFormData((prev) => ({
                      ...prev,
                      departamentoId: departamentoId,
                    }));
                  }}
                  isLoading={isLoadingDepartamentos}
                  isDisabled={isSaving || !selectedProvinciaId}
                >
                  {departamentos.map((departamento: any) => (
                    <SelectItem
                      key={departamento.id || departamento.Id}
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
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({
                      ...prev,
                      localidadId: selected ? Number(selected) : "",
                    }));
                  }}
                  isLoading={isLoadingLocalidades}
                  isDisabled={isSaving || !selectedDepartamentoId}
                  isRequired
                >
                  {localidades.map((localidad: any) => (
                    <SelectItem
                      key={localidad.id || localidad.Id}
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
                        setFormData({ ...formData, nombreUsuario: value })
                      }
                      isRequired
                      isDisabled={isSaving}
                    />
                    <Input
                      label="Contraseña"
                      placeholder="Mínimo 8 caracteres"
                      type="password"
                      value={formData.password || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, password: value })
                      }
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
                      setFormData({ ...formData, mail: value || undefined })
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
                    formData.rolId
                      ? [formData.rolId.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({
                      ...prev,
                      rolId: selected ? Number(selected) : null,
                    }));
                  }}
                  isLoading={isLoadingRoles}
                  isDisabled={isSaving}
                >
                  {roles.map((rol: any) => (
                    <SelectItem
                      key={rol.id || rol.Id}
                    >
                      {rol.nombre || rol.Descripcion || rol.descripcion}
                    </SelectItem>
                  ))}
                </Select>
                {/* Sucursal solo en modo edición - no se asigna al crear */}
                {isEdit && (
                  <Select
                    label="Sucursal"
                    placeholder="Seleccione una sucursal (opcional)"
                    selectedKeys={
                      formData.sucursalId
                        ? [formData.sucursalId.toString()]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData((prev) => ({
                        ...prev,
                        sucursalId: selected ? Number(selected) : null,
                      }));
                    }}
                    isLoading={isLoadingSucursales}
                    isDisabled={isSaving}
                  >
                    {sucursales.map((sucursal: any) => (
                      <SelectItem
                        key={sucursal.id || sucursal.Id}
                      >
                        {sucursal.nombre || sucursal.Nombre || sucursal.descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose} isDisabled={isSaving}>
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

