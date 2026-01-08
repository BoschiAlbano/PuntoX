"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";

interface GraficaPagosProps {
  datos: Array<{
    nombre: string;
    monto: number;
    porcentaje: number;
  }>;
}

const COLORS = ["#67afc3", "#90c472", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function GraficaPagos({ datos }: GraficaPagosProps) {
  const total = datos.reduce((sum, d) => sum + d.monto, 0);
  const datosConPorcentaje = datos
    .filter((d) => d.monto > 0)
    .map((d) => ({
      ...d,
      porcentaje: total > 0 ? (d.monto / total) * 100 : 0,
    }));

  if (!datos || datos.length === 0 || datosConPorcentaje.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
          <h3 className="text-lg font-semibold text-slate-900">
            Mix de Medios de Pago
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>No hay datos de pagos para el período seleccionado</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
        <h3 className="text-lg font-semibold text-slate-900">
          Mix de Medios de Pago
        </h3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={datosConPorcentaje}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => {
                const data = entry as { nombre: string; porcentaje: number };
                return `${data.nombre}: ${data.porcentaje.toFixed(1)}%`;
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="monto"
            >
              {datosConPorcentaje.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) =>
                value !== undefined
                  ? new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(value)
                  : ""
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

