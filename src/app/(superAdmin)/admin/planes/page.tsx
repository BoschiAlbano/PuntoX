"use client";

import { Key } from "react";
import { Chip, Tooltip, Button } from "@heroui/react";
import {
  Pencil,
  Trash2,
  CreditCard,
  Building2,
  DollarSign,
} from "lucide-react";
import GenericCrud, { CrudActions } from "@/components/shared/GenericCrud";
import { Column } from "@/components/shared/GenericTable";
import PlanForm from "@/components/admin/PlanForm";

type Plan = {
  Id: number;
  Nombre: string;
  Descripcion: string;
  CostoMensual: number;
  Caracteristicas: string;
  CantidadTenants: number;
};

const columns: Column[] = [
  { uid: "Nombre", name: "Nombre", sortable: true },
  { uid: "Descripcion", name: "Descripción", sortable: false },
  { uid: "CostoMensual", name: "Costo Mensual", sortable: true },
  { uid: "CantidadTenants", name: "Tiendas", sortable: true },
  { uid: "actions", name: "Acciones", sortable: false },
];

function renderCell(item: Plan, columnKey: Key, actions: CrudActions<Plan>) {
  switch (columnKey) {
    case "Nombre":
      return (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50">
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-semibold text-slate-800">{item.Nombre}</span>
        </div>
      );

    case "Descripcion":
      return (
        <p className="text-sm text-slate-600 max-w-xs truncate">
          {item.Descripcion || "—"}
        </p>
      );

    case "CostoMensual":
      return (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-semibold text-emerald-700">
            {item.CostoMensual.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      );

    case "CantidadTenants":
      return (
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <Chip
            size="sm"
            variant="flat"
            color={item.CantidadTenants > 0 ? "primary" : "default"}
          >
            {item.CantidadTenants}
          </Chip>
        </div>
      );

    case "actions":
      return (
        <div className="flex items-center justify-end gap-1">
          <Tooltip content="Editar">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => actions.onEdit(item)}
            >
              <Pencil className="w-4 h-4 text-slate-600" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              item.CantidadTenants > 0
                ? "No se puede eliminar (tiene tiendas asignadas)"
                : "Eliminar"
            }
          >
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => actions.onDelete(item)}
              isDisabled={item.CantidadTenants > 0}
            >
              <Trash2
                className={`w-4 h-4 ${
                  item.CantidadTenants > 0 ? "text-slate-300" : "text-rose-500"
                }`}
              />
            </Button>
          </Tooltip>
        </div>
      );

    default:
      return null;
  }
}

export default function PlanesPage() {
  return (
    <div className="space-y-6">
      <GenericCrud<Plan>
        apiPath="/api/admin/planes"
        queryKey="admin-planes"
        columns={columns}
        renderCell={renderCell}
        FormComponent={PlanForm}
        searchPlaceholder="Buscar planes..."
        exportConfig={{
          filename: "planes_saas",
          columns: [
            { key: "Nombre", header: "Nombre" },
            { key: "Descripcion", header: "Descripción" },
            { key: "CostoMensual", header: "Costo Mensual" },
            { key: "CantidadTenants", header: "Tiendas Asignadas" },
          ],
          mapItem: (item) => ({
            Nombre: item.Nombre,
            Descripcion: item.Descripcion,
            CostoMensual: item.CostoMensual,
            CantidadTenants: item.CantidadTenants,
          }),
        }}
      />
    </div>
  );
}
