"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  useState,
  useEffect,
  useMemo,
  memo,
  useCallback,
  startTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { filtrarRutasPorPermisos } from "@/lib/permissions/routePermissions";
import { startManualLogout, endManualLogout } from "@/lib/auth/logoutManager";
import { SucursalSelector } from "@/components/sucursal";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems: MenuItem[] = [
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
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
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
  // {
  //   icon: (
  //     <svg
  //       className="w-5 h-5"
  //       fill="none"
  //       stroke="currentColor"
  //       viewBox="0 0 24 24"
  //     >
  //       <path
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //         strokeWidth={2}
  //         d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  //       />
  //     </svg>
  //   ),
  //   label: "Test",
  //   href: "/test",
  //   badge: "12",
  // },
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
    label: "Configuraci\u00f3n",
    href: "/configuracion",
  },
];

function SidebarComponent({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase, user, status } = useSupabaseAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Cargar permisos del usuario
  useEffect(() => {
    async function cargarPermisos() {
      if (status !== "authenticated" || !user) {
        return;
      }

      try {
        const res = await fetch("/api/permisos", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          // Si la respuesta no es OK, intentar leer el error
          const errorText = await res.text();
          console.error(
            "Error en respuesta de permisos:",
            res.status,
            errorText
          );
          return;
        }

        const data = await res.json();
        setPermisos(Array.isArray(data.permisos) ? data.permisos : []);
        setIsSuperAdmin(data.isSuperAdmin === true);
      } catch (error) {
        // Manejar diferentes tipos de errores
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.warn(
            "No se pudo conectar con el servidor. Verifica que el servidor esté corriendo."
          );
        } else {
          console.error("Error cargando permisos:", error);
        }
        // En caso de error, establecer valores por defecto para evitar bloqueos
        setPermisos([]);
        setIsSuperAdmin(false);
      }
    }

    cargarPermisos();
  }, [user, status]);

  // Filtrar menuItems según permisos (SuperAdmin ve todo)
  const menuItemsFiltrados = useMemo(() => {
    if (isSuperAdmin) {
      return menuItems;
    }
    return filtrarRutasPorPermisos(menuItems, permisos);
  }, [permisos, isSuperAdmin]);

  // Prefetch todas las rutas disponibles al montar el componente para navegación instantánea
  useEffect(() => {
    menuItemsFiltrados.forEach((item) => {
      // Prefetch todas las rutas en paralelo
      router.prefetch(item.href);
    });
  }, [menuItemsFiltrados, router]);

  const queryClient = useQueryClient();

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // Marcar que estamos haciendo logout manual para prevenir toasts de error
    startManualLogout();

    try {
      // Cancelar todas las queries activas para evitar errores 401
      queryClient.cancelQueries();

      // Limpiar todo el cache de queries
      queryClient.clear();

      // Cerrar sesión en Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      // Limpiar el estado de logout manual después de un breve delay
      // para asegurar que cualquier error pendiente no muestre toasts
      setTimeout(() => {
        endManualLogout();
        setIsLoggingOut(false);
      }, 100);

      // Redirigir al login
      router.push("/signin");
    }
  }, [isLoggingOut, supabase, router, queryClient]);

  return (
    <motion.section
      onClick={(e) => e.stopPropagation()}
      className={`z-99 sm:relative absolute flex-col h-auto sm:flex  ${
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
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <img
                  src="/XPdark.ico"
                  alt="Punto X"
                  className="w-7 h-7 object-contain"
                />
                <span className="text-white font-semibold text-lg">
                  Punto X
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isCollapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Selector de Sucursal */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 border-b border-slate-700/50"
          >
            <SucursalSelector hideIfSingle={false} />
          </motion.div>
        </AnimatePresence>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItemsFiltrados.map((item) => {
            const isActive = pathname === item.href;
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              // Solo navegar si no estamos ya en esa ruta
              if (pathname !== item.href) {
                // Usar startTransition para hacer la navegación más suave y no bloquear el UI
                startTransition(() => {
                  router.push(item.href);
                });
              }
            };
            return (
              <motion.button
                key={item.href}
                type="button"
                onClick={handleClick}
                onMouseEnter={() => {
                  // Prefetch agresivo de la ruta al hacer hover para navegación instantánea
                  // Esto se ejecuta antes del click, haciendo la navegación más rápida
                  if (pathname !== item.href) {
                    router.prefetch(item.href);
                  }
                }}
                onFocus={() => {
                  // También prefetch cuando el elemento recibe foco (accesibilidad)
                  if (pathname !== item.href) {
                    router.prefetch(item.href);
                  }
                }}
                whileHover={{
                  x: isCollapsed ? 0 : 2,
                  scale: isCollapsed ? 1 : 1.01,
                }}
                whileTap={{ scale: 0.98 }}
                className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden
                    relative group
                    ${
                      isActive
                        ? "bg-slate-800/80 text-white  shadow-none"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/30"
                    }
                  `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute top-1 left-1 w-[5px] h-[5px] rounded-full bg-[#5fa7b8] animate-pulse"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <div
                  className={`relative ${
                    isActive
                      ? "text-[#5fa7b8] animate-pulse"
                      : " text-white animate-none"
                  }`}
                >
                  {item.icon}
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
                      <span className="font-semibold whitespace-nowrap text-[15px] text-slate-100">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-blue-500/15 text-blue-100 text-xs rounded-full border border-blue-300/40">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* Botón Cerrar Sesión */}
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
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                 relative group
                text-white hover:text-red-200 hover:bg-slate-700/30
              `}
          >
            <div className="relative">
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
                <p className="text-xs text-slate-400 mb-2">Version 1.0.0</p>
                <p className="text-xs text-slate-500">(c) 2024 Punto X SaaS</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
