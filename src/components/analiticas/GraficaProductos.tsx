"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";

interface GraficaProductosProps {
  datos: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    monto: number;
    margen: number;
    margenPorcentaje: number;
  }>;
}

const getColorByMargen = (margenPorcentaje: number): string => {
  if (margenPorcentaje >= 30) return "#10b981"; // Verde (buen margen)
  if (margenPorcentaje >= 15) return "#67afc3"; // Azul (margen aceptable)
  if (margenPorcentaje >= 0) return "#f59e0b"; // Amarillo (margen bajo)
  return "#ef4444"; // Rojo (pérdida)
};

export default function GraficaProductos({ datos }: GraficaProductosProps) {
  const top10 = datos.slice(0, 10);

  if (!datos || datos.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
          <h3 className="text-lg font-semibold text-slate-900">
            Top 10 Productos por Ventas
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            <p>No hay datos de productos vendidos para el período seleccionado</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
        <h3 className="text-lg font-semibold text-slate-900">
          Top 10 Productos por Ventas
        </h3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={top10}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) =>
                new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  notation: "compact",
                }).format(value)
              }
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={90}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => {
                if (value === undefined) return ["", name || ""];
                const nameStr = name || "";
                if (nameStr === "monto") {
                  return [
                    new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(value),
                    "Ventas",
                  ];
                }
                if (nameStr === "margen") {
                  return [
                    new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(value),
                    "Margen",
                  ];
                }
                return [value, nameStr];
              }}
            />
            <Legend />
            <Bar dataKey="monto" name="Ventas" fill="#67afc3">
              {top10.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorByMargen(entry.margenPorcentaje)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

