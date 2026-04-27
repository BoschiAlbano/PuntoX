import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TipoAjustePrecio,
  TipoRedondeo,
  TipoObjetivo,
  ActualizarPreciosMasivoInput,
} from "@/lib/validations/actualizar-precios.schema";
import { Producto } from "@/lib/validations/producto.schema";
import { dynamicDataQueryOptions } from "@/lib/react-query/queryDefaults";
import { addToast } from "@heroui/react";

export interface FiltrosPrecios {
  q: string;
  marcaId: number | null;
  rubroId: number | null;
  estado: "activo" | "inactivo" | "todos";
}

export interface ReglaActualizacion {
  objetivo: TipoObjetivo;
  listaPrecioId: number | null;
  tipo: TipoAjustePrecio;
  valor: number;
  redondear: boolean;
  redondeoTipo: TipoRedondeo;
}

// ─── Helpers puros (sin dependencias de hooks) ────────────────────────────

/**
 * Aplica el ajuste a una base (PrecioFinal o PrecioCosto según objetivo).
 * El valor siempre es positivo; el tipo determina dirección e interpretación.
 */
function aplicarAjustePuro(
  tipo: TipoAjustePrecio,
  valor: number,
  base: number,
): number | null {
  switch (tipo) {
    case "incremento_porcentaje":
      return base * (1 + valor / 100);
    case "decremento_porcentaje":
      return base * (1 - valor / 100);
    case "incremento_fijo":
      return base + valor;
    case "decremento_fijo":
      return base - valor;
    default:
      return null;
  }
}

function redondearPrecioPuro(
  precio: number,
  redondear: boolean,
  redondeoTipo: TipoRedondeo,
): number {
  if (!redondear) return Math.round(precio * 100) / 100;
  switch (redondeoTipo) {
    case "ceil":
      return Math.ceil(precio);
    case "ceil_99": {
      const base = Math.floor(precio / 100);
      const resto = precio % 100;
      return resto <= 99 && precio === base * 100 + 99
        ? precio
        : (base + 1) * 100 - 1;
    }
    case "floor":
      return Math.floor(precio);
    default:
      return Math.round(precio * 100) / 100;
  }
}

export interface PreviewResumen {
  articulos: number;
  precios: number;
  preciosConCambio: number;
}

export interface ProductoPreview extends Producto {
  PrecioCostoOriginal: number;
  EsSimulacion: boolean;
  PreciosListaOriginal: Producto["PreciosLista"];
}

function sonReglasIguales(
  izquierda: ReglaActualizacion | null,
  derecha: ReglaActualizacion,
) {
  if (!izquierda) return false;
  return (
    izquierda.objetivo === derecha.objetivo &&
    izquierda.listaPrecioId === derecha.listaPrecioId &&
    izquierda.tipo === derecha.tipo &&
    izquierda.valor === derecha.valor &&
    izquierda.redondear === derecha.redondear &&
    izquierda.redondeoTipo === derecha.redondeoTipo
  );
}

/**
 * Hook para gestionar la actualización masiva de precios.
 * Centraliza filtros, obtención de datos, previsualización y persistencia.
 */
export function useActualizarPrecios() {
  const queryClient = useQueryClient();

  // ─── Estado de Filtros ──────────────────────────────────────────────────
  const [filtros, setFiltros] = useState<FiltrosPrecios>({
    q: "",
    marcaId: null,
    rubroId: null,
    estado: "activo",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleSetLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // ─── Estado de la Regla de Ajuste ────────────────────────────────────────
  const [regla, setRegla] = useState<ReglaActualizacion>({
    objetivo: "costo",
    listaPrecioId: null,
    tipo: "incremento_porcentaje",
    valor: 0,
    redondear: false,
    redondeoTipo: "none",
  });

  // ─── Estado de la UI ─────────────────────────────────────────────────────
  const [previewModo, setPreviewModo] = useState(false);
  const [previewRegla, setPreviewRegla] = useState<ReglaActualizacion | null>(
    null,
  );
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const previewEstaActualizada = useMemo(
    () => previewModo && sonReglasIguales(previewRegla, regla),
    [previewModo, previewRegla, regla],
  );

  // ─── Query: Obtener artículos con precios ────────────────────────────────
  const query = useQuery({
    queryKey: ["articulos-con-precios", filtros, page, limit],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (filtros.q) params.append("q", filtros.q);
      if (filtros.marcaId) params.append("marcaId", String(filtros.marcaId));
      if (filtros.rubroId) params.append("rubroId", String(filtros.rubroId));
      params.append("estado", filtros.estado);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const res = await fetch(
        `/api/productos/con-precios?${params.toString()}`,
        { signal },
      );
      if (!res.ok) throw new Error("Error al cargar artículos con precios");
      return res.json();
    },
    ...dynamicDataQueryOptions,
  });

  const articulosBase = useMemo<Producto[]>(
    () => query.data?.data ?? [],
    [query.data],
  );

  // ─── Mutation: Aplicar cambios ──────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (input: ActualizarPreciosMasivoInput) => {
      const res = await fetch("/api/precios/actualizar-masivo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    },
    onSuccess: (data) => {
      addToast({
        title: "Actualización exitosa",
        description: `Se actualizaron ${data.articulosActualizados} artículos y ${data.preciosActualizados} precios.`,
        color: "success",
      });
      // Invalidar caches
      queryClient.removeQueries({ queryKey: ["articulos-con-precios"] });
      queryClient.removeQueries({ queryKey: ["productos-generic"] });
      queryClient.removeQueries({ queryKey: ["producto-detail"] });
      // Limpiar selección
      setSeleccionados(new Set());
      setPreviewModo(false);
    },
    onError: (error: any) => {
      addToast({
        title: "Error al actualizar",
        description: error.error?.message || "Ocurrió un error inesperado.",
        color: "danger",
      });
    },
  });

  // ─── Lógica de Previsualización (Client-side) ───────────────────────────

  const articulosPreview = useMemo<ProductoPreview[]>(() => {
    const base = articulosBase.map((articulo) => ({
      ...articulo,
      PrecioCostoOriginal: articulo.PrecioCosto,
      EsSimulacion: false,
      PreciosListaOriginal: articulo.PreciosLista,
    }));

    if (!previewModo || !previewRegla) return base;

    return articulosBase.map((articulo) => {
      // ── Objetivo: COSTO ─────────────────────────────────────────────────
      if (previewRegla.objetivo === "costo") {
        const nuevoCostoRaw = aplicarAjustePuro(
          previewRegla.tipo,
          previewRegla.valor,
          articulo.PrecioCosto, // base = PrecioCosto
        );

        if (nuevoCostoRaw === null || nuevoCostoRaw <= 0) {
          return {
            ...articulo,
            PrecioCostoOriginal: articulo.PrecioCosto,
            EsSimulacion: false,
            PreciosListaOriginal: articulo.PreciosLista,
          };
        }

        const nuevoCosto = redondearPrecioPuro(
          nuevoCostoRaw,
          previewRegla.redondear,
          previewRegla.redondeoTipo,
        );

        return {
          ...articulo,
          PrecioCosto: nuevoCosto,
          PrecioCostoOriginal: articulo.PrecioCosto,
          EsSimulacion: true,
          PreciosListaOriginal: articulo.PreciosLista,
          PreciosLista: articulo.PreciosLista.map((pl) => ({
            ...pl,
            PrecioFinal: redondearPrecioPuro(
              nuevoCosto * (1 + pl.PorcentajeGanancia / 100),
              previewRegla.redondear,
              previewRegla.redondeoTipo,
            ),
          })),
        };
      }

      // ── Objetivo: LISTAS ─────────────────────────────────────────────────
      return {
        ...articulo,
        PrecioCostoOriginal: articulo.PrecioCosto,
        EsSimulacion: true,
        PreciosListaOriginal: articulo.PreciosLista,
        PreciosLista: articulo.PreciosLista.map((pl) => {
          // Si es lista específica y no es la seleccionada, no cambiar
          if (
            previewRegla.objetivo === "lista_especifica" &&
            pl.ListaPrecioId !== previewRegla.listaPrecioId
          ) {
            return pl;
          }

          // Ajustar PorcentajeGanancia y recalcular PrecioFinal desde el costo
          const nuevoPorcRaw = aplicarAjustePuro(
            previewRegla.tipo,
            previewRegla.valor,
            pl.PorcentajeGanancia,
          );
          if (nuevoPorcRaw === null || nuevoPorcRaw < 0) return pl;

          const nuevoPorcentaje = Math.round(nuevoPorcRaw * 100) / 100;
          const nuevoPrecioRaw =
            articulo.PrecioCosto * (1 + nuevoPorcentaje / 100);
          const nuevoPrecio = redondearPrecioPuro(
            nuevoPrecioRaw,
            previewRegla.redondear,
            previewRegla.redondeoTipo,
          );

          return {
            ...pl,
            PorcentajeGanancia: nuevoPorcentaje,
            PrecioFinal: nuevoPrecio,
          };
        }),
      };
    });
  }, [articulosBase, previewModo, previewRegla]);

  // El resumen se deriva directamente del snapshot ya calculado
  const previewResumen = useMemo<PreviewResumen>(() => {
    if (!previewModo || !previewRegla) {
      return { articulos: 0, precios: 0, preciosConCambio: 0 };
    }

    let articulosConPreview = 0;
    let preciosPreview = 0;
    let preciosConCambio = 0;

    for (const art of articulosPreview) {
      if (!art.EsSimulacion) continue;
      articulosConPreview++;
      for (const pl of art.PreciosLista) {
        const original = art.PreciosListaOriginal?.find(
          (p) => p.ListaPrecioId === pl.ListaPrecioId,
        );
        if (!original) continue;
        preciosPreview++;
        if (pl.PrecioFinal !== original.PrecioFinal) preciosConCambio++;
      }
    }

    return {
      articulos: articulosConPreview,
      precios: preciosPreview,
      preciosConCambio,
    };
  }, [articulosPreview, previewModo, previewRegla]);

  // ─── Acciones ───────────────────────────────────────────────────────────

  const toggleSeleccion = useCallback((id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const seleccionarTodos = useCallback((ids: string[]) => {
    setSeleccionados(new Set(ids));
  }, []);

  const generarVistaPrevia = useCallback(() => {
    if (articulosBase.length === 0) {
      addToast({
        title: "Sin artículos para previsualizar",
        description:
          "La grilla no tiene datos cargados con los filtros actuales.",
        color: "warning",
      });
      return;
    }

    if (regla.objetivo === "lista_especifica" && !regla.listaPrecioId) {
      addToast({
        title: "Seleccioná una lista de precios",
        description: "Debés elegir qué lista de precios actualizar.",
        color: "warning",
      });
      return;
    }

    setPreviewRegla({ ...regla });
    setPreviewModo(true);
  }, [articulosBase, regla]);

  const limpiarVistaPrevia = useCallback(() => {
    setPreviewModo(false);
    setPreviewRegla(null);
  }, []);

  const aplicarASeleccionados = async () => {
    if (seleccionados.size === 0) {
      addToast({
        title: "Atención",
        description: "No hay artículos seleccionados.",
        color: "warning",
      });
      return;
    }

    if (!previewEstaActualizada) {
      addToast({
        title: "Genera la vista previa",
        description: "Revisá la vista previa antes de aplicar los cambios.",
        color: "warning",
      });
      return;
    }

    if (regla.objetivo === "lista_especifica" && !regla.listaPrecioId) {
      addToast({
        title: "Seleccioná una lista de precios",
        description: "Debés elegir qué lista de precios actualizar.",
        color: "warning",
      });
      return;
    }

    await mutation.mutateAsync({
      articuloIds: Array.from(seleccionados).map((id) => Number(id)),
      objetivo: regla.objetivo,
      listaPrecioId: regla.listaPrecioId ?? undefined,
      tipo: regla.tipo,
      valor: regla.valor,
      redondear: regla.redondear,
      redondeoTipo: regla.redondeoTipo,
    } as ActualizarPreciosMasivoInput);
  };

  const toggleFiltro = (key: keyof FiltrosPrecios, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSeleccionados(new Set()); // Limpiar selección al filtrar
  };

  return {
    // Estado
    filtros,
    setFiltros: toggleFiltro,
    articulos: articulosBase,
    articulosPreview,
    pagination: query.data?.pagination || {
      total: 0,
      page: 1,
      limit,
      totalPages: 1,
    },
    isLoading: query.isLoading,
    page,
    setPage,
    limit,
    setLimit: handleSetLimit,

    // Regla y Preview
    regla,
    setRegla,
    previewModo,
    previewEstaActualizada,
    previewResumen,
    generarVistaPrevia,
    limpiarVistaPrevia,

    // Selección
    seleccionados,
    toggleSeleccion,
    seleccionarTodos,

    // Mutación
    aplicarASeleccionados,
    isApplying: mutation.isPending,
  };
}
