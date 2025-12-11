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

import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

interface Marca {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// Función para obtener marcas
const fetchMarcas = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Marca[]> => {
  const supabase = getSupabaseBrowserClient();
  const { data: marcas, error } = await supabase.from("Marca").select("*");
  if (error) {
    throw new Error(error.message);
  }
  return marcas ? marcas : [];
  // const response = await fetch("/api/marcas", { signal });
  // if (!response.ok) {
  //   throw new Error("Error al cargar marcas");
  // }
  // const data = await response.json();
  // return Array.isArray(data?.marcas) ? data.marcas : [];
};

export default function MarcaCRUD() {
  const { user, session } = useSupabaseAuthContext();

  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [marcaSeleccionada, setMarcaSeleccionada] = useState<Marca | null>(
    null
  );
  const [marcaAEliminar, setMarcaAEliminar] = useState<Marca | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Marca>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  // Query para obtener marcas
  const {
    data: marcas = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["marcas"],
    queryFn: fetchMarcas,
    // Usa el staleTime global (5 min)
  });

  // Mutación para crear/actualizar
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Marca>) => {
      // const isEdit = modoEdicion && marcaSeleccionada;
      // const url = isEdit
      //   ? `/api/marcas/?Id=${marcaSeleccionada.Id}`
      //   : "/api/marcas";
      // const method = isEdit ? "PATCH" : "POST";

      // const response = await fetch(url, {
      //   method,
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(data),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw errorData;
      // }

      // return response.json();

      console.log(user);

      if (modoEdicion) {
        const supabase = getSupabaseBrowserClient();
        const { data: marcas, error } = await supabase
          .from("Marca")
          .update({
            Descripcion: data.Descripcion,
            EstaEliminado: data.EstaEliminado,
            TenantId: user?.tenantId,
          })
          .eq("Id", marcaSeleccionada?.Id);
        if (error) {
          throw error;
        }
        return marcas ? marcas : [];
      }
      const supabase = getSupabaseBrowserClient();
      const { data: marcas, error } = await supabase.from("Marca").insert({
        Descripcion: data.Descripcion,
        EstaEliminado: data.EstaEliminado,
        TenantId: user?.tenantId,
      });
      if (error) {
        throw error;
      }
      return marcas ? marcas : [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      addToast({
        title: "Éxito",
        description: `Marca ${
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
          description: error.error || "Error al guardar la marca",
          color: "danger",
        });
      }
    },
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // const response = await fetch(`/api/marcas/?Id=${id}`, {
      //   method: "DELETE",
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw errorData;
      // }

      // return response.json();
      const supabase = getSupabaseBrowserClient();
      const { data: marcas, error } = await supabase
        .from("Marca")
        .delete()
        .eq("Id", id);
      if (error) {
        throw error;
      }
      return marcas ? marcas : [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      addToast({
        title: "Éxito",
        description: "Marca eliminada correctamente",
        color: "success",
      });
      onDeleteClose();
      setMarcaAEliminar(null);
    },
    onError: (error: ApiError) => {
      addToast({
        title: "Error",
        description: error.error || "Error al eliminar la marca",
        color: "danger",
      });
    },
  });

  // Handlers
  const handleCrear = () => {
    setModoEdicion(false);
    setMarcaSeleccionada(null);
    setFormData({
      Descripcion: "",
      EstaEliminado: false,
    });
    onOpen();
  };

  const handleEditar = (marca: Marca) => {
    setModoEdicion(true);
    setMarcaSeleccionada(marca);
    setFormData(marca);
    onOpen();
  };

  const handleGuardar = () => {
    saveMutation.mutate(formData);
  };

  const handleConfirmarEliminar = (marca: Marca) => {
    setMarcaAEliminar(marca);
    onDeleteOpen();
  };

  const handleEliminar = () => {
    if (marcaAEliminar) {
      deleteMutation.mutate(marcaAEliminar.Id);
    }
  };

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="w-full space-y-4">
      {/* Header con botón crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Marcas
          </h2>
          <p className="text-gray-600 mt-1">
            Administra las marcas de tus productos
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
          isDisabled={isLoading}
        >
          + Nueva Marca
        </Button>
      </div>

      {/* Tabla de marcas */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de marcas">
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
                "No hay marcas registradas"
              )
            }
          >
            {marcas.map((marca) => (
              <TableRow key={marca.Id}>
                <TableCell>{marca.Id}</TableCell>
                <TableCell>{marca.Descripcion}</TableCell>
                <TableCell>
                  <Chip
                    color={marca.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {marca.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(marca)}
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
                        onPress={() => handleConfirmarEliminar(marca)}
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
              {modoEdicion ? "Editar Marca" : "Nueva Marca"}
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Nombre de la marca"
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
                  {formData.EstaEliminado ? "Marca Inactiva" : "Marca Activa"}
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
              ¿Estás seguro de que deseas eliminar la marca{" "}
              <strong>{marcaAEliminar?.Descripcion}</strong>?
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
