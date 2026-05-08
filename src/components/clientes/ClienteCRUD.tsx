"use client";

import { useRouter } from "next/navigation";
import GenericCrud from "@/components/shared/GenericCrud";
import ClienteForm from "./ClienteForm";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Button, Chip, Tooltip, addToast } from "@heroui/react";
import { CreditCard } from "lucide-react";

import { clienteListAdapter } from "@/lib/adapters/cliente.adapter";
import { Cliente } from "@/lib/validations/cliente.schema";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

export default function ClienteCRUD() {
  const currency = useCurrency();
  const router = useRouter();
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
        <div className="space-y-6 text-sm">
          <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {item.Nombre?.charAt(0).toUpperCase()}
              {item.Apellido?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">
                {item.Nombre} {item.Apellido}
              </p>
              {item.Dni && (
                <p className="text-slate-500 font-medium text-xs mt-0.5">
                  DNI: {item.Dni}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                Condición IVA
              </p>
              <span
                className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                  item.CondicionIva
                    ? "bg-[#67afc3]/15 text-[#67afc3]"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {item.CondicionIva || "N/A"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                Contacto
              </p>
              <div className="space-y-1.5">
                {item.Mail && (
                  <p className="text-slate-700 text-xs font-medium flex items-center gap-1.5">
                    <span className="text-slate-400">✉️</span>{" "}
                    <span className="truncate">{item.Mail}</span>
                  </p>
                )}
                {item.Telefono && (
                  <p className="text-slate-700 text-xs font-medium flex items-center gap-1.5">
                    <span className="text-slate-400">📞</span> {item.Telefono}
                  </p>
                )}
                {!item.Mail && !item.Telefono && (
                  <p className="text-slate-400 text-xs">Sin datos</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
            <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
              Ubicación
            </p>
            <p className="font-medium text-slate-700 text-sm">
              {item.Direccion || "—"}
            </p>
            {(item.Localidad || item.Departamento || item.Provincia) && (
              <p className="text-slate-500 text-xs mt-1">
                {[item.Localidad, item.Departamento, item.Provincia]
                  .filter(Boolean)
                  .join(" → ")}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-linear-to-br from-green-50 to-emerald-50/20 border border-green-100/50">
            <p className="text-green-600/60 font-semibold text-[10px] uppercase tracking-wider mb-1">
              Cuenta Corriente
            </p>
            {item.ActivarCtaCte ? (
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-semibold text-sm">
                  Habilitada
                </span>
                {item.TieneLimiteCompra ? (
                  <div className="text-right">
                    <p className="text-green-800/60 text-[10px] uppercase font-bold tracking-wider">
                      Límite
                    </p>
                    <p className="text-green-700 font-bold">
                      {formatCurrency(
                        Number(item.MontoMaximoCtaCte ?? 0),
                        currency,
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-green-700 font-medium text-sm">
                    Sin límite de compra
                  </p>
                )}
              </div>
            ) : (
              <span className="text-slate-500 font-medium text-sm">
                No activada
              </span>
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
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {item.Nombre?.charAt(0).toUpperCase()}
                  {item.Apellido?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    {item.Nombre} {item.Apellido}
                  </span>
                  {item.Dni && (
                    <span className="text-[11px] font-medium text-slate-500">
                      DNI: {item.Dni}
                    </span>
                  )}
                </div>
              </div>
            );
          case "condicionIva":
            return (
              <span
                className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                  item.CondicionIva
                    ? "bg-[#67afc3]/10 text-[#67afc3]"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {item.CondicionIva || "N/A"}
              </span>
            );
          case "localidad":
            return (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">
                  {item.Localidad || "Ubicación pendiente"}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {item.Direccion || "Sin dirección"}
                </span>
              </div>
            );
          case "contacto":
            return (
              <div className="flex flex-col justify-center gap-1.5 min-w-[140px]">
                {item.Mail ? (
                  <div className="flex items-center gap-2 group">
                    <span className="w-5 h-5 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] group-hover:bg-[#67afc3]/10 group-hover:text-[#67afc3] transition-colors">
                      ✉️
                    </span>
                    <span className="text-[12px] font-medium text-slate-600 truncate max-w-[150px]">
                      {item.Mail}
                    </span>
                  </div>
                ) : null}
                {item.Telefono ? (
                  <div className="flex items-center gap-2 group">
                    <span className="w-5 h-5 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] group-hover:bg-[#67afc3]/10 group-hover:text-[#67afc3] transition-colors">
                      📞
                    </span>
                    <span className="text-[12px] font-medium text-slate-600">
                      {item.Telefono}
                    </span>
                  </div>
                ) : null}
                {!item.Mail && !item.Telefono && (
                  <span className="text-xs text-slate-400 italic">
                    Sin contacto
                  </span>
                )}
              </div>
            );
          case "ctaCte":
            return (
              <div className="flex flex-col gap-1.5 items-start">
                {item.ActivarCtaCte ? (
                  <>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold tracking-wide uppercase">
                      Activa
                    </span>
                    {item.TieneLimiteCompra ? (
                      <span className="text-[11px] font-semibold text-slate-500">
                        {formatCurrency(
                          Number(item.MontoMaximoCtaCte ?? 0),
                          currency,
                        )}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Sin límite
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold tracking-wide uppercase">
                    Inactiva
                  </span>
                )}
              </div>
            );
          case "acciones": {
            const tieneDeudaCliente = (item.SaldoCtaCte ?? 0) > 0;
            const esConsumidorFinal =
              item.Nombre === consumidorFinalSchema.Nombre &&
              item.Apellido === consumidorFinalSchema.Apellido;
            return (
              <div className="flex gap-2 w-full justify-center items-center">
                {!esConsumidorFinal && (
                  <Tooltip
                    content={
                      tieneDeudaCliente
                        ? "Tiene deuda — Ver cuenta corriente"
                        : "Ver cuenta corriente"
                    }
                    color={tieneDeudaCliente ? "danger" : "default"}
                  >
                    <Button
                      isIconOnly
                      size="sm"
                      className={
                        tieneDeudaCliente
                          ? "bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          : "bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/25 transition-colors"
                      }
                      onPress={() =>
                        router.push(
                          `/clientes/cuentas-corrientes?clienteId=${item.Id}&nombre=${encodeURIComponent(`${item.Nombre} ${item.Apellido}`)}&dni=${encodeURIComponent(item.Dni ?? "")}`,
                        )
                      }
                    >
                      <CreditCard className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                )}
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
                    className="bg-slate-50 text-slate-400  hover:text-warning-600 transition-colors"
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
                    className="bg-slate-50 text-slate-400  hover:text-red-500 transition-colors"
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
          }
          default:
            return null;
        }
      }}
    />
  );
}
