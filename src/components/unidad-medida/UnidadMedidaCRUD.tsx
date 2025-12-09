"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Switch,
  Chip,
  Tooltip,
  useDisclosure,
  addToast,
  Spinner,
} from "@heroui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UnidadMedida {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// Función para obtener unidades de medida
const fetchUnidades = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<UnidadMedida[]> => {
  const response = await fetch("/api/unidades-medida", { signal });
  if (!response.ok) {
    throw new Error("Error al cargar unidades de medida");
  }
  const data = await response.json();
  return Array.isArray(data?.unidades) ? data.unidades : [];
};

export default function UnidadMedidaCRUD() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [unidadSeleccionada, setUnidadSeleccionada] =
    useState<UnidadMedida | null>(null);
  const [unidadAEliminar, setUnidadAEliminar] = useState<UnidadMedida | null>(
    null
  );
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<UnidadMedida>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  // Query para obtener unidades
  const {
    data: unidades = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["unidades-medida"],
    queryFn: fetchUnidades,
  });

  // Mutación para crear/actualizar
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<UnidadMedida>) => {
      const isEdit = modoEdicion && unidadSeleccionada;
      const url = isEdit
        ? `/api/unidades-medida/?Id=${unidadSeleccionada.Id}`
        : "/api/unidades-medida";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades-medida"] });
      addToast({
        title: "Éxito",
        description: `Unidad de medida ${
          modoEdicion ? "actualizada" : "creada"
        } correctamente`,
        color: "success",
      });
      onClose();
    },
    onError: (error: ApiError) => {
      if (error.details && error.details.length > 0) {
        error.details.forEach((detail) => {
          addToast({
            title: "Error de validación",
            description: detail.message,
            color: "danger",
          });
        });
      } else {
        addToast({
          title: "Error",
          description: error.error || "Error al guardar la unidad de medida",
          color: "danger",
        });
      }
    },
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/unidades-medida/?Id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades-medida"] });
      addToast({
        title: "Éxito",
        description: "Unidad de medida eliminada correctamente",
        color: "success",
      });
      onDeleteClose();
      setUnidadAEliminar(null);
    },
    onError: (error: ApiError) => {
      addToast({
        title: "Error",
        description: error.error || "Error al eliminar la unidad de medida",
        color: "danger",
      });
    },
  });

  // Handlers
  const handleCrear = () => {
    setModoEdicion(false);
    setUnidadSeleccionada(null);
    setFormData({
      Descripcion: "",
      EstaEliminado: false,
    });
    onOpen();
  };

  const handleEditar = (unidad: UnidadMedida) => {
    setModoEdicion(true);
    setUnidadSeleccionada(unidad);
    setFormData(unidad);
    onOpen();
  };

  const handleGuardar = () => {
    saveMutation.mutate(formData);
  };

  const handleConfirmarEliminar = (unidad: UnidadMedida) => {
    setUnidadAEliminar(unidad);
    onDeleteOpen();
  };

  const handleEliminar = () => {
    if (unidadAEliminar) {
      deleteMutation.mutate(unidadAEliminar.Id);
    }
  };

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="w-full space-y-4">
      {/* Header con botón crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Unidades de Medida
          </h2>
          <p className="text-gray-600 mt-1">
            Administra las unidades de medida de tus productos
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
          isDisabled={isLoading}
        >
          + Nueva Unidad
        </Button>
      </div>

      {/* Tabla de unidades */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de unidades de medida">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>DESCRIPCIÓN</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : isError ? (
                <div className="text-danger">Error al cargar datos</div>
              ) : (
                "No hay unidades de medida registradas"
              )
            }
          >
            {unidades.map((unidad) => (
              <TableRow key={unidad.Id}>
                <TableCell>{unidad.Id}</TableCell>
                <TableCell>{unidad.Descripcion}</TableCell>
                <TableCell>
                  <Chip
                    color={unidad.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {unidad.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(unidad)}
                        isDisabled={isSaving}
                      >
                        ✏️
                      </Button>
                    </Tooltip>
                    <Tooltip content="Eliminar" color="danger">
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => handleConfirmarEliminar(unidad)}
                        isDisabled={isSaving}
                      >
                        🗑️
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        backdrop="opaque"
        isDismissable={!isSaving}
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-200">
            <h3 className="text-xl font-bold">
              {modoEdicion
                ? "Editar Unidad de Medida"
                : "Nueva Unidad de Medida"}
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Nombre de la unidad (ej: Litro, Kilogramo, Unidad)"
                value={formData.Descripcion || ""}
                onChange={(e) =>
                  setFormData({ ...formData, Descripcion: e.target.value })
                }
                isRequired
                isDisabled={isSaving}
                maxLength={250}
                description={`${
                  formData.Descripcion?.length || 0
                }/250 caracteres`}
              />
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={!formData.EstaEliminado}
                  onValueChange={(value) =>
                    setFormData({ ...formData, EstaEliminado: !value })
                  }
                  color={formData.EstaEliminado ? "danger" : "success"}
                  isDisabled={isSaving}
                >
                  {formData.EstaEliminado ? "Unidad Inactiva" : "Unidad Activa"}
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200">
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
              onPress={handleGuardar}
              isLoading={isSaving}
            >
              {modoEdicion ? "Actualizar" : "Crear"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        size="sm"
        backdrop="opaque"
        isDismissable={!isSaving}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-danger">
              Confirmar eliminación
            </h3>
          </ModalHeader>
          <ModalBody>
            <p>
              ¿Estás seguro de que deseas eliminar la unidad de medida{" "}
              <strong>{unidadAEliminar?.Descripcion}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onDeleteClose}
              isDisabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleEliminar}
              isLoading={isSaving}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
