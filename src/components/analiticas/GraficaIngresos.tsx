"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import Panel from "./Panel";

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
  const datosFormateados = datos.map((d) => ({
    ...d,
    fecha: d.fecha.split("T")[0] || d.fecha,
    ingresosNetos: d.ingresos,
  }));

  if (!datos || datos.length === 0) {
    return (
      <Panel
        title={mostrarSoloFacturas ? "Ingresos por Facturas" : "Ingresos Totales"}
        icon={TrendingUp}
      >
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <p>No hay datos disponibles para el período seleccionado</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title={mostrarSoloFacturas ? "Ingresos por Facturas" : "Ingresos Totales"}
      icon={TrendingUp}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={datosFormateados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#67afc3" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#67afc3" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDescuentos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            dx={-10}
            tickFormatter={(value) =>
              new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                notation: "compact",
              }).format(value)
            }
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            formatter={(value) =>
              new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
              }).format(Number(value))
            }
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
          <Area
            type="monotone"
            dataKey="ingresosNetos"
            stroke="#67afc3"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorIngresos)"
            name="Ingresos Netos"
          />
          <Area
            type="monotone"
            dataKey="descuentos"
            stroke="#f59e0b"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorDescuentos)"
            name="Descuentos"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

