import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { tienePermisoParaRuta } from "@/lib/permissions/routePermissions";

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

interface Role {
  Id: string;
  Descripcion: string;
  Tipo: "ADMINISTRADOR" | "EMPLEADO" | "SUPERADMIN";
}

interface UserState {
  user: User | null;
  branches: (Sucursal & { esDefault: boolean })[];
  currentBranch: Sucursal;
  permissions: string[];
  roles: Role[];
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setCurrentBranch: (branch: Sucursal) => void;
  hasPermission: (path: string) => boolean;
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
      },
      permissions: [],
      roles: [],
      isLoading: false,
      isInitialized: false,

      initialize: async () => {
        // Prevent double init
        if (get().isInitialized) return;

        set({ isLoading: true }, false, "initialize/loading");
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            console.log(data);
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
              "initialize/success",
            );
          }
        } catch (e) {
          console.error("Failed to initialize user store", e);
        } finally {
          set({ isLoading: false }, false, "initialize/done");
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

        console.log(path, permissions, roles);

        // SuperAdmin has access to everything
        if (roles.some((r) => r.Tipo === "SUPERADMIN")) return true;

        // Basic routes
        if (path === "/" || path === "/dashboard") return true;

        return tienePermisoParaRuta(permissions, path);
      },
    }),
    { name: "UserStore" },
  ),
);
