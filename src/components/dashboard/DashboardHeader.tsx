"use client";

import { motion } from "framer-motion";
import {
  Dispatch,
  SetStateAction,
  memo,
  useMemo,
  useState,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import {
  Breadcrumbs,
  DesktopSidebarButton,
  MobileMenuButton,
} from "@/components/shell/HeaderParts";
import { useUserStore } from "@/store/useUserStore";
import GlobalSearchModal from "@/components/shared/GlobalSearchModal";
import { NotificacionesDropdown } from "./NotificacionesDropdown";
import { UserDropdown } from "./UserDropdown";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

// ─── Route map ────────────────────────────────────────────────────────────────
const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ventas": "Ventas",
  "/caja": "Caja",
  "/productos": "Productos",
  "/productos/marcas": "Marcas",
  "/productos/rubros": "Rubros",
  "/productos/unidades": "Unidades",
  "/productos/listas-precios": "Listas de Precios",
  "/compras": "Compras",
  "/clientes": "Clientes",
  "/clientes/cuentas-corrientes": "Cuentas Corrientes",
  "/proveedores/cuentas-corrientes": "Cuentas Cte. Prov.",
  "/empleados": "Empleados",
  "/empleados/roles": "Roles",
  "/empleados/auditoria": "Auditoría",
  "/analiticas": "Analíticas",
  "/sucursales": "Sucursales",
  "/configuracion": "Configuración",
  "/configuracion/ventas": "Preferencias de Venta",
  "/configuracion/notificaciones": "Notificaciones",
  "/configuracion/seguridad": "Seguridad",
  "/configuracion/fiscal": "Facturación",
};

// ─── Accent color del shell ──────────────────────────────────────────────────
const ACCENT = "#0066ff";

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

// ─── Main Component ───────────────────────────────────────────────────────────
function DashboardHeaderComponent({
  isShow,
  show,
  isCollapsed,
  onToggle,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const { user, isInitialized } = useUserStore();
  const { overrides } = useBreadcrumbStore();
  const hasUserSession = isInitialized && !!user;
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

      let label = routeNames[currentPath] || overrides[currentPath];

      if (!label) {
        if (!isNaN(Number(segment))) {
          label = "Editar";
        } else {
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
        }
      }

      result.push({ label, path: currentPath });
    });

    return result;
  }, [pathname, overrides]);

  // Página actual
  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Inicio";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="top-0 left-0 right-0 z-40 w-full bg-(--header-bg)"
      role="banner"
    >
      {/* ── Barra principal ── */}
      <div className="relative flex items-center h-(--shell-header-height) px-3 sm:px-4 lg:px-5 gap-1.5 sm:gap-2">
        {/* ── Izquierda: toggles + breadcrumbs ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          {/* Mobile toggle */}
          <MobileMenuButton
            show={show}
            onToggle={() => isShow((prev) => !prev)}
          />

          {/* Desktop toggle */}
          <DesktopSidebarButton isCollapsed={isCollapsed} onToggle={onToggle} />

          {/* Separador visual */}
          <div
            className="h-5 w-px bg-(--header-divider) mx-0.5 shrink-0"
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
            <span className="text-[14px] font-bold text-(--header-page-title-mobile) truncate">
              {currentPage}
            </span>
          </div>
        </div>

        {/* ── Centro: Búsqueda grande centrada (lg+ only, posición absoluta) ── */}
        <div
          className="hidden lg:flex absolute inset-x-0 justify-center pointer-events-none"
          aria-hidden="false"
        >
          <button
            aria-label="Buscar en el sistema"
            onClick={() => setIsSearchOpen(true)}
            className="pointer-events-auto flex items-center gap-2.5 h-9 w-72 xl:w-96 px-4 rounded-xl cursor-pointer
                       text-(--header-search-text) hover:text-(--header-btn-hover-text)
                       bg-(--header-search-bg) hover:bg-(--header-search-hover-bg)
                       border border-(--header-search-border) hover:border-(--header-search-hover-border)
                       transition-all duration-200 text-[13px] font-medium
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff]/40
                       group"
          >
            <Search
              size={14}
              strokeWidth={2}
              className="shrink-0 text-(--header-search-placeholder) group-hover:text-(--header-btn-hover-text) transition-colors"
            />
            <span className="flex-1 text-left text-(--header-search-placeholder) group-hover:text-(--header-btn-hover-text) transition-colors">
              Buscar...
            </span>
            <kbd
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                         bg-(--header-kbd-bg) text-(--header-kbd-text) text-[10px] font-mono border border-(--header-kbd-border)"
            >
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* ── Derecha: acciones + usuario ── */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Búsqueda — mobile/tablet (< lg) */}
          <button
            aria-label="Buscar en el sistema"
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg cursor-pointer
                       text-(--header-btn-text) hover:text-(--header-btn-hover-text) hover:bg-(--header-btn-hover-bg)
                       transition-all duration-200 shrink-0 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-[#0066ff]/40"
          >
            <Search size={16} strokeWidth={2} />
          </button>

          {/* Notificaciones */}
          {hasUserSession ? <NotificacionesDropdown /> : null}

          {/* Separador */}
          <div
            className="h-5 w-px bg-(--header-divider) mx-0.5 sm:mx-1 shrink-0"
            aria-hidden="true"
          />

          {/* Avatar + info usuario (Dropdown) */}
          {hasUserSession ? <UserDropdown /> : null}
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
