import { create } from "zustand";

interface BreadcrumbStore {
  overrides: Record<string, string>;
  setOverride: (path: string, label: string) => void;
  clearOverride: (path: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  overrides: {},
  setOverride: (path, label) =>
    set((state) => ({
      overrides: { ...state.overrides, [path]: label },
    })),
  clearOverride: (path) =>
    set((state) => {
      const { [path]: _, ...rest } = state.overrides;
      return { overrides: rest };
    }),
}));
