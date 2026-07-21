"use client";

/**
 * Registro de "cambios sin guardar" para el wizard de onboarding.
 * Cada sección de configuración (Fiscal, Perfil, Ventas, etc.) reporta su
 * propio `hasChanges` con `useReportDirty(id, hasChanges)`. Fuera del
 * onboarding (ej. la página de Configuración normal) no hay Provider, así
 * que el hook es un no-op y no cambia nada del comportamiento actual.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

interface DirtyRegistry {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
  report: (id: string, dirty: boolean) => void;
}

function createDirtyRegistry(): DirtyRegistry {
  const dirtyMap = new Map<string, boolean>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => [...dirtyMap.values()].some(Boolean),
    report(id, dirty) {
      if (dirtyMap.get(id) === dirty) return;
      dirtyMap.set(id, dirty);
      notify();
    },
  };
}

const OnboardingDirtyContext = createContext<DirtyRegistry | null>(null);

export function OnboardingDirtyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const registryRef = useRef<DirtyRegistry | null>(null);
  if (!registryRef.current) registryRef.current = createDirtyRegistry();

  return (
    <OnboardingDirtyContext.Provider value={registryRef.current}>
      {children}
    </OnboardingDirtyContext.Provider>
  );
}

/** Reporta si esta sección tiene cambios sin guardar. No-op fuera del onboarding. */
export function useReportDirty(id: string, isDirty: boolean) {
  const registry = useContext(OnboardingDirtyContext);
  useEffect(() => {
    if (!registry) return;
    registry.report(id, isDirty);
    return () => registry.report(id, false);
  }, [registry, id, isDirty]);
}

const noSubscribe = () => () => {};

/** true si alguna sección reportó cambios sin guardar (solo dentro del Provider). */
export function useHasUnsavedChanges(): boolean {
  const registry = useContext(OnboardingDirtyContext);
  return useSyncExternalStore(
    registry?.subscribe ?? noSubscribe,
    () => registry?.getSnapshot() ?? false,
    () => false,
  );
}
