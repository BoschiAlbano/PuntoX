"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { ArrowLeft, Banknote, Calendar, Coins, FileText, Tag, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { TIPO_PAGO_LABELS } from "@/lib/constants/comprobantes";
import { useUserStore } from "@/store/useUserStore";

function formatMoney(val: number) {
  return val.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GastoDetalleScreen({ id }: { id: number }) {
  const router = useRouter();
  const { currentBranch } = useUserStore();
  const sucursalId = currentBranch?.Id ? Number(currentBranch.Id) : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["gasto", id, sucursalId],
    queryFn: async () => {
      const res = await fetch(`/api/gastos?id=${id}&sucursalId=${sucursalId}`);
      if (!res.ok) throw new Error("Error al cargar el gasto");
      return res.json();
    },
    enabled: !!id && !!sucursalId,
  });

  const gasto = data?.gasto;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError || !gasto) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="p-4 rounded-full bg-red-50 border border-red-200">
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Gasto no encontrado</h2>
          <Button
            variant="flat"
            onPress={() => router.push("/caja")}
            startContent={<ArrowLeft size={16} />}
          >
            Volver a Caja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          isIconOnly
          variant="light"
          onPress={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Detalle del Gasto</h1>
          <p className="text-sm text-gray-500">#{gasto.Id}</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Descripción
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{gasto.Descripcion}</p>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Concepto
              </span>
            </div>
            <Chip size="sm" variant="flat" color="danger" className="text-xs">
              {gasto.ConceptoGastos?.Descripcion || "Gasto"}
            </Chip>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Fecha
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {formatDate(gasto.Fecha)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg shadow-rose-500/25 border-0">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={14} className="text-white/70" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                Monto Total
              </span>
            </div>
            <p className="text-xl font-black text-white">
              -{formatMoney(gasto.Monto)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Formas de Pago */}
      <Card className="border border-slate-200 rounded-2xl shadow-sm mb-6">
        <CardBody className="p-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Banknote size={15} className="text-slate-400" />
              Formas de Pago
            </h3>
          </div>
          <Table
            aria-label="Formas de pago"
            removeWrapper
            classNames={{
              th: "bg-transparent text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100",
              td: "py-3 text-sm",
            }}
          >
            <TableHeader>
              <TableColumn>FORMA DE PAGO</TableColumn>
              <TableColumn align="end">MONTO</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Sin formas de pago">
              {(gasto.FormaPago || []).map((p: any) => (
                <TableRow key={p.Id}>
                  <TableCell>
                    <Chip size="sm" variant="flat" className="text-xs">
                      {TIPO_PAGO_LABELS[p.TipoPago] || "Desconocido"}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(p.Monto)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Total
            </span>
            <span className="font-bold text-rose-600">
              {formatMoney(gasto.Monto)}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Caja asociada */}
      {gasto.Caja && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Caja asociada
              </span>
            </div>
            <p className="text-sm text-gray-700">
              Caja #{gasto.Caja.Id} — Abierta: {formatDate(gasto.Caja.FechaApertura)}
              {gasto.Caja.FechaCierre && ` — Cerrada: ${formatDate(gasto.Caja.FechaCierre)}`}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
