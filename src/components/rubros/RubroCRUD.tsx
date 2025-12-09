"use client";

import { useEffect, useState } from "react";
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

interface Rubro {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// Función para obtener rubros
const fetchRubros = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Rubro[]> => {
  const response = await fetch("/api/rubros", { signal });
  if (!response.ok) {
    throw new Error("Error al cargar rubros");
  }
  const data = await response.json();
  return Array.isArray(data?.rubros) ? data.rubros : [];
};

export default function RubroCRUD() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [rubroSeleccionado, setRubroSeleccionado] = useState<Rubro | null>(
    null
  );
  const [rubroAEliminar, setRubroAEliminar] = useState<Rubro | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Rubro>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  // Query para obtener rubros
  const {
    data: rubros = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rubros"],
    queryFn: fetchRubros,
  });

  // Mutación para crear/actualizar
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Rubro>) => {
      const isEdit = modoEdicion && rubroSeleccionado;
      const url = isEdit
        ? `/api/rubros/?Id=${rubroSeleccionado.Id}`
        : "/api/rubros";
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
      queryClient.invalidateQueries({ queryKey: ["rubros"] });
      addToast({
        title: "Éxito",
        description: `Rubro ${
          modoEdicion ? "actualizado" : "creado"
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
          description: error.error || "Error al guardar el rubro",
          color: "danger",
        });
      }
    },
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/rubros/?Id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubros"] });
      addToast({
        title: "Éxito",
        description: "Rubro eliminado correctamente",
        color: "success",
      });
      onDeleteClose();
      setRubroAEliminar(null);
    },
    onError: (error: ApiError) => {
      addToast({
        title: "Error",
        description: error.error || "Error al eliminar la marca",
        color: "danger",
      });
    },
  });

  // Abrir modal para crear
  const handleCrear = () => {
    setModoEdicion(false);
    setRubroSeleccionado(null);
    setFormData({
      Descripcion: "",
      EstaEliminado: false,
    });
    onOpen();
  };

  // Abrir modal para editar
  const handleEditar = (rubro: Rubro) => {
    setModoEdicion(true);
    setRubroSeleccionado(rubro);
    setFormData(rubro);
    onOpen();
  };

  // Guardar rubro (crear o actualizar)
  const handleGuardar = async () => {
    saveMutation.mutate(formData);
  };

  // Abrir modal de confirmación de eliminación
  const handleConfirmarEliminar = (rubro: Rubro) => {
    setRubroAEliminar(rubro);
    onDeleteOpen();
  };

  // Eliminar rubro
  const handleEliminar = async () => {
    deleteMutation.mutate(rubroAEliminar?.Id || 0);
  };

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="w-full space-y-4">
      {/* Header con botón crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Rubros
          </h2>
          <p className="text-gray-600 mt-1">
            Administra los rubros de tus productos
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
          isDisabled={isLoading}
        >
          + Nuevo Rubro
        </Button>
      </div>

      {/* Tabla de rubros */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de rubros">
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
              ) : (
                "No hay rubros registrados"
              )
            }
          >
            {rubros.map((rubro) => (
              <TableRow key={rubro.Id}>
                <TableCell>{rubro.Id}</TableCell>
                <TableCell>{rubro.Descripcion}</TableCell>
                <TableCell>
                  <Chip
                    color={rubro.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {rubro.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(rubro)}
                        isDisabled={isLoading}
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
                        onPress={() => handleConfirmarEliminar(rubro)}
                        isDisabled={isLoading}
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
              {modoEdicion ? "Editar Rubro" : "Nuevo Rubro"}
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Nombre del rubro"
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
                  {formData.EstaEliminado ? "Rubro Inactivo" : "Rubro Activo"}
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
              ¿Estás seguro de que deseas eliminar el rubro{" "}
              <strong>{rubroAEliminar?.Descripcion}</strong>?
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
