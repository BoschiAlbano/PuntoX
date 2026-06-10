"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Usuario, SucursalUsuario } from "./UsuariosCRUD";
import { useUsuario } from "@/hooks/useUsuario";
import { User, MapPin, UserCog, Camera, X } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

const ACCENT = "#0F2233"; // Changed from #67afc3 to match new style

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

interface UsuarioFormProps {
  initialData: Usuario | null;
  onSubmit: (data: Partial<Usuario>) => void;
  isSaving: boolean;
  onCancel: () => void;
}

export default function UsuarioForm({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: UsuarioFormProps) {
  const { isAdministrador, isSuperAdmin } = useUserStore();
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
  }, [initialData]);

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
      "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#0F2233] focus-within:ring-1 focus-within:ring-[#0F2233]/20",
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
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0F2233] to-[#1a364d] shadow-sm flex-shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isEdit
                ? "Actualiza la información del empleado"
                : "Completa los datos para registrar un nuevo empleado"}
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
            isDisabled={
              !formData.nombre ||
              !formData.apellido ||
              !formData.direccion ||
              !formData.localidadId ||
              (!isEdit && (!formData.nombreUsuario || !formData.password))
            }
            className="flex-1 sm:flex-none bg-[#0F2233] hover:bg-[#1a364d] text-white font-semibold shadow-md shadow-[#0F2233]/20"
          >
            {isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: Info General y Usuario */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* FOTO DE PERFIL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col items-center py-6 px-6 relative">
            <div className="relative group">
              {/* Avatar: foto o iniciales */}
              <button
                type="button"
                onClick={() => !isSaving && fileInputRef.current?.click()}
                disabled={isSaving}
                className="relative flex h-24 w-24 items-center justify-center rounded-2xl
                           overflow-hidden shadow-md ring-2 ring-white focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#0F2233]/50
                           transition-all duration-200 hover:ring-[#0F2233]/40 cursor-pointer"
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
                    className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {getInitials()}
                  </div>
                )}
                {/* Overlay con icono cámara */}
                <div className="absolute inset-0 flex items-center justify-center
                                bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Botón quitar foto */}
              {fotoPreview && (
                <button
                  type="button"
                  onClick={handleQuitarFoto}
                  disabled={isSaving}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center
                             rounded-full bg-rose-500 text-white shadow-sm
                             hover:bg-rose-600 transition-colors focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-rose-400/50 z-10"
                  aria-label="Quitar foto"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              )}
            </div>

            <p className="text-sm text-slate-500 font-medium mt-4">
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

          {/* INFORMACIÓN PERSONAL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
              <User className="text-slate-400 w-5 h-5" />
              <h3 className="font-semibold text-slate-800 text-base">
                Información Personal
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                className="sm:col-span-2"
                classNames={inputClassNames}
              />
            </div>
          </div>

          {/* INFORMACIÓN DE USUARIO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
              <UserCog className="text-slate-400 w-5 h-5" />
              <h3 className="font-semibold text-slate-800 text-base">
                Información de Usuario
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    className="sm:col-span-2"
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
                isDisabled={isSaving}
              >
                {roles
                  .filter((rol: any) => {
                    const rolTipoStr = rol.tipo || rol.Tipo || rol.nombre || rol.Descripcion || "";
                    const rolTipo = rolTipoStr.toUpperCase();
                    const isRolSuperAdmin = rolTipo === "SUPERADMIN";
                    const isRolAdmin = rolTipo === "ADMINISTRADOR";
                    
                    // Regla 1: Empleado no puede ver ADMIN ni SUPERADMIN
                    if (!isAdministrador && !isSuperAdmin) {
                      if (isRolAdmin || isRolSuperAdmin) return false;
                    }

                    // Regla 2: Administrador no puede ver SUPERADMIN
                    if (isAdministrador && !isSuperAdmin) {
                      if (isRolSuperAdmin) return false;
                    }

                    // Regla 3: Prevención de descenso de rango (downgrade)
                    if (isEdit && initialData) {
                      const editedRolTipo = initialData.rolTipo?.toUpperCase();
                      
                      // Si editamos a un SUPERADMIN, solo puede ser SUPERADMIN
                      if (editedRolTipo === "SUPERADMIN" && !isRolSuperAdmin) {
                        return false;
                      }

                      // Si editamos a un ADMINISTRADOR, no puede ser degradado a EMPLEADO
                      if (editedRolTipo === "ADMINISTRADOR" && !isRolAdmin && !isRolSuperAdmin) {
                        return false;
                      }
                    }

                    return true;
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
        </div>

        {/* COLUMNA DERECHA: Ubicación */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
              <MapPin className="text-slate-400 w-5 h-5" />
              <h3 className="font-semibold text-slate-800 text-base">
                Ubicación
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
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
        </div>
      </div>
    </div>
  );
}
