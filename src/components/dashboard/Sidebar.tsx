"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  useState,
  useEffect,
  useMemo,
  memo,
  startTransition,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { SucursalSelector } from "@/components/sucursal";
import { useUserStore } from "@/store/useUserStore";
import { PuntoXLogo } from "@/components/ui/PuntoXLogo";

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

interface SidebarProps {
  isCollapsed: boolean;
  onClose?: () => void;
}

const menuSections: MenuSection[] = [
  {
    title: "Principal",
    items: [
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
        ),
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
        ),
        label: "Ventas",
        href: "/ventas",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
        label: "Caja",
        href: "/caja",
      },
    ],
  },
  {
    title: "Inventario",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        ),
        label: "Productos",
        href: "/productos",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
        label: "Compras",
        href: "/compras",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ),
        label: "Clientes",
        href: "/clientes",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ),
        label: "Empleados",
        href: "/empleados",
      },
    ],
  },
  {
    title: "Reportes",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
        label: "Analíticas",
        href: "/analiticas",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        ),
        label: "Sucursales",
        href: "/sucursales",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
        label: "Configuración",
        href: "/configuracion",
      },
    ],
  },
];

function SidebarComponent({ isCollapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase } = useSupabaseAuthContext();

  // Use global store
  const { canAccessRoute } = useUserStore();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Solo una sección abierta a la vez (acordeón). Por defecto "Principal".
  const [openSection, setOpenSection] = useState<string | null>("Principal");

  const toggleSection = useCallback((title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  }, []);

  // Auto-expandir la sección que contiene la ruta activa al navegar
  useEffect(() => {
    const activeSection = menuSectionsFiltradas.find((section) =>
      section.items.some((item) => pathname === item.href),
    );
    if (activeSection && openSection !== activeSection.title) {
      setOpenSection(activeSection.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Filtrar menuSections según permisos (SuperAdmin ve todo gracias a canAccessRoute)
  const menuSectionsFiltradas = useMemo(() => {
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => canAccessRoute(item.href)),
      }))
      .filter((section) => section.items.length > 0);
  }, [canAccessRoute]);

  // Prefetch todas las rutas disponibles al montar el componente para navegación instantánea
  useEffect(() => {
    menuSectionsFiltradas.forEach((section) => {
      section.items.forEach((item) => {
        router.prefetch(item.href);
      });
    });
  }, [menuSectionsFiltradas, router]);

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.section
      onClick={(e) => e.stopPropagation()}
      className={`z-99 sm:relative sticky flex-col h-auto sm:flex  ${
        isCollapsed ? "sm:w-[80px] w-0" : "w-[280px]"
      }`}
      initial={false}
      animate={{
        width: isCollapsed ? "80px" : "280px",
      }}
      transition={{
        duration: 0.4,
        ease: "easeInOut",
      }}
    >
      <motion.aside
        className="fixed bg-[#182337] border-r border-slate-700/50 flex flex-col h-screen"
        initial={false}
        animate={{
          width: isCollapsed ? "80px" : "280px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        {/* Header del Sidebar */}
        <div className="w-full flex items-center justify-center p-6 border-b border-slate-700/50 ">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="logo-expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-row items-center gap-2 h-[40px] w-full  "
              >
                <PuntoXLogo className="w-12 h-12  border border-[#67afc3]/50 rounded-lg p-1 hover:rotate-345 transition-all duration-300 cursor-pointer shadow-sm shadow-[#67afc3]/50" />
                <div className="flex flex-col items-start truncate">
                  <span className="text-xl font-bold text-white">Punto X</span>
                  <span className="text-sm font-bold text-slate-400">
                    Software de gestión
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-[40px]"
              >
                <PuntoXLogo className="w-12 h-12  border border-[#67afc3]/50 rounded-lg p-1 hover:rotate-345 transition-all duration-300 cursor-pointer shadow-sm shadow-[#67afc3]/50" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selector de Sucursal */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-6 space-y-2 group cursor-pointer group-hover:text-[#5fa7b8]"
          >
            <SucursalSelector hideIfSingle={false} isCollapsed={isCollapsed} />
          </motion.div>
        </AnimatePresence>

        {/* Menu Items por Secciones */}
        <nav
          id="Scroll"
          className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide"
        >
          {menuSectionsFiltradas.map((section, sectionIndex) => {
            const isSectionCollapsed = isCollapsed
              ? false
              : openSection !== section.title;
            return (
              <div
                key={section.title}
                className={sectionIndex > 0 ? "pt-3" : ""}
              >
                {/* Título de la sección (clickeable para colapsar/expandir) */}
                <AnimatePresence mode="wait">
                  {!isCollapsed ? (
                    <motion.button
                      key={`section-label-${section.title}`}
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex items-center justify-between px-4 pb-2 pt-1 cursor-pointer group/section"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 group-hover/section:text-slate-400 transition-colors">
                        {section.title}
                      </span>
                      <motion.svg
                        animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-3.5 h-3.5 text-slate-500 group-hover/section:text-slate-400 transition-colors"
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
                        className="mx-4 mb-2 border-t border-slate-700/40"
                      />
                    )
                  )}
                </AnimatePresence>

                {/* Items de la sección (animados al colapsar/expandir) */}
                <AnimatePresence initial={false}>
                  {!isSectionCollapsed && (
                    <motion.div
                      key={`section-items-${section.title}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href;

                          // Manejador extra para responsive
                          const handleNavigationTrigger = () => {
                            if (window.innerWidth < 768 && onClose) {
                              onClose();
                            }
                          };

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={handleNavigationTrigger}
                              className="block"
                            >
                              <motion.div
                                whileHover={{
                                  x: isCollapsed ? 0 : 2,
                                  scale: isCollapsed ? 1 : 1.01,
                                }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                    w-full h-[50px] flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden
                                    relative group cursor-pointer
                                    ${
                                      isActive
                                        ? "bg-slate-800/80 text-white shadow-none"
                                        : "text-slate-300 hover:text-white hover:bg-slate-700/30"
                                    }
                                  `}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute top-1 left-1 w-[5px] h-[5px] rounded-full bg-[#5fa7b8] animate-pulse"
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 30,
                                    }}
                                  />
                                )}

                                <div
                                  className={`relative ${
                                    isActive
                                      ? "text-[#5fa7b8] animate-pulse"
                                      : "text-slate-500 dark:text-white animate-none"
                                  }`}
                                >
                                  <div className=" group-hover:text-[#5fa7b8]">
                                    {item.icon}
                                  </div>
                                  {item.badge && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-linear-to-b from-blue-500 to-[#90c472] text-white text-xs rounded-full flex items-center justify-center">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>

                                <AnimatePresence mode="wait">
                                  {!isCollapsed && (
                                    <motion.div
                                      initial={{ opacity: 0, width: 0 }}
                                      animate={{ opacity: 1, width: "auto" }}
                                      exit={{ opacity: 0, width: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="flex items-center justify-between flex-1 overflow-hidden"
                                    >
                                      <span
                                        className={`font-semibold whitespace-nowrap text-[15px] ${isActive ? "text-slate-100" : "text-slate-100"}`}
                                      >
                                        {item.label}
                                      </span>
                                      {item.badge && (
                                        <span className="px-2 py-0.5 bg-blue-500/15 text-blue-600 text-xs rounded-full border border-blue-200">
                                          {item.badge}
                                        </span>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            </Link>
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

        {/* Botón Cerrar Sesión (fijo abajo) */}
        <div className="px-3 pb-2">
          <motion.button
            onClick={() => handleLogout()}
            disabled={isLoggingOut}
            whileHover={{
              x: isCollapsed ? 0 : 2,
              scale: isCollapsed ? 1 : 1.01,
            }}
            whileTap={{ scale: 0.98 }}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
                 relative group
                text-slate-300 hover:text-white hover:bg-slate-700/30
              `}
          >
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-slate-500 group-hover:text-[#5fa7b8]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            </div>

            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between flex-1 overflow-hidden"
                >
                  <span className="font-medium whitespace-nowrap text-[15px]">
                    Cerrar Sesión
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Footer del Sidebar */}
        <div className="w-full p-4 border-t border-slate-700/50 flex flex-col gap-3 items-center">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full p-4 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                  Version 1.0.0
                </p>
                <p className="text-xs text-slate-500 truncate">
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
                <div className="w-2  rounded-full bg-green-500 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </motion.section>

    // </section>
  );
}

// Memoizar componente para evitar re-renders innecesarios
const Sidebar = memo(SidebarComponent);
export default Sidebar;
