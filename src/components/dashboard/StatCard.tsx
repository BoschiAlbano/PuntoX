"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string | ReactNode;
  icon: LucideIcon;
  colorScheme: "blue" | "orange" | "emerald" | "purple" | "white";
  iconColor: string;
  delay: number;
  progressPercent: number;
  progressDelay?: number;
}

const colorClasses = {
  blue: {
    bg: "bg-gradient-to-br from-blue-300 via-blue-400 to-cyan-400",
    text: "text-[#182337]",
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-300 via-amber-300 to-yellow-300",
    text: "text-[#182337]",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-300 via-teal-300 to-green-400",
    text: "text-[#182337]",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-300 via-violet-300 to-pink-300",
    text: "text-[#182337]",
  },
  white: {
    bg: "bg-gradient-to-br from-white via-white to-white",
    text: "text-[#182337]",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  iconColor,
  delay,
  progressPercent,
  progressDelay = 0.5,
}: StatCardProps) {
  const colors = colorClasses[colorScheme];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }}
      className={`${colors.bg} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer w-full`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`${colors.text} text-sm font-medium mb-1`}>{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {subtitle && (
            <p className={`${colors.text} text-xs mt-1`}>{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-xl">
          <Icon className="w-6 h-6" color={iconColor} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: progressDelay, duration: 1 }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
