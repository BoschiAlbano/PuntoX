"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { useUserStore } from "@/store/useUserStore";
import ProtectRoute from "@/components/auth/ProtectRoute";
import Loading from "@/components/loading/loading";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initialize, isInitialized, isLoading, branches, roles } =
    useUserStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [show, setshow] = useState(true);

  // Monitorear inactividad y cerrar sesión automáticamente
  useInactivityTimeout();

  useEffect(() => {
    initialize();
    setshow(window.innerWidth > 768);
  }, []);

  if (isLoading && !isInitialized) {
    return <Loading message="Verificando autenticación..." />;
  }

  if (!branches.length && roles.some((role) => role.Tipo !== "SUPERADMIN")) {
    return redirect("/not-branches");
  }

  return (
    <ProtectRoute>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex">
        <section
          onClick={() => setshow(false)}
          className={`z-99 transition-all duration-400 ease-in-out sm:relative fixed sm:w-auto w-screen  sm:h-auto h-screen  ${
            show ? `translate-x-[0%]` : `-translate-x-full`
          }`}
        >
          {/* Sidebar */}
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </section>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <DashboardHeader isShow={setshow} show={show} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-6 h-full"
            >
              {children}
            </motion.div>
          </main>

          <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-200 py-4 px-6">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <p>ЖИ 2024 Punto X SaaS. Todos los derechos reservados.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Terminos
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Privacidad
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Soporte
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ProtectRoute>
  );
}
