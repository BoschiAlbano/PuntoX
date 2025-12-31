"use client";

import { useState, Key, useMemo } from "react";
import {
  useDisclosure,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  SortDescriptor,
} from "@heroui/react";
import GenericTable, { Column } from "./GenericTable";
import { useGenericApi } from "@/hooks/useGenericApi";

// Interfaz que deben cumplir los formularios pasados a este componente
export interface GenericFormProps<T> {
  isOpen: boolean;
  onClose: () => void;
  initialData: T | null; // null = Crear, Objeto = Editar
  onSubmit: (data: Partial<T>) => void;
  isSaving: boolean;
  // Se pueden pasar props adicionales via spread en el padre si se usa un wrapper,
  // pero por ahora mantenemos lo básico.
}

export interface CrudActions<T> {
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onCreate: () => void;
}

interface GenericCrudProps<T> {
  // Configuración de API
  apiPath: string;
  queryKey: string;

  // Configuración de Tabla
  columns: Column[];
  renderCell: (
    item: T,
    columnKey: Key,
    actions: CrudActions<T>
  ) => React.ReactNode;

  // Componente de Formulario
  FormComponent: React.ComponentType<GenericFormProps<T>>;

  // Opcionales
  title?: string; // Título de la sección
  searchPlaceholder?: string;
  initialLimit?: number;
  transformer?: (data: any) => T[];
}

export default function GenericCrud<T extends { Id: number | string }>({
  apiPath,
  queryKey,
  columns,
  renderCell,
  FormComponent,
  searchPlaceholder,
  initialLimit = 2,
  transformer,
}: GenericCrudProps<T>) {
  // Estados de UI
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal Form
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure(); // Modal Delete

  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  // Estados de Listado
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "Descripcion",
    direction: "ascending",
  });

  // Hook de Data
  const {
    data,
    paginationMeta,
    isLoading,
    isError,
    saveMutation,
    deleteMutation,
    refetch,
  } = useGenericApi<T>({
    endpoint: apiPath,
    queryKey,
    search,
    page,
    limit,
    transformer,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortedItems = useMemo(() => {
    return [...data].sort((a: T, b: T) => {
      const first = a[sortDescriptor.column as keyof T] as unknown as
        | number
        | string;
      const second = b[sortDescriptor.column as keyof T] as unknown as
        | number
        | string;
      const cmp =
        (parseInt(first as string) || first) <
        (parseInt(second as string) || second)
          ? -1
          : 1;

      if (sortDescriptor.direction === "descending") {
        return -cmp;
      }

      return cmp;
    });
  }, [sortDescriptor, data]);

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  // --- Handlers ---

  const handleCreate = () => {
    setSelectedItem(null);
    onOpen();
  };

  const handleEdit = (item: T) => {
    setSelectedItem(item);
    onOpen();
  };

  const handleDeleteClick = (item: T) => {
    setItemToDelete(item);
    onDeleteOpen();
  };

  const handleSave = (formData: Partial<T>) => {
    const isEdit = !!selectedItem;
    // Si es edición, asegurar que el ID vaya en el payload si no viene del form
    const payload = isEdit ? { ...formData, Id: selectedItem.Id } : formData;

    saveMutation.mutate(
      { data: payload, isEdit },
      {
        onSuccess: () => {
          addToast({
            title: "Éxito",
            description: `Registro ${
              isEdit ? "actualizado" : "creado"
            } correctamente`,
            color: "success",
            duration: 3000,
          });
          // Cerrar con animación suave
          setTimeout(() => {
            onClose();
          }, 150);
        },
        onError: (error: any) => {
          // Manejo básico de errores, se puede mejorar parseando Zod errors
          const msg = error.error || error.message || "Error al guardar";
          addToast({
            title: "Error",
            description: msg,
            color: "danger",
          });
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    deleteMutation.mutate(itemToDelete.Id, {
      onSuccess: () => {
        addToast({
          title: "Éxito",
          description: "Registro eliminado correctamente",
          color: "success",
          duration: 3000,
        });
        // Cerrar con animación suave
        setTimeout(() => {
          onDeleteClose();
          setItemToDelete(null);
        }, 150);
      },
      onError: (error: any) => {
        const errorMessage = typeof error?.error === "string" 
          ? error.error 
          : error?.error?.message || "Error al eliminar";
        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
      },
    });
  };

  // Acciones que pasamos al renderCell
  const actions: CrudActions<T> = {
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onCreate: handleCreate,
  };

  // Wrapper para renderCell que inyecta las acciones
  const renderCellWrapper = (item: T, columnKey: Key) => {
    return renderCell(item, columnKey, actions);
  };

  return (
    <div className="w-full h-full relative">
      {/* Botón flotante para crear (opcional, o se puede integrar en la tabla) */}
      {/* Por ahora, asumimos que la tabla tiene el botón o se pasa */}
      {/* Vamos a poner un botón de crear flotante simple o header si se desea */}

      {/* Aquí podríamos poner el botón de crear si no está en la tabla */}
      {/* <div className="absolute top-0 right-0 z-10 p-2">
        <Button
          onPress={handleCreate}
          color="primary"
          className="mb-4 shadow-lg font-bold"
          radius="full"
          isIconOnly
        >
          +
        </Button>
      </div> */}

      <GenericTable
        data={sortedItems}
        columns={columns}
        renderCell={renderCellWrapper}
        isLoading={isLoading}
        isError={isError}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        page={page}
        onPageChange={setPage}
        paginationMeta={paginationMeta}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        onNewClick={handleCreate}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        totalItems={paginationMeta.total}
      />

      {/* Modal de Formulario */}
      {isOpen && (
        <FormComponent
          isOpen={isOpen}
          onClose={onClose}
          initialData={selectedItem}
          onSubmit={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Modal de Eliminación Genérico */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmar Eliminación
              </ModalHeader>
              <ModalBody>
                <p>
                  ¿Estás seguro de que deseas eliminar este registro? Esta
                  acción no se puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleConfirmDelete}
                  isLoading={isSaving}
                >
                  Eliminar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
