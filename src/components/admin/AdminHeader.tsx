"use client";

import { motion } from "framer-motion";
import { Dispatch, SetStateAction, memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { UserDropdown } from "@/components/dashboard/UserDropdown";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import {
  Breadcrumbs,
  DesktopSidebarButton,
  MobileMenuButton,
} from "@/components/shell/HeaderParts";

// ─── Route map ────────────────────────────────────────────────────────────────
const routeNames: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/tenants": "Tiendas",
  "/admin/tenants/new": "Nueva Tienda",
  "/admin/planes": "Planes SaaS",
  "/admin/imagenes-cache": "Imágenes (Caché)",
  "/admin/auditoria": "Auditoría",
  "/admin/configuracion": "Configuración",
};

/** Mismo acento que el header de las tiendas. */
const ACCENT = "#0066ff";

// ─── Props ────────────────────────────────────────────────────────────────────
interface AdminHeaderProps {
  isShow: Dispatch<SetStateAction<boolean>>;
  show: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * Header del panel del superadmin. Mismo aspecto que el de las tiendas
 * (components/dashboard/DashboardHeader): fondo blanco, controles y migas de
 * pan compartidos (components/shell/HeaderParts).
 */
function AdminHeaderComponent({
  isShow,
  show,
  isCollapsed,
  onToggle,
}: AdminHeaderProps) {
  const pathname = usePathname();

  // Breadcrumbs from route
  const breadcrumbs = useMemo(() => {
    const paths = pathname.split("/").filter(Boolean);
    const result: { label: string; path: string }[] = [
      { label: "Inicio", path: "/admin/dashboard" },
    ];

    let currentPath = "";
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      if (currentPath === "/admin/dashboard") return;
      if (currentPath === "/admin") return; // skip intermediate /admin

      // Check for dynamic segments (tenant IDs, etc.)
      const label =
        routeNames[currentPath] ||
        (segment.match(/^\d+$/)
          ? `#${segment}`
          : segment.charAt(0).toUpperCase() + segment.slice(1));

      result.push({ label, path: currentPath });
    });

    return result;
  }, [pathname]);

  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Inicio";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="top-0 left-0 right-0 z-40 w-full bg-(--header-bg)"
      role="banner"
    >
      <div className="relative flex items-center h-(--shell-header-height) px-3 sm:px-4 lg:px-5 gap-1.5 sm:gap-2">
        {/* Izquierda: toggles + breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <MobileMenuButton
            show={show}
            onToggle={() => isShow((prev) => !prev)}
          />
          <DesktopSidebarButton isCollapsed={isCollapsed} onToggle={onToggle} />

          <div
            className="h-5 w-px bg-(--header-divider) mx-0.5 shrink-0"
            aria-hidden="true"
          />

          <Breadcrumbs breadcrumbs={breadcrumbs} homeHref="/admin/dashboard" />

          {/* Página actual — mobile */}
          <div className="sm:hidden flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: ACCENT }}
              aria-hidden="true"
            />
            <span className="text-[14px] font-bold text-(--header-page-title-mobile) truncate">
              {currentPage}
            </span>
          </div>
        </div>

        {/* Derecha: rol + notificaciones + usuario */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0066ff]/8 border border-[#0066ff]/15 mr-1">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ACCENT }}
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold text-[#0050cb] uppercase tracking-wider">
              Super Admin
            </span>
          </div>

          <AdminNotifications />

          <div
            className="h-5 w-px bg-(--header-divider) mx-0.5 sm:mx-1 shrink-0"
            aria-hidden="true"
          />

          <UserDropdown />
        </div>
      </div>
    </motion.header>
  );
}

const AdminHeader = memo(AdminHeaderComponent);
export default AdminHeader;
