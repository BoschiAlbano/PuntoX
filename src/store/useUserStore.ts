import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { tienePermisoParaRuta } from "@/lib/permissions/routePermissions";
import { addToast } from "@heroui/react";

// Define simplified types matching API response (which converts BigInt to string)
interface User {
  Id: string;
  Nombre: string;
  Email: string;
  [key: string]: any;
}

interface Sucursal {
  Id: string;
  Nombre: string;
  EsPrincipal: boolean;
  [key: string]: any;
}

type UserBranch = Sucursal & { esDefault: boolean };

interface Role {
  Id: string;
  Descripcion: string;
  Tipo: "ADMINISTRADOR" | "EMPLEADO" | "SUPERADMIN";
}

interface UserState {
  user: User | null;
  branches: UserBranch[];
  currentBranch: UserBranch;
  permissions: string[];
  roles: Role[];
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  setCurrentBranch: (branch: UserBranch) => void;
  hasPermission: (path: string) => boolean;
  canAccessRoute: (path: string) => boolean;
  pushBranch: (branch: UserBranch) => void;
  removeBranch: (branchId: string) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      user: null,
      branches: [],
      currentBranch: {
        Id: "",
        Nombre: "",
        EsPrincipal: false,
        esDefault: false,
      },
      permissions: [],
      roles: [],
      isLoading: false,
      isInitialized: false,

      initialize: async () => {
        // Prevent double init
        if (get().isInitialized) return;
        await get().refreshUserData();
      },

      refreshUserData: async () => {
        set({ isLoading: true }, false, "refresh/loading");
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            // console.log(data);
            let branchToUse = data.currentBranch;
            // Client-side restoration of selected branch
            if (typeof window !== "undefined") {
              const storedId = localStorage.getItem("selectedBranchId");
              if (storedId) {
                const found = data.branches.find((b: any) => b.Id === storedId);
                if (found) branchToUse = found;
              }
            }

            set(
              {
                user: data.user,
                branches: data.branches,
                currentBranch: branchToUse,
                permissions: data.permissions,
                roles: data.roles,
                isInitialized: true,
              },
              false,
              "refresh/success",
            );
          }
        } catch (e) {
          console.error("Failed to refresh user data", e);
        } finally {
          set({ isLoading: false }, false, "refresh/done");
        }
      },

      setCurrentBranch: (branch) => {
        set({ currentBranch: branch }, false, "setCurrentBranch");
        if (typeof window !== "undefined") {
          localStorage.setItem("selectedBranchId", branch.Id);
        }
      },

      hasPermission: (path: string) => {
        const { permissions, roles } = get();

        // SuperAdmin has access to everything
        if (roles.some((r) => r.Tipo === "SUPERADMIN")) return true;

        // Basic routes
        if (path === "/" || path === "/dashboard") return true;

        return tienePermisoParaRuta(permissions, path);
      },

      canAccessRoute: (path: string) => {
        const { hasPermission } = get();
        return hasPermission(path);
      },

      pushBranch: (branch) => {
        const { branches } = get();
        set({ branches: [...branches, branch] });
      },

      removeBranch: (branchId: string) => {
        const { currentBranch } = get();
        if (currentBranch.Id == branchId) {
          addToast({
            title: "Sucursal",
            description: "No se puede eliminar la sucursal actual",
          });
          return;
        }
        const { branches } = get();
        set({ branches: branches.filter((b) => b.Id != branchId) });
      },
    }),
    { name: "UserStore" },
  ),
);
