"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import ClienteForm from "./ClienteForm";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Button, Chip, Tooltip, addToast } from "@heroui/react";
import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";
import { clienteListAdapter } from "@/lib/adapters/cliente.adapter";
import { Cliente } from "@/lib/validations/cliente.schema";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

export default function ClienteCRUD() {
  const currency = useCurrency();
  return (
    <GenericCrud<Cliente>
      apiPath="/api/clientes"
      queryKey="clientes-generic"
      title="Gestión de Clientes"
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
                  item.CondicionIva
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
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
                    Límite de compra:{" "}
                    {formatCurrency(
                      Number(item.MontoMaximoCtaCte ?? 0),
                      currency,
                    )}
                  </p>
                )}
                {!item.TieneLimiteCompra && (
                  <p className="text-slate-500 text-xs mt-1">
                    Sin límite configurado
                  </p>
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
      exportConfig={{
        filename: "clientes",
        columns: [
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
        mapItem: (c) => ({
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
        }),
      }}
      bulkActionsDropdown={[
        {
          key: "cambiar-estado",
          label: "Cambiar estado",
          onAction: (ctx) => {
            addToast({
              title: "Cambiar estado",
              description: `${ctx.totalCount} cliente(s)`,
            });
          },
        },
        {
          key: "editar-campos",
          label: "Editar campos comunes",
          onAction: (ctx) => {
            addToast({
              title: "Editar campos",
              description: `${ctx.totalCount} cliente(s)`,
            });
          },
        },
        {
          key: "exportar-csv",
          label: "Exportar como CSV",
          onAction: (ctx) => {
            const data = ctx.items.map((c) => ({
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
            const columns = [
              { key: "Nombre" as const, header: "Nombre" },
              { key: "Apellido" as const, header: "Apellido" },
              { key: "Dni" as const, header: "DNI" },
              { key: "Mail" as const, header: "Email" },
              { key: "Telefono" as const, header: "Teléfono" },
              { key: "Direccion" as const, header: "Dirección" },
              { key: "Localidad" as const, header: "Localidad" },
              { key: "CondicionIva" as const, header: "Cond. IVA" },
              { key: "ActivarCtaCte" as const, header: "Cta. Cte." },
              { key: "MontoMaximoCtaCte" as const, header: "Límite Cta. Cte." },
            ];
            exportToCsv(data, columns, "clientes");
            addToast({
              title: "Exportado",
              description: `${ctx.items.length} cliente${ctx.items.length !== 1 ? "s" : ""} exportado${ctx.items.length !== 1 ? "s" : ""} como CSV`,
              color: "success",
            });
            ctx.clearSelection();
          },
        },
        {
          key: "exportar-xls",
          label: "Exportar como XLS",
          onAction: (ctx) => {
            const data = ctx.items.map((c) => ({
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
            const columns = [
              { key: "Nombre" as const, header: "Nombre" },
              { key: "Apellido" as const, header: "Apellido" },
              { key: "Dni" as const, header: "DNI" },
              { key: "Mail" as const, header: "Email" },
              { key: "Telefono" as const, header: "Teléfono" },
              { key: "Direccion" as const, header: "Dirección" },
              { key: "Localidad" as const, header: "Localidad" },
              { key: "CondicionIva" as const, header: "Cond. IVA" },
              { key: "ActivarCtaCte" as const, header: "Cta. Cte." },
              { key: "MontoMaximoCtaCte" as const, header: "Límite Cta. Cte." },
            ];
            exportToXls(data, columns, "clientes");
            addToast({
              title: "Exportado",
              description: `${ctx.items.length} cliente${ctx.items.length !== 1 ? "s" : ""} exportado${ctx.items.length !== 1 ? "s" : ""} como Excel`,
              color: "success",
            });
            ctx.clearSelection();
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
              <div className="flex gap-2 w-full justify-center items-center">
                <Tooltip
                  content={
                    item.Nombre === consumidorFinalSchema.Nombre ||
                    item.Apellido === consumidorFinalSchema.Apellido
                      ? "No se puede editar"
                      : "Editar"
                  }
                  color="warning"
                >
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="warning"
                    disabled={
                      item.Nombre === consumidorFinalSchema.Nombre ||
                      item.Apellido === consumidorFinalSchema.Apellido
                    }
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
                <Tooltip
                  content={
                    item.Nombre === consumidorFinalSchema.Nombre ||
                    item.Apellido === consumidorFinalSchema.Apellido
                      ? "No se puede eliminar"
                      : "Eliminar"
                  }
                  color="danger"
                >
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="light"
                    disabled={
                      item.Nombre === consumidorFinalSchema.Nombre ||
                      item.Apellido === consumidorFinalSchema.Apellido
                    }
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
