"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useCurrency } from "@/hooks/useCurrency";
import {
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/utils/formatCurrency";

interface GraficaIngresosProps {
  datos: Array<{
    fecha: string;
    ingresos: number;
    descuentos: number;
    facturas: number;
    todos: number;
  }>;
  mostrarSoloFacturas?: boolean;
}

export default function GraficaIngresos({
  datos,
  mostrarSoloFacturas = false,
}: GraficaIngresosProps) {
  const currency = useCurrency();
  const datosFormateados = datos.map((d) => ({
    ...d,
    fecha: d.fecha.split("T")[0] || d.fecha,
    ingresosNetos: d.ingresos,
  }));

  if (!datos || datos.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
          <h3 className="text-lg font-semibold text-slate-900">
            {mostrarSoloFacturas ? "Ingresos por Facturas" : "Ingresos Totales"}
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>No hay datos disponibles para el período seleccionado</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
        <h3 className="text-lg font-semibold text-slate-900">
          {mostrarSoloFacturas ? "Ingresos por Facturas" : "Ingresos Totales"}
        </h3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datosFormateados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrencyCompact(value, currency)}
            />
            <Tooltip
              formatter={(value: number | undefined) =>
                value !== undefined ? formatCurrency(value, currency) : ""
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ingresosNetos"
              stroke="#67afc3"
              strokeWidth={2}
              name="Ingresos Netos"
            />
            <Line
              type="monotone"
              dataKey="descuentos"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Descuentos"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

