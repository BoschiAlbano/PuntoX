"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import MarcaForm, { Marca } from "./MarcaForm";
import { Chip } from "@heroui/react";
import { DeleteButton, EditButton } from "../shared/TableActions";

export default function MarcaCRUD() {
  return (
    <GenericCrud<Marca>
      apiPath="/api/marcas"
      queryKey="marcas-generic"
      title="Gestión de Marcas"
      searchPlaceholder="Buscar marcas..."
      FormComponent={MarcaForm}
      // Definimos las columnas
      columns={[
        {
          uid: "Descripcion",
          name: "DESCRIPCIÓN",
          sortable: true,
          align: "start",
        },
        { uid: "Estado", name: "ESTADO" },
        { uid: "acciones", name: "ACCIONES" },
      ]}
      // Función para renderizar celdas personalizadas
      renderCell={(item, columnKey, actions) => {
        switch (columnKey) {
          case "Descripcion":
            return (
              <span className="font-medium text-gray-700">
                {item.Descripcion}
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
                <EditButton
                  onPress={() => actions.onEdit(item)}
                  label={`Editar ${item.Descripcion || "marca"}`}
                />
                <DeleteButton
                  onPress={() => actions.onDelete(item)}
                  label={`Eliminar ${item.Descripcion || "marca"}`}
                />
              </div>
            );
          default:
            return null;
        }
      }}
    />
  );
}
