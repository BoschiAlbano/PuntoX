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

interface Iva {
  Id: number;
  Descripcion: string;
  Porcentaje: number;
  EstaEliminado: boolean;
}

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// Función para obtener IVAs
const fetchIvas = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Iva[]> => {
  const response = await fetch("/api/ivas", { signal });
  if (!response.ok) {
    throw new Error("Error al cargar IVAs");
  }
  const data = await response.json();
  return Array.isArray(data?.ivas) ? data.ivas : [];
};

export default function IvaCRUD() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [ivaSeleccionado, setIvaSeleccionado] = useState<Iva | null>(null);
  const [ivaAEliminar, setIvaAEliminar] = useState<Iva | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Iva>>({
    Descripcion: "",
    Porcentaje: 0,
    EstaEliminado: false,
  });

  // Query para obtener IVAs
  const {
    data: ivas = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["ivas"],
    queryFn: fetchIvas,
  });

  // Mutación para crear/actualizar
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Iva>) => {
      const isEdit = modoEdicion && ivaSeleccionado;
      const url = isEdit ? `/api/ivas/?Id=${ivaSeleccionado.Id}` : "/api/ivas";
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
      queryClient.invalidateQueries({ queryKey: ["ivas"] });
      addToast({
        title: "Éxito",
        description: `IVA ${
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
          description: error.error || "Error al guardar el IVA",
          color: "danger",
        });
      }
    },
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ivas/?Id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ivas"] });
      addToast({
        title: "Éxito",
        description: "IVA eliminado correctamente",
        color: "success",
      });
      onDeleteClose();
      setIvaAEliminar(null);
    },
    onError: (error: ApiError) => {
      addToast({
        title: "Error",
        description: error.error || "Error al eliminar el IVA",
        color: "danger",
      });
    },
  });

  // Handlers
  const handleCrear = () => {
    setModoEdicion(false);
    setIvaSeleccionado(null);
    setFormData({
      Descripcion: "",
      Porcentaje: 0,
      EstaEliminado: false,
    });
    onOpen();
  };

  const handleEditar = (iva: Iva) => {
    setModoEdicion(true);
    setIvaSeleccionado(iva);
    setFormData(iva);
    onOpen();
  };

  const handleGuardar = () => {
    saveMutation.mutate(formData);
  };

  const handleConfirmarEliminar = (iva: Iva) => {
    setIvaAEliminar(iva);
    onDeleteOpen();
  };

  const handleEliminar = () => {
    if (ivaAEliminar) {
      deleteMutation.mutate(ivaAEliminar.Id);
    }
  };

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="w-full space-y-4">
      {/* Header con botón crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de IVAs</h2>
          <p className="text-gray-600 mt-1">
            Administra las tasas de IVA disponibles
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
          isDisabled={isLoading}
        >
          + Nuevo IVA
        </Button>
      </div>

      {/* Tabla de IVAs */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de IVAs">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>DESCRIPCIÓN</TableColumn>
            <TableColumn>PORCENTAJE</TableColumn>
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
                "No hay IVAs registrados"
              )
            }
          >
            {ivas.map((iva) => (
              <TableRow key={iva.Id}>
                <TableCell>{iva.Id}</TableCell>
                <TableCell>{iva.Descripcion}</TableCell>
                <TableCell>{iva.Porcentaje}%</TableCell>
                <TableCell>
                  <Chip
                    color={iva.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {iva.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(iva)}
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
                        onPress={() => handleConfirmarEliminar(iva)}
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
              {modoEdicion ? "Editar IVA" : "Nuevo IVA"}
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Ej: IVA 21%"
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
              <Input
                label="Porcentaje"
                placeholder="0.00"
                type="number"
                value={formData.Porcentaje?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Porcentaje: parseFloat(e.target.value) || 0,
                  })
                }
                endContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">%</span>
                  </div>
                }
                isRequired
                isDisabled={isSaving}
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
                  {formData.EstaEliminado ? "Inactivo" : "Activo"}
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
              ¿Estás seguro de que deseas eliminar el IVA{" "}
              <strong>{ivaAEliminar?.Descripcion}</strong>?
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
