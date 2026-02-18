"use client";

import { useState, Key, useMemo, useEffect } from "react";
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
import { AlertTriangle } from "lucide-react";
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
  /** Habilitar checkboxes y acciones masivas (eliminar seleccionados) */
  enableBulkActions?: boolean;
  /** Opciones del dropdown "Más acciones" (visibles solo con selección). Reciben items y clearSelection para limpiar tras éxito. */
  bulkActionsDropdown?: Array<{
    key: string;
    label: string;
    onAction: (
      selectedItems: T[],
      context: { clearSelection: () => void }
    ) => void;
  }>;
  /** Filtro "Bajo stock": cuando se provee, se muestra el botón. Si además pasa lowStockApiParam, se filtra en el backend. */
  lowStockFilterFn?: (item: T) => boolean;
  /** Si true y hay lowStockFilterFn, envía bajoStock=true al API (solo aplica a endpoints que lo soporten) */
  lowStockApiParam?: boolean;
  /** Devuelve params extra para el API según el estado (ej: bajoStock cuando lowStockOnly) */
  getApiExtraParams?: (state: { lowStockOnly: boolean }) => Record<string, string | number | boolean>;
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
  enableBulkActions = false,
  bulkActionsDropdown,
  lowStockFilterFn,
  lowStockApiParam = false,
  getApiExtraParams,
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
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const hasRowPreview = !!renderRowPreview || !!onRowClick;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "Descripcion",
    direction: "ascending",
  });

  // Debounce de búsqueda para evitar requests en cada keystroke
  const debouncedSearch = useDebounce(search, 400);

  // Resetear página al cambiar filtro bajo stock (evita páginas vacías)
  useEffect(() => {
    setPage(1);
  }, [lowStockOnly]);

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
    extraParams: getApiExtraParams
      ? getApiExtraParams({ lowStockOnly })
      : lowStockApiParam && lowStockOnly
        ? { bajoStock: true }
        : undefined,
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
    let items = [...data];
    // Filtro client-side solo cuando NO se usa bajoStock en API (lowStockApiParam)
    if (lowStockFilterFn && lowStockOnly && !lowStockApiParam) {
      items = items.filter(lowStockFilterFn);
    }
    return items.sort((a: T, b: T) => {
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
  }, [sortDescriptor, data, lowStockOnly, lowStockFilterFn]);

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

  const handleBulkDelete = async () => {
    if (selectedKeys.size === 0) return;
    const isEmpleados = apiPath.includes("/empleados");
    const itemsToDelete = sortedItems.filter((item) =>
      selectedKeys.has(String(item.Id)),
    );
    if (itemsToDelete.length === 0) return;

    const ids = itemsToDelete.map((item) =>
      isEmpleados && (item as any).personaId
        ? (item as any).personaId
        : item.Id,
    );

    try {
      for (const id of ids) {
        await deleteMutation.mutateAsync(id);
      }
      addToast({
        title: "Éxito",
        description: `${ids.length} registro${ids.length !== 1 ? "s" : ""} eliminado${ids.length !== 1 ? "s" : ""} correctamente`,
        color: "success",
        timeout: 3000,
      });
      setSelectedKeys(new Set());
    } catch (error: any) {
      const msg = error?.error || error?.message || "Error al eliminar";
      handleError(new Error(msg), "Error al eliminar seleccionados");
    }
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
        limit={limit}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        limitOptions={[10, 30, 50, 100]}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        onNewClick={handleCreate}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onImportClick={onImportClick}
        onExportClick={onExportClick}
        enableSelection={enableBulkActions}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        selectedCount={selectedKeys.size}
        onBulkDelete={enableBulkActions ? handleBulkDelete : undefined}
        onClearSelection={
          enableBulkActions ? () => setSelectedKeys(new Set()) : undefined
        }
        bulkActionsDropdown={
          enableBulkActions && bulkActionsDropdown?.length
            ? bulkActionsDropdown.map((a) => ({
                ...a,
                onClick: () => {
                  const items = sortedItems.filter((i) =>
                    selectedKeys.has(String(i.Id)),
                  );
                  a.onAction(items, {
                    clearSelection: () => setSelectedKeys(new Set()),
                  });
                },
              }))
            : undefined
        }
        extraSearchContent={
          lowStockFilterFn ? (
            <button
              type="button"
              onClick={() => setLowStockOnly((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                lowStockOnly
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-800"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-[#67afc3]"
              }`}
              title={lowStockOnly ? "Mostrar todos" : "Solo bajo stock"}
            >
              <AlertTriangle size={18} />
              Bajo stock
            </button>
          ) : undefined
        }
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
          hideCloseButton
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
