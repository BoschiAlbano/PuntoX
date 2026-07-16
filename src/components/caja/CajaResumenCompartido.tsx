import React from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";
import {
  ArrowRightLeft,
  Banknote,
  Coins,
  CreditCard,
  DollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import StatCard from "../dashboard/StatCard";
import { Caja } from "@/hooks/useCaja";

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

type MetodoPago = {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  entrada: number;
  salida: number;
  total: number;
  totalColor: string;
};

export default function CajaResumenCompartido({
  cajaActual,
  isLoading,
  children,
}: {
  cajaActual: Caja | null | undefined;
  isLoading: boolean;
  children?: React.ReactNode;
}) {
  const gananciaDelDia = React.useMemo(() => {
    if (!cajaActual) return 0;
    return (
      Number(cajaActual.TotalEntradaEfectivo) -
      Number(cajaActual.TotalSalidaEfectivo)
    );
  }, [cajaActual]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="rounded-2xl h-28" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="rounded-2xl h-96" />
        </div>
      </div>
    );
  }

  if (!cajaActual) return null;

  const metodos: MetodoPago[] = [
    {
      label: "Efectivo Total",
      icon: Banknote,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500",
      entrada: Number(cajaActual.TotalEntradaEfectivo),
      salida: Number(cajaActual.TotalSalidaEfectivo),
      total: Number(cajaActual.MontoInicial) + gananciaDelDia,
      totalColor: "text-slate-900",
    },
    {
      label: "Tarjetas",
      icon: CreditCard,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
      entrada: Number(cajaActual.TotalEntradaTarjeta),
      salida: Number(cajaActual.TotalSalidaTarjeta),
      total:
        Number(cajaActual.TotalEntradaTarjeta) -
        Number(cajaActual.TotalSalidaTarjeta),
      totalColor: "text-slate-900",
    },
    {
      label: "Transferencias",
      icon: ArrowRightLeft,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-500",
      entrada: Number(cajaActual.TotalEntradaTransf),
      salida: Number(cajaActual.TotalSalidaTransf),
      total:
        Number(cajaActual.TotalEntradaTransf) -
        Number(cajaActual.TotalSalidaTransf),
      totalColor: "text-slate-900",
    },
    {
      label: "Cheques",
      icon: Wallet,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-500",
      entrada: Number(cajaActual.TotalEntradaCheque),
      salida: Number(cajaActual.TotalSalidaCheque),
      total:
        Number(cajaActual.TotalEntradaCheque) -
        Number(cajaActual.TotalSalidaCheque),
      totalColor: "text-slate-900",
    },
    {
      label: "Cta. Corriente",
      icon: FileText,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-500",
      entrada: Number(cajaActual.TotalEntradaCtaCte),
      salida: Number(cajaActual.TotalSalidaCtaCte),
      total:
        Number(cajaActual.TotalEntradaCtaCte) -
        Number(cajaActual.TotalSalidaCtaCte),
      totalColor: "text-slate-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left column: Summary Cards + children */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monto Inicial"
            value={formatMoney(cajaActual.MontoInicial)}
            icon={Wallet}
            colorScheme="blue"
            delay={0.1}
            subtitle={`Abierta: ${formatDate(cajaActual.FechaApertura)}`}
          />
          <StatCard
            title="Entradas (Efectivo)"
            value={formatMoney(cajaActual.TotalEntradaEfectivo)}
            icon={TrendingUp}
            colorScheme="emerald"
            delay={0.2}
            subtitle="Ventas y aportes"
          />
          <StatCard
            title="Salidas (Efectivo)"
            value={formatMoney(cajaActual.TotalSalidaEfectivo)}
            icon={TrendingDown}
            colorScheme="red"
            delay={0.3}
            subtitle="Gastos y retiros"
          />
          <StatCard
            title="Monto Cierre Estimado"
            value={formatMoney(
              Number(cajaActual.MontoInicial) + gananciaDelDia,
            )}
            icon={Coins}
            colorScheme="orange"
            delay={0.4}
            subtitle={
              cajaActual.FechaCierre
                ? `Cerrada: ${formatDate(cajaActual.FechaCierre)}`
                : "En curso"
            }
          />
        </div>

        {children}
      </div>

      {/* Right column: Resumen de la Caja */}
      <div className="flex flex-col gap-6">
        <Card className="shadow-sm border-none bg-white rounded-2xl">
          <CardBody className="p-5 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <FileText size={20} className="text-[#67afc3]" />
              <h3 className="text-lg font-semibold text-slate-800">
                Resumen de la Caja
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {metodos.map((metodo) => {
                const Icon = metodo.icon;
                return (
                  <div
                    key={metodo.label}
                    className="bg-slate-50 rounded-xl overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Icon size={20} className={metodo.iconColor} />
                        </div>
                        <span className="font-medium text-slate-700">
                          {metodo.label}
                        </span>
                      </div>
                      <span className={`font-bold ${metodo.totalColor}`}>
                        {formatMoney(metodo.total)}
                      </span>
                    </div>
                    <div className="px-4 pb-3 flex items-center justify-end gap-4 text-[11px]">
                      <span className="text-emerald-600 font-semibold">
                        ↑ {formatMoney(metodo.entrada)}
                      </span>
                      <span className="text-red-500 font-semibold">
                        ↓ {formatMoney(metodo.salida)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <DollarSign size={20} className="text-[#67afc3]" />
                  </div>
                  <span className="font-medium text-slate-700">
                    Ganancia Ventas
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  {formatMoney(cajaActual.GananciaVentas || 0)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
