"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CreditCard } from "lucide-react";
import Panel from "./Panel";

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
      <Panel title="Mix de Medios de Pago" icon={CreditCard}>
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <p>No hay datos de pagos para el período seleccionado</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Mix de Medios de Pago" icon={CreditCard}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Pie
            data={datosConPorcentaje}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={5}
            labelLine={false}
            dataKey="monto"
          >
            {datosConPorcentaje.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value, name) => [
              new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
              }).format(Number(value)),
              name ?? "",
            ]}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}
