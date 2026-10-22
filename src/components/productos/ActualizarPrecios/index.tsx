"use client";

import { useState, useMemo, Key, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActualizarPrecios } from "@/hooks/useActualizarPrecios";
import { PanelRegla } from "./PanelRegla";
import { ConfirmarModal } from "./ConfirmarModal";
import {
  Autocomplete,
  AutocompleteItem,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Eye,
  Tags,
  Layers,
  ListFilter,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Columns3,
} from "lucide-react";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { Producto } from "@/lib/validations/producto.schema";

import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";

type MobileTab = "busqueda" | "precios";

export default function ActualizarPreciosContainer() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("busqueda");
  const [listasVisibles, setListasVisibles] = useState<Set<number>>(new Set());
  const [listasMenuOpen, setListasMenuOpen] = useState(false);

  const {
    filtros,
    setFiltros,
    articulos,
    articulosPreview,
    pagination,
    isLoading,
    page,
    setPage,
    limit,
    setLimit,
    regla,
    setRegla,
    previewModo,
    previewEstaActualizada,
    previewResumen,
    generarVistaPrevia,
    limpiarVistaPrevia,
    seleccionados,
    seleccionarTodos,
    aplicarASeleccionados,
    isApplying,
  } = useActualizarPrecios();

  // ─── Exportación ───────────────────────────────────────────────────────
  const handleExport = (type: "csv" | "xls", onlySelected: boolean) => {
    const sourceData = previewModo ? articulosPreview : articulos;
    const dataToExport = onlySelected
      ? sourceData.filter((a) => seleccionados.has(String(a.Id)))
      : sourceData;

    if (dataToExport.length === 0) return;

    const exportColumns = [
      { key: "Descripcion", header: "Articulo" },
      { key: "CodigoBarra", header: "Codigo" },
      { key: "Marca", header: "Marca" },
      { key: "PrecioCosto", header: "Costo" },
      ...listas.map((l: any) => ({
        key: `lista_${l.Id}`,
        header: l.Nombre,
      })),
    ];

    const mappedData = dataToExport.map((a) => {
      const row: any = {
        Descripcion: a.Descripcion,
        CodigoBarra: a.CodigoBarra,
        Marca: a.Marca?.Descripcion || "",
        PrecioCosto: a.PrecioCosto,
      };
      listas.forEach((l: any) => {
        const p = a.PreciosLista.find((pl) => pl.ListaPrecioId === l.Id);
        row[`lista_${l.Id}`] = p ? p.PrecioFinal : 0;
      });
      return row;
    });

    if (type === "csv")
      exportToCsv(mappedData, exportColumns as any, "Precios");
    else exportToXls(mappedData, exportColumns as any, "Precios");
  };

  // ─── Fetch de Listas y Maestros para Filtros ───────────────────────────
  const { data: listas = [] } = useQuery({
    queryKey: ["listas-precios-generic"],
    queryFn: async () => {
      const res = await fetch("/api/listas-precios");
      if (!res.ok) throw new Error("Error fetching listas");
      const data = await res.json();
      return data.data;
    },
  });

  // Inicializar listasVisibles con todas cuando se cargan
  const listasInicializadas = useMemo(() => {
    if (listas.length > 0 && listasVisibles.size === 0) {
      setListasVisibles(new Set(listas.map((l: any) => l.Id as number)));
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listas]);
  void listasInicializadas;

  const toggleLista = (id: number) => {
    setListasVisibles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // al menos 1 visible
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTodasListas = () => {
    if (listasVisibles.size === listas.length) {
      // dejar solo la primera
      setListasVisibles(new Set([listas[0]?.Id]));
    } else {
      setListasVisibles(new Set(listas.map((l: any) => l.Id as number)));
    }
  };

  const { data: marcas = [] } = useQuery({
    queryKey: ["marcas-generic"],
    queryFn: async () => {
      const res = await fetch("/api/marcas");
      return (await res.json()).data;
    },
  });

  const { data: rubros = [] } = useQuery({
    queryKey: ["rubros-generic"],
    queryFn: async () => {
      const res = await fetch("/api/rubros");
      return (await res.json()).data;
    },
  });

  // ─── Configuración de Columnas para GenericTable ────────────────────────
  const columns = useMemo<Column[]>(() => {
    const base: Column[] = [
      { uid: "Descripcion", name: "Artículo", sortable: true, align: "start" },
      { uid: "PrecioCosto", name: "Costo", align: "end" },
    ];

    const listasCols = listas
      .filter((l: any) => listasVisibles.has(l.Id))
      .map((l: any) => ({
        uid: `lista-${l.Id}`,
        name: l.Nombre,
        align: "end" as const,
      }));

    return [...base, ...listasCols];
  }, [listas, listasVisibles]);

  // ─── Renderizado de Celdas ─────────────────────────────────────────────
  const renderCell = useCallback(
    (articulo: Producto, columnKey: Key) => {
      const key = columnKey as string;

      if (key === "Descripcion") {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-[#0F172A] leading-snug text-sm">
              {articulo.Descripcion}
            </span>
            <div className="flex gap-1.5 mt-0.5">
              <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-1.5 py-px rounded font-mono tracking-wide">
                {articulo.CodigoBarra}
              </span>
              {articulo.Marca && (
                <span className="text-[10px] text-[#0F2233] bg-[#EAEFF5] border border-[#D5DFE9] px-1.5 py-px rounded font-semibold">
                  {articulo.Marca.Descripcion}
                </span>
              )}
            </div>
          </div>
        );
      }

      if (key === "PrecioCosto") {
        const art = articulo as Producto & {
          PrecioCostoOriginal?: number;
          EsSimulacion?: boolean;
        };

        const costoOriginal = art.PrecioCostoOriginal;
        const costoActual = articulo.PrecioCosto;
        const costoCambio =
          art.EsSimulacion &&
          costoOriginal !== undefined &&
          costoActual !== costoOriginal;

        return (
          <div className="flex flex-col items-end gap-0.5">
            <span
              className={`font-mono text-sm ${
                costoCambio ? "text-[#B45309] font-bold" : "text-[#64748B] font-semibold"
              }`}
            >
              ${costoActual.toLocaleString()}
            </span>
            {costoCambio && (
              <span className="text-[10px] text-[#94A3B8] line-through">
                ${costoOriginal!.toLocaleString()}
              </span>
            )}
          </div>
        );
      }

      if (key.startsWith("lista-")) {
        const listaId = Number(key.split("-")[1]);
        const precioActual = articulo.PreciosLista?.find(
          (p) => p.ListaPrecioId === listaId,
        );

        if (!precioActual)
          return <span className="text-[#CBD5E1] font-mono">—</span>;

        const precioOriginal = (
          articulo as Producto & {
            PreciosListaOriginal?: Producto["PreciosLista"];
            EsSimulacion?: boolean;
          }
        ).PreciosListaOriginal?.find((p) => p.ListaPrecioId === listaId);

        return (
          <div className="flex flex-col items-end gap-0.5">
            <span
              className={`font-mono text-sm ${
                previewModo ? "text-[#B45309] font-bold" : "text-[#475569] font-semibold"
              }`}
            >
              ${precioActual.PrecioFinal.toLocaleString()}
            </span>

            {previewModo && precioOriginal && (
              <span className="text-[10px] text-[#94A3B8] line-through">
                ${precioOriginal.PrecioFinal.toLocaleString()}
              </span>
            )}
          </div>
        );
      }

      return null;
    },
    [previewModo],
  );

  const handleConfirm = async () => {
    await aplicarASeleccionados();
    setIsConfirmOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="xl:hidden flex items-center bg-white border-b border-[#E2E8F0] shrink-0">
        <button
          onClick={() => setMobileTab("busqueda")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            mobileTab === "busqueda"
              ? "border-[#0F2233] text-[#0F2233]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Search size={15} />
          <span>Búsqueda</span>
          {seleccionados.size > 0 && (
            <span
              className="ml-1 min-w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1.5"
              style={{ background: "#0F2233" }}
            >
              {seleccionados.size}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileTab("precios")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            mobileTab === "precios"
              ? "border-[#0F2233] text-[#0F2233]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Regla</span>
          {previewModo && (
            <span className="ml-1 text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.5 rounded-full">
              Activo
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-0 xl:gap-6 flex-1 min-h-0 p-0">
        {/* Panel Izquierdo: Tabla Genérica */}
        <div
          className={`xl:col-span-3 flex flex-col min-h-0 ${
            mobileTab === "busqueda" ? "flex" : "hidden xl:flex"
          }`}
        >
          <div className="flex-1 min-h-0 flex flex-col">
            <GenericTable
              data={previewModo ? articulosPreview : articulos}
              columns={columns}
              renderCell={renderCell}
              isLoading={isLoading}
              isError={false}
              defaultVisibleUidsMobile={["Descripcion", "PrecioCosto"]}
              search={filtros.q}
              onSearchChange={(val) => setFiltros("q", val)}
              searchPlaceholder="Nombre o código de barras..."
              page={page}
              onPageChange={setPage}
              paginationMeta={pagination}
              limit={limit}
              onLimitChange={setLimit}
              enableSelection={true}
              selectedKeys={seleccionados}
              onSelectionChange={(keys) => {
                if (keys === "all")
                  seleccionarTodos(
                    (previewModo ? articulosPreview : articulos).map((a) =>
                      String(a.Id),
                    ),
                  );
                else seleccionarTodos(Array.from(keys));
              }}
              selectedCount={seleccionados.size}
              totalCount={pagination.total}
              onExportCsv={() => handleExport("csv", false)}
              onExportXls={() => handleExport("xls", false)}
              onExportCsvSelected={() => handleExport("csv", true)}
              onExportXlsSelected={() => handleExport("xls", true)}
              extraSearchContent={
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <Autocomplete
                    aria-label="Filtrar por Marca"
                    placeholder="Marca"
                    className="w-full sm:w-40"
                    size="sm"
                    variant="bordered"
                    startContent={<Tags className="size-3.5 text-slate-400" />}
                    selectedKey={
                      filtros.marcaId ? String(filtros.marcaId) : null
                    }
                    onSelectionChange={(key) =>
                      setFiltros("marcaId", key ? Number(key) : null)
                    }
                  >
                    {marcas.map((m: any) => (
                      <AutocompleteItem
                        key={String(m.Id)}
                        textValue={m.Descripcion}
                      >
                        {m.Descripcion}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Autocomplete
                    aria-label="Filtrar por Rubro"
                    placeholder="Rubro"
                    className="w-full sm:w-40"
                    size="sm"
                    variant="bordered"
                    startContent={
                      <Layers className="size-3.5 text-slate-400" />
                    }
                    selectedKey={
                      filtros.rubroId ? String(filtros.rubroId) : null
                    }
                    onSelectionChange={(key) =>
                      setFiltros("rubroId", key ? Number(key) : null)
                    }
                  >
                    {rubros.map((r: any) => (
                      <AutocompleteItem
                        key={String(r.Id)}
                        textValue={r.Descripcion}
                      >
                        {r.Descripcion}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Select
                    aria-label="Estado"
                    className="w-full sm:w-36"
                    size="sm"
                    variant="bordered"
                    startContent={
                      <ListFilter className="size-3.5 text-slate-400" />
                    }
                    selectedKeys={[filtros.estado]}
                    onChange={(e) => setFiltros("estado", e.target.value)}
                  >
                    <SelectItem key="activo" textValue="Activos">
                      Activos
                    </SelectItem>
                    <SelectItem key="inactivo" textValue="Inactivos">
                      Inactivos
                    </SelectItem>
                    <SelectItem key="todos" textValue="Todos">
                      Todos
                    </SelectItem>
                  </Select>

                  {/* ── Selector de columnas de listas (solo si hay más de 1) ── */}
                  {listas.length > 1 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setListasMenuOpen((v) => !v)}
                        className="h-8 flex items-center gap-1.5 px-3 rounded-lg border text-sm font-medium transition-colors"
                        style={{
                          borderColor:
                            listasVisibles.size < listas.length
                              ? "#0F2233"
                              : "#CBD5E1",
                          color:
                            listasVisibles.size < listas.length
                              ? "#0F2233"
                              : "#475569",
                          background:
                            listasVisibles.size < listas.length
                              ? "#F1F5F9"
                              : "#FFFFFF",
                        }}
                      >
                        <Columns3 className="size-3.5" />
                        <span>Listas</span>
                        {listasVisibles.size < listas.length && (
                          <span
                            className="min-w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1"
                            style={{ background: "#0F2233" }}
                          >
                            {listasVisibles.size}
                          </span>
                        )}
                      </button>

                      {listasMenuOpen && (
                        <>
                          {/* overlay para cerrar */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setListasMenuOpen(false)}
                          />
                          <div
                            className="absolute right-0 top-full mt-1 z-50 rounded-xl border p-1 min-w-48"
                            style={{
                              background: "#FFFFFF",
                              borderColor: "#E2E8F0",
                              boxShadow:
                                "0 4px 6px -1px rgba(15,34,51,0.08), 0 2px 4px -2px rgba(15,34,51,0.06)",
                            }}
                          >
                            {/* Encabezado con toggle todo */}
                            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                              <span
                                className="text-[10px] font-bold uppercase tracking-widest"
                                style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  color: "#64748B",
                                }}
                              >
                                Columnas visibles
                              </span>
                              <button
                                type="button"
                                onClick={toggleTodasListas}
                                className="text-[10px] font-semibold text-[#0F2233] hover:underline"
                              >
                                {listasVisibles.size === listas.length
                                  ? "Quitar todas"
                                  : "Ver todas"}
                              </button>
                            </div>
                            <div
                              className="w-full h-px mb-1"
                              style={{ background: "#F1F5F9" }}
                            />
                            {/* Lista de checkboxes */}
                            {listas.map((l: any) => {
                              const visible = listasVisibles.has(l.Id);
                              return (
                                <button
                                  key={l.Id}
                                  type="button"
                                  onClick={() => toggleLista(l.Id)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-[#F8FAFC]"
                                >
                                  {/* Checkbox custom */}
                                  <span
                                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors"
                                    style={{
                                      borderColor: visible
                                        ? "#0F2233"
                                        : "#CBD5E1",
                                      background: visible
                                        ? "#0F2233"
                                        : "transparent",
                                    }}
                                  >
                                    {visible && (
                                      <svg
                                        viewBox="0 0 10 8"
                                        fill="none"
                                        className="w-2.5 h-2"
                                      >
                                        <path
                                          d="M1 4l2.5 2.5L9 1"
                                          stroke="white"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    )}
                                  </span>
                                  <span
                                    className="truncate text-left font-medium"
                                    style={{
                                      color: visible ? "#0F2233" : "#94A3B8",
                                    }}
                                  >
                                    {l.Nombre}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              }
            />
          </div>
        </div>

        {/* Panel Derecho: Configuración de la Regla */}
        <div
          className={`xl:col-span-1 ${
            mobileTab === "precios" ? "h-max top-0 sticky" : "hidden xl:block"
          }`}
        >
          <div className="sticky top-6 flex flex-col gap-4">
            <PanelRegla
              regla={regla}
              setRegla={setRegla}
              previewModo={previewModo}
              previewEstaActualizada={previewEstaActualizada}
              onGenerarPreview={generarVistaPrevia}
              onLimpiarPreview={limpiarVistaPrevia}
              onAplicar={() => setIsConfirmOpen(true)}
              isApplying={isApplying}
              seleccionadosCount={seleccionados.size}
              listas={listas}
            />
          </div>
        </div>
      </div>

      <ConfirmarModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        regla={regla}
        count={seleccionados.size}
        isApplying={isApplying}
      />
    </div>
  );
}
