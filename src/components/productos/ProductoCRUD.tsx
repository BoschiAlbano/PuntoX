"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import ProductoForm from "./ProductoForm";
import { Producto } from "@/lib/validations/producto.schema";
import { Chip } from "@heroui/react";
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
import { addToast } from "@heroui/react";

export default function ProductoCRUD() {
  const { addStockMutation } = useProductos();
  const currency = useCurrency();
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
            case "Stock":
              return (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-700">
                    {item.Stock}
                  </span>
                  {item.SucursalNombre && (
                    <span className="text-xs text-gray-500 mt-0.5">
                      {item.SucursalNombre}
                    </span>
                  )}
                </div>
              );
            case "Costo":
              return (
                <span className="font-medium text-gray-700">
                  {formatCurrency(Number(item.Precio?.PrecioCosto ?? 0), currency)}
                </span>
              );
            case "Minorista":
              return (
                <span className="font-medium text-gray-700">
                  {formatCurrency(Number(item.Precio?.PrecioCosto ?? 0), currency)}
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
