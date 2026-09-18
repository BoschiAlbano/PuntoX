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
  colorScheme:
    | "red"
    | "orange"
    | "green"
    | "blue"
    | "emerald"
    | "purple"
    | "white";
  chartType?: "line" | "bar" | "none";
  delay: number;
}

const colorClasses: Record<
  string,
  {
    bg: string;
    surface: string;
    pill: string;
    chartColor: string;
    iconTint: string;
  }
> = {
  red: {
    bg: "bg-[#fff7f7] border border-[#f4d8d8]",
    surface: "bg-[#fee2e2]",
    pill: "bg-[#fca5a5]",
    chartColor: "rgba(239,68,68,0.55)",
    iconTint: "text-[#b91c1c]",
  },
  orange: {
    bg: "bg-[#fffaf1] border border-[#f7e7c6]",
    surface: "bg-[#fef3c7]",
    pill: "bg-[#fbbf24]",
    chartColor: "rgba(245,158,11,0.55)",
    iconTint: "text-[#b45309]",
  },
  green: {
    bg: "bg-[#f3fbf8] border border-[#d8efe6]",
    surface: "bg-[#d1fae5]",
    pill: "bg-[#34d399]",
    chartColor: "rgba(16,185,129,0.55)",
    iconTint: "text-[#047857]",
  },
  emerald: {
    bg: "bg-[#f3fbf8] border border-[#d8efe6]",
    surface: "bg-[#d1fae5]",
    pill: "bg-[#34d399]",
    chartColor: "rgba(16,185,129,0.55)",
    iconTint: "text-[#047857]",
  },
  blue: {
    bg: "bg-[#f4f9ff] border border-[#dfeefd]",
    surface: "bg-[#dbeafe]",
    pill: "bg-[#60a5fa]",
    chartColor: "rgba(59,130,246,0.55)",
    iconTint: "text-[#1d4ed8]",
  },
  purple: {
    bg: "bg-[#faf5ff] border border-[#eadcff]",
    surface: "bg-[#f3e8ff]",
    pill: "bg-[#c084fc]",
    chartColor: "rgba(168,85,247,0.55)",
    iconTint: "text-[#7e22ce]",
  },
  white: {
    bg: "bg-white border border-slate-200",
    surface: "bg-slate-100",
    pill: "bg-slate-200",
    chartColor: "rgba(15,23,42,0.18)",
    iconTint: "text-slate-700",
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
  const textColor = isWhite ? "text-slate-800" : "text-slate-800";
  const mutedColor = isWhite ? "text-slate-500" : "text-slate-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={`${scheme.bg} rounded-2xl p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] flex flex-col justify-between w-full h-full relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_40%)]" />

      <div className="flex items-start justify-between z-10 w-full mb-4">
        <div className="flex flex-col min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
            {title}
          </p>
          <h3
            className={`${textColor} text-3xl font-extrabold leading-none tracking-[-0.04em]`}
          >
            {value}
          </h3>
          {subtitle && (
            <p className={`${mutedColor} text-sm font-medium mt-2`}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`${scheme.surface} ${scheme.pill} rounded-xl p-2.5 shadow-sm`}
        >
          <Icon className={`w-5 h-5 ${scheme.iconTint}`} strokeWidth={1.8} />
        </div>
      </div>

      <div className="flex items-end justify-between mt-4 z-10 gap-3">
        {bottomText ? (
          <p className={`${mutedColor} text-xs font-semibold leading-relaxed`}>
            {bottomText}
          </p>
        ) : (
          <div />
        )}

        {chartType === "line" && (
          <div className="w-16 h-8 shrink-0">
            <svg
              viewBox="0 0 100 40"
              className="w-full h-full overflow-visible"
            >
              <polyline
                fill="none"
                stroke={scheme.chartColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,35 20,20 40,25 60,10 80,15 100,5"
              />
              <path
                fill={scheme.chartColor}
                d="M0,35 L20,20 L40,25 L60,10 L80,15 L100,5 L100,40 L0,40 Z"
                opacity="0.18"
              />
            </svg>
          </div>
        )}
        {chartType === "bar" && (
          <div className="w-16 h-8 shrink-0 flex items-end justify-between gap-0.5">
            {[38, 56, 44, 92, 68, 100, 80].map((h, i) => (
              <div
                key={i}
                className="w-full rounded-t-sm"
                style={{
                  height: `${h}%`,
                  backgroundColor: scheme.chartColor,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
