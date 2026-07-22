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
import {
  ArrowLeft,
  Banknote,
  Calendar,
  Coins,
  FileText,
  Tag,
  TrendingDown,
} from "lucide-react";
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
      <div className="flex flex-col w-full bg-[#F5F8FD]">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 pt-3 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
          <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0" />
          <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-lg" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6 px-3 pt-4 pb-6 sm:p-6 sm:pb-8 lg:p-8 lg:pb-10">
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !gasto) {
    return (
      <div className="flex flex-col w-full min-h-[50vh] bg-[#F5F8FD]">
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="p-4 rounded-full bg-red-50 border border-red-200">
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            Gasto no encontrado
          </h2>
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
    <div className="flex flex-col w-full bg-[#F5F8FD]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button
            isIconOnly
            variant="flat"
            className="bg-white hover:bg-slate-100 shadow-sm rounded-xl transition-all duration-200 cursor-pointer shrink-0"
            onPress={() => router.back()}
            aria-label="Volver"
            size="sm"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: "#e11d48" }}
          >
            <TrendingDown size={16} className="text-white sm:size-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-xl font-bold text-slate-800 leading-tight truncate">
                Gasto #{gasto.Id}
              </span>
              <Chip
                size="sm"
                variant="flat"
                color="danger"
                className="font-semibold shadow-sm cursor-default shrink-0"
              >
                {gasto.ConceptoGastos?.Descripcion || "Gasto"}
              </Chip>
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-500 truncate">
              {formatDate(gasto.Fecha)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4 sm:space-y-6 px-3 pt-4 pb-6 sm:p-6 sm:pb-8 lg:p-8 lg:pb-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border border-slate-200 rounded-2xl shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Descripción
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {gasto.Descripcion}
                </p>
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
                <Chip
                  size="sm"
                  variant="flat"
                  color="danger"
                  className="text-xs"
                >
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
          <Card className="border border-slate-200 rounded-2xl shadow-sm">
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
                  Caja #{gasto.Caja.Id} — Abierta:{" "}
                  {formatDate(gasto.Caja.FechaApertura)}
                  {gasto.Caja.FechaCierre &&
                    ` — Cerrada: ${formatDate(gasto.Caja.FechaCierre)}`}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
