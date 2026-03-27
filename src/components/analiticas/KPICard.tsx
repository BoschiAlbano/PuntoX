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
  color?: "primary" | "success" | "warning" | "danger" | "default";
}

export default function KPICard({
  title,
  value,
  variation,
  previousValue,
  format = "number",
  icon,
  color = "default",
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
    if (variation < 0) return <TrendingDown size={16} className="text-danger" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getVariationColor = () => {
    if (variation === undefined || variation === null) return "text-gray-500";
    if (variation > 0) return "text-success";
    if (variation < 0) return "text-danger";
    return "text-gray-500";
  };

  const colorClasses = {
    primary: "border-l-indigo-400 bg-linear-to-br from-indigo-50/20 to-white",
    success: "border-l-emerald-400 bg-linear-to-br from-emerald-50/20 to-white",
    warning: "border-l-amber-400 bg-linear-to-br from-amber-50/20 to-white",
    danger: "border-l-red-400 bg-linear-to-br from-red-50/20 to-white",
    default: "border-l-[#67afc3] bg-linear-to-br from-[#67afc3]/5 to-white",
  };

  return (
    <Card
      className={`rounded-2xl border border-slate-100 shadow-sm backdrop-blur-2xl hover:shadow-md transition-shadow group ${colorClasses[color]}`}
    >
      <CardBody className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 w-full truncate">
            <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {title}
            </p>
            <p className="text-2xl font-bold text-slate-800 truncate tracking-tight">
              {formatValue(value)}
            </p>
            {variation !== undefined && variation !== null && (
              <div className="flex items-center gap-1.5 mt-3">
                <span
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wider ${
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
                  <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wide">
                    vs ant.
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 shadow-sm ${
              color === "primary" ? "bg-indigo-50 border-indigo-100 text-indigo-500" :
              color === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
              color === "warning" ? "bg-amber-50 border-amber-100 text-amber-500" :
              color === "danger" ? "bg-red-50 border-red-100 text-red-500" :
              "bg-[#67afc3]/10 border-[#67afc3]/20 text-[#67afc3]"
            }`}>
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

