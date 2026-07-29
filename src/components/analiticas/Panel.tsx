"use client";

import React from "react";

export default function Panel({
  title,
  icon: Icon,
  children,
  action,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl sm:rounded-[20px] shadow-sm ${className}`}
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100/60 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
            <Icon size={16} strokeWidth={2.5} className="shrink-0" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 tracking-tight">
            {title}
          </h3>
        </div>
        {action && <div className="w-full sm:w-auto">{action}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
