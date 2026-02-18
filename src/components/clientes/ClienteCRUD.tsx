"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import ClienteForm from "./ClienteForm";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Chip, Tooltip, addToast } from "@heroui/react";
import { exportToCsv } from "@/lib/utils/exportCsv";
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
      renderRowPreview={(item) => (
        <div className="space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Cliente</p>
              <p className="font-semibold text-slate-800">
                {item.Nombre} {item.Apellido}
              </p>
              {item.Dni && (
                <p className="text-slate-500 text-xs mt-1">DNI: {item.Dni}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Condición IVA</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  item.CondicionIva ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {item.CondicionIva || "N/A"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Ubicación</p>
            <p className="font-medium">{item.Direccion || "—"}</p>
            {(item.Localidad || item.Departamento || item.Provincia) && (
              <p className="text-slate-500 text-xs mt-0.5">
                {[item.Localidad, item.Departamento, item.Provincia]
                  .filter(Boolean)
                  .join(" → ")}
              </p>
            )}
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Contacto</p>
            <div className="space-y-1">
              {item.Mail && (
                <p className="text-slate-700">
                  <span className="text-slate-400">✉️</span> {item.Mail}
                </p>
              )}
              {item.Telefono && (
                <p className="text-slate-700">
                  <span className="text-slate-400">📞</span> {item.Telefono}
                </p>
              )}
              {!item.Mail && !item.Telefono && (
                <p className="text-slate-400">Sin datos de contacto</p>
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-slate-500 text-xs mb-0.5">Cuenta Corriente</p>
            {item.ActivarCtaCte ? (
              <div>
                <span className="text-green-700 font-medium">Activa</span>
                {item.TieneLimiteCompra && (
                  <p className="text-slate-600 text-xs mt-1">
                    Límite de compra: {formatCurrency(Number(item.MontoMaximoCtaCte ?? 0), currency)}
                  </p>
                )}
                {!item.TieneLimiteCompra && (
                  <p className="text-slate-500 text-xs mt-1">Sin límite configurado</p>
                )}
              </div>
            ) : (
              <span className="text-slate-500">No activa</span>
            )}
          </div>
        </div>
      )}
      getRowPreviewTitle={(item) => `${item.Nombre} ${item.Apellido}`}
      enableBulkActions
      bulkActionsDropdown={[
        {
          key: "cambiar-estado",
          label: "Cambiar estado",
          onAction: (items) => {
            addToast({ title: "Cambiar estado", description: `${items.length} cliente(s)` });
          },
        },
        {
          key: "editar-campos",
          label: "Editar campos comunes",
          onAction: (items) => {
            addToast({ title: "Editar campos", description: `${items.length} cliente(s)` });
          },
        },
        {
          key: "exportar",
          label: "Exportar seleccionados",
          onAction: (items) => {
            const data = items.map((c) => ({
              Nombre: c.Nombre,
              Apellido: c.Apellido,
              Dni: c.Dni ?? "",
              Mail: c.Mail ?? "",
              Telefono: c.Telefono ?? "",
              Direccion: c.Direccion ?? "",
              Localidad: c.Localidad ?? "",
              CondicionIva: c.CondicionIva ?? "",
              ActivarCtaCte: c.ActivarCtaCte ? "Sí" : "No",
              MontoMaximoCtaCte: c.MontoMaximoCtaCte ?? 0,
            }));
            exportToCsv(
              data,
              [
                { key: "Nombre", header: "Nombre" },
                { key: "Apellido", header: "Apellido" },
                { key: "Dni", header: "DNI" },
                { key: "Mail", header: "Email" },
                { key: "Telefono", header: "Teléfono" },
                { key: "Direccion", header: "Dirección" },
                { key: "Localidad", header: "Localidad" },
                { key: "CondicionIva", header: "Cond. IVA" },
                { key: "ActivarCtaCte", header: "Cta. Cte." },
                { key: "MontoMaximoCtaCte", header: "Límite Cta. Cte." },
              ],
              "clientes"
            );
            addToast({
              title: "Exportado",
              description: `${items.length} cliente${items.length !== 1 ? "s" : ""} exportado${items.length !== 1 ? "s" : ""}`,
              color: "success",
            });
          },
        },
      ]}
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
