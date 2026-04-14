"use client";

/**
 * CRUD genérico: orquesta API, tabla, formulario, modales y acciones masivas.
 * Usa GenericTable para la UI y useGenericApi para datos.
 * @see docs/ui/crud-tablas-genericas.md
 */
import { useState, Key, useMemo, useEffect, useCallback } from "react";
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
import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";
import { useGenericApi } from "@/hooks/useGenericApi";
import { useDebounce } from "@/hooks/useDebounce";
import { handleError } from "@/lib/auth/errorHandler";
import { buildSelectionQuerySignature } from "@/lib/utils/selectionUtils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type SelectionMode = "manual" | "all_matching";

export interface BulkSelectionContext<T> {
  ids: string[];
  items: T[];
  totalCount: number;
  mode: SelectionMode;
  clearSelection: () => void;
}

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
  /** Abre el preview (cuando hay renderRowPreview) */
  onPreview?: (item: T) => void;
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
  title?: string; // Título de la sección
  searchPlaceholder?: string;
  initialLimit?: number;
  transformer?: (data: any) => T[];
  additionalInvalidateQueryKeys?: any[];
  /** Configuración para exportar datos actuales (CSV/XLS) desde "Más opciones" */
  exportConfig?: {
    filename: string;
    columns: { key: string; header: string }[];
    mapItem: (item: T) => Record<string, unknown>;
  };
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
  /** Opciones del dropdown "Acciones masivas" (visibles solo con selección). */
  bulkActionsDropdown?: Array<{
    key: string;
    label: string;
    onAction: (context: BulkSelectionContext<T>) => void;
  }>;
  /** Filtro "Bajo stock": cuando se provee, se muestra el botón. Si además pasa lowStockApiParam, se filtra en el backend. */
  lowStockFilterFn?: (item: T) => boolean;
  /** Si true y hay lowStockFilterFn, envía bajoStock=true al API (solo aplica a endpoints que lo soporten) */
  lowStockApiParam?: boolean;
  /** Devuelve params extra para el API según el estado (ej: bajoStock cuando lowStockOnly) */
  getApiExtraParams?: (state: {
    lowStockOnly: boolean;
  }) => Record<string, string | number | boolean>;
  /** Contenido extra en la barra de herramientas (ej: botón "Solicitar reposición") */
  toolbarExtraContent?: React.ReactNode;
  /** Configuración de impresión (título, orientación, filtros) */
  printConfig?: {
    title?: string;
    orientation?: "portrait" | "landscape";
  };
  /** Vista cards: viewMode, onViewModeChange, renderCard (recibe item y actions) */
  viewMode?: "table" | "cards";
  onViewModeChange?: (mode: "table" | "cards") => void;
  renderCard?: (item: T, actions: CrudActions<T>) => React.ReactNode;
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
  exportConfig,
  onRowClick,
  renderRowPreview,
  getRowPreviewTitle,
  showEditInPreview = true,
  enableBulkActions = false,
  bulkActionsDropdown,
  lowStockFilterFn,
  lowStockApiParam = false,
  getApiExtraParams,
  toolbarExtraContent,
  printConfig,
  viewMode = "table",
  onViewModeChange,
  renderCard,
}: GenericCrudProps<T>) {
  // Estados de UI
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal Form
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isBulkDeleteOpen,
    onOpen: onBulkDeleteOpen,
    onClose: onBulkDeleteClose,
  } = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [previewItem, setPreviewItem] = useState<T | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const editId = searchParams?.get("editId");

  // Selección masiva cross-page
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("manual");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [selectionQuerySignature, setSelectionQuerySignature] = useState("");

  const hasRowPreview = !!renderRowPreview || !!onRowClick;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "Descripcion",
    direction: "ascending",
  });

  // Debounce de búsqueda para evitar requests en cada keystroke
  const debouncedSearch = useDebounce(search, 300);

  // Resetear página al cambiar filtro bajo stock (evita páginas vacías)
  useEffect(() => {
    setPage(1);
  }, [lowStockOnly]);

  // Firma de filtros para invalidar selección
  const currentSignature = useMemo(
    () =>
      buildSelectionQuerySignature({
        search: debouncedSearch,
        lowStockOnly,
        sortColumn: String(sortDescriptor?.column ?? ""),
        sortDirection: String(sortDescriptor?.direction ?? ""),
        limit,
      }),
    [debouncedSearch, lowStockOnly, sortDescriptor, limit],
  );

  // Resetear selección cuando cambian filtros
  useEffect(() => {
    if (
      selectionQuerySignature &&
      selectionQuerySignature !== currentSignature
    ) {
      const hadSelection =
        selectedIds.size > 0 ||
        excludedIds.size > 0 ||
        selectionMode === "all_matching";
      setSelectionMode("manual");
      setSelectedIds(new Set());
      setExcludedIds(new Set());
      setSelectionQuerySignature(currentSignature);
      if (hadSelection) {
        addToast({
          title: "Filtros cambiados",
          description: "Se reinició la selección por cambio de filtros",
          color: "primary",
          timeout: 2000,
        });
      }
    } else if (!selectionQuerySignature) {
      setSelectionQuerySignature(currentSignature);
    }
  }, [
    currentSignature,
    selectionQuerySignature,
    selectedIds.size,
    excludedIds.size,
    selectionMode,
  ]);

  // Hook de Data (usa debouncedSearch en lugar de search)
  const {
    data,
    paginationMeta,
    isLoading,
    isError,
    saveMutation,
    deleteMutation,
    refetch,
    prefetchWithParams,
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

  // Auto-open edit modal if editId is present in URL
  useEffect(() => {
    if (editId && data && data.length > 0) {
      const itemToEdit = data.find(
        (i: T) => String(i.Id) === editId || String((i as any).id) === editId,
      );
      if (itemToEdit && !isOpen) {
        setSelectedItem(itemToEdit);
        onOpen();

        // Remove editId from URL to prevent reopening on future reloads
        if (searchParams) {
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.delete("editId");
          const newUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
          router.replace(newUrl, { scroll: false });
        }
      }
    }
  }, [editId, data, isOpen, onOpen, router, pathname, searchParams]);

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
    const col = columns.find((c) => c.uid === sortDescriptor.column);
    const sortPath = col?.sortKey ?? (sortDescriptor.column as string);

    const getVal = (obj: T): number | string => {
      const v = sortPath.includes(".")
        ? sortPath
            .split(".")
            .reduce(
              (o: unknown, k) => (o as Record<string, unknown>)?.[k],
              obj as unknown,
            )
        : (obj as Record<string, unknown>)[sortPath];
      if (v == null) return "";
      if (typeof v === "object" && v !== null && "Descripcion" in v) {
        return String((v as { Descripcion?: string }).Descripcion ?? "");
      }
      return String(v);
    };

    return items.sort((a: T, b: T) => {
      const first = getVal(a);
      const second = getVal(b);
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
  }, [sortDescriptor, data, lowStockOnly, lowStockFilterFn, columns]);

  const pageIds = useMemo(
    () => new Set(sortedItems.map((i) => String(i.Id))),
    [sortedItems],
  );

  // selectedKeys para la tabla HeroUI
  const selectedKeysForTable = useMemo(() => {
    if (selectionMode === "manual") {
      return new Set([...selectedIds].filter((id) => pageIds.has(id)));
    }
    return new Set([...pageIds].filter((id) => !excludedIds.has(id)));
  }, [selectionMode, selectedIds, excludedIds, pageIds]);

  const effectiveSelectedCount =
    selectionMode === "manual"
      ? selectedIds.size
      : Math.max(0, paginationMeta.total - excludedIds.size);

  const hasSelection = effectiveSelectedCount > 0;

  const handleSelectionChange = useCallback(
    (keys: Set<string> | "all") => {
      if (selectionMode === "manual") {
        if (keys === "all") {
          setSelectedIds((prev) => new Set([...prev, ...pageIds]));
        } else {
          // Usar setSelectedIds con función para leer siempre el estado más reciente
          setSelectedIds((prev) => {
            const otherPageIds = [...prev].filter((id) => !pageIds.has(id));
            return new Set([...otherPageIds, ...keys]);
          });
        }
      } else {
        if (keys === "all") {
          setExcludedIds(
            (prev) => new Set([...prev].filter((id) => !pageIds.has(id))),
          );
        } else {
          const newlyExcluded = [...pageIds].filter((id) => !keys.has(id));
          setExcludedIds(
            (prev) =>
              new Set([
                ...[...prev].filter((id) => !pageIds.has(id)),
                ...newlyExcluded,
              ]),
          );
        }
      }
    },
    [selectionMode, pageIds],
  );

  const handleScaleToAllMatching = useCallback(() => {
    setSelectionMode("all_matching");
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionMode("manual");
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }, []);

  // Fetch todos los ítems que coinciden con los filtros (pagina para cubrir cross-page)
  const fetchAllMatchingItems = useCallback(async (): Promise<T[]> => {
    const extraParams = getApiExtraParams
      ? getApiExtraParams({ lowStockOnly })
      : lowStockApiParam && lowStockOnly
        ? { bajoStock: true }
        : undefined;
    const total = paginationMeta.total;
    const cap = Math.min(total, 2000);
    const allItems: T[] = [];
    let pageNum = 1;
    const perPage = Math.min(limit, 100);

    while (allItems.length < cap) {
      const params = new URLSearchParams();
      params.append("q", debouncedSearch);
      params.append("page", String(pageNum));
      params.append("limit", String(perPage));
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "")
            params.append(k, String(v));
        });
      }
      const url = `${apiPath.replace(/\/$/, "")}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar datos");
      const json = await res.json();
      const items: T[] = transformer
        ? transformer(json.data || [])
        : json.data || [];
      allItems.push(...items);
      if (items.length < perPage) break;
      pageNum++;
      if (allItems.length >= cap) break;
    }

    return allItems.slice(0, cap);
  }, [
    apiPath,
    debouncedSearch,
    lowStockOnly,
    paginationMeta.total,
    limit,
    getApiExtraParams,
    lowStockApiParam,
    transformer,
  ]);

  const getBulkSelectionContext = useCallback(async (): Promise<
    BulkSelectionContext<T>
  > => {
    const ids = selectionMode === "manual" ? [...selectedIds] : [];
    const allItems = await fetchAllMatchingItems();
    const items =
      selectionMode === "manual"
        ? allItems.filter((i) => selectedIds.has(String(i.Id)))
        : allItems.filter((i) => !excludedIds.has(String(i.Id)));
    const resolvedIds =
      selectionMode === "manual" ? ids : items.map((i) => String(i.Id));
    return {
      ids: resolvedIds,
      items,
      totalCount: effectiveSelectedCount,
      mode: selectionMode,
      clearSelection,
    };
  }, [
    selectionMode,
    selectedIds,
    excludedIds,
    effectiveSelectedCount,
    fetchAllMatchingItems,
    clearSelection,
  ]);

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
    if (!hasSelection) return;
    const ctx = await getBulkSelectionContext();
    if (ctx.ids.length === 0) return;

    const isEmpleados = apiPath.includes("/empleados");
    const idsToDelete = isEmpleados
      ? ctx.items.map((i: any) => i.personaId ?? i.Id).filter(Boolean)
      : ctx.ids;

    try {
      for (const id of idsToDelete) {
        await deleteMutation.mutateAsync(id);
      }
      addToast({
        title: "Éxito",
        description: `${idsToDelete.length} registro${idsToDelete.length !== 1 ? "s" : ""} eliminado${idsToDelete.length !== 1 ? "s" : ""} correctamente`,
        color: "success",
        timeout: 3000,
      });
      clearSelection();
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

  // Acciones que pasamos al renderCell y renderCard
  const actions: CrudActions<T> = {
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onCreate: handleCreate,
    onPreview: hasRowPreview ? (item) => setPreviewItem(item) : undefined,
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
        onExportCsv={
          exportConfig
            ? () => {
                const rows = sortedItems.map(exportConfig.mapItem);
                if (rows.length === 0) {
                  addToast({
                    title: "Sin datos",
                    description: "No hay registros para exportar",
                    color: "warning",
                  });
                  return;
                }
                exportToCsv(rows, exportConfig.columns, exportConfig.filename);
                addToast({
                  title: "Exportado",
                  description: `${rows.length} registro${rows.length !== 1 ? "s" : ""} exportado${rows.length !== 1 ? "s" : ""} como CSV`,
                  color: "success",
                });
              }
            : undefined
        }
        onExportXls={
          exportConfig
            ? () => {
                const rows = sortedItems.map(exportConfig.mapItem);
                if (rows.length === 0) {
                  addToast({
                    title: "Sin datos",
                    description: "No hay registros para exportar",
                    color: "warning",
                  });
                  return;
                }
                exportToXls(rows, exportConfig.columns, exportConfig.filename);
                addToast({
                  title: "Exportado",
                  description: `${rows.length} registro${rows.length !== 1 ? "s" : ""} exportado${rows.length !== 1 ? "s" : ""} como Excel`,
                  color: "success",
                });
              }
            : undefined
        }
        enableSelection={enableBulkActions}
        selectionMode={selectionMode}
        selectedKeys={selectedKeysForTable}
        onSelectionChange={handleSelectionChange}
        selectedCount={effectiveSelectedCount}
        totalCount={paginationMeta.total}
        canScaleToAll={
          enableBulkActions &&
          selectionMode === "manual" &&
          selectedIds.size > 0 &&
          paginationMeta.total > limit
        }
        onScaleToAllMatching={handleScaleToAllMatching}
        onBulkDelete={enableBulkActions ? onBulkDeleteOpen : undefined}
        onClearSelection={enableBulkActions ? clearSelection : undefined}
        bulkActionsDropdown={
          enableBulkActions && bulkActionsDropdown?.length
            ? bulkActionsDropdown.map((a) => ({
                ...a,
                onClick: async () => {
                  try {
                    const ctx = await getBulkSelectionContext();
                    a.onAction(ctx);
                  } catch (err) {
                    addToast({
                      title: "Error",
                      description: "No se pudo cargar la selección",
                      color: "danger",
                    });
                  }
                },
              }))
            : undefined
        }
        printConfig={{
          title: printConfig?.title,
          orientation: printConfig?.orientation,
          filters:
            lowStockFilterFn && lowStockOnly ? "Solo bajo stock" : undefined,
        }}
        extraSearchContent={
          <>
            {lowStockFilterFn ? (
              <button
                type="button"
                onClick={() => setLowStockOnly((v) => !v)}
                onMouseEnter={() => {
                  if (!lowStockOnly && lowStockApiParam && prefetchWithParams) {
                    prefetchWithParams({
                      page: 1,
                      extraParams: { bajoStock: true },
                    });
                  }
                }}
                aria-pressed={lowStockOnly}
                aria-label={
                  lowStockOnly
                    ? "Mostrar todos los productos"
                    : "Filtrar solo productos con bajo stock"
                }
                className={`flex items-center justify-center gap-2 px-3 h-10 sm:h-9 w-full sm:w-auto rounded-lg text-sm font-medium transition-all duration-150 border whitespace-nowrap ${
                  lowStockOnly
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-800"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-[#67afc3] hover:text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#67afc3]/40"
                }`}
                title={lowStockOnly ? "Mostrar todos" : "Solo bajo stock"}
              >
                <AlertTriangle size={18} strokeWidth={2} />
                Bajo stock
              </button>
            ) : null}
            {toolbarExtraContent}
          </>
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
        onRowKeyDown={(item, key) => {
          if (key === "Enter") handleEdit(item);
        }}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        renderCards={
          renderCard ? (item) => renderCard(item, actions) : undefined
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
              {getRowPreviewTitle ? getRowPreviewTitle(previewItem) : "Detalle"}
            </ModalHeader>
            <ModalBody className="py-4">
              {renderRowPreview(previewItem)}
            </ModalBody>
            <ModalFooter className="border-t border-gray-200">
              <Button variant="light" onPress={() => setPreviewItem(null)}>
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

      {/* Modal de confirmación eliminación masiva */}
      <Modal isOpen={isBulkDeleteOpen} onClose={onBulkDeleteClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmar eliminación masiva
              </ModalHeader>
              <ModalBody>
                <p>
                  ¿Estás seguro de que deseas eliminar{" "}
                  <strong>{effectiveSelectedCount}</strong> registro
                  {effectiveSelectedCount !== 1 ? "s" : ""}? Esta acción no se
                  puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    await handleBulkDelete();
                    onClose();
                  }}
                  isLoading={isSaving}
                >
                  Eliminar {effectiveSelectedCount} registro
                  {effectiveSelectedCount !== 1 ? "s" : ""}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
