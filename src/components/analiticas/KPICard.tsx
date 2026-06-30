"use client";

import { Card, CardBody } from "@heroui/react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  variation?: number;
  previousValue?: number;
  format?: "currency" | "number" | "percentage" | "custom";
  icon?: React.ReactNode;
}

export default function KPICard({
  title,
  value,
  variation,
  previousValue,
  format = "number",
  icon,
}: KPICardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "number":
        return new Intl.NumberFormat("es-AR").format(val);
      default:
        return String(val);
    }
  };

  const getVariationIcon = () => {
    if (variation === undefined || variation === null) return null;
    if (variation > 0) return <TrendingUp size={16} className="text-success" />;
    if (variation < 0)
      return <TrendingDown size={16} className="text-danger" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getVariationColor = () => {
    if (variation === undefined || variation === null) return "text-gray-500";
    if (variation > 0) return "text-success";
    if (variation < 0) return "text-danger";
    return "text-gray-500";
  };

  return (
    <Card
      className={`rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm backdrop-blur-2xl hover:shadow-md transition-shadow group border-l-[#67afc3] bg-linear-to-br from-[#67afc3]/5 to-white`}
    >
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 w-full min-w-0">
            <p className="text-[11px] sm:text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate tracking-tight">
              {formatValue(value)}
            </p>
            {variation !== undefined && variation !== null && (
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3">
                <span
                  className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider ${
                    variation > 0
                      ? "bg-emerald-50 text-emerald-600"
                      : variation < 0
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {getVariationIcon()}
                  {variation > 0 ? "+" : ""}
                  {variation.toFixed(1)}%
                </span>
                {previousValue !== undefined && (
                  <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wide hidden sm:inline">
                    vs ant.
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 sm:p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 shadow-sm bg-[#67afc3]/10 border-[#67afc3]/20 text-[#67afc3]">
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
