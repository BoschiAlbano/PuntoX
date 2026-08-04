"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Tooltip } from "@heroui/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Shield,
  ChevronDown,
  ImageIcon,
} from "lucide-react";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onClose?: () => void;
}

const menuSections: MenuSection[] = [
  {
    title: "Principal",
    items: [
      {
        icon: <LayoutDashboard className="w-5 h-5" />,
        label: "Dashboard",
        href: "/admin/dashboard",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        icon: <Building2 className="w-5 h-5" />,
        label: "Tiendas",
        href: "/admin/tenants",
      },
      {
        icon: <CreditCard className="w-5 h-5" />,
        label: "Planes SaaS",
        href: "/admin/planes",
      },
      {
        icon: <ImageIcon className="w-5 h-5" />,
        label: "Imágenes (Caché)",
        href: "/admin/imagenes-cache",
      },
    ],
  },
  {
    title: "Plataforma",
    items: [
      {
        icon: <Shield className="w-5 h-5" />,
        label: "Auditoría",
        href: "/admin/auditoria",
      },
    ],
  },
];

function AdminSidebarComponent({ isCollapsed, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [openSection, setOpenSection] = useState<string | null>("Principal");

  const toggleSection = useCallback((title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  }, []);

  // Auto-expand section that contains the active route
  useEffect(() => {
    const activeSection = menuSections.find((section) =>
      section.items.some((item) => pathname.startsWith(item.href)),
    );
    if (activeSection && openSection !== activeSection.title) {
      setOpenSection(activeSection.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prefetch all routes
  useEffect(() => {
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        router.prefetch(item.href);
      });
    });
  }, [router]);

  return (
    <motion.section
      onClick={(e) => e.stopPropagation()}
      className={`z-40 sm:relative sticky flex-col h-auto sm:flex ${
        isCollapsed ? "sm:w-20 w-0" : "w-70"
      }`}
      initial={false}
      animate={{
        width: isCollapsed ? "80px" : "280px",
      }}
      transition={{
        duration: 0.35,
        ease: "easeInOut",
      }}
    >
      <motion.aside
        className="fixed flex h-screen flex-col bg-(--nav-bg)"
        initial={false}
        animate={{
          width: isCollapsed ? "80px" : "280px",
        }}
        transition={{
          duration: 0.35,
          ease: "easeInOut",
        }}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-center px-4 py-4 h-15.5">
          <div className="flex h-7.5 w-full flex-row items-center gap-2">
            <img
              src="/logo.svg"
              className="w-11 rounded-lg border border-[#67afc3]/40 p-1.5 shadow-sm shadow-[#67afc3]/30 transition-all duration-300 hover:rotate-345"
              alt="logo.svg"
            />

            <div
              className={`flex flex-col items-start truncate ${isCollapsed ? "opacity-0" : "opacity-100"}`}
            >
              <span className="text-lg font-bold tracking-tight text-(--nav-logo-title)">
                Punto X
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                Super Admin
              </span>
            </div>
          </div>
        </div>

        {/* Admin Badge */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">
                  Panel de Administración
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Items */}
        <nav
          id="Scroll"
          className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 scrollbar-hide"
        >
          {menuSections.map((section, sectionIndex) => {
            const isSectionCollapsed = isCollapsed
              ? false
              : openSection !== section.title;
            return (
              <div
                key={section.title}
                className={sectionIndex > 0 ? "pt-3" : ""}
              >
                {/* Section title */}
                <AnimatePresence>
                  {!isCollapsed ? (
                    <motion.button
                      key={`section-label-${section.title}`}
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="group/section flex w-full cursor-pointer items-center justify-between px-3 pb-2 pt-1"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--nav-section-label) transition-colors group-hover/section:text-(--nav-item-hover-text)">
                        {section.title}
                      </span>
                      <motion.div
                        animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-(--nav-section-chevron) transition-colors group-hover/section:text-(--nav-item-hover-text)" />
                      </motion.div>
                    </motion.button>
                  ) : (
                    sectionIndex > 0 && (
                      <motion.div
                        key={`section-divider-${section.title}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mx-auto my-2 h-px w-8 bg-(--nav-divider)"
                      />
                    )
                  )}
                </AnimatePresence>

                {/* Section items */}
                <AnimatePresence initial={false}>
                  {(!isSectionCollapsed || isCollapsed) && (
                    <motion.div
                      key={`items-${section.title}`}
                      initial={
                        isCollapsed ? false : { height: 0, opacity: 0 }
                      }
                      animate={{ height: "auto", opacity: 1 }}
                      exit={isCollapsed ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                          const handleNavigationTrigger = () => {
                            if (window.innerWidth < 768 && onClose) {
                              onClose();
                            }
                          };

                          const linkContent = (
                            <Link
                              href={item.href}
                              onClick={handleNavigationTrigger}
                              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                                isActive
                                  ? "bg-(--nav-item-active-bg) text-(--nav-item-active-text)"
                                  : "text-(--nav-item-text) hover:bg-(--nav-item-hover-bg) hover:text-(--nav-item-hover-text)"
                              } ${isCollapsed ? "justify-center" : ""}`}
                            >
                              {/* Active indicator */}
                              {isActive && (
                                <motion.div
                                  layoutId="admin-sidebar-active"
                                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-(--nav-item-active-indicator)"
                                  transition={{
                                    type: "spring",
                                    stiffness: 350,
                                    damping: 30,
                                  }}
                                />
                              )}

                              <span
                                className={`shrink-0 ${
                                  isActive
                                    ? "text-(--nav-item-active-icon)"
                                    : "text-(--nav-item-icon) group-hover:text-(--nav-item-hover-text)"
                                }`}
                              >
                                {item.icon}
                              </span>

                              {!isCollapsed && (
                                <span className="truncate">{item.label}</span>
                              )}

                              {!isCollapsed && item.badge && (
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );

                          if (isCollapsed) {
                            return (
                              <Tooltip
                                key={item.href}
                                content={item.label}
                                placement="right"
                                delay={200}
                                classNames={{
                                  base: "py-1 px-2",
                                  content:
                                    "bg-(--nav-tooltip-bg) text-(--nav-tooltip-text) border border-(--nav-tooltip-border) text-xs font-medium",
                                }}
                              >
                                {linkContent}
                              </Tooltip>
                            );
                          }

                          return (
                            <div key={item.href}>{linkContent}</div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-(--nav-footer-border) px-4 py-3">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-lg bg-(--nav-footer-card-bg) border border-(--nav-footer-card-border) px-3 py-2"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-(--nav-footer-text)">
                  Sistema operativo
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </motion.section>
  );
}

const AdminSidebar = memo(AdminSidebarComponent);
export default AdminSidebar;
