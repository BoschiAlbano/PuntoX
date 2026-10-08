"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Image from "next/image";
import AuthLoadingView from "../loading/loading";

export type AuthTransitionPhase = "idle" | "signing-in" | "verifying";

interface AuthTransitionContextValue {
  phase: AuthTransitionPhase;
  setPhase: (phase: AuthTransitionPhase) => void;
  startSigningIn: () => void;
  startVerifying: () => void;
  resetTransition: () => void;
}

const AuthTransitionContext = createContext<
  AuthTransitionContextValue | undefined
>(undefined);

/**
 * Overlay global persistente montado una única vez en la jerarquía raíz.
 * Permanece en el DOM durante toda la transición /signin -> /dashboard sin desmontarse,
 * cambiando únicamente el texto entre "Iniciando sesión…" y "Verificando autenticación…"
 * para evitar parpadeos y cortes en las animaciones del isotipo y la barra.
 */
function AuthTransitionOverlay({ phase }: { phase: AuthTransitionPhase }) {
  const isVisible = phase !== "idle";
  const message =
    phase === "signing-in" ? "Iniciando sesión…" : "Verificando autenticación…";

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-[#F6FAFC] flex flex-col items-center justify-center select-none overflow-hidden"
      aria-live="polite"
      role="status"
    >
      <AuthLoadingView message={message} />
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
