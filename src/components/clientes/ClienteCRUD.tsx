"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import ClienteForm from "./ClienteForm";
import { Chip, Tooltip, Button } from "@heroui/react";
import { clienteListAdapter } from "@/lib/adapters/cliente.adapter";
import { Cliente } from "@/lib/validations/cliente.schema";

export default function ClienteCRUD() {
  return (
    <GenericCrud<Cliente>
      apiPath="/api/clientes"
      queryKey="clientes-generic"
      title="Gestión de Clientes"
      searchPlaceholder="Buscar por nombre, email, dni"
      FormComponent={ClienteForm}
      transformer={(item) => clienteListAdapter(item)}
      columns={[
        { uid: "nombreCompleto", name: "CLIENTE", sortable: true },
        { uid: "condicionIva", name: "CONDICIÓN IVA", sortable: true },
        { uid: "localidad", name: "UBICACIÓN", sortable: false },
        { uid: "contacto", name: "CONTACTO", sortable: false },
        { uid: "ctaCte", name: "CTA. CTE.", sortable: true },
        { uid: "acciones", name: "ACCIONES" },
      ]}
      renderCell={(item, columnKey, actions) => {
        switch (columnKey) {
          case "nombreCompleto":
            return (
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900">
                  {item.Nombre + " " + item.Apellido}
                </span>
                {item.Dni && (
                  <span className="text-xs text-gray-500">DNI: {item.Dni}</span>
                )}
              </div>
            );
          case "condicionIva":
            return (
              <Chip
                color={item.CondicionIva ? "success" : "danger"}
                variant="flat"
                size="sm"
              >
                {item.CondicionIva || "N/A"}
              </Chip>
            );
          case "localidad":
            return (
              <div className="flex flex-col text-sm">
                <span>{item.Localidad || "Localidad pendiente"}</span>
                <span className="text-xs text-gray-500">{item.Direccion}</span>
              </div>
            );
          case "contacto":
            return (
              <div className="flex flex-col text-sm gap-1">
                {item.Mail && (
                  <span className="flex items-center gap-1 text-xs">
                    ✉️ {item.Mail}
                  </span>
                )}
                {item.Telefono && (
                  <span className="flex items-center gap-1 text-xs">
                    📞 {item.Telefono}
                  </span>
                )}
              </div>
            );
          case "ctaCte":
            return (
              <div className="flex flex-col gap-1">
                {item.ActivarCtaCte ? (
                  <>
                    <Chip variant="flat" size="sm" color="success">
                      Activa
                    </Chip>
                    {item.TieneLimiteCompra && (
                      <span className="text-xs text-gray-500">
                        Límite: ${item.MontoMaximoCtaCte?.toLocaleString()}
                      </span>
                    )}
                  </>
                ) : (
                  <Chip variant="flat" size="sm" color="danger">
                    No
                  </Chip>
                )}
              </div>
            );
          case "acciones":
            return (
              <div className="flex gap-2">
                <Tooltip content="Editar" color="warning">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="warning"
                    onPress={() => actions.onEdit(item)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-5 text-gray-500"
                    >
                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                  </Button>
                </Tooltip>
                <Tooltip content="Eliminar" color="danger">
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={() => actions.onDelete(item)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-5 text-gray-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </Tooltip>
              </div>
            );
          default:
            return null;
        }
      }}
    />
  );
}
