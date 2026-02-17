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
  Accordion,
  AccordionItem,
  Chip,
} from "@heroui/react";
import { GenericFormProps } from "@/components/shared/GenericCrud";
import { Usuario, SucursalUsuario } from "./UsuariosCRUD";
import { useUsuario } from "@/hooks/useUsuario";
import { User, MapPin, UserCog } from "lucide-react";

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
  sucursales?: SucursalUsuario[] | null;
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

  // Hook useUsuario para la gestión de estados y datos
  const {
    provincias,
    roles,
    sucursales,
    isLoadingProvincias,
    isLoadingRoles,
    isLoadingSucursales,
    useDepartamentos,
    useLocalidades,
  } = useUsuario();

  const { data: departamentos = [], isLoading: isLoadingDepartamentos } =
    useDepartamentos(formData.provinciaId);

  const { data: localidades = [], isLoading: isLoadingLocalidades } =
    useLocalidades(formData.departamentoId);

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

  const inputClassNames = {
    inputWrapper:
      "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
  };

  function getUsuarioSectionStatus(data: UsuarioFormData) {
    const personal =
      (data.nombre?.trim() ?? "").length > 0 &&
      (data.apellido?.trim() ?? "").length > 0 &&
      (data.direccion?.trim() ?? "").length > 0;
    const ubicacion = !!data.localidadId;
    const usuario = isEdit
      ? true
      : (data.nombreUsuario?.trim() ?? "").length > 0 &&
        (data.password?.trim() ?? "").length >= 8;
    return { personal, ubicacion, usuario };
  }

  const sectionStatus = getUsuarioSectionStatus(formData);

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
            {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
          </h3>
          {!isEdit && (
            <p className="text-sm text-[#6b7280] mt-1">
              Completa la información del empleado
            </p>
          )}
        </ModalHeader>
        <ModalBody className="p-0">
          <div className="px-6 py-6">
            <Accordion
              aria-label="Opciones del empleado"
              defaultSelectedKeys={["personal"]}
              selectionMode="single"
              variant="bordered"
              motionProps={{
                transition: { duration: 0.18, ease: "easeInOut" },
              }}
              className="gap-3 overflow-visible"
            >
              <AccordionItem
                key="personal"
                aria-label="Información Personal"
                title={
                  <SectionTitle
                    icon={User}
                    label="Información Personal"
                    isComplete={sectionStatus.personal}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                  label="Nombre"
                  placeholder="Ingrese el nombre"
                  value={formData.nombre}
                  onValueChange={(value) => handleChange("nombre", value)}
                  isRequired
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                />
                <Input
                  label="Apellido"
                  placeholder="Ingrese el apellido"
                  value={formData.apellido}
                  onValueChange={(value) => handleChange("apellido", value)}
                  isRequired
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                />
                <Input
                  label="DNI"
                  placeholder="Ingrese el DNI (opcional)"
                  maxLength={8}
                  value={formData.dni || ""}
                  onValueChange={(value) => handleChange("dni", value || null)}
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                />
                <Input
                  label="Teléfono"
                  placeholder="Ingrese el teléfono (opcional)"
                  maxLength={25}
                  value={formData.telefono || ""}
                  onValueChange={(value) =>
                    handleChange("telefono", value || null)
                  }
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                />
                <Input
                  label="Dirección"
                  placeholder="Ingrese la dirección"
                  value={formData.direccion}
                  onValueChange={(value) => handleChange("direccion", value)}
                  isRequired
                  isDisabled={isSaving}
                  className="md:col-span-2"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Provincia"
                  placeholder="Seleccione una provincia"
                  selectedKeys={
                    formData.provinciaId
                      ? [formData.provinciaId.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) handleChange("provinciaId", Number(val));
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
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) handleChange("departamentoId", Number(val));
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
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) handleChange("localidadId", val);
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
              </AccordionItem>

              <AccordionItem
                key="usuario"
                aria-label="Información de Usuario"
                title={
                  <SectionTitle
                    icon={UserCog}
                    label="Información de Usuario"
                    isComplete={sectionStatus.usuario}
                  />
                }
              >
                <div className="space-y-5 pt-5">
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
                      classNames={inputClassNames}
                    />
                    <Input
                      label="Contraseña"
                      placeholder="Mínimo 8 caracteres"
                      type="password"
                      value={formData.password || ""}
                      onValueChange={(value) => handleChange("password", value)}
                      isRequired
                      isDisabled={isSaving}
                      classNames={inputClassNames}
                    />
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
                      classNames={inputClassNames}
                    />
                  </>
                )}
                <Select
                  label="Rol"
                  placeholder="Seleccione un rol (opcional)"
                  selectedKeys={
                    formData.rolId ? [formData.rolId.toString()] : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) handleChange("rolId", Number(val));
                  }}
                  isLoading={isLoadingRoles}
                  isDisabled={
                    isSaving || initialData?.rolTipo === "ADMINISTRADOR"
                  }
                >
                  {roles
                    .filter((rol: any) => {
                      // If we are editing an admin, show everything (it's disabled anyway, needed for display)
                      if (initialData?.rolTipo === "ADMINISTRADOR") return true;

                      // Otherwise, hide ADMINISTRADOR
                      // Check by type or name (case insensitive)
                      const isAdministrator =
                        rol.tipo === "ADMINISTRADOR" ||
                        (rol.nombre &&
                          rol.nombre.toUpperCase() === "ADMINISTRADOR") ||
                        (rol.Descripcion &&
                          rol.Descripcion.toUpperCase() === "ADMINISTRADOR");

                      return !isAdministrator;
                    })
                    .map((rol: any) => (
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
            isDisabled={
              !formData.nombre ||
              !formData.apellido ||
              !formData.direccion ||
              !formData.localidadId ||
              (!isEdit && (!formData.nombreUsuario || !formData.password))
            }
            className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
          >
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
