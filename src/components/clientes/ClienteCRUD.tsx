"use client";

import { Users } from "lucide-react";
import GenericCrud from "@/components/shared/GenericCrud";
import ClienteForm from "./ClienteForm";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Chip, Tooltip } from "@heroui/react";
import { DeleteButton, EditButton } from "@/components/shared/TableActions";
import { clienteListAdapter } from "@/lib/adapters/cliente.adapter";
import { Cliente } from "@/lib/validations/cliente.schema";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

function isConsumidorFinal(item: Cliente) {
  return (
    item.Nombre === consumidorFinalSchema.Nombre &&
    item.Apellido === consumidorFinalSchema.Apellido
  );
}

export default function ClienteCRUD() {
  const currency = useCurrency();
  return (
    <GenericCrud<Cliente>
      apiPath="/api/clientes"
      queryKey="clientes-generic"
      searchPlaceholder="Buscar por nombre, email, dni"
      FormComponent={ClienteForm}
      transformer={(item) => clienteListAdapter(item)}
      additionalInvalidateQueryKeys={["cliente"]}
      columns={[
        {
          uid: "nombreCompleto",
          name: "CLIENTE",
          sortable: true,
          align: "start",
        },
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
                        Límite: {formatCurrency(Number(item.MontoMaximoCtaCte ?? 0), currency)}
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
          case "acciones": {
            const esConsumidorFinal = isConsumidorFinal(item);
            return (
              <div className="flex gap-2 w-full justify-center items-center">
                <Tooltip
                  content={esConsumidorFinal ? "No se puede editar" : "Editar"}
                  color="warning"
                >
                  <span>
                    <EditButton
                      onPress={() => actions.onEdit(item)}
                      label={`Editar ${item.Nombre || "cliente"}`}
                      isDisabled={esConsumidorFinal}
                    />
                  </span>
                </Tooltip>
                <Tooltip
                  content={
                    esConsumidorFinal ? "No se puede eliminar" : "Eliminar"
                  }
                  color="danger"
                >
                  <span>
                    <DeleteButton
                      onPress={() => actions.onDelete(item)}
                      label={`Eliminar ${item.Nombre || "cliente"}`}
                      isDisabled={esConsumidorFinal}
                    />
                  </span>
                </Tooltip>
              </div>
            );
          }
          default:
            return null;
        }
      }}
    />
  );
}
