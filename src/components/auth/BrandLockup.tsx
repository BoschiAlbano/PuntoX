import React from "react";
import Image from "next/image";

interface BrandLockupProps {
  /**
   * dark: texto "Punto" en blanco (para fondo oscuro #0B1F3B)
   * light: texto "Punto" en azul profundo #0B1F3B (para fondo claro)
   */
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function BrandLockup({
  variant = "dark",
  size = "md",
  className = "",
}: BrandLockupProps) {
  const isDark = variant === "dark";

  const sizeConfig = {
    sm: {
      text: "text-xl",
      imgWidth: 26,
      imgHeight: 22,
      gap: "gap-2",
    },
    md: {
      text: "text-2xl sm:text-3xl",
      imgWidth: 34,
      imgHeight: 28,
      gap: "gap-2.5",
    },
    lg: {
      text: "text-3xl xl:text-4xl",
      imgWidth: 44,
      imgHeight: 37,
      gap: "gap-3",
    },
    xl: {
      text: "text-4xl xl:text-5xl",
      imgWidth: 56,
      imgHeight: 47,
      gap: "gap-3.5",
    },
  }[size];

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} ${className}`}>
      <span
        className={`font-extrabold tracking-tight font-sans select-none leading-none ${sizeConfig.text} ${
          isDark ? "text-white" : "text-[#0B1F3B]"
        }`}
      >
        Punto
      </span>
      <Image
        src="/brand/puntox-isotipo.png"
        alt="PuntoX"
        width={sizeConfig.imgWidth}
        height={sizeConfig.imgHeight}
        className="shrink-0 object-contain"
        priority
      />
    </div>
  );
}
