"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import { Producto } from "@/lib/validations/producto.schema";
import { Button, Chip, Skeleton, Tooltip } from "@heroui/react";
import { productoListAdapter } from "@/lib/adapters/producto.adapter";
import {
  AddStockButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/TableActions";
import AddStockModal from "./AddStockModal";
import { useProductos } from "@/hooks/useProductos";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import { BulkCambiarEstadoModal } from "@/components/shared/BulkCambiarEstadoModal";
import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";
import { Copy, Check, Barcode } from "lucide-react";
import { ProductoCard } from "./ProductoCard";
import { BulkPrintBarcodesModal } from "./BulkPrintBarcodesModal";

function ProductoPreviewContent({ item }: { item: Producto }) {
  const currency = useCurrency();
  const { data: fullProduct, isLoading } = useQuery({
    queryKey: ["producto-detail", item?.Id],
    queryFn: async () => {
      const res = await fetch(`/api/productos/${item?.Id}`);
      if (!res.ok) throw new Error("Error al cargar producto");
      return res.json();
    },
    enabled: !!item?.Id,
  });

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );

  const p = fullProduct ?? item;

  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-slate-500 text-xs mb-0.5">Código / Barras</p>
          <p className="font-medium">
            {p?.Codigo ?? "-"} / {p?.CodigoBarra ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-0.5">Categorización</p>
          <p className="font-medium">
            {p?.Marca?.Descripcion ?? "-"} · {p?.Rubro?.Descripcion ?? "-"}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            {p?.UnidadMedida?.Descripcion ?? "-"} · IVA{" "}
            {p?.Iva?.Porcentaje ?? "-"}%
          </p>
        </div>
      </div>

      {p?.Detalle && (
        <div>
          <p className="text-slate-500 text-xs mb-0.5">Detalle</p>
          <p className="text-slate-700 leading-relaxed">{p.Detalle}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-slate-500 text-xs mb-0.5">Stock</p>
          <p
            className={
              (p?.StockMinimo ?? 0) > 0 &&
              (p?.Stock ?? 0) <= (p?.StockMinimo ?? 0)
                ? "font-semibold text-red-600"
                : "font-medium"
            }
          >
            {p?.Stock ?? 0} unidades
          </p>
          <p className="text-slate-400 text-xs">
            Mínimo: {p?.StockMinimo ?? 0}
            {p?.SucursalNombre && ` · ${p.SucursalNombre}`}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-0.5">Ubicación</p>
          <p className="font-medium">{p?.Ubicacion || "—"}</p>
        </div>
      </div>

      <div>
        <p className="text-slate-500 text-xs mb-1">Precios</p>
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 border border-gray-100">
          <div>
            <p className="text-slate-400 text-xs">Costo</p>
            <p className="font-semibold">
              {formatCurrency(Number(p?.Precio?.PrecioCosto ?? 0), currency)}
            </p>
          </div>
          {p?.PreciosLista?.slice(0, 2).map((pl: any, idx: number) => (
            <div key={pl.Id || idx}>
              <p
                className="text-slate-400 text-xs truncate"
                title={pl.ListaPrecio?.Nombre}
              >
                {pl.ListaPrecio?.Nombre || `Lista ${idx + 1}`}
              </p>
              <p
                className={`font-semibold ${idx === 0 ? "text-green-700" : "text-blue-700"}`}
              >
                {formatCurrency(Number(pl.PrecioFinal ?? 0), currency)}
              </p>
            </div>
          ))}
        </div>
        {(() => {
          const costo = Number(p?.Precio?.PrecioCosto ?? 0);
          const venta = p?.PreciosLista?.[0]
            ? Number(p.PreciosLista[0].PrecioFinal)
            : 0;
          const margen =
            costo > 0 && venta > 0
              ? ((venta / costo - 1) * 100).toFixed(1)
              : null;
          return margen != null ? (
            <p className="text-slate-400 text-xs mt-1">
              Margen princ.: {margen}%
            </p>
          ) : null;
        })()}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            p?.EstaEliminado
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {p?.EstaEliminado ? "Inactivo" : "Activo"}
        </span>
        {p?.DescuentaStock && (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
            Descuenta stock
          </span>
        )}
        {p?.PermiteStockNegativo && (
          <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
            Stock negativo permitido
          </span>
        )}
        {p?.ActivarLimiteVenta && (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
            Límite: {p?.LimiteVenta}
          </span>
        )}
        {p?.ActivarHoraVenta && (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
            Horario venta
          </span>
        )}
        {p?.TipoVenta && (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
            {p.TipoVenta}
          </span>
        )}
      </div>
    </div>
  );
}

async function bulkPatchProductos(
  ids: (number | string)[],
  data: Record<string, unknown>,
) {
  for (const id of ids) {
    const res = await fetch("/api/productos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Id: id, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || "Error al actualizar");
    }
  }
}

function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      addToast({
        title: "Copiado",
        description: "Código copiado al portapapeles",
        color: "success",
        timeout: 1500,
      });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo copiar",
        color: "danger",
      });
    }
  }, [value]);

  if (!value) return <span className="text-slate-500">—</span>;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#67afc3]/40 transition-all duration-150 group"
      title="Clic para copiar"
    >
      <span className="font-mono text-sm">{value}</span>
      {copied ? (
        <Check size={14} strokeWidth={2} className="text-green-600 shrink-0" />
      ) : (
        <Copy
          size={14}
          strokeWidth={2}
          className="text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity duration-150"
        />
      )}
    </button>
  );
}

export default function ProductoCRUD() {
  const router = useRouter();
  const currency = useCurrency();
  const queryClient = useQueryClient();
  const { addStockMutation } = useProductos();
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [productToAddStock, setProductToAddStock] = useState<Producto | null>(
    null,
  );
  const [bulkEstadoModal, setBulkEstadoModal] = useState<{
    open: boolean;
    items: Producto[];
    clearSelection?: () => void;
  }>({ open: false, items: [] });
  const [bulkPrintModal, setBulkPrintModal] = useState<{
    open: boolean;
    items: Producto[];
    clearSelection?: () => void;
  }>({ open: false, items: [] });
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const invalidateProductos = () => {
    queryClient.invalidateQueries({ queryKey: ["productos-generic"] });
    queryClient.invalidateQueries({ queryKey: ["producto-detail"] });
  };

  const handleOpenStockModal = (item: Producto) => {
    setProductToAddStock(item);
    setIsStockModalOpen(true);
  };

  const handleAddStock = async (qty: number) => {
    if (!productToAddStock) return;
    await addStockMutation.mutateAsync({
      productoId: productToAddStock.Id,
      cantidad: qty + (productToAddStock.Stock || 0),
    });

    const newStock = (productToAddStock.Stock || 0) + qty;

    addToast({
      title: "Stock actualizado",
      description: `Se agregó ${qty} al stock. Nuevo total: ${newStock}`,
      color: "success",
    });
  };

  return (
    <>
      <GenericCrud<Producto>
        apiPath="/api/productos"
        getApiExtraParams={(state) => ({
          tipo: "articulo",
          ...(state.lowStockOnly ? { bajoStock: true } : {}),
        })}
        queryKey="productos-generic"
        searchPlaceholder="Buscar por nombre, código o barras..."
        onNewClick={() => router.push("/productos/new")}
        newButtonText="Nuevo Producto"
        renderRowPreview={(item) => <ProductoPreviewContent item={item} />}
          getRowPreviewTitle={(item) => item.Descripcion || "Producto"}
          showEditInPreview={false}
          enableBulkActions
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          renderCard={(item, actions) => (
            <ProductoCard
              item={item}
              onEdit={() => router.push(`/productos/${item.Id}`)}
              onDelete={actions.onDelete}
              onOpenStockModal={handleOpenStockModal}
              onClick={actions.onPreview}
            />
          )}
          lowStockFilterFn={(item) => {
            const min = item.StockMinimo ?? 0;
            const stock = item.Stock ?? 0;
            return min > 0 && stock <= min;
          }}
          lowStockApiParam
          printConfig={{
            title: "Listado de Productos",
            orientation: "landscape",
          }}
          extraMenuItems={(currentItems) => [
            {
              key: "imprimir-barras-todos",
              label: "Imprimir códigos",
              icon: <Barcode size={16} strokeWidth={2} />,
              onPress: () => {
                setBulkPrintModal({
                  open: true,
                  items: currentItems,
                });
              },
            },
          ]}
          bulkActionsDropdown={[
            {
              key: "imprimir-barras",
              label: "Imprimir códigos",
              onAction: (ctx) => {
                setBulkPrintModal({
                  open: true,
                  items: ctx.items,
                  clearSelection: ctx.clearSelection,
                });
              },
            },
            {
              key: "cambiar-estado",
              label: "Cambiar estado",
              onAction: (ctx) => {
                setBulkEstadoModal({
                  open: true,
                  items: ctx.items,
                  clearSelection: ctx.clearSelection,
                });
              },
            },
          ]}
          transformer={(item) => productoListAdapter(item)}
          additionalInvalidateQueryKeys={["producto-detail"]}
          exportConfig={{
            filename: "productos",
            columns: [
              { key: "CodigoBarra", header: "Código" },
              { key: "Descripcion", header: "Descripción" },
              { key: "Marca", header: "Marca" },
              { key: "Rubro", header: "Rubro" },
              { key: "Stock", header: "Stock" },
              { key: "StockMinimo", header: "Stock mínimo" },
              { key: "Costo", header: "Costo" },
              { key: "Precios", header: "Precios" },
            ],
            mapItem: (p) => ({
              CodigoBarra: p.CodigoBarra,
              Descripcion: p.Descripcion,
              Marca: p.Marca?.Descripcion ?? "",
              Rubro: p.Rubro?.Descripcion ?? "",
              Stock: p.Stock ?? 0,
              StockMinimo: p.StockMinimo ?? 0,
              Costo: p.PrecioCosto ?? 0,
              Precios:
                p.PreciosLista?.map(
                  (pl: any) => `${pl.ListaPrecio?.Nombre}: $${pl.PrecioFinal}`,
                ).join(" | ") || "",
            }),
          }}
          columns={[
            { uid: "Codigo", name: "CODIGO", sortable: false },
            {
              uid: "Descripcion",
              name: "DESCRIPCIÓN",
              sortable: true,
              align: "start",
            },
            { uid: "Marca", name: "MARCA", sortable: true, align: "start" },
            { uid: "Rubro", name: "RUBRO", sortable: true, align: "start" },
            { uid: "Stock", name: "STOCK", sortable: true },
            {
              uid: "Costo",
              name: "COSTO",
              sortable: true,
              sortKey: "Precio.PrecioCosto",
            },
            {
              uid: "Precios",
              name: "PRECIOS",
              sortable: false,
            },
            { uid: "Estado", name: "ESTADO" },
            { uid: "acciones", name: "ACCIONES" },
          ]}
          renderCell={(item, columnKey, actions) => {
            switch (columnKey) {
              case "Codigo":
                return (
                  <CopyableCode
                    value={item.CodigoBarra || item.Codigo?.toString() || ""}
                  />
                );
              case "Descripcion":
                return (
                  <span className="font-medium text-gray-700">
                    {item.Descripcion}
                  </span>
                );
              case "Marca":
                return (
                  <span className="text-gray-600">
                    {item.Marca?.Descripcion ?? "—"}
                  </span>
                );
              case "Rubro":
                return (
                  <span className="text-gray-600">
                    {item.Rubro?.Descripcion ?? "—"}
                  </span>
                );
              case "Stock": {
                const stock = item.Stock ?? 0;
                const stockMinimo = item.StockMinimo ?? 0;
                const isLowStock = stockMinimo > 0 && stock <= stockMinimo;
                const fmt = (v: number) => parseFloat(v.toFixed(3)).toString();

                return (
                  <div className="flex flex-col gap-0.5 min-w-[80px]">
                    <Tooltip
                      content={
                        <div className="text-xs px-1 py-0.5">
                          <p>
                            <span className="text-slate-400">Mínimo:</span>{" "}
                            {fmt(stockMinimo)}
                          </p>
                          <p>
                            <span className="text-slate-400">Actual:</span>{" "}
                            {fmt(stock)}
                          </p>
                        </div>
                      }
                      placement="top"
                      delay={300}
                      classNames={{
                        base: "before:bg-[#0F2233]",
                        content: "bg-[#0F2233] text-white text-xs font-medium",
                      }}
                    >
                      <span
                        className={
                          isLowStock
                            ? "font-semibold text-red-600 cursor-default"
                            : "font-medium text-gray-700 cursor-default"
                        }
                      >
                        {fmt(stockMinimo)} / {fmt(stock)}
                      </span>
                    </Tooltip>
                    {item.SucursalNombre && (
                      <span className="text-[10px] text-slate-400">
                        {item.SucursalNombre}
                      </span>
                    )}
                  </div>
                );
              }
              case "Costo":
                return (
                  <span className="font-medium text-gray-700">
                    {formatCurrency(Number(item.PrecioCosto ?? 0), currency)}
                  </span>
                );
              case "Precios":
                return (
                  <div className="flex flex-col gap-0.5">
                    {item.PreciosLista?.slice(0, 2).map(
                      (pl: any, idx: number) => (
                        <span
                          key={pl.Id || idx}
                          className="text-xs text-gray-700 truncate max-w-[120px]"
                          title={`${pl.ListaPrecio?.Nombre}: ${pl.PrecioFinal}`}
                        >
                          <span className="text-gray-400 mr-1">
                            {pl.ListaPrecio?.Nombre?.substring(0, 3)}:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              Number(pl.PrecioFinal ?? 0),
                              currency,
                            )}
                          </span>
                        </span>
                      ),
                    )}
                    {(item.PreciosLista?.length || 0) > 2 && (
                      <span className="text-[10px] text-gray-400">
                        +{item.PreciosLista!.length - 2} más
                      </span>
                    )}
                  </div>
                );
              case "Estado":
                return (
                  <Chip
                    color={item.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {item.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                );
              case "acciones":
                return (
                  <div className="flex gap-2 w-full justify-center items-center">
                    <AddStockButton
                      onPress={() => handleOpenStockModal(item)}
                      label={`Agregar Stock ${item.Descripcion || "producto"}`}
                    />
                    <EditButton
                      onPress={() => router.push(`/productos/${item.Id}`)}
                      label={`Editar ${item.Descripcion || "producto"}`}
                    />
                    <DeleteButton
                      onPress={() => actions.onDelete(item)}
                      label={`Eliminar ${item.Descripcion || "producto"}`}
                    />
                  </div>
                );
              default:
                return null;
            }
          }}
        ></GenericCrud>

        <AddStockModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          product={productToAddStock}
          onConfirm={handleAddStock}
        />

        <BulkCambiarEstadoModal<Producto>
          isOpen={bulkEstadoModal.open}
          onClose={() => setBulkEstadoModal({ open: false, items: [] })}
          items={bulkEstadoModal.items}
          entityLabel="producto"
          getCurrentEstado={(p) => !!p.EstaEliminado}
          onConfirm={async (ids, nuevoEstado) => {
            await bulkPatchProductos(ids, {
              EstaEliminado: !nuevoEstado,
            });
          }}
          onSuccess={() => {
            bulkEstadoModal.clearSelection?.();
            invalidateProductos();
          }}
        />

        <BulkPrintBarcodesModal
          isOpen={bulkPrintModal.open}
          onClose={() => setBulkPrintModal({ open: false, items: [] })}
          items={bulkPrintModal.items}
          onSuccess={() => {
            bulkPrintModal.clearSelection?.();
          }}
        />
    </>
  );
}
