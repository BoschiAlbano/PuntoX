"use client";

import { Card, CardBody } from "@heroui/react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type KPITone = "teal" | "emerald" | "amber" | "rose" | "slate";

interface KPICardProps {
  title: string;
  value: number | string;
  variation?: number;
  previousValue?: number;
  format?: "currency" | "number" | "percentage" | "custom";
  icon?: React.ReactNode;
  /** Categoría de la métrica: define el color de acento (ingreso/ganancia,
   *  costo, riesgo, neutro-operativo, informativo). */
  tone?: KPITone;
  /** "hero" para las métricas principales (más grandes), "default" para el resto. */
  size?: "hero" | "default";
  /** Cuando subir la métrica es una mala señal (ej. Notas de Crédito),
   *  invierte los colores de la variación (positivo → rojo, negativo → verde). */
  invertVariation?: boolean;
}

const TONE_STYLES: Record<
  KPITone,
  { icon: string; from: string }
> = {
  teal: {
    icon: "bg-[#67afc3]/10 border-[#67afc3]/20 text-[#67afc3]",
    from: "from-[#67afc3]/5",
  },
  emerald: {
    icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    from: "from-emerald-500/5",
  },
  amber: {
    icon: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    from: "from-amber-500/5",
  },
  rose: {
    icon: "bg-rose-500/10 border-rose-500/20 text-rose-600",
    from: "from-rose-500/5",
  },
  slate: {
    icon: "bg-slate-500/10 border-slate-500/20 text-slate-500",
    from: "from-slate-500/5",
  },
};

export default function KPICard({
  title,
  value,
  variation,
  previousValue,
  format = "number",
  icon,
  tone = "teal",
  size = "default",
  invertVariation = false,
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

  const hasVariation = variation !== undefined && variation !== null;
  // Cuando invertVariation está activo, subir es malo (ej. Notas de Crédito)
  const isGood = hasVariation && (invertVariation ? variation! < 0 : variation! > 0);
  const isBad = hasVariation && (invertVariation ? variation! > 0 : variation! < 0);

  const getVariationIcon = () => {
    if (!hasVariation) return null;
    if (isGood) return <TrendingUp size={16} className="text-success" />;
    if (isBad) return <TrendingDown size={16} className="text-danger" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const toneStyle = TONE_STYLES[tone];
  const isHero = size === "hero";

  return (
    <Card
      className={`rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm backdrop-blur-2xl hover:shadow-md transition-shadow group bg-linear-to-br ${toneStyle.from} to-white`}
    >
      <CardBody className={isHero ? "p-4 sm:p-6" : "p-3.5 sm:p-4"}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 w-full min-w-0">
            <p
              className={`font-semibold text-slate-500 uppercase tracking-wider truncate ${
                isHero
                  ? "text-[11px] sm:text-[13px] mb-1.5 sm:mb-2"
                  : "text-[10px] sm:text-[11px] mb-1 sm:mb-1.5"
              }`}
            >
              {title}
            </p>
            <p
              className={`font-bold text-slate-800 truncate tracking-tight ${
                isHero ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
              }`}
            >
              {formatValue(value)}
            </p>
            {hasVariation && (
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3">
                <span
                  className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider ${
                    isGood
                      ? "bg-emerald-50 text-emerald-600"
                      : isBad
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {getVariationIcon()}
                  {variation! > 0 ? "+" : ""}
                  {variation!.toFixed(1)}%
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
            <div
              className={`rounded-xl border shrink-0 transition-transform group-hover:scale-105 shadow-sm ${toneStyle.icon} ${
                isHero ? "p-2.5 sm:p-3" : "p-2 sm:p-2.5"
              }`}
            >
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
