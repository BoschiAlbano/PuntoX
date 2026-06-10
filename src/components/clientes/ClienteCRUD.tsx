"use client";

import { useRouter } from "next/navigation";
import GenericCrud from "@/components/shared/GenericCrud";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { addToast } from "@heroui/react";
import {
  EditButton,
  DeleteButton,
  CreditCardButton,
} from "@/components/shared/TableActions";

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
      onNewClick={() => router.push("/clientes/new")}
      newButtonText="Nuevo Cliente"
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
                  <CreditCardButton
                    hasDebt={tieneDeudaCliente}
                    tooltipContent={
                      tieneDeudaCliente
                        ? "Tiene deuda — Ver cuenta corriente"
                        : "Ver cuenta corriente"
                    }
                    onPress={() =>
                      router.push(
                        `/clientes/cuentas-corrientes?clienteId=${item.Id}&nombre=${encodeURIComponent(`${item.Nombre} ${item.Apellido}`)}&dni=${encodeURIComponent(item.Dni ?? "")}`,
                      )
                    }
                  />
                )}
                <EditButton
                  tooltipContent={
                    esConsumidorFinal ? "No se puede editar" : "Editar"
                  }
                  isDisabled={esConsumidorFinal}
                  onPress={() => router.push(`/clientes/${item.Id}`)}
                />
                <DeleteButton
                  tooltipContent={
                    esConsumidorFinal ? "No se puede eliminar" : "Eliminar"
                  }
                  isDisabled={esConsumidorFinal}
                  onPress={() => actions.onDelete(item)}
                />
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
