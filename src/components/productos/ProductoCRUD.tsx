"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import ProductoForm from "./ProductoForm";
import { Producto } from "@/lib/validations/producto.schema";
import { Chip } from "@heroui/react";
import { productoListAdapter } from "@/lib/adapters/producto.adapter";
import { DeleteButton, EditButton } from "@/components/shared/TableActions";

export default function ProductoCRUD() {
  return (
    <GenericCrud<Producto>
      apiPath="/api/productos"
      queryKey="productos-generic"
      title="Gestión de Productos"
      searchPlaceholder="Buscar productos..."
      FormComponent={ProductoForm}
      transformer={(item) => productoListAdapter(item)}
      columns={[
        { uid: "Codigo", name: "CODIGO", sortable: false },
        { uid: "Descripcion", name: "DESCRIPCIÓN", sortable: true },
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
              <span className="font-medium text-gray-700">{item.Stock}</span>
            );
          case "Costo":
            return (
              <span className="font-medium text-gray-700">
                {item.Precio.PrecioCosto}
              </span>
            );
          case "Minorista":
            return (
              <span className="font-medium text-gray-700">
                {item.Precio.PrecioCosto}
              </span>
            );
          case "Mayorista":
            return (
              <span className="font-medium text-gray-700">
                {item.Precio.PrecioPublico2}
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
              <div className="flex gap-2">
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
  );
}
