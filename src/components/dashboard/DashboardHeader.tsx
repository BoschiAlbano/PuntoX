"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dispatch, SetStateAction, memo, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronRight,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import GlobalSearchModal from "@/components/shared/GlobalSearchModal";
import { NotificacionesDropdown } from "./NotificacionesDropdown";
import { UserDropdown } from "./UserDropdown";

// ─── Route map ────────────────────────────────────────────────────────────────
const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ventas": "Ventas",
  "/caja": "Caja",
  "/productos": "Productos",
  "/productos/marcas": "Marcas",
  "/productos/rubros": "Rubros",
  "/productos/unidades": "Unidades",
  "/compras": "Compras",
  "/clientes": "Clientes",
  "/clientes/cuentas-corrientes": "Cuentas Corrientes",
  "/empleados": "Empleados",
  "/empleados/roles": "Roles",
  "/empleados/auditoria": "Auditoría",
  "/analiticas": "Analíticas",
  "/analiticas/logs": "Logs",
  "/sucursales": "Sucursales",
  "/configuracion": "Configuración",
  "/configuracion/ventas": "Preferencias de Venta",
  "/configuracion/notificaciones": "Notificaciones",
  "/configuracion/seguridad": "Seguridad",
  "/configuracion/fiscal": "Facturación",
};

// ─── Accent color (fijo en toda la app) ──────────────────────────────────────
const ACCENT = "#67afc3";

// ─── Props ────────────────────────────────────────────────────────────────────
interface DashboardHeaderProps {
  /** Controla visibilidad del sidebar en mobile */
  isShow: Dispatch<SetStateAction<boolean>>;
  show: boolean;
  /** Controla si el sidebar en desktop está colapsado */
  isCollapsed: boolean;
  onToggle: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Botón de toggle animado para mobile (hamburger ↔ X) */
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
      className="sm:hidden relative flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer
                 text-slate-500 hover:text-[#67afc3] hover:bg-[#67afc3]/10
                 transition-all duration-200 shrink-0 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-[#67afc3]/50"
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

/** Botón de colapsar/expandir sidebar en desktop */
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
      className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer
                 text-slate-400 hover:text-[#67afc3] hover:bg-[#67afc3]/10
                 transition-all duration-200 shrink-0 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-[#67afc3]/50"
    >
      {isCollapsed ? (
        <PanelLeftOpen size={17} strokeWidth={2} />
      ) : (
        <PanelLeftClose size={17} strokeWidth={2} />
      )}
    </button>
  );
}

/** Breadcrumb navigation (desktop only) */
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
                  className="text-slate-300 shrink-0 mx-0.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
              {isFirst ? (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center w-6 h-6 rounded-lg
                             text-slate-400 hover:text-[#67afc3] hover:bg-slate-100
                             transition-colors duration-200"
                  aria-label="Ir al inicio"
                >
                  <Home size={13} strokeWidth={2} />
                </Link>
              ) : isLast ? (
                <span className="text-[13px] font-semibold text-slate-700 truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="text-[12.5px] font-medium text-slate-400 hover:text-slate-600
                             transition-colors duration-200 truncate max-w-[120px]"
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
function DashboardHeaderComponent({
  isShow,
  show,
  isCollapsed,
  onToggle,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const { user, roles } = useUserStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global search shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Breadcrumbs generados desde la ruta
  const breadcrumbs = useMemo(() => {
    const paths = pathname.split("/").filter(Boolean);
    const result: { label: string; path: string }[] = [
      { label: "Inicio", path: "/dashboard" },
    ];

    let currentPath = "";
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      // Evitar duplicar "/dashboard" que ya está como primer elemento (Inicio)
      if (currentPath === "/dashboard") return;
      const label =
        routeNames[currentPath] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      result.push({ label, path: currentPath });
    });

    return result;
  }, [pathname]);

  // Datos de usuario
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

  // Página actual
  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Inicio";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="top-0 left-0 right-0 z-40 w-full"
      role="banner"
    >
      {/* ── Barra principal ── */}
      <div className="mx-2 mt-2 sm:mx-3 sm:mt-3">
        <div
          className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl
                     shadow-[0_2px_16px_-4px_rgba(100,116,139,0.12),0_1px_4px_-2px_rgba(100,116,139,0.08)]"
        >
          <div className="flex items-center h-14 px-2 sm:px-3 gap-1.5 sm:gap-2">
            {/* ── Izquierda: toggles + breadcrumbs ── */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              {/* Mobile toggle */}
              <MobileMenuButton
                show={show}
                onToggle={() => isShow((prev) => !prev)}
              />

              {/* Desktop toggle */}
              <DesktopSidebarButton
                isCollapsed={isCollapsed}
                onToggle={onToggle}
              />

              {/* Separador visual */}
              <div
                className="h-5 w-px bg-slate-200 mx-0.5 shrink-0"
                aria-hidden="true"
              />

              {/* Breadcrumbs — desktop */}
              <Breadcrumbs breadcrumbs={breadcrumbs} />

              {/* Página actual — mobile */}
              <div className="sm:hidden flex items-center gap-2 min-w-0">
                {/* Dot acento de color */}
                <div
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: ACCENT }}
                  aria-hidden="true"
                />
                <span className="text-[14px] font-bold text-slate-800 truncate">
                  {currentPage}
                </span>
              </div>
            </div>

            {/* ── Derecha: acciones + usuario ── */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Búsqueda rápida — solo lg+ */}
              <button
                aria-label="Buscar en el sistema"
                onClick={() => setIsSearchOpen(true)}
                className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-xl cursor-pointer
                           text-slate-400 hover:text-slate-600 hover:bg-slate-100
                           border border-transparent hover:border-slate-200
                           transition-all duration-200 text-[13px] font-medium
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3]/50"
              >
                <Search size={14} strokeWidth={2} />
                <span className="text-slate-400">Buscar…</span>
                <kbd
                  className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                                bg-slate-100 text-slate-400 text-[10px] font-mono border border-slate-200 ml-1"
                >
                  ⌘K
                </kbd>
              </button>

              {/* Notificaciones */}
              <NotificacionesDropdown />

              {/* Separador */}
              <div
                className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 shrink-0"
                aria-hidden="true"
              />

              {/* Avatar + info usuario (Dropdown) */}
              <UserDropdown />
            </div>
          </div>

          {/* ── Progress bar (decorativo, 2px) ── */}
          <motion.div
            key={pathname}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="px-3 pb-0.5 hidden sm:block"
            aria-hidden="true"
          >
            <div className="h-[1.5px] w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: ACCENT }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </motion.header>
  );
}

// Memoizar para evitar re-renders innecesarios
const DashboardHeader = memo(DashboardHeaderComponent);
export default DashboardHeader;
