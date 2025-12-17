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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-gray-500"
                        >
                          <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                        </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-gray-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </Tooltip>
                    <Tooltip content="Nuevo" color="primary">
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        variant="light"
                        isDisabled={isLoading}
                        onPress={handleCrear}
                        className="rounded-full font-extrabold text-2xl"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5 text-gray-500"
                        >
                          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
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
