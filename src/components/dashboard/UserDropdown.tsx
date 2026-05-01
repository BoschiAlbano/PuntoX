"use client";

import { useUserStore } from "@/store/useUserStore";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { clearAllClientState, getStoredSesionId } from "@/lib/auth/clearClientState";

const ACCENT = "#67afc3";

export function UserDropdown() {
  const { user, roles } = useUserStore();
  const { supabase } = useSupabaseAuthContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // User details
  const email = typeof user?.Email === "string" ? user.Email : "";
  const usuario = typeof user?.Usuario === "string" ? user.Usuario : "";
  const displayName = email.trim() || usuario || "Usuario";
  const displayRol = roles.map((r) => r.Descripcion).join(" · ") || "Operador";
  const userInitials =
    email
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("") ||
    usuario?.[0]?.toUpperCase() ||
    "U";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      queryClient.cancelQueries();
      queryClient.clear();

      // 1. Recuperar sesionId ANTES de limpiar el localStorage
      const sesionId = getStoredSesionId();

      // 2. Cerrar sesión en nuestra DB ANTES de revocar el token en Supabase
      //    (después del signOut el token ya no es válido)
      const url = sesionId
        ? `/api/auth/registrar-sesion?sesionId=${sesionId}`
        : "/api/auth/registrar-sesion";

      await fetch(url, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {}); // No crítico

      // 3. Limpiar TODO el estado del cliente (localStorage, sessionStorage, cookies)
      clearAllClientState();

      // 4. Cerrar sesión en Supabase
      await supabase.auth.signOut();

      router.push("/signin");
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <button
          className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1.5 rounded-xl cursor-pointer
                     hover:bg-slate-100 transition-all duration-200 group
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3]/50"
          aria-label="Menú de perfil de usuario"
          aria-haspopup="true"
        >
          {/* Avatar */}
          <div
            className="relative w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold
                        shrink-0 shadow-sm ring-2 ring-white group-hover:ring-[#67afc3]/20
                        transition-all duration-200"
            style={{ backgroundColor: ACCENT }}
            aria-hidden="true"
          >
            {userInitials}
            {/* Online indicator */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400
                         rounded-full border-2 border-white"
              aria-hidden="true"
            />
          </div>

          {/* Info usuario — md+ */}
          <div className="hidden md:flex flex-col items-start min-w-0">
            <span className="text-[12.5px] font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
              {displayName}
            </span>
            <span className="text-[11px] text-slate-400 leading-tight truncate max-w-[130px]">
              {displayRol}
            </span>
          </div>

          {/* Chevron — md+ */}
          <ChevronDown
            size={13}
            className="hidden md:block text-slate-400 group-hover:text-slate-600
                       transition-colors duration-200 shrink-0 ml-0.5"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Acciones de usuario"
        className="w-56"
        itemClasses={{
          base: "gap-3",
        }}
        disabledKeys={isLoggingOut ? ["logout"] : []}
      >
        <DropdownItem
          key="profile_info"
          className="h-14 gap-2 opacity-100"
          isReadOnly
          textValue="Información del usuario"
        >
          <p className="font-semibold text-slate-800 truncate">{displayName}</p>
          <p className="text-xs text-slate-500 truncate">{displayRol}</p>
        </DropdownItem>

        <DropdownItem
          key="my_profile"
          startContent={<User size={16} className="text-slate-500" />}
          textValue="Mi Perfil"
          onPress={() => router.push("/perfil")}
        >
          Mi perfil
        </DropdownItem>

        <DropdownItem
          key="config"
          startContent={<Settings size={16} className="text-slate-500" />}
          textValue="Configuración"
          onPress={() => router.push("/configuracion")}
        >
          Configuración
        </DropdownItem>

        <DropdownItem
          key="logout"
          className="text-danger"
          color="danger"
          startContent={
            <LogOut
              size={16}
              className={isLoggingOut ? "text-danger/50" : "text-danger"}
            />
          }
          onPress={handleLogout}
          textValue="Cerrar sesión"
        >
          {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
