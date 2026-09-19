"use client";

import Image from "next/image";

interface LoadingViewProps {
  message?: string;
  className?: string;
}

/**
 * Vista centralizada y unificada de loading para autenticación y cargas de aplicación.
 * Utiliza el isotipo oficial de PuntoX con una respiración sutil (0.96 -> 1 -> 0.96).
 */
export function AuthLoadingView({
  message = "Cargando...",
  className = "",
}: LoadingViewProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none relative ${className}`}
    >
      {/* Halo ambiental suave que acompaña la respiración */}
      <div
        className="absolute w-32 h-32 bg-[#006AFC]/8 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Isotipo oficial con respiración sutil */}
      <div className="relative w-16 h-14 sm:w-18 sm:h-16 flex items-center justify-center animate-puntox-breathe">
        <Image
          src="/brand/puntox-isotipo.png"
          alt="PuntoX"
          width={64}
          height={54}
          className="object-contain"
          priority
        />
      </div>

      {/* Texto de estado */}
      {message && (
        <p className="text-sm font-semibold text-slate-700 tracking-tight mt-5">
          {message}
        </p>
      )}

      {/* Línea de progreso sutil con colores de marca */}
      <div className="w-28 h-1 bg-slate-200/60 rounded-full overflow-hidden mt-3.5">
        <div className="h-full bg-linear-to-r from-[#006AFC] via-[#00B9D8] to-[#FC6A01] rounded-full w-full opacity-85 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

export function LoadingSpinner({ message }: { message?: string }) {
  return <AuthLoadingView message={message} />;
}

export function LoadingPage({
  message = "Verificando autenticación...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen w-full bg-[#F6FAFC] flex items-center justify-center relative overflow-hidden">
      <AuthLoadingView message={message} />
    </div>
  );
}

export function LoadingComponent({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-75 h-full w-full bg-transparent flex items-center justify-center">
      <AuthLoadingView message={message} />
    </div>
  );
}
