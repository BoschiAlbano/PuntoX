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
    primary: "border-l-blue-500",
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    danger: "border-l-red-500",
    default: "border-l-gray-500",
  };

  return (
    <Card
      className={`rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm border-l-4 ${colorClasses[color]}`}
    >
      <CardBody className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            {variation !== undefined && variation !== null && (
              <div className="flex items-center gap-1 mt-2">
                {getVariationIcon()}
                <span className={`text-xs font-medium ${getVariationColor()}`}>
                  {variation > 0 ? "+" : ""}
                  {variation.toFixed(1)}%
                </span>
                {previousValue !== undefined && (
                  <span className="text-xs text-gray-500 ml-1">
                    vs período anterior
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="ml-4 text-gray-400">{icon}</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

