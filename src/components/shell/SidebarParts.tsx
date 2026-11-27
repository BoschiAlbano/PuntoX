"use client";

/**
 * Piezas visuales del sidebar, compartidas por el panel de las tiendas
 * (components/dashboard/Sidebar) y el del superadmin
 * (components/admin/AdminSidebar), para que los dos se vean igual.
 * Cada sidebar decide QUÉ mostrar (secciones, permisos, badges); acá solo
 * está CÓMO se dibuja.
 */
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Tooltip } from "@heroui/react";

export interface SidebarMenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

export interface SidebarMenuSection {
  title: string;
  items: SidebarMenuItem[];
}

/** Logo + nombre + subtítulo ("Software de gestión", "Super Admin"). */
export function SidebarBrand({
  subtitle,
  isCollapsed,
}: {
  subtitle: string;
  isCollapsed: boolean;
}) {
  return (
    <div className="w-full flex items-center justify-center px-4 py-4 h-15.5">
      <div
        className={`flex h-auto w-full flex-row items-center gap-2 ${isCollapsed ? "justify-start pl-2" : "justify-start"} animate-fade-in duration-300`}
      >
        <Image
          src="/brand/puntox-isotipo.png"
          width={40}
          height={40}
          className="w-9 h-9 shrink-0 object-contain"
          alt="Punto X"
        />
        <div className="flex flex-col items-start truncate">
          <span className="text-lg font-bold tracking-tight text-(--nav-logo-title)">
            Punto X
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-(--nav-logo-subtitle)">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Secciones en acordeón con sus ítems. */
export function SidebarNav({
  sections,
  isCollapsed,
  openSection,
  onToggleSection,
  isActive,
  disabled = false,
  onNavigate,
}: {
  sections: SidebarMenuSection[];
  isCollapsed: boolean;
  openSection: string | null;
  onToggleSection: (title: string) => void;
  /** Si el ítem corresponde a la ruta actual. */
  isActive: (href: string) => boolean;
  /** Deshabilita la navegación (ej. onboarding sin completar). */
  disabled?: boolean;
  /** Al elegir un ítem (en mobile, cierra el sidebar). */
  onNavigate?: () => void;
}) {
  return (
    <nav
      id="Scroll"
      className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 scrollbar-hide"
    >
      {sections.map((section, sectionIndex) => {
        const isSectionCollapsed = isCollapsed
          ? false
          : openSection !== section.title;

        return (
          <div key={section.title} className={sectionIndex > 0 ? "pt-3" : ""}>
            {/* Título de la sección (clickeable para colapsar/expandir) */}
            <AnimatePresence>
              {!isCollapsed ? (
                <motion.button
                  key={`section-label-${section.title}`}
                  type="button"
                  onClick={() => onToggleSection(section.title)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="group/section flex w-full cursor-pointer items-center justify-between px-3 pb-2 pt-1"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--nav-section-label) transition-colors group-hover/section:text-(--nav-item-hover-text)">
                    {section.title}
                  </span>
                  <motion.svg
                    animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-3.5 w-3.5 text-(--nav-section-chevron) transition-colors group-hover/section:text-(--nav-item-hover-text)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </motion.button>
              ) : (
                sectionIndex > 0 && (
                  <motion.div
                    key={`section-divider-${section.title}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mx-3 mb-2 border-t border-(--nav-divider)"
                  />
                )
              )}
            </AnimatePresence>

            {/* Items de la sección — CSS grid 0fr→1fr evita el flash de height:"auto" */}
            <motion.div
              animate={{ gridTemplateRows: isSectionCollapsed ? "0fr" : "1fr" }}
              initial={false}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="grid overflow-hidden -mx-2 px-2"
            >
              <div className="min-h-0 overflow-hidden -mx-2 px-2">
                <div className="space-y-1 pt-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={disabled ? "#" : item.href}
                        onClick={(e) => {
                          if (disabled) {
                            e.preventDefault();
                            return;
                          }
                          onNavigate?.();
                        }}
                        className={`block ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <Tooltip
                          content={item.label}
                          placement="right"
                          isDisabled={!isCollapsed}
                          offset={20}
                          classNames={{
                            content:
                              "bg-(--nav-tooltip-bg) text-(--nav-tooltip-text) font-semibold text-xs border border-(--nav-tooltip-border) shadow-lg",
                          }}
                        >
                          <motion.div
                            whileHover={{
                              x: isCollapsed ? 0 : 2,
                              scale: isCollapsed ? 1 : 1.01,
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                              relative group flex h-11 w-full cursor-pointer items-center overflow-hidden rounded-lg
                              ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                              ${
                                active
                                  ? " text-(--nav-item-active-text) "
                                  : "text-(--nav-item-text) hover:bg-(--nav-item-hover-bg) hover:text-(--nav-item-hover-text)"
                              }
                            `}
                          >
                            {active && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-1.5 h-5 w-0.75 rounded-full bg-(--nav-item-active-indicator)"
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                }}
                              />
                            )}

                            <div
                              className={`relative ${
                                active
                                  ? "text-(--nav-item-active-icon)"
                                  : "text-(--nav-item-icon)"
                              }`}
                            >
                              <div className="transition-colors group-hover:text-[#66a3ff]">
                                {item.icon}
                              </div>
                              {item.badge && (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-linear-to-b from-[#0066ff] to-[#0050cb] px-1 text-[10px] text-white">
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            <AnimatePresence>
                              {!isCollapsed && (
                                <motion.div
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -6 }}
                                  transition={{ duration: 0.18 }}
                                  className="flex-1 overflow-hidden whitespace-nowrap"
                                >
                                  <span className="relative z-10 text-[13px] font-semibold tracking-tight">
                                    {item.label}
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </Tooltip>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </nav>
  );
}

/** Pie con la versión. */
export function SidebarFooter({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex w-full flex-col items-center gap-2 border-t border-(--nav-footer-border) p-3">
      <AnimatePresence>
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full rounded-lg border border-(--nav-footer-card-border) bg-(--nav-footer-card-bg) p-3"
          >
            <p className="mb-1 truncate text-[11px] font-semibold uppercase tracking-wide text-(--nav-footer-text)">
              Version 1.0.0
            </p>
            <p className="truncate text-xs text-(--nav-footer-text)">
              (c) 2024 Punto X SaaS
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center"
          >
            <p className="text-xs text-(--nav-footer-text) truncate">V 1.0.0</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Contenedor animado del sidebar (ancho 280px / 80px colapsado). */
export function SidebarFrame({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      onClick={(e) => e.stopPropagation()}
      className={`z-40 sm:relative sticky flex-col h-auto sm:flex  ${
        isCollapsed ? "sm:w-20 w-0" : "w-70"
      }`}
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "280px" }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <motion.aside
        className="fixed flex h-screen flex-col bg-(--nav-bg)"
        initial={false}
        animate={{ width: isCollapsed ? "80px" : "280px" }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        {children}
      </motion.aside>
    </motion.section>
  );
}
