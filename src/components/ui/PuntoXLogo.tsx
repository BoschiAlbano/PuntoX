import Image from "next/image";

interface PuntoXLogoProps {
  className?: string;
  /** Si es true, la animación se ejecuta de forma infinita (modo spinner). */
  spinner?: boolean;
}

export function PuntoXLogo({
  className = "w-12 h-12",
  spinner = false,
}: PuntoXLogoProps) {
  return (
    <Image
      src="/brand/puntox-isotipo.png"
      alt="Punto X"
      width={120}
      height={100}
      priority={spinner}
      className={`${className} object-contain ${spinner ? "motion-safe:animate-spin" : ""}`}
    />
  );
}
