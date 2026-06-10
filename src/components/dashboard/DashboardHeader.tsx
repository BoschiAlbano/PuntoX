"use client";

import { motion, AnimatePresence, useScroll } from "framer-motion";
import {
  Dispatch,
  SetStateAction,
  memo,
  useMemo,
  useState,
  useEffect,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronRight,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Shield,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { Tooltip } from "@heroui/react";
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
                  className="text-(--nav-breadcrumb-sep) shrink-0 mx-0.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
              {isFirst ? (
                <Link
                  href="/dashboard"
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
function DashboardHeaderComponent({
  isShow,
  show,
  isCollapsed,
  onToggle,
}: DashboardHeaderProps) {
  const { scrollY } = useScroll();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized, isSuperAdmin } = useUserStore();
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

  // Datos de usuario
  const email = typeof user?.Email === "string" ? user.Email : "";
  const usuario = typeof user?.Usuario === "string" ? user.Usuario : "";

  // Página actual
  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Inicio";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="top-0 left-0 right-0 z-40 w-full bg-(--fondo)"
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
            className="h-5 w-px bg-(--nav-divider) mx-0.5 shrink-0"
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
            <span className="text-[14px] font-bold text-(--nav-page-title-mobile) truncate">
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
                       text-(--nav-search-text) hover:text-(--nav-btn-hover-text)
                       bg-(--nav-search-bg) hover:bg-(--nav-search-hover-bg)
                       border border-(--nav-search-border) hover:border-(--nav-search-hover-border)
                       transition-all duration-200 text-[13px] font-medium
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3]/40
                       group"
          >
            <Search
              size={14}
              strokeWidth={2}
              className="shrink-0 text-(--nav-search-placeholder) group-hover:text-(--nav-btn-hover-text) transition-colors"
            />
            <span className="flex-1 text-left text-(--nav-search-placeholder) group-hover:text-(--nav-btn-hover-text) transition-colors">
              Buscar...
            </span>
            <kbd
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                         bg-(--nav-kbd-bg) text-(--nav-kbd-text) text-[10px] font-mono border border-(--nav-kbd-border)"
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
                       text-(--nav-btn-text) hover:text-(--nav-btn-hover-text) hover:bg-(--nav-btn-hover-bg)
                       transition-all duration-200 shrink-0 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
          >
            <Search size={16} strokeWidth={2} />
          </button>

          {/* Switch to Admin (SuperAdmin only) */}
          {/* {hasUserSession && isSuperAdmin && (
            <Tooltip content="Panel Superadmin" placement="bottom">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="flex items-center justify-center h-8 w-8 rounded-lg cursor-pointer
                           text-amber-500 hover:text-amber-600 hover:bg-amber-500/10
                           transition-all duration-200 shrink-0 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-amber-500/40"
              >
                <Shield size={18} strokeWidth={2} />
              </button>
            </Tooltip>
          )} */}

          {/* Notificaciones */}
          {hasUserSession ? <NotificacionesDropdown /> : null}

          {/* Separador */}
          <div
            className="h-5 w-px bg-(--nav-divider) mx-0.5 sm:mx-1 shrink-0"
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
