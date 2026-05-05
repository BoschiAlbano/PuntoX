"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";

export interface GraficaProductosProps {
  datos: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    monto: number;
    margen: number;
    margenPorcentaje: number;
  }>;
}



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
            <p>
              No hay datos de productos vendidos para el período seleccionado
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const maxMonto = top10.length > 0 ? Math.max(...top10.map(p => p.monto)) : 0;

  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-slate-200/70 bg-slate-50/70">
        <h3 className="text-lg font-semibold text-slate-900">
          Ranking de Productos por Ventas
        </h3>
      </CardHeader>
      <CardBody className="p-5">
        <div className="flex flex-col gap-4">
          {top10.map((producto, index) => {
            const widthPercentage = maxMonto > 0 ? (producto.monto / maxMonto) * 100 : 0;
            // Variamos la opacidad del color acento para darle jerarquía sin usar otros colores
            const opacity = 1 - (index * 0.06);

            return (
              <div key={producto.id} className="flex flex-col gap-1.5 group">
                <div className="flex justify-between items-end text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-slate-400 w-4">{index + 1}.</span>
                    <span className="font-medium text-slate-700 truncate group-hover:text-[#67afc3] transition-colors">
                      {producto.nombre}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-3">
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      }).format(producto.monto)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {producto.cantidad} un.
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: "#67afc3",
                      opacity: Math.max(opacity, 0.4), // Nunca más transparente que 0.4
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
