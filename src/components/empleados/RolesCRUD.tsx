"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Tooltip,
  Input,
  Spinner,
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
import { handleError } from "@/lib/auth/errorHandler";

export type Rol = {
  id: number;
  nombre: string;
  usuarios: number;
  tipo: "ADMINISTRADOR" | "EMPLEADO";
  descripcion?: string | null;
  permisos?: string[];
};

const permisosDisponibles = [
  "Ventas",
  "Caja",
  "Clientes",
  "Productos",
  "Analiticas",
  "Configuracion",
  "Empleados",
];

export default function RolesCRUD() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [rolAEditar, setRolAEditar] = useState<Rol | null>(null);
  const [rolAEliminar, setRolAEliminar] = useState<Rol | null>(null);

  const [nuevoRol, setNuevoRol] = useState({
    nombre: "",
    descripcion: "",
    permisos: ["Ventas", "Caja"],
    tipo: "EMPLEADO" as "ADMINISTRADOR" | "EMPLEADO",
  });

  const [rolEditDraft, setRolEditDraft] = useState({
    nombre: "",
    descripcion: "",
    tipo: "EMPLEADO" as "ADMINISTRADOR" | "EMPLEADO",
    permisos: [] as string[],
  });

  // Query para obtener roles
  const {
    data: roles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["roles-crud"],
    queryFn: async () => {
      const response = await fetch("/api/roles");
      if (!response.ok) throw new Error("Error al cargar roles");
      return await response.json();
    },
  });

  // Mutation para crear rol
  const createMutation = useMutation({
    mutationFn: async (data: typeof nuevoRol) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear rol");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      addToast({
        title: "Rol creado",
        description: "El rol se creó exitosamente",
        color: "success",
      });
      setOpenCreateModal(false);
      setNuevoRol({
        nombre: "",
        descripcion: "",
        permisos: ["Ventas", "Caja"],
        tipo: "EMPLEADO",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear rol");
    },
  });

  // Mutation para actualizar rol
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: typeof rolEditDraft;
    }) => {
      const response = await fetch(`/api/roles?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar rol");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      addToast({
        title: "Rol actualizado",
        description: "Los cambios se guardaron exitosamente",
        color: "success",
      });
      setRolAEditar(null);
      setRolEditDraft({
        nombre: "",
        descripcion: "",
        tipo: "EMPLEADO",
        permisos: [],
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al actualizar rol");
    },
  });

  // Mutation para eliminar rol
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/roles?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar rol");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      addToast({
        title: "Rol eliminado",
        description: "El rol se eliminó exitosamente",
        color: "success",
      });
      setRolAEliminar(null);
    },
    onError: (error: Error) => {
      handleError(error, "Error al eliminar rol");
    },
  });

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

    createMutation.mutate(nuevoRol);
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

    updateMutation.mutate({ id: rolAEditar.id, data: rolEditDraft });
  };

  const handleEliminarRol = () => {
    if (!rolAEliminar) return;
    deleteMutation.mutate(rolAEliminar.id);
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

  !isLoading && console.log(roles);

  return (
    <div className="space-y-4">
      {/* Header con botones de acción */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles</h2>
          <p className="text-sm text-gray-600">
            Gestiona los roles y permisos del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Actualizar">
            <Button
              isIconOnly
              variant="flat"
              onPress={handleRefresh}
              isLoading={isRefreshing}
            >
              <RefreshCw size={18} />
            </Button>
          </Tooltip>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            onPress={() => setOpenCreateModal(true)}
          >
            Nuevo Rol
          </Button>
        </div>
      </div>

      {/* Grid de roles */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles?.roles.map((rol: Rol) => {
            const esRolSistema =
              rol.id < 0 ||
              rol.nombre.toLowerCase() === "administrador" ||
              rol.nombre.toLowerCase() === "admin" ||
              rol.nombre.toLowerCase() === "superadmin";
            const tieneUsuarios = rol.usuarios > 0;
            const puedeEliminar = !esRolSistema && !tieneUsuarios;

            return (
              <Card key={rol.id} className="border border-gray-200">
                <CardHeader className="flex flex-col items-start gap-2 pb-2">
                  <div className="flex items-center justify-between w-full">
                    <Chip
                      size="sm"
                      color={
                        rol.tipo === "ADMINISTRADOR" ? "primary" : "secondary"
                      }
                      variant="flat"
                    >
                      {rol.tipo}
                    </Chip>
                    <div className="flex items-center gap-1">
                      <Tooltip content="Editar">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {rol.nombre}
                  </h3>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-sm text-gray-600 mb-3">
                    {rol.descripcion || "Sin descripción"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={16} />
                    <span>
                      {rol.usuarios} usuario{rol.usuarios !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {rol.permisos && rol.permisos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {rol.permisos.map((permiso) => (
                        <Chip key={permiso} size="sm" variant="flat">
                          {permiso}
                        </Chip>
                      ))}
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
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Crear nuevo rol</h3>
            <p className="text-sm text-gray-500 font-normal">
              Define permisos base. Luego podrás afinarlos en cada usuario.
            </p>
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
                    tipo: e.target.value as "ADMINISTRADOR" | "EMPLEADO",
                  }))
                }
                isRequired
              >
                <SelectItem key="ADMINISTRADOR">Administrador</SelectItem>
                <SelectItem key="EMPLEADO">Empleado</SelectItem>
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
              <p className="text-sm font-semibold text-gray-700">Permisos</p>
              <div className="flex flex-wrap gap-2">
                {permisosDisponibles.map((permiso) => {
                  const activo = nuevoRol.permisos.includes(permiso);
                  return (
                    <Button
                      key={permiso}
                      size="sm"
                      variant={activo ? "solid" : "bordered"}
                      color={activo ? "primary" : "default"}
                      onPress={() =>
                        setNuevoRol((prev) => ({
                          ...prev,
                          permisos: activo
                            ? prev.permisos.filter((p) => p !== permiso)
                            : [...prev.permisos, permiso],
                        }))
                      }
                    >
                      {permiso}
                    </Button>
                  );
                })}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setOpenCreateModal(false)}
              isDisabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleCrearRol}
              isLoading={createMutation.isPending}
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
            tipo: "EMPLEADO",
            permisos: [],
          });
        }}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Editar rol</h3>
            <p className="text-sm text-gray-500">
              Modifica los permisos y configuración del rol.
            </p>
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
                        tipo: e.target.value as "ADMINISTRADOR" | "EMPLEADO",
                      }))
                    }
                    isDisabled={esRolSistema}
                  >
                    <SelectItem key="ADMINISTRADOR">Administrador</SelectItem>
                    <SelectItem key="EMPLEADO">Empleado</SelectItem>
                  </Select>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Permisos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {permisosDisponibles.map((permiso) => {
                        const activo = rolEditDraft.permisos.includes(permiso);
                        return (
                          <Button
                            key={permiso}
                            size="sm"
                            variant={activo ? "solid" : "bordered"}
                            color={activo ? "primary" : "default"}
                            onPress={() =>
                              setRolEditDraft((prev) => ({
                                ...prev,
                                permisos: activo
                                  ? prev.permisos.filter((p) => p !== permiso)
                                  : [...prev.permisos, permiso],
                              }))
                            }
                          >
                            {permiso}
                          </Button>
                        );
                      })}
                    </div>
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
                  tipo: "EMPLEADO",
                  permisos: [],
                });
              }}
              isDisabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleEditarRol}
              isLoading={updateMutation.isPending}
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
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Eliminar rol</h3>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer
            </p>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-700">
              ¿Estás seguro de que deseas eliminar el rol{" "}
              <span className="font-semibold text-slate-900">
                &quot;{rolAEliminar?.nombre}&quot;
              </span>
              ? Esta acción eliminará permanentemente el rol y todos sus
              permisos asociados.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setRolAEliminar(null)}
              isDisabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleEliminarRol}
              isLoading={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
