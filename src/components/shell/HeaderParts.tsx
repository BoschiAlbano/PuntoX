"use client";

/**
 * Controles del header compartidos por el panel de las tiendas
 * (components/dashboard/DashboardHeader) y el del superadmin
 * (components/admin/AdminHeader), para que los dos se vean igual.
 */
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronRight,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

/** Botón de toggle animado para mobile (hamburger ↔ X) */
export function MobileMenuButton({
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
             text-(--header-btn-text) hover:text-(--header-btn-hover-text) hover:bg-(--header-btn-hover-bg)
                  transition-all duration-200 shrink-0 focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-[#0066ff]/40"
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
export function DesktopSidebarButton({
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
             text-(--header-btn-text) hover:text-(--header-btn-hover-text) hover:bg-(--header-btn-hover-bg)
                 transition-all duration-200 shrink-0 focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-[#0066ff]/40"
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
export function Breadcrumbs({
  breadcrumbs,
  homeHref = "/dashboard",
}: {
  breadcrumbs: { label: string; path: string }[];
  /** A dónde lleva el ícono de inicio. */
  homeHref?: string;
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
                  className="text-(--header-breadcrumb-sep) shrink-0 mx-0.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
              {isFirst ? (
                <Link
                  href={homeHref}
                  className="flex items-center justify-center w-6 h-6 rounded-lg
                             text-(--header-breadcrumb-home) hover:text-[#0050cb] hover:bg-(--header-btn-hover-bg)
                             transition-colors duration-200"
                  aria-label="Ir al inicio"
                >
                  <Home size={13} strokeWidth={2} />
                </Link>
              ) : isLast ? (
                <span className="text-[13px] font-semibold text-(--header-breadcrumb-current) truncate max-w-50">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="text-[12.5px] font-medium text-(--header-breadcrumb-mid) hover:text-(--header-breadcrumb-current)
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
