"use client";

import { modalMotionProps } from "@/lib/motionConfig";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
import { User, MapPin, UserCog, Camera, X } from "lucide-react";

const ACCENT = "#67afc3";

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
  foto?: string | null; // base64, URL existente o null
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
  foto: null,
};

export default function UsuarioForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Usuario>) {
  const [formData, setFormData] = useState<UsuarioFormData>(defaultFormData);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          foto: initialData.foto || null,
        });
        setFotoPreview(initialData.foto || null);
      } else {
        setFormData(defaultFormData);
        setFotoPreview(null);
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

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setFotoPreview(result);
      setFormData((prev) => ({ ...prev, foto: result }));
    };
    reader.readAsDataURL(file);
    // Reset para poder seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  const handleQuitarFoto = () => {
    setFotoPreview(null);
    setFormData((prev) => ({ ...prev, foto: null }));
  };

  /** Genera iniciales a partir del nombre y apellido del formulario */
  const getInitials = () => {
    const n = formData.nombre?.trim()[0]?.toUpperCase() ?? "";
    const a = formData.apellido?.trim()[0]?.toUpperCase() ?? "";
    return n + a || "?";
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
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm shrink-0">
          <Icon className="w-4 h-4 text-[#67afc3]" />
        </div>
        <span className="font-semibold text-slate-800 tracking-tight">{label}</span>
      </div>
      <Chip
        size="sm"
        variant="flat"
        className={
          isComplete
            ? "bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider text-[10px] border-0 shrink-0"
            : "bg-warning-50 text-warning-600 font-bold uppercase tracking-wider text-[10px] border-0 shrink-0"
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
      // Foto: enviar siempre (puede ser base64 nueva, URL existente o null para quitar)
      payload.foto = formData.foto ?? null;

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
      if (formData.foto) payload.foto = formData.foto;

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
      backdrop="opaque"
      isDismissable={!isSaving}
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{
        backdrop: "bg-slate-900/40 backdrop-blur-md",
        wrapper: "items-end sm:items-center",
        base: "font-sans bg-white/95 backdrop-blur-2xl rounded-t-[20px] rounded-b-none sm:rounded-[24px] shadow-2xl border border-white/60 max-w-full sm:max-w-[820px] max-h-[92vh] overflow-hidden w-full sm:w-auto m-0 sm:m-auto",
        header: "border-b border-slate-100/60 pb-4 pt-6 px-6 sm:px-8 bg-transparent",
        body: "py-0 px-4 sm:px-8 overflow-y-auto overflow-x-hidden",
        footer: "border-t border-slate-100/60 py-4 px-4 sm:px-8 bg-transparent",
        closeButton: "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm">
              <User className="w-5 h-5 text-[#67afc3]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEdit ? "Modifica los datos del empleado seleccionado" : "Completa la información del empleado"}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="p-0">
          <div className="py-6">
            {/* ── Foto de perfil ── */}
            <div className="flex flex-col items-center gap-3 mb-6 px-1">
              <div className="relative group">
                {/* Avatar: foto o iniciales */}
                <button
                  type="button"
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl
                             overflow-hidden shadow-md ring-2 ring-white focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-[#67afc3]/50
                             transition-all duration-200 hover:ring-[#67afc3]/40 cursor-pointer"
                  aria-label="Cambiar foto de empleado"
                >
                  {fotoPreview ? (
                    <Image
                      src={fotoPreview}
                      alt="Foto del empleado"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {getInitials()}
                    </div>
                  )}
                  {/* Overlay con icono cámara */}
                  <div className="absolute inset-0 flex items-center justify-center
                                  bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>

                {/* Botón quitar foto */}
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={handleQuitarFoto}
                    disabled={isSaving}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center
                               rounded-full bg-rose-500 text-white shadow-sm
                               hover:bg-rose-600 transition-colors focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-rose-400/50"
                    aria-label="Quitar foto"
                  >
                    <X className="w-3 h-3" strokeWidth={3} />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-400 font-medium">
                {fotoPreview ? "Click para cambiar · PNG, JPG · máx. 5 MB" : "Click para agregar foto (opcional)"}
              </p>

              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFotoChange}
                disabled={isSaving}
              />
            </div>
            <Accordion
              aria-label="Opciones del empleado"
              defaultSelectedKeys={["personal"]}
              selectionMode="single"
              variant="bordered"
              itemClasses={{
                base: "border-slate-200 shadow-sm bg-white hover:bg-slate-50/50 transition-colors rounded-xl",
                titleWrapper: "py-3",
              }}
              motionProps={{
                transition: { duration: 0.18, ease: "easeInOut" },
              }}
              className="gap-3 overflow-visible px-1"
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
                  autoFocus
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
