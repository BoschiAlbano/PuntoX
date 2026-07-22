"use client";

/**
 * CRUD genérico: orquesta API, tabla, formulario, modales y acciones masivas.
 * Usa GenericTable para la UI y useGenericApi para datos.
 * @see docs/ui/crud-tablas-genericas.md
 */
import { useState, Key, useMemo, useEffect, useCallback } from "react";
import { modalMotionProps } from "@/lib/motionConfig";
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
import ConfirmModal from "./ConfirmModal";
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
  FormComponent?: React.ComponentType<GenericFormProps<T>>;

  // Opcionales
  title?: string; // Título de la sección
  onNewClick?: () => void;
  newButtonText?: string;
  searchPlaceholder?: string;
  initialLimit?: number;
  transformer?: (data: any) => T[];
  /**
   * true (default) si "Eliminar" en esta entidad es un borrado lógico reversible
   * (EstaEliminado). false si "Eliminar" ya es un borrado físico inmediato
   * (ej. empleados, roles). Solo cambia el texto de confirmación del modal
   * de borrado genérico de un solo ítem (no aplica si la entidad no usa
   * `actions.onDelete` para ese fin, ej. cuando el botón de fila alterna
   * el estado directamente).
   */
  softDeleteEntity?: boolean;
  /**
   * Habilita el filtro "Mostrar/Ocultar inactivos" en "Más opciones",
   * persistido en localStorage por queryKey. Úsalo en cualquier entidad
   * cuyo listado muestre activos e inactivos sin distinción.
   */
  enableInactiveFilter?: boolean;
  /**
   * Habilita además la acción masiva "Eliminar definitivamente" en "Más
   * opciones" (borrado físico condicionado a que el seleccionado esté
   * inactivo).
   */
  enableHardDelete?: boolean;
  /**
   * true (default) para mostrar la acción masiva genérica "Eliminar N
   * seleccionados" (borrado lógico) en "Más opciones". Ponelo en false
   * cuando la entidad ya tiene su propia acción "Cambiar estado" (ej.
   * marcas, rubros) para no duplicar la misma acción con dos nombres.
   */
  showBulkSoftDelete?: boolean;
  additionalInvalidateQueryKeys?: any[];
  /** Configuración para exportar datos actuales (CSV/XLS) desde "Más opciones" */
  exportConfig?: {
    filename: string;
    columns: { key: string; header: string }[];
    mapItem: (item: T) => Record<string, unknown>;
  };
  /** Callback que recibe la respuesta cruda de la API después de un save exitoso */
  onSaveSuccess?: (result: any, payload: Partial<T>, isEdit: boolean) => void;
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
  /** Ítems extra en el menú de Más Opciones siempre visibles. `hasSelection` permite ocultar
   * condicionalmente ítems que no tenga sentido mostrar cuando ya hay una selección activa
   * (ej: reemplazarlos por una variante que use `selectedItems`, ya cargados en la página
   * actual, evitando el fetch cross-page de `bulkActionsDropdown`). */
  extraMenuItems?: (
    currentItems: T[],
    hasSelection: boolean,
    selectedItems: T[],
    clearSelection: () => void,
  ) => Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    onPress: () => void;
  }>;
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
  /** Columnas visibles por defecto en mobile. Si no se pasa, se usa 'descripcion' o la primera columna disponible */
  defaultVisibleUidsMobile?: string[];
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
  extraMenuItems,
  printConfig,
  viewMode = "table",
  onViewModeChange,
  renderCard,
  onSaveSuccess,
  onNewClick,
  newButtonText,
  defaultVisibleUidsMobile,
  softDeleteEntity = true,
  enableInactiveFilter = false,
  enableHardDelete = false,
  showBulkSoftDelete = true,
}: GenericCrudProps<T>) {
  // Estados de UI
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal Form
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isHardDeleteOpen,
    onOpen: onHardDeleteOpen,
    onClose: onHardDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isBulkDeleteOpen,
    onOpen: onBulkDeleteOpen,
    onClose: onBulkDeleteClose,
  } = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [previewItem, setPreviewItem] = useState<T | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const editId = searchParams?.get("editId");

  const [lowStockOnly, setLowStockOnly] = useState(
    () => searchParams?.get("bajoStock") === "true",
  );

  // "Mostrar inactivos": persistido en localStorage por tabla (queryKey)
  const inactiveFilterStorageKey = `crud:${queryKey}:mostrarInactivos`;
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  useEffect(() => {
    if (!enableInactiveFilter || typeof window === "undefined") return;
    setMostrarInactivos(
      window.localStorage.getItem(inactiveFilterStorageKey) === "true",
    );
    // Solo al montar: la key depende del queryKey, que no cambia en runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableInactiveFilter]);

  const toggleMostrarInactivos = () => {
    setMostrarInactivos((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(inactiveFilterStorageKey, String(next));
      }
      return next;
    });
  };

  // Selección masiva cross-page
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("manual");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [selectionQuerySignature, setSelectionQuerySignature] = useState("");

  const hasRowPreview = !!renderRowPreview || !!onRowClick;

  const [search, setSearch] = useState(() => searchParams?.get("q") || "");
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
    isFetching,
    isError,
    saveMutation,
    deleteMutation,
    hardDeleteMutation,
    refetch,
    prefetchWithParams,
  } = useGenericApi<T>({
    endpoint: apiPath,
    queryKey,
    search: debouncedSearch,
    page,
    limit,
    extraParams: {
      ...(getApiExtraParams
        ? getApiExtraParams({ lowStockOnly })
        : lowStockApiParam && lowStockOnly
          ? { bajoStock: true }
          : {}),
      ...(enableInactiveFilter && mostrarInactivos
        ? { incluirInactivos: true }
        : {}),
      ...(editId ? { editId } : {}),
    },
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

  // Si la URL trae ?q= (ej. desde el buscador global), ya sembramos el
  // estado "search" en el useState inicial de arriba. Lo sacamos de la URL
  // para que no vuelva a aplicarse en un refresh futuro ni quede colgado
  // si el usuario borra el término manualmente.
  useEffect(() => {
    if (searchParams?.get("q")) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("q");
      const newUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
      router.replace(newUrl, { scroll: false });
    }
    // Solo al montar: es una siembra única del valor inicial de la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const extraParams: Record<string, string | number | boolean> = {
      ...(getApiExtraParams
        ? getApiExtraParams({ lowStockOnly })
        : lowStockApiParam && lowStockOnly
          ? { bajoStock: true }
          : {}),
      ...(enableInactiveFilter && mostrarInactivos
        ? { incluirInactivos: true }
        : {}),
    };
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
    enableInactiveFilter,
    mostrarInactivos,
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

  /** Ítems de la página actual que están seleccionados (para imprimir/exportar seleccionados) */
  const selectedItemsOnPage = useMemo(
    () => sortedItems.filter((i) => selectedKeysForTable.has(String(i.Id))),
    [sortedItems, selectedKeysForTable],
  );

  /** Exportar solo los ítems seleccionados como CSV */
  const handleExportCsvSelected = useCallback(async () => {
    if (!exportConfig || !hasSelection) return;
    try {
      const ctx = await getBulkSelectionContext();
      const rows = ctx.items.map(exportConfig.mapItem);
      if (rows.length === 0) {
        addToast({
          title: "Sin datos",
          description: "No hay registros seleccionados para exportar",
          color: "warning",
        });
        return;
      }
      exportToCsv(
        rows,
        exportConfig.columns,
        `${exportConfig.filename}_seleccionados`,
      );
      addToast({
        title: "Exportado",
        description: `${rows.length} registro${
          rows.length !== 1 ? "s" : ""
        } exportado${rows.length !== 1 ? "s" : ""} como CSV`,
        color: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo exportar la selección",
        color: "danger",
      });
    }
  }, [exportConfig, hasSelection, getBulkSelectionContext]);

  /** Exportar solo los ítems seleccionados como XLS */
  const handleExportXlsSelected = useCallback(async () => {
    if (!exportConfig || !hasSelection) return;
    try {
      const ctx = await getBulkSelectionContext();
      const rows = ctx.items.map(exportConfig.mapItem);
      if (rows.length === 0) {
        addToast({
          title: "Sin datos",
          description: "No hay registros seleccionados para exportar",
          color: "warning",
        });
        return;
      }
      exportToXls(
        rows,
        exportConfig.columns,
        `${exportConfig.filename}_seleccionados`,
      );
      addToast({
        title: "Exportado",
        description: `${rows.length} registro${
          rows.length !== 1 ? "s" : ""
        } exportado${rows.length !== 1 ? "s" : ""} como Excel`,
        color: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo exportar la selección",
        color: "danger",
      });
    }
  }, [exportConfig, hasSelection, getBulkSelectionContext]);

  const isSaving =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    hardDeleteMutation.isPending;

  // Estados de carga dedicados para los modales masivos: no alcanza con
  // *Mutation.isPending porque estos handlers hacen un fetch previo
  // (getBulkSelectionContext) y, en el caso de borrado definitivo, disparan
  // varias mutations en paralelo — isPending de una única mutation no
  // refleja de forma confiable todo ese tramo async.
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkHardDeleting, setIsBulkHardDeleting] = useState(false);

  // --- Handlers ---

  const handleCreate = () => {
    if (onNewClick) {
      onNewClick();
      return;
    }
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

  const handleBulkHardDeleteClick = () => {
    if (!hasSelection) return;
    onHardDeleteOpen();
  };

  const handleSave = (formData: Partial<T>) => {
    const isEdit = !!selectedItem;
    // Si es edición, asegurar que el ID vaya en el payload si no viene del form
    const payload = isEdit ? { ...formData, Id: selectedItem.Id } : formData;

    saveMutation.mutate(
      { data: payload, isEdit },
      {
        onSuccess: (result) => {
          onSaveSuccess?.(result, formData, isEdit);
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
          handleError(error, "Error al guardar");
        },
      },
    );
  };

  const handleBulkDelete = async () => {
    if (!hasSelection) return;
    setIsBulkDeleting(true);
    try {
      const ctx = await getBulkSelectionContext();
      if (ctx.ids.length === 0) return;

      const isEmpleados = apiPath.includes("/empleados");
      const idsToDelete = isEmpleados
        ? ctx.items.map((i: any) => i.personaId ?? i.Id).filter(Boolean)
        : ctx.ids;

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
      handleError(error, "Error al eliminar seleccionados");
    } finally {
      setIsBulkDeleting(false);
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
        handleError(error, "Error al eliminar");
      },
    });
  };

  const handleConfirmBulkHardDelete = async () => {
    if (!hasSelection) return;
    setIsBulkHardDeleting(true);
    try {
      const ctx = await getBulkSelectionContext();
      const isEmpleados = apiPath.includes("/empleados");
      const inactivos = ctx.items.filter((i: any) => i.EstaEliminado === true);
      const omitidos = ctx.items.length - inactivos.length;

      if (inactivos.length === 0) {
        addToast({
          title: "No se puede eliminar",
          description:
            "Los registros seleccionados no están inactivos. Desactivalos primero desde \"Eliminar\".",
          color: "warning",
        });
        onHardDeleteClose();
        return;
      }

      const idsToDelete = isEmpleados
        ? inactivos.map((i: any) => i.personaId ?? i.Id).filter(Boolean)
        : inactivos.map((i) => i.Id);

      const results = await Promise.allSettled(
        idsToDelete.map((id) => hardDeleteMutation.mutateAsync(id)),
      );
      const okCount = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected");

      if (okCount > 0) {
        const partes = [
          `${okCount} registro${okCount !== 1 ? "s" : ""} eliminado${okCount !== 1 ? "s" : ""} definitivamente.`,
        ];
        if (failed.length > 0) {
          partes.push(
            `${failed.length} no se pud${failed.length !== 1 ? "ieron" : "o"} eliminar por tener relaciones con otros datos.`,
          );
        }
        if (omitidos > 0) {
          partes.push(
            `${omitidos} omitido${omitidos !== 1 ? "s" : ""} por no estar inactivo${omitidos !== 1 ? "s" : ""}.`,
          );
        }
        addToast({
          title: "Eliminación definitiva",
          description: partes.join(" "),
          color: failed.length > 0 ? "warning" : "success",
          timeout: 5000,
        });
      } else if (failed.length > 0) {
        handleError(
          (failed[0] as PromiseRejectedResult).reason,
          "No se pudo eliminar definitivamente",
        );
      }

      onHardDeleteClose();
      clearSelection();
    } finally {
      setIsBulkHardDeleting(false);
    }
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
    <div className="w-full min-w-0 min-h-0 relative flex flex-col flex-1">
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
        newButtonText={newButtonText}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || isFetching}
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
        selectedItems={selectedItemsOnPage}
        onBulkDelete={
          enableBulkActions && showBulkSoftDelete ? onBulkDeleteOpen : undefined
        }
        onBulkHardDelete={
          enableBulkActions && enableHardDelete
            ? handleBulkHardDeleteClick
            : undefined
        }
        inactiveToggle={
          enableInactiveFilter
            ? { isActive: mostrarInactivos, onToggle: toggleMostrarInactivos }
            : undefined
        }
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
        onExportCsvSelected={
          exportConfig && hasSelection ? handleExportCsvSelected : undefined
        }
        onExportXlsSelected={
          exportConfig && hasSelection ? handleExportXlsSelected : undefined
        }
        printConfig={{
          title: printConfig?.title,
          orientation: printConfig?.orientation,
          filters:
            lowStockFilterFn && lowStockOnly ? "Solo bajo stock" : undefined,
        }}
        extraMenuItems={[
          ...(extraMenuItems
            ? extraMenuItems(
                sortedItems,
                hasSelection,
                selectedItemsOnPage,
                clearSelection,
              )
            : []),
          ...(lowStockFilterFn
            ? [
                {
                  key: "bajo-stock",
                  label: lowStockOnly ? "Mostrar todos" : "Solo bajo stock",
                  icon: <AlertTriangle size={16} strokeWidth={2} />,
                  isActive: lowStockOnly,
                  onPress: () => {
                    if (
                      !lowStockOnly &&
                      lowStockApiParam &&
                      prefetchWithParams
                    ) {
                      prefetchWithParams({
                        page: 1,
                        extraParams: { bajoStock: true },
                      });
                    }
                    setLowStockOnly((v) => !v);
                  },
                },
              ]
            : []),
        ]}
        extraSearchContent={
          toolbarExtraContent ? <>{toolbarExtraContent}</> : undefined
        }
        onRowClick={undefined}
        onRowKeyDown={(item, key) => {
          if (key === "Enter") handleEdit(item);
        }}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        renderCards={
          renderCard ? (item) => renderCard(item, actions) : undefined
        }
        defaultVisibleUidsMobile={defaultVisibleUidsMobile}
      />

      {/* Modal de Formulario */}
      {isOpen && FormComponent && (
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
          motionProps={modalMotionProps}
          classNames={{
            backdrop: "bg-black/40",
            wrapper: "items-end sm:items-center",
            base: "rounded-t-xl rounded-b-none sm:rounded-xl shadow-xl w-full sm:w-auto m-0 sm:m-auto",
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
                  className="bg-[var(--crud-accent)] hover:bg-[var(--crud-accent-hover)] text-white"
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
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        description={
          softDeleteEntity
            ? "¿Estás seguro de que deseas eliminar este registro? Quedará marcado como inactivo y podrás reactivarlo o eliminarlo definitivamente más adelante."
            : "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isSaving}
      />

      {/* Modal de Eliminación Definitiva masiva (borrado físico) */}
      <ConfirmModal
        isOpen={isHardDeleteOpen}
        onClose={onHardDeleteClose}
        onConfirm={handleConfirmBulkHardDelete}
        title="Eliminar definitivamente"
        description={`Esta acción borra ${effectiveSelectedCount} registro${effectiveSelectedCount !== 1 ? "s" : ""} de forma permanente y no se puede deshacer. Solo se eliminarán los que estén inactivos; si tienen relaciones con otros datos, no se podrán eliminar.`}
        confirmLabel="Eliminar definitivamente"
        variant="danger"
        isLoading={isBulkHardDeleting}
      />

      {/* Modal de confirmación eliminación masiva */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        onClose={onBulkDeleteClose}
        onConfirm={async () => {
          await handleBulkDelete();
          onBulkDeleteClose();
        }}
        title="Confirmar eliminación masiva"
        description={
          <p className="text-sm text-slate-600">
            ¿Estás seguro de que deseas eliminar{" "}
            <strong>{effectiveSelectedCount}</strong> registro
            {effectiveSelectedCount !== 1 ? "s" : ""}? Esta acción no se puede
            deshacer.
          </p>
        }
        confirmLabel={`Eliminar ${effectiveSelectedCount} registro${effectiveSelectedCount !== 1 ? "s" : ""}`}
        variant="danger"
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
