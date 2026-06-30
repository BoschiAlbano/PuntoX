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
} from "lucide-react";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { Producto } from "@/lib/validations/producto.schema";

import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";

type MobileTab = "busqueda" | "precios";

export default function ActualizarPreciosContainer() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("busqueda");

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

    const listasCols = listas.map((l: any) => ({
      uid: `lista-${l.Id}`,
      name: l.Nombre,
      align: "end" as const,
    }));

    return [...base, ...listasCols];
  }, [listas]);

  // ─── Renderizado de Celdas ─────────────────────────────────────────────
  const renderCell = useCallback(
    (articulo: Producto, columnKey: Key) => {
      const key = columnKey as string;

      if (key === "Descripcion") {
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-700 leading-snug">
              {articulo.Descripcion}
            </span>
            <div className="flex gap-1 mt-0.5">
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-px rounded">
                {articulo.CodigoBarra}
              </span>
              {articulo.Marca && (
                <span className="text-[10px] text-[#67afc3] bg-[#67afc3]/10 px-1.5 py-px rounded">
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
                costoCambio
                  ? "font-medium text-sky-600"
                  : "text-slate-400 font-normal"
              }`}
            >
              ${costoActual.toLocaleString()}
            </span>
            {costoCambio && (
              <span className="text-[10px] text-slate-500">
                Antes: ${costoOriginal!.toLocaleString()}
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

        if (!precioActual) return <span className="text-slate-300">—</span>;

        const precioOriginal = (
          articulo as Producto & {
            PreciosListaOriginal?: Producto["PreciosLista"];
            EsSimulacion?: boolean;
          }
        ).PreciosListaOriginal?.find((p) => p.ListaPrecioId === listaId);

        return (
          <div className="flex flex-col items-end gap-0.5">
            <span
              className={`font-mono text-sm ${previewModo ? "font-medium text-sky-600" : "font-normal text-slate-600"}`}
            >
              ${precioActual.PrecioFinal.toLocaleString()}
            </span>

            {previewModo && precioOriginal && (
              <span className="text-[10px] text-slate-500">
                Antes: ${precioOriginal.PrecioFinal.toLocaleString()}
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
      {/* ── MOBILE TABS ── solo visible en pantallas < xl */}
      <div className="xl:hidden flex items-center bg-transparent border-b border-slate-100 shrink-0 px-3 pt-1 mb-2">
        <button
          onClick={() => setMobileTab("busqueda")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            mobileTab === "busqueda"
              ? "border-[#67afc3] text-[#67afc3]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Search size={15} />
          <span>Búsqueda</span>
          {seleccionados.size > 0 && (
            <span className="ml-1 min-w-5 h-5 rounded-full bg-[#67afc3] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
              {seleccionados.size}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileTab("precios")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            mobileTab === "precios"
              ? "border-[#67afc3] text-[#67afc3]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Precios</span>
          {previewModo && (
            <span className="ml-1 text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">
              Activo
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Panel Izquierdo: Tabla Genérica */}
        <div
          className={`xl:col-span-3 flex flex-col min-h-0 ${
            mobileTab === "busqueda" ? "flex" : "hidden xl:flex"
          }`}
        >
          {previewModo && (
            <div
              className={`mb-3 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
                previewEstaActualizada
                  ? "border-sky-200 bg-sky-50 text-sky-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <Eye className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {previewEstaActualizada
                    ? "Vista previa activa en la grilla"
                    : "La vista previa quedó desactualizada"}
                </p>
                <p className="text-xs leading-relaxed">
                  {previewEstaActualizada
                    ? `Se simularon ${previewResumen.precios} precios sobre ${previewResumen.articulos} artículos. ${previewResumen.preciosConCambio} cambian respecto del valor actual.`
                    : "Cambiaron los parámetros de la regla. Presiona nuevamente el botón para refrescar los valores simulados."}
                </p>
              </div>
            </div>
          )}

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
                <div className="flex flex-col sm:flex-row gap-2">
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
                </div>
              }
            />
          </div>
        </div>

        {/* Panel Derecho: Configuración de la Regla */}
        <div
          className={`xl:col-span-1 ${
            mobileTab === "precios" ? "block" : "hidden xl:block"
          }`}
        >
          <div className="sticky top-6">
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

            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed shadow-sm">
              <p className="font-bold mb-1 text-slate-700">💡 Tips de uso:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Activa <strong>Vista Previa</strong> para ver el impacto en
                  color.
                </li>
                <li>Los artículos sin precio en una lista se ignoran.</li>
                <li>
                  <strong>Ceil $99</strong> es ideal para precios psicológicos.
                </li>
              </ul>
            </div>
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
