"use client";

import { Producto } from "@/lib/validations/producto.schema";
import { Card, CardBody, Chip } from "@heroui/react";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import {
  AddStockButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/TableActions";

const PLACEHOLDER_IMG = "/producto-placeholder.svg";

interface ProductoCardProps {
  item: Producto;
  onEdit: (item: Producto) => void;
  onDelete: (item: Producto) => void;
  onOpenStockModal: (item: Producto) => void;
  onClick?: (item: Producto) => void;
}

export function ProductoCard({
  item,
  onEdit,
  onDelete,
  onOpenStockModal,
  onClick,
}: ProductoCardProps) {
  const currency = useCurrency();
  const stock = item.Stock ?? 0;
  const stockMinimo = item.StockMinimo ?? 0;
  const isLowStock = stockMinimo > 0 && stock <= stockMinimo;

  return (
    <Card
      className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-none"
      isPressable={false}
    >
      <CardBody className="p-0">
        <div
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          onClick={onClick ? () => onClick(item) : undefined}
          onKeyDown={
            onClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick(item);
                  }
                }
              : undefined
          }
          className={onClick ? "cursor-pointer" : ""}
        >
          <div className="aspect-square bg-white relative">
            <img
              src={item.Foto || PLACEHOLDER_IMG}
              alt={item.Descripcion}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
              }}
            />
            <div className="absolute top-2 right-2">
              <Chip
                color={item.EstaEliminado ? "danger" : "success"}
                variant="flat"
                size="sm"
              >
                {item.EstaEliminado ? "Inactivo" : "Activo"}
              </Chip>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <h3
              className="font-semibold text-slate-800 truncate"
              title={item.Descripcion}
            >
              {item.Descripcion}
            </h3>
            <p className="text-xs text-slate-500">
              {item.Marca?.Descripcion ?? "—"} ·{" "}
              {item.Rubro?.Descripcion ?? "—"}
            </p>
            <div
              className={`text-sm font-medium ${
                isLowStock ? "text-red-600" : "text-slate-700"
              }`}
            >
              Stock: {stock}
              {item.SucursalNombre && (
                <span className="text-xs text-slate-400 ml-1">
                  ({item.SucursalNombre})
                </span>
              )}
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">
                {formatCurrency(
                  item.PreciosLista?.length
                    ? Number(item.PreciosLista[0].PrecioFinal)
                    : 0,
                  currency,
                )}
              </span>
            </div>
          </div>
        </div>
        <div
          className="px-3 pb-3 flex gap-1 opacity-70 hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <AddStockButton
            onPress={() => onOpenStockModal(item)}
            label={`Agregar stock ${item.Descripcion}`}
          />
          <EditButton
            onPress={() => onEdit(item)}
            label={`Editar ${item.Descripcion}`}
          />
          <DeleteButton
            onPress={() => onDelete(item)}
            label={`Eliminar ${item.Descripcion}`}
          />
        </div>
      </CardBody>
    </Card>
  );
}
