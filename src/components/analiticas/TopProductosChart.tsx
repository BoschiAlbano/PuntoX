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

export interface TopProductosChartProps {
  datos: Array<{
    id: number;
    nombre: string;
    cantidad: number;
  }>;
  title: string;
  subtitle: string;
}

// Paleta de colores pastel visuamente atractivos
const PASTEL_COLORS = [
  "#FF8096", // Rosa fuerte
  "#68D391", // Verde menta intenso
  "#F6AD55", // Melocotón intenso
  "#63B3ED", // Azul cielo intenso
  "#B794F4", // Lavanda intenso
  "#FC8181", // Naranja rojizo
  "#4FD1C5", // Turquesa
  "#F687B3", // Rosa chicle intenso
  "#7F9CF5", // Azul periwinkle intenso
  "#F6E05E", // Amarillo intenso
];

export default function TopProductosChart({
  datos,
  title,
  subtitle,
}: TopProductosChartProps) {
  // Filtrar solo los primeros 10 productos y los que tengan cantidad > 0
  const top10 = datos
    .filter((p) => p.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  const total = top10.reduce((sum, p) => sum + p.cantidad, 0);

  const datosConPorcentaje = top10.map((producto) => ({
    ...producto,
    porcentaje: total > 0 ? (producto.cantidad / total) * 100 : 0,
  }));

  if (!datos || datos.length === 0 || top10.length === 0) {
    return (
      <Card className="rounded-2xl shadow-sm bg-white">
        <CardHeader className="pb-3 bg-white">
          <h3 className="text-lg font-semibold text-slate-900">
            Top 10 Productos Más Vendidos del Día
          </h3>
        </CardHeader>
        <CardBody className="bg-white">
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            <p>No hay datos de productos vendidos para hoy</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.nombre}</p>
          <p className="text-sm text-slate-600">
            Cantidad: <span className="font-bold">{data.cantidad}</span>
          </p>
          <p className="text-sm text-slate-600">
            Porcentaje:{" "}
            <span className="font-bold">{data.porcentaje.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const data = entry as { nombre: string; porcentaje: number };
    // Solo mostrar etiquetas para porcentajes mayores a 5%
    if (data.porcentaje < 5) return "";
    return `${data.porcentaje.toFixed(0)}%`;
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3  bg-white flex flex-col items-start">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
      </CardHeader>
      <CardBody className="bg-white overflow-hidden pb-8">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={datosConPorcentaje}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={110}
              innerRadius={60}
              fill="#8884d8"
              dataKey="cantidad"
              paddingAngle={2}
            >
              {datosConPorcentaje.map((entry, index) => (
                <Cell
                  key={`cell-${entry.id}`}
                  fill={PASTEL_COLORS[index % PASTEL_COLORS.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const itemData = entry.payload;
                return `${itemData.nombre} (${itemData.cantidad})`;
              }}
              wrapperStyle={{
                fontSize: "12px",
                paddingTop: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
