import { ReactNode } from "react";

interface SectionPanelProps {
  id: string;
  title: string;
  description: string;
  summary: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function SectionPanel({
  id,
  title,
  description,
  summary,
  children,
  icon,
}: SectionPanelProps) {
  return (
    <div
      id={id}
      className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm overflow-hidden"
    >
      {/* Panel header */}
      <div className="px-6 py-5 border-b border-slate-100/60 bg-slate-50/50 flex items-start gap-4">
        {icon && (
          <div className="p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3] shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>
          {summary && (
            <p className="mt-2 text-[11px] text-slate-400 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-100 font-medium w-fit">
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Panel content */}
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}
