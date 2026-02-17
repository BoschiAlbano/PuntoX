"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import ProductoForm from "./ProductoForm";
import { Producto } from "@/lib/validations/producto.schema";
import { Chip, Skeleton } from "@heroui/react";
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
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addToast } from "@heroui/react";

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
            {p?.UnidadMedida?.Descripcion ?? "-"} · IVA {p?.Iva?.Porcentaje ?? "-"}%
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
              (p?.StockMinimo ?? 0) > 0 && (p?.Stock ?? 0) <= (p?.StockMinimo ?? 0)
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
          <div>
            <p className="text-slate-400 text-xs">Minorista</p>
            <p className="font-semibold text-green-700">
              {formatCurrency(Number(p?.Precio?.PrecioPublico ?? 0), currency)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Mayorista</p>
            <p className="font-semibold text-blue-700">
              {formatCurrency(Number(p?.Precio?.PrecioPublico2 ?? 0), currency)}
            </p>
          </div>
        </div>
        {(() => {
          const costo = Number(p?.Precio?.PrecioCosto ?? 0);
          const venta = Number(p?.Precio?.PrecioPublico ?? 0);
          const margen = costo > 0 ? (((venta / costo) - 1) * 100).toFixed(1) : null;
          return margen != null ? (
            <p className="text-slate-400 text-xs mt-1">Margen: {margen}%</p>
          ) : null;
        })()}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            p?.EstaEliminado ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
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

export default function ProductoCRUD() {
  const currency = useCurrency();
  const { addStockMutation } = useProductos();
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [productToAddStock, setProductToAddStock] = useState<Producto | null>(
    null,
  );

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
        queryKey="productos-generic"
        searchPlaceholder="Buscar productos..."
        FormComponent={ProductoForm}
        renderRowPreview={(item) => <ProductoPreviewContent item={item} />}
        getRowPreviewTitle={(item) => item.Descripcion || "Producto"}
        transformer={(item) => productoListAdapter(item)}
        additionalInvalidateQueryKeys={["producto-detail"]}
        columns={[
          { uid: "Codigo", name: "CODIGO", sortable: false },
          {
            uid: "Descripcion",
            name: "DESCRIPCIÓN",
            sortable: true,
            align: "start",
          },
          { uid: "Stock", name: "STOCK", sortable: true },
          { uid: "Costo", name: "COSTO", sortable: true },
          { uid: "Minorista", name: "MINORISTA", sortable: true },
          { uid: "Mayorista", name: "MAYORISTA", sortable: true },
          { uid: "Estado", name: "ESTADO" },
          { uid: "acciones", name: "ACCIONES" },
        ]}
        renderCell={(item, columnKey, actions) => {
          switch (columnKey) {
            case "Codigo":
              return item.CodigoBarra;
            case "Descripcion":
              return (
                <span className="font-medium text-gray-700">
                  {item.Descripcion}
                </span>
              );
            case "Stock": {
              const stock = item.Stock ?? 0;
              const stockMinimo = item.StockMinimo ?? 0;
              const isLowStock = stockMinimo > 0 && stock <= stockMinimo;
              return (
                <div className="flex flex-col">
                  <span
                    className={
                      isLowStock
                        ? "font-semibold text-red-600"
                        : "font-medium text-gray-700"
                    }
                  >
                    {item.Stock}
                  </span>
                  {item.SucursalNombre && (
                    <span className="text-xs text-gray-500 mt-0.5">
                      {item.SucursalNombre}
                    </span>
                  )}
                </div>
              );
            }
            case "Costo":
              return (
                <span className="font-medium text-gray-700">
                  {formatCurrency(Number(item.Precio?.PrecioCosto ?? 0), currency)}
                </span>
              );
            case "Minorista":
              return (
                <span className="font-medium text-gray-700">
                  {formatCurrency(Number(item.Precio?.PrecioPublico ?? 0), currency)}
                </span>
              );
            case "Mayorista":
              return (
                <span className="font-medium text-gray-700">
                  {formatCurrency(Number(item.Precio?.PrecioPublico2 ?? 0), currency)}
                </span>
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
                    onPress={() => actions.onEdit(item)}
                    label={`Editar ${item.Descripcion || "producto"}`}
                  />
                  <DeleteButton
                    onPress={() => actions.onDelete(item)}
                    label={`Eliminar ${item.Descripcion || "producto"}`}
                  />
                </div>
              );
            default:
              break;
          }
        }}
      ></GenericCrud>

      <AddStockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={productToAddStock}
        onConfirm={handleAddStock}
      />
    </>
  );
}
