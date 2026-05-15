import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { tienePermisoParaRuta } from "@/lib/permissions/routePermissions";
import { addToast } from "@heroui/react";

// Define simplified types matching API response (which converts BigInt to string)
interface User {
  Id: string;
  Nombre: string;
  Email: string;
  Foto?: string | null;
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
  isSuperAdmin: boolean;
  isAdministrador: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  setCurrentBranch: (branch: UserBranch) => void;
  hasPermission: (path: string) => boolean;
  canAccessRoute: (path: string) => boolean;
  pushBranch: (branch: UserBranch) => void;
  removeBranch: (branchId: string) => void;
  updateBranch: (branch: UserBranch) => void;
  updateUserFoto: (foto: string | null) => void;
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
      isSuperAdmin: false,
      isAdministrador: false,
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
                isSuperAdmin: data.roles.some(
                  (r: Role) => r.Tipo === "SUPERADMIN",
                ),
                isAdministrador: data.roles.some(
                  (r: Role) => r.Tipo === "ADMINISTRADOR",
                ),
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

        // SuperAdmin y Administrador tienen acceso a todo
        if (
          roles.some(
            (r) => r.Tipo === "SUPERADMIN" || r.Tipo === "ADMINISTRADOR",
          )
        )
          return true;

        // Basic routes
        if (path === "/" || path === "/dashboard" || path.startsWith("/perfil")) return true;

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

      updateBranch: (branch) => {
        const { branches, currentBranch } = get();
        const updatedBranches = branches.map((b) =>
          b.Id == branch.Id ? { ...b, ...branch } : b,
        );

        let newCurrent = currentBranch;
        if (currentBranch.Id == branch.Id) {
          newCurrent = { ...currentBranch, ...branch };
        }

        set({ branches: updatedBranches, currentBranch: newCurrent });
      },

      updateUserFoto: (foto) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, Foto: foto } }, false, "updateUserFoto");
      },
    }),
    { name: "UserStore" },
  ),
);
