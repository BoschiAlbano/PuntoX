"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Tooltip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react";
import { Pencil, Trash2, RefreshCw, Plus, Users } from "lucide-react";
import {
  PERMISSION_MODULES,
  PERMISSION_MODULE_LABELS,
  WRITABLE_MODULES,
  TIPO_PERFIL,
  type TipoPerfil,
  type PermissionModule,
} from "@/lib/constants/comprobantes";
import { LoadingComponent } from "../loading/loading";
import { useRoles, Rol } from "@/hooks/useRoles";

const WRITABLE_MODULE_SET = new Set<PermissionModule>(
  WRITABLE_MODULES as PermissionModule[],
);

/** Renderiza la tabla de permisos por módulo */
function PermisosTable({
  permisos,
  onChange,
  readOnly = false,
  showOnlyAssigned = false,
}: {
  permisos: string[];
  onChange?: (permisos: string[]) => void;
  readOnly?: boolean;
  showOnlyAssigned?: boolean;
}) {
  const toggle = (clave: string) => {
    if (readOnly || !onChange) return;
    const next = permisos.includes(clave)
      ? permisos.filter((p) => p !== clave)
      : [...permisos, clave];
    onChange(next);
  };

  const toggleRow = (mod: PermissionModule, checked: boolean) => {
    if (readOnly || !onChange) return;
    const rowKeys = [
      `${mod}:page`,
      `${mod}:get`,
      ...(WRITABLE_MODULE_SET.has(mod) ? [`${mod}:set`] : []),
    ];
    const next = checked
      ? Array.from(new Set([...permisos, ...rowKeys]))
      : permisos.filter((p) => !rowKeys.includes(p));
    onChange(next);
  };

  const CellBtn = ({ clave, color }: { clave: string; color: string }) => {
    const active = permisos.includes(clave);
    return (
      <button
        type="button"
        disabled={readOnly}
        onClick={() => toggle(clave)}
        className={`w-full h-8 rounded-md text-[11px] font-bold transition-all border ${
          active ? color : "bg-white text-slate-400 border-slate-200"
        }`}
      >
        {active ? "✓" : "+"}
      </button>
    );
  };

  const visibleModules = PERMISSION_MODULES.filter((mod) => {
    if (!showOnlyAssigned) return true;

    const rowKeys = [
      `${mod}:page`,
      `${mod}:get`,
      ...(WRITABLE_MODULE_SET.has(mod) ? [`${mod}:set`] : []),
    ];

    return rowKeys.some((key) => permisos.includes(key));
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">
              Módulo
            </th>
            <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
              Página
            </th>
            <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
              Leer
            </th>
            <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
              Escribir
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleModules.map((mod) => {
            const hasWrite = WRITABLE_MODULE_SET.has(mod);
            const rowKeys = [
              `${mod}:page`,
              `${mod}:get`,
              ...(hasWrite ? [`${mod}:set`] : []),
            ];
            const allActive = rowKeys.every((k) => permisos.includes(k));
            return (
              <tr
                key={mod}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="py-1.5 px-3">
                  <label
                    className={`flex items-center gap-2 select-none ${
                      readOnly ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={allActive}
                      onChange={(e) => toggleRow(mod, e.target.checked)}
                      className={`w-4 h-4 rounded accent-[#67afc3] ${
                        readOnly ? "cursor-default" : "cursor-pointer"
                      }`}
                    />
                    <span className="font-medium text-slate-700">
                      {PERMISSION_MODULE_LABELS[mod]}
                    </span>
                  </label>
                </td>
                <td className="py-1.5 px-2">
                  <CellBtn
                    clave={`${mod}:page`}
                    color="bg-[#67afc3]/10 text-[#67afc3] border-[#67afc3]/30"
                  />
                </td>
                <td className="py-1.5 px-2">
                  <CellBtn
                    clave={`${mod}:get`}
                    color="bg-blue-50 text-blue-600 border-blue-200"
                  />
                </td>
                <td className="py-1.5 px-2">
                  {hasWrite ? (
                    <CellBtn
                      clave={`${mod}:set`}
                      color="bg-amber-50 text-amber-600 border-amber-200"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-8 text-slate-300 text-xs">
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-400">
        <span className="text-[#67afc3] font-semibold">Página</span> → acceso a
        la sección · <span className="text-blue-500 font-semibold">Leer</span> →
        consultar datos ·{" "}
        <span className="text-amber-500 font-semibold">Escribir</span> → crear,
        editar y eliminar
      </p>

      {showOnlyAssigned && visibleModules.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Este rol no tiene módulos asignados.
        </p>
      ) : null}
    </div>
  );
}

export default function RolesCRUD() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [rolAEditar, setRolAEditar] = useState<Rol | null>(null);
  const [rolAEliminar, setRolAEliminar] = useState<Rol | null>(null);
  const [rolVerPermisos, setRolVerPermisos] = useState<Rol | null>(null);

  const [nuevoRol, setNuevoRol] = useState({
    nombre: "",
    descripcion: "",
    permisos: [] as string[],
    tipo: TIPO_PERFIL.EMPLEADO as TipoPerfil,
  });

  const [rolEditDraft, setRolEditDraft] = useState({
    nombre: "",
    descripcion: "",
    tipo: TIPO_PERFIL.EMPLEADO as TipoPerfil,
    permisos: [] as string[],
  });

  // Usar Custom Hook
  const {
    rolesData: roles = [],
    isLoading,
    refetch,
    createRol,
    updateRol,
    deleteRol,
  } = useRoles();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCrearRol = () => {
    if (!nuevoRol.nombre.trim()) {
      addToast({
        title: "Nombre requerido",
        description: "Define un nombre para el rol.",
        color: "warning",
      });
      return;
    }

    if (!nuevoRol.permisos.length) {
      addToast({
        title: "Selecciona permisos",
        description: "El rol debe tener al menos un permiso.",
        color: "warning",
      });
      return;
    }

    createRol.mutate(nuevoRol, {
      onSuccess: () => {
        setOpenCreateModal(false);
        setNuevoRol({
          nombre: "",
          descripcion: "",
          permisos: [],
          tipo: TIPO_PERFIL.EMPLEADO,
        });
      },
    });
  };

  const handleEditarRol = () => {
    if (!rolAEditar) return;

    if (!rolEditDraft.nombre.trim()) {
      addToast({
        title: "Nombre requerido",
        description: "Define un nombre para el rol.",
        color: "warning",
      });
      return;
    }

    if (!rolEditDraft.permisos.length) {
      addToast({
        title: "Selecciona permisos",
        description: "El rol debe tener al menos un permiso.",
        color: "warning",
      });
      return;
    }

    updateRol.mutate(
      { id: rolAEditar.id, data: rolEditDraft },
      {
        onSuccess: () => {
          setRolAEditar(null);
          setRolEditDraft({
            nombre: "",
            descripcion: "",
            tipo: TIPO_PERFIL.EMPLEADO,
            permisos: [],
          });
        },
      },
    );
  };

  const handleEliminarRol = () => {
    if (!rolAEliminar) return;
    deleteRol.mutate(rolAEliminar.id, {
      onSuccess: () => {
        setRolAEliminar(null);
      },
    });
  };

  const handleEditClick = (rol: Rol) => {
    setRolAEditar(rol);
    setRolEditDraft({
      nombre: rol.nombre,
      descripcion: rol.descripcion || "",
      tipo: rol.tipo,
      permisos: rol.permisos || [],
    });
  };

  return (
    <div className="space-y-4">
      {/* Header con botones de acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Roles del Sistema
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona los niveles de acceso y permisos del personal.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Botón de actualizar */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#67afc3]/40 transition-all shadow-sm group disabled:opacity-50"
            title="Actualizar"
            aria-label="Actualizar datos"
          >
            <RefreshCw
              size={18}
              className={`text-slate-500 group-hover:text-[#67afc3] transition-colors ${
                isRefreshing ? "animate-spin text-[#67afc3]" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          {/* Botón nuevo con efecto lift */}
          <button
            onClick={() => setOpenCreateModal(true)}
            className="flex-1 sm:flex-none px-4 h-11 rounded-xl bg-[#67afc3] hover:bg-[#5a9db0] transition-colors disabled:opacity-50 hover:shadow shadow-sm disabled:shadow-none text-white font-semibold cursor-pointer flex items-center justify-center gap-2"
            aria-label="Nuevo Rol"
          >
            <Plus size={18} />
            Nuevo Rol
          </button>
        </div>
      </div>

      {/* Grid de roles */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingComponent message="Cargando roles..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles?.roles?.map((rol: Rol) => {
            const esRolSistema =
              rol.id < 0 ||
              rol.nombre.toLowerCase() === "administrador" ||
              rol.nombre.toLowerCase() === "admin" ||
              rol.nombre.toLowerCase() === "superadmin";
            const tieneUsuarios = rol.usuarios > 0;
            const puedeEliminar = !esRolSistema && !tieneUsuarios;

            return (
              <Card
                key={rol.id}
                className="bg-linear-to-br from-slate-50 to-white border border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-shadow group"
              >
                <CardHeader className="flex flex-col items-start gap-2 pt-5 px-5">
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                        rol.tipo === TIPO_PERFIL.ADMINISTRADOR
                          ? "bg-[#67afc3]/15 text-[#67afc3]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {rol.tipo}
                    </span>
                    <div className="flex items-center gap-1">
                      <Tooltip
                        content={
                          esRolSistema
                            ? "No se puede editar el rol de sistema"
                            : "Editar"
                        }
                      >
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          isDisabled={esRolSistema}
                          onPress={() => handleEditClick(rol)}
                        >
                          <Pencil size={16} />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        content={
                          !puedeEliminar
                            ? tieneUsuarios
                              ? "El rol tiene usuarios asignados"
                              : "No se puede eliminar un rol del sistema"
                            : "Eliminar rol"
                        }
                      >
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          isDisabled={!puedeEliminar}
                          onPress={() => setRolAEliminar(rol)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    {rol.nombre}
                  </h3>
                </CardHeader>
                <CardBody className="pt-0 px-5 pb-5">
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-10">
                    {rol.descripcion ||
                      "Sin descripción proporcionada para este rol."}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-lg w-fit mb-4">
                    <Users size={14} className="text-[#67afc3]" />
                    <span>
                      {rol.usuarios} usuario{rol.usuarios !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {rol.permisos && rol.permisos.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-3">
                      <Button
                        variant="light"
                        size="sm"
                        className="self-start text-[#67afc3] font-medium px-2 py-1 data-[hover=true]:bg-[#67afc3]/10 h-auto min-h-0"
                        onPress={() => setRolVerPermisos(rol)}
                      >
                        Ver permisos ({rol.permisos.length})
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Crear Rol */}
      <Modal
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        size="xl"
        placement="center"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md",
          base: "font-sans bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60 max-w-xl",
          header:
            "border-b border-slate-100/60 pb-4 pt-6 px-6 sm:px-8 bg-transparent",
          body: "py-6 px-6 sm:px-8 overflow-y-auto overflow-x-hidden",
          footer:
            "border-t border-slate-100/60 py-4 px-6 sm:px-8 bg-transparent",
          closeButton:
            "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm">
                <Plus className="w-5 h-5 text-[#67afc3]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Crear Nuevo Rol
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Define permisos base. Luego podrás afinarlos en cada usuario.
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Ej: Supervisor de turno"
                value={nuevoRol.nombre}
                onChange={(e) =>
                  setNuevoRol((prev) => ({ ...prev, nombre: e.target.value }))
                }
                isRequired
              />
              <Select
                label="Tipo de rol"
                selectedKeys={[nuevoRol.tipo]}
                onChange={(e) =>
                  setNuevoRol((prev) => ({
                    ...prev,
                    tipo: e.target.value as TipoPerfil,
                  }))
                }
                isRequired
              >
                <SelectItem key={TIPO_PERFIL.EMPLEADO}>Empleado</SelectItem>
              </Select>
            </div>
            <Textarea
              label="Descripción"
              placeholder="Qué puede y qué no puede hacer este rol"
              value={nuevoRol.descripcion}
              onChange={(e) =>
                setNuevoRol((prev) => ({
                  ...prev,
                  descripcion: e.target.value,
                }))
              }
            />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Permisos</p>
              <PermisosTable
                permisos={nuevoRol.permisos}
                onChange={(permisos) =>
                  setNuevoRol((prev) => ({ ...prev, permisos }))
                }
              />
            </div>
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button
              variant="light"
              onPress={() => setOpenCreateModal(false)}
              isDisabled={createRol.isPending}
              className="font-medium text-[#6b7280] hover:bg-[#f1f5f9] h-11 px-5 rounded-[10px]"
            >
              Cancelar
            </Button>
            <Button
              onPress={handleCrearRol}
              isLoading={createRol.isPending}
              className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow"
            >
              Crear rol
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Editar Rol */}
      <Modal
        isOpen={!!rolAEditar}
        onClose={() => {
          setRolAEditar(null);
          setRolEditDraft({
            nombre: "",
            descripcion: "",
            tipo: TIPO_PERFIL.EMPLEADO,
            permisos: [],
          });
        }}
        size="xl"
        placement="center"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md",
          base: "font-sans bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60 max-w-xl",
          header:
            "border-b border-slate-100/60 pb-4 pt-6 px-6 sm:px-8 bg-transparent",
          body: "py-6 px-6 sm:px-8 overflow-y-auto overflow-x-hidden",
          footer:
            "border-t border-slate-100/60 py-4 px-6 sm:px-8 bg-transparent",
          closeButton:
            "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm">
                <Pencil className="w-5 h-5 text-[#67afc3]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Editar Rol
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Modifica los permisos y configuración del rol.
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {(() => {
              const esRolSistema =
                (rolAEditar?.id ?? 0) < 0 ||
                rolAEditar?.nombre.toLowerCase() === "administrador" ||
                rolAEditar?.nombre.toLowerCase() === "admin" ||
                rolAEditar?.nombre.toLowerCase() === "superadmin";

              return (
                <>
                  <Input
                    label="Nombre"
                    value={rolEditDraft.nombre}
                    onChange={(e) =>
                      setRolEditDraft((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    isDisabled={esRolSistema}
                  />
                  <Textarea
                    label="Descripción"
                    value={rolEditDraft.descripcion}
                    onChange={(e) =>
                      setRolEditDraft((prev) => ({
                        ...prev,
                        descripcion: e.target.value,
                      }))
                    }
                  />
                  <Select
                    label="Tipo de rol"
                    selectedKeys={[rolEditDraft.tipo]}
                    onChange={(e) =>
                      setRolEditDraft((prev) => ({
                        ...prev,
                        tipo: e.target.value as TipoPerfil,
                      }))
                    }
                    isDisabled={esRolSistema}
                  >
                    <SelectItem key={TIPO_PERFIL.EMPLEADO}>Empleado</SelectItem>
                  </Select>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Permisos
                    </p>
                    <PermisosTable
                      permisos={rolEditDraft.permisos}
                      onChange={(permisos) =>
                        setRolEditDraft((prev) => ({ ...prev, permisos }))
                      }
                    />
                  </div>
                </>
              );
            })()}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setRolAEditar(null);
                setRolEditDraft({
                  nombre: "",
                  descripcion: "",
                  tipo: TIPO_PERFIL.EMPLEADO,
                  permisos: [],
                });
              }}
              isDisabled={updateRol.isPending}
              className="font-medium text-[#6b7280] hover:bg-[#f1f5f9] h-11 px-5 rounded-[10px]"
            >
              Cancelar
            </Button>
            <Button
              onPress={handleEditarRol}
              isLoading={updateRol.isPending}
              className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow"
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Eliminar Rol */}
      <Modal
        isOpen={!!rolAEliminar}
        onClose={() => setRolAEliminar(null)}
        size="md"
        placement="center"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md",
          base: "bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60",
          header: "border-b border-slate-100/60 pb-3",
          footer: "border-t border-slate-100/60 pt-3",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 py-5 px-6">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  Eliminar Rol
                </h3>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 py-2">
            <p className="text-sm text-gray-700">
              ¿Estás seguro de que deseas eliminar el rol{" "}
              <span className="font-semibold text-slate-900">
                &quot;{rolAEliminar?.nombre}&quot;
              </span>
              ? Esta acción eliminará permanentemente el rol y todos sus
              permisos asociados.
            </p>
          </ModalBody>
          <ModalFooter className="px-6 py-4">
            <Button
              variant="light"
              onPress={() => setRolAEliminar(null)}
              isDisabled={deleteRol.isPending}
              className="font-medium text-slate-500 h-11"
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleEliminarRol}
              isLoading={deleteRol.isPending}
              className="font-semibold h-11 shadow-sm"
            >
              Sí, eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Ver Permisos */}
      <Modal
        isOpen={!!rolVerPermisos}
        onClose={() => setRolVerPermisos(null)}
        size="xl"
        placement="center"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md",
          base: "font-sans bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60",
          header:
            "border-b border-slate-100/60 pb-4 pt-6 px-6 sm:px-8 bg-transparent",
          body: "py-6 px-6 sm:px-8 overflow-y-auto overflow-x-hidden",
          footer:
            "border-t border-slate-100/60 py-4 px-6 sm:px-8 bg-transparent hidden",
          closeButton:
            "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Permisos: {rolVerPermisos?.nombre}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Vista del esquema de accesos asignados a este rol.
            </p>
          </ModalHeader>
          <ModalBody>
            <PermisosTable
              permisos={rolVerPermisos?.permisos ?? []}
              readOnly
              showOnlyAssigned
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
