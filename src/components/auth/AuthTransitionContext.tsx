"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Image from "next/image";

export type AuthTransitionPhase = "idle" | "signing-in" | "verifying";

interface AuthTransitionContextValue {
  phase: AuthTransitionPhase;
  setPhase: (phase: AuthTransitionPhase) => void;
  startSigningIn: () => void;
  startVerifying: () => void;
  resetTransition: () => void;
}

const AuthTransitionContext = createContext<AuthTransitionContextValue | undefined>(
  undefined,
);

/**
 * Overlay global persistente montado una única vez en la jerarquía raíz.
 * Permanece en el DOM durante toda la transición /signin -> /dashboard sin desmontarse,
 * cambiando únicamente el texto entre "Iniciando sesión…" y "Verificando autenticación…"
 * para evitar parpadeos y cortes en las animaciones del isotipo y la barra.
 */
function AuthTransitionOverlay({ phase }: { phase: AuthTransitionPhase }) {
  const isVisible = phase !== "idle";
  const message =
    phase === "signing-in"
      ? "Iniciando sesión…"
      : "Verificando autenticación…";

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-[#F6FAFC] flex flex-col items-center justify-center select-none overflow-hidden"
      aria-live="polite"
      role="status"
    >
      {/* Halo ambiental suave que acompaña la respiración */}
      <div
        className="absolute w-48 h-48 bg-[#006AFC]/8 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Isotipo oficial con respiración continua que NO se reinicia */}
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

      {/* Contenedor de texto con altura fija para evitar saltos de layout */}
      <div className="h-7 flex items-center justify-center mt-5">
        <p className="text-sm font-semibold text-slate-700 tracking-tight transition-opacity duration-150">
          {message}
        </p>
      </div>

      {/* Barra de progreso indeterminada continua que NO se reinicia */}
      <div className="w-32 h-1 bg-slate-200/70 rounded-full overflow-hidden mt-3.5 relative">
        <div className="absolute inset-y-0 w-1/2 bg-linear-to-r from-[#006AFC] via-[#00B9D8] to-[#FC6A01] rounded-full animate-puntox-indeterminate" />
      </div>
    </div>
  );
}

export function AuthTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<AuthTransitionPhase>("idle");

  const startSigningIn = useCallback(() => {
    setPhase("signing-in");
  }, []);

  const startVerifying = useCallback(() => {
    setPhase("verifying");
  }, []);

  const resetTransition = useCallback(() => {
    setPhase("idle");
  }, []);

  return (
    <AuthTransitionContext.Provider
      value={{
        phase,
        setPhase,
        startSigningIn,
        startVerifying,
        resetTransition,
      }}
    >
      {children}
      <AuthTransitionOverlay phase={phase} />
    </AuthTransitionContext.Provider>
  );
}

export function useAuthTransition() {
  const context = useContext(AuthTransitionContext);
  if (!context) {
    throw new Error(
      "useAuthTransition debe usarse dentro de AuthTransitionProvider",
    );
  }
  return context;
}
