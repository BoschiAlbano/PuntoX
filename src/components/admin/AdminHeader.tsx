"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dispatch, SetStateAction, memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronRight,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { UserDropdown } from "@/components/dashboard/UserDropdown";

// ─── Route map ────────────────────────────────────────────────────────────────
const routeNames: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/tenants": "Tiendas",
  "/admin/tenants/new": "Nueva Tienda",
  "/admin/planes": "Planes SaaS",
  "/admin/auditoria": "Auditoría",
  "/admin/configuracion": "Configuración",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface AdminHeaderProps {
  isShow: Dispatch<SetStateAction<boolean>>;
  show: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MobileMenuButton({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={show ? "Cerrar menú lateral" : "Abrir menú lateral"}
      aria-expanded={show}
      className="sm:hidden relative flex items-center justify-center h-8 w-8 rounded-lg cursor-pointer
                 text-(--nav-btn-text) hover:text-(--nav-btn-hover-text) hover:bg-(--nav-btn-hover-bg)
                  transition-all duration-200 shrink-0 focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
    >
      <AnimatePresence mode="wait" initial={false}>
        {show ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute"
          >
            <X size={18} strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span
            key="menu"
            initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute"
          >
            <Menu size={18} strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function DesktopSidebarButton({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={
        isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"
      }
      className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg cursor-pointer
                 text-(--nav-btn-text) hover:text-(--nav-btn-hover-text) hover:bg-(--nav-btn-hover-bg)
                 transition-all duration-200 shrink-0 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
    >
      {isCollapsed ? (
        <PanelLeftOpen size={17} strokeWidth={2} />
      ) : (
        <PanelLeftClose size={17} strokeWidth={2} />
      )}
    </button>
  );
}

function Breadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs: { label: string; path: string }[];
}) {
  return (
    <nav
      aria-label="Navegación de ruta"
      className="hidden sm:flex items-center gap-1 min-w-0"
    >
      <ol className="flex items-center gap-0.5 min-w-0">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isFirst = idx === 0;

          return (
            <li key={crumb.path} className="flex items-center gap-0.5">
              {idx > 0 && (
                <ChevronRight
                  size={12}
                  className="text-(--nav-breadcrumb-sep) shrink-0 mx-0.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
              {isFirst ? (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center justify-center w-6 h-6 rounded-lg
                             text-(--nav-breadcrumb-home) hover:text-[#67afc3] hover:bg-(--nav-btn-hover-bg)
                             transition-colors duration-200"
                  aria-label="Ir al inicio"
                >
                  <Home size={13} strokeWidth={2} />
                </Link>
              ) : isLast ? (
                <span className="text-[13px] font-semibold text-(--nav-breadcrumb-current) truncate max-w-50">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="text-[12.5px] font-medium text-(--nav-breadcrumb-mid) hover:text-(--nav-breadcrumb-current)
                             transition-colors duration-200 truncate max-w-30"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
      className="top-0 left-0 right-0 z-40 w-full bg-(--fondo)"
      role="banner"
    >
      <div className="relative flex items-center h-(--shell-header-height) px-3 sm:px-4 lg:px-5 gap-1.5 sm:gap-2">
        {/* Left: toggles + breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <MobileMenuButton
            show={show}
            onToggle={() => isShow((prev) => !prev)}
          />
          <DesktopSidebarButton isCollapsed={isCollapsed} onToggle={onToggle} />

          <div
            className="h-5 w-px bg-(--nav-divider) mx-0.5 shrink-0"
            aria-hidden="true"
          />

          <Breadcrumbs breadcrumbs={breadcrumbs} />

          {/* Mobile page title */}
          <div className="sm:hidden flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0 shadow-sm bg-amber-400"
              aria-hidden="true"
            />
            <span className="text-[14px] font-bold text-(--nav-page-title-mobile) truncate">
              {currentPage}
            </span>
          </div>
        </div>

        {/* Right: user dropdown */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Admin badge - desktop only */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 mr-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              Super-Admin
            </span>
          </div>

          <div
            className="h-5 w-px bg-(--nav-divider) mx-0.5 sm:mx-1 shrink-0"
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
