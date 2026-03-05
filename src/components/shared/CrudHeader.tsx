import React from "react";

interface CrudHeaderProps {
  title: string;
  description: string;
  /**
   * Ruta pública al ícono decorativo (ej: "/producto-placeholder.svg").
   * Se usa solo como marca de agua, no debe contener información crítica.
   */
  iconSrc?: string;
  /**
   * Color de acento para el header. Por defecto usa el color del sistema.
   */
  accentColor?: string;
  /**
   * Texto pequeño sobre el título (ej: "Catálogo", "Configuración").
   */
  eyebrowLabel?: string;
}

export function CrudHeader({
  title,
  description,
  iconSrc,
  accentColor = "#67afc3",
  eyebrowLabel,
}: CrudHeaderProps) {
  return (
    <section className="relative mb-5 min-h-[160px] overflow-hidden px-6 py-6 sm:mb-6 sm:min-h-[172px] sm:px-9 sm:py-7">
      {/* Marca de agua / ícono difuminado */}
      {iconSrc ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[-12px] right-[-12px] hidden w-40 opacity-15 mix-blend-multiply sm:block sm:w-56 lg:right-[-24px] lg:w-72"
        >
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.08),_transparent_65%)]" />
          <img
            src={iconSrc}
            alt=""
            className="absolute inset-3 h-auto w-auto max-h-full max-w-full object-contain blur-[0.8px]"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {eyebrowLabel ? (
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accentColor }}
            >
              {eyebrowLabel}
            </p>
          ) : null}

          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="h-7 w-1.5 rounded-full bg-[#67afc3]/90 sm:h-8"
              style={{ backgroundColor: accentColor }}
            />

            <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
          </div>

          <p className="max-w-xl pl-5 text-sm font-medium leading-relaxed text-slate-500 sm:pl-6 sm:text-[15px]">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

