"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import ProductoForm from "./ProductoForm";
import { Producto } from "@/lib/validations/producto.schema";
import { Chip, Tooltip, Button } from "@heroui/react";
import { productoListAdapter } from "@/lib/adapters/producto.adapter";

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
                <div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="warning"
                    onPress={() => actions.onEdit(item)}
                    className="transition-all duration-200 hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-1"
                    aria-label={`Editar ${item.Descripcion || "producto"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-5 text-gray-500 transition-colors group-hover:text-warning-600"
                    >
                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                  </Button>
                </div>
                <div>
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={() => actions.onDelete(item)}
                    className="transition-all duration-200 hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-danger-300 focus:ring-offset-1"
                    aria-label={`Eliminar ${item.Descripcion || "producto"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-5 text-gray-500 transition-colors group-hover:text-danger-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            );
          default:
            break;
        }
      }}
    ></GenericCrud>
  );
}
