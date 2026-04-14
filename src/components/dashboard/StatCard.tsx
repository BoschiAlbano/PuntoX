"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string | ReactNode;
  bottomText?: string | ReactNode;
  icon: LucideIcon;
  colorScheme: "red" | "orange" | "green" | "blue" | "emerald" | "purple" | "white";
  chartType?: "line" | "bar" | "none";
  delay: number;
}

const colorClasses: Record<string, { bg: string; chartColor: string }> = {
  red: {
    bg: "bg-gradient-to-br from-[#f87171] to-[#fca5a5]",
    chartColor: "rgba(255,255,255,0.4)",
  },
  orange: {
    bg: "bg-gradient-to-br from-[#f97316] to-[#fb923c]",
    chartColor: "rgba(255,255,255,0.4)",
  },
  green: {
    bg: "bg-gradient-to-br from-[#4ade80] to-[#86efac]",
    chartColor: "rgba(255,255,255,0.5)",
  },
  emerald: {
    bg: "bg-gradient-to-br from-[#4ade80] to-[#86efac]",
    chartColor: "rgba(255,255,255,0.5)",
  },
  blue: {
    bg: "bg-gradient-to-br from-[#38bdf8] to-[#7dd3fc]",
    chartColor: "rgba(255,255,255,0.4)",
  },
  purple: {
    bg: "bg-gradient-to-br from-[#a855f7] to-[#d8b4fe]",
    chartColor: "rgba(255,255,255,0.5)",
  },
  white: {
    bg: "bg-white border border-slate-200",
    chartColor: "rgba(0,0,0,0.1)",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  bottomText,
  icon: Icon,
  colorScheme,
  chartType = "line",
  delay,
}: StatCardProps) {
  const scheme = colorClasses[colorScheme] || colorClasses.blue;
  const isWhite = colorScheme === "white";
  const textColor = isWhite ? "text-slate-800" : "text-white";
  const mutedColor = isWhite ? "text-slate-500" : "text-white/80";

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }}
      className={`${scheme.bg} rounded-xl p-5 shadow-md flex flex-col justify-between w-full h-full relative overflow-hidden`}
    >
      <div className="flex items-start justify-between z-10 w-full mb-3">
        <div className="flex flex-col">
          <p className={`${textColor} text-xs font-bold uppercase tracking-wider mb-2`}>{title}</p>
          <h3 className={`${textColor} text-3xl font-extrabold leading-tight`}>{value}</h3>
          {subtitle && (
            <p className={`${mutedColor} text-sm font-medium mt-1`}>{subtitle}</p>
          )}
        </div>
        <div>
          <Icon className={`w-6 h-6 ${textColor} opacity-80`} strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-4 z-10">
        {bottomText ? (
          <p className={`${textColor} text-xs font-semibold`}>{bottomText}</p>
        ) : (
          <div />
        )}

        {/* Decoraciones Estilo Gráfico (Mini SVGs Estáticos simulando chart) */}
        {chartType === "line" && (
          <div className="w-16 h-8 shrink-0">
             <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
               <polyline
                 fill="none"
                 stroke={isWhite ? "#94a3b8" : "white"}
                 strokeWidth="3"
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 points="0,35 20,20 40,25 60,10 80,15 100,5"
               />
               <path 
                 fill={scheme.chartColor} 
                 d="M0,35 L20,20 L40,25 L60,10 L80,15 L100,5 L100,40 L0,40 Z" />
             </svg>
          </div>
        )}
        {chartType === "bar" && (
          <div className="w-16 h-8 shrink-0 flex items-end justify-between gap-0.5">
            {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
              <div 
                key={i} 
                className={`w-full rounded-t-sm`} 
                style={{ height: `${h}%`, backgroundColor: isWhite ? "#cbd5e1" : "white" }} 
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
