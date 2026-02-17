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
import { useDebounce } from "@/hooks/useDebounce";
import { handleError } from "@/lib/auth/errorHandler";

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
    actions: CrudActions<T>,
  ) => React.ReactNode;

  // Componente de Formulario
  FormComponent: React.ComponentType<GenericFormProps<T>>;

  // Opcionales
  searchPlaceholder?: string;
  initialLimit?: number;
  transformer?: (data: any) => T[];
  additionalInvalidateQueryKeys?: any[];
  onImportClick?: () => void;
  onExportClick?: () => void;
  /** @deprecated Use renderRowPreview instead */
  onRowClick?: (item: T, openEdit: () => void) => void;
  /** Contenido del modal de vista previa al hacer click en la fila */
  renderRowPreview?: (item: T) => React.ReactNode;
  /** Título del modal de vista previa */
  getRowPreviewTitle?: (item: T) => string;
  /** Mostrar botón Editar en el preview (false para CRUDs de solo lectura) */
  showEditInPreview?: boolean;
}

export default function GenericCrud<T extends { Id: number | string }>({
  apiPath,
  queryKey,
  columns,
  renderCell,
  FormComponent,
  searchPlaceholder,
  initialLimit = 10,
  transformer,
  additionalInvalidateQueryKeys,
  onImportClick,
  onExportClick,
  onRowClick,
  renderRowPreview,
  getRowPreviewTitle,
  showEditInPreview = true,
}: GenericCrudProps<T>) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [previewItem, setPreviewItem] = useState<T | null>(null);

  const hasRowPreview = !!renderRowPreview || !!onRowClick;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "Descripcion",
    direction: "ascending",
  });

  // Debounce de búsqueda para evitar requests en cada keystroke
  const debouncedSearch = useDebounce(search, 400);

  // Hook de Data (usa debouncedSearch en lugar de search)
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
    search: debouncedSearch,
    page,
    limit,
    transformer,
    additionalInvalidateQueryKeys,
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
            timeout: 3000,
          });
          // Cerrar con animación suave
          setTimeout(() => {
            onClose();
          }, 150);
        },
        onError: (error: any) => {
          // Manejo básico de errores, se puede mejorar parseando Zod errors
          const msg = error.error || error.message || "Error al guardar";
          handleError(new Error(msg), "Error al guardar");
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    // Para empleados, usar personaId en lugar de Id
    const isEmpleados = apiPath.includes("/empleados");
    const deleteId =
      isEmpleados && (itemToDelete as any).personaId
        ? (itemToDelete as any).personaId
        : itemToDelete.Id;

    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        addToast({
          title: "Éxito",
          description: "Registro eliminado correctamente",
          color: "success",
          timeout: 3000,
        });
        // Cerrar con animación suave
        setTimeout(() => {
          onDeleteClose();
          setItemToDelete(null);
        }, 150);
      },
      onError: (error: any) => {
        const errorMessage =
          typeof error?.error === "string"
            ? error.error
            : error?.error?.message || "Error al eliminar";
        handleError(new Error(errorMessage), "Error al eliminar");
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
        onImportClick={onImportClick}
        onExportClick={onExportClick}
        onRowClick={
          hasRowPreview
            ? (item) => {
                if (renderRowPreview) {
                  setPreviewItem(item);
                } else if (onRowClick) {
                  onRowClick(item, () => handleEdit(item));
                }
              }
            : undefined
        }
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

      {/* Modal de Vista Previa (al hacer click en fila) */}
      {renderRowPreview && previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          size="md"
          scrollBehavior="inside"
          classNames={{
            backdrop: "bg-black/40",
            base: "rounded-xl shadow-xl",
          }}
        >
          <ModalContent>
            <ModalHeader className="border-b border-gray-200">
              {getRowPreviewTitle
                ? getRowPreviewTitle(previewItem)
                : "Detalle"}
            </ModalHeader>
            <ModalBody className="py-4">
              {renderRowPreview(previewItem)}
            </ModalBody>
            <ModalFooter className="border-t border-gray-200">
              <Button
                variant="light"
                onPress={() => setPreviewItem(null)}
              >
                Cerrar
              </Button>
              {showEditInPreview && (
                <Button
                  className="bg-[#67afc3] hover:bg-[#5a9db0] text-white"
                  onPress={() => {
                    handleEdit(previewItem);
                    setPreviewItem(null);
                  }}
                >
                  Editar
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
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
