"use client";
import { motion } from "framer-motion";
// import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { Dispatch, SetStateAction, memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";

function DashboardHeaderComponent({
  isShow,
  isCollapsed,
  onToggle,
}: {
  isShow: Dispatch<SetStateAction<boolean>>;
  show: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  // const { user } = useSupabaseAuthContext();
  const pathname = usePathname();

  const { user, roles } = useUserStore();

  // Mapeo de rutas a nombres amigables
  const routeNames: Record<string, string> = {
    "/ventas": "Ventas",
    "/caja": "Caja",
    "/productos": "Productos",
    "/test": "Test",
    "/clientes": "Clientes",
    "/empleados": "Empleados",
    "/analiticas": "Analíticas",
    "/sucursales": "Sucursales",
    "/configuracion": "Configuración",
  };

  // Generar breadcrumbs desde la ruta (memoizado para evitar recalcular en cada render)
  const breadcrumbs = useMemo(() => {
    const paths = pathname.split("/").filter(Boolean);
    const result = [{ label: "Inicio", path: "/" }];

    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const label =
        routeNames[currentPath] || path.charAt(0).toUpperCase() + path.slice(1);
      result.push({ label, path: currentPath });
    });

    return result;
  }, [pathname]);

  const fullName = typeof user?.Email === "string" ? user.Email : "";
  const initialsFromName = fullName
    ? fullName
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "";
  const userInitials =
    initialsFromName || user?.Email?.[0]?.toUpperCase() || "U";

  const displayName =
    fullName.trim() ||
    (typeof user?.Usuario === "string" ? user.Usuario : "") ||
    "Usuario";
  const displayEmail = typeof user?.Usuario === "string" ? user.Usuario : "";

  const displayRol = roles.map((rol) => rol.Descripcion).join(" - ");

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 backdrop-blur-sm"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Breadcrumbs */}
          <nav
            className="flex items-center gap-2 text-sm"
            aria-label="Breadcrumb"
          >
            <ol className="flex items-center gap-2">
              <button
                onClick={onToggle}
                className="sm:block hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 group/btn"
              >
                <svg
                  className="w-5 h-5 group-hover/btn:text-[#5fa7b8] transition-colors"
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

              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  {index === 0 ? (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-1.5"
                    >
                      <Home className="h-4 w-4 text-slate-500" />
                      <Link
                        href="/dashboard"
                        className="text-slate-600 font-medium"
                      >
                        Inicio
                      </Link>
                    </motion.div>
                  ) : index === breadcrumbs.length - 1 ? (
                    <span className="text-slate-900 font-semibold">
                      {crumb.label}
                    </span>
                  ) : (
                    <span className="text-slate-600 hover:text-slate-900 transition-colors">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Right Section */}
          <div className="flex items-center sm:gap-4 gap-0 sm:ml-6 ml-0">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-3 rounded-xl hover:bg-slate-100 transition-colors sm:block hidden"
            >
              <svg
                className="w-6 h-6 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#76b7c8] rounded-full border-2 border-white animate-pulse" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="items-center gap-3 p-2 pr-4 rounded-xl hover:bg-slate-100 transition-colors flex"
            >
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-[#90c472] flex items-center justify-center text-white font-semibold">
                {userInitials}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500">
                  {displayEmail} - {displayRol}
                </p>
              </div>

              <svg
                onClick={() => isShow((prev) => !prev)}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 cursor-pointer text-gray-500 sm:hidden flex "
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

// Memoizar componente para evitar re-renders innecesarios
const DashboardHeader = memo(DashboardHeaderComponent);
export default DashboardHeader;
