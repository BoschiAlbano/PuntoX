"use client";

import { ReactNode } from "react";
import { Switch } from "@heroui/react";

/** Fila de toggle reutilizable para todas las secciones de ventas */
export function ToggleRow({
  icon: Icon,
  iconColor = "text-[#67afc3]",
  iconBg = "from-[#67afc3]/15 to-[#2dd4bf]/15 border-[#67afc3]/20",
  title,
  description,
  isSelected,
  onValueChange,
  isDisabled,
  children,
}: {
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description?: string;
  isSelected?: boolean;
  onValueChange?: (v: boolean) => void;
  isDisabled?: boolean;
  /** Contenido extra debajo de título/desc (ej: Select de métodos de pago) */
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 rounded-2xl bg-slate-50/60 border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-xl bg-linear-to-br ${iconBg} border shrink-0 mt-0.5`}>
          <Icon size={15} strokeWidth={2.5} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-sm font-bold text-slate-700 leading-tight">{title}</p>
            {description && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
          {children && <div>{children}</div>}
        </div>
      </div>
      {onValueChange !== undefined && (
        <Switch
          isSelected={isSelected}
          onValueChange={onValueChange}
          isDisabled={isDisabled}
          size="sm"
          color="primary"
          aria-label={title}
          classNames={{ wrapper: "group-data-[selected=true]:bg-[#67afc3]" }}
        />
      )}
    </div>
  );
}

/** Contenedor de sección con header premium */
export function VentasSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: ReactNode;
}) {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-bold text-slate-700 tracking-tight">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-2">{children}</div>
    </div>
  );
}
