"use client";

import { useRouter } from "next/navigation";
import { Proveedor } from "@/lib/validations/proveedor.schema";
import GenericCrud from "@/components/shared/GenericCrud";
import FormularioProveedor from "./FormularioProveedor";
import { Button, Tooltip, addToast } from "@heroui/react";
import { CreditCard } from "lucide-react";

export default function ProveedoresCrud() {
  const router = useRouter();
  return (
    <GenericCrud<Proveedor>
      apiPath="/api/proveedores"
      queryKey="proveedores-generic"
      title="Gestión de Proveedores"
      searchPlaceholder="Buscar por Razón Social, CUIT o Email"
      FormComponent={FormularioProveedor}
      transformer={(item) => item}
      additionalInvalidateQueryKeys={["proveedores"]}
      renderRowPreview={(item) => (
        <div className="space-y-6 text-sm">
          <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {item.RazonSocial?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">
                {item.RazonSocial}
              </p>
              {item.CUIT && (
                <p className="text-slate-500 font-medium text-xs mt-0.5">CUIT: {item.CUIT}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">Condición IVA</p>
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
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">Contacto</p>
              <div className="space-y-1.5">
                {item.Mail && (
                  <p className="text-slate-700 text-xs font-medium flex items-center gap-1.5">
                    <span className="text-slate-400">✉️</span> <span className="truncate">{item.Mail}</span>
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
            <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">Ubicación</p>
            <p className="font-medium text-slate-700 text-sm">{item.Direccion || "—"}</p>
            {(item.Localidad || item.Departamento || item.Provincia) && (
              <p className="text-slate-500 text-xs mt-1">
                {[item.Localidad, item.Departamento, item.Provincia]
                  .filter(Boolean)
                  .join(" → ")}
              </p>
            )}
          </div>
        </div>
      )}
      getRowPreviewTitle={(item) => item.RazonSocial}
      enableBulkActions
      exportConfig={{
        filename: "proveedores",
        columns: [
          { key: "RazonSocial", header: "Razón Social" },
          { key: "CUIT", header: "CUIT" },
          { key: "Mail", header: "Email" },
          { key: "Telefono", header: "Teléfono" },
          { key: "Direccion", header: "Dirección" },
          { key: "Localidad", header: "Localidad" },
          { key: "CondicionIva", header: "Cond. IVA" },
        ],
        mapItem: (c) => ({
          RazonSocial: c.RazonSocial,
          CUIT: c.CUIT ?? "",
          Mail: c.Mail ?? "",
          Telefono: c.Telefono ?? "",
          Direccion: c.Direccion ?? "",
          Localidad: c.Localidad ?? "",
          CondicionIva: c.CondicionIva ?? "",
        }),
      }}
      bulkActionsDropdown={[
        {
          key: "eliminar-masivo",
          label: "Eliminar seleccionados",
          onAction: (ctx) => {
               // logica bulk actions mock
              addToast({
                title: "Acción en lote",
                description: `Se han procesado ${ctx.totalCount} proveedores.`,
              });
          },
        },
      ]}
      columns={[
        { uid: "razonSocial", name: "PROVEEDOR", sortable: true,
          align: "start",
        },
        { uid: "condicionIva", name: "CONDICIÓN IVA", sortable: true },
        { uid: "localidad", name: "UBICACIÓN", sortable: false },
        { uid: "contacto", name: "CONTACTO", sortable: false },
        { uid: "saldoCtaCte", name: "CTA. CORRIENTE", sortable: false },
        { uid: "acciones", name: "ACCIONES" },
      ]}
      renderCell={(item, columnKey, actions) => {
        switch (columnKey) {
          case "razonSocial":
            return (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {item.RazonSocial?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    {item.RazonSocial}
                  </span>
                  {item.CUIT && (
                    <span className="text-[11px] font-medium text-slate-500">
                      CUIT: {item.CUIT}
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
                  <span className="text-xs text-slate-400 italic">Sin contacto</span>
                )}
              </div>
            );
          case "saldoCtaCte": {
            const saldo = item.SaldoCtaCte ?? 0;
            if (saldo > 0) {
              return (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-500 border border-rose-100">
                    ${saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                  <Tooltip content="Ver cuenta corriente">
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/25 transition-colors"
                      onPress={() =>
                        router.push(
                          `/proveedores/cuentas-corrientes?proveedorId=${item.Id}&nombre=${encodeURIComponent(item.RazonSocial)}&cuit=${encodeURIComponent(item.CUIT ?? "")}`
                        )
                      }
                    >
                      <CreditCard className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              );
            }
            return (
              <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-500 border border-emerald-100">
                Al día
              </span>
            );
          }
          case "acciones":
            return (
              <div className="flex gap-2 w-full justify-center items-center">
                <Tooltip
                  content="Editar Proveedor"
                  color="warning"
                >
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-slate-50 text-slate-400 hover:bg-warning-50 hover:text-warning-600 transition-colors"
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
                  content="Eliminar Proveedor"
                  color="danger"
                >
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
