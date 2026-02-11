"use client";

import { useEffect, useState } from "react";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { useUserStore } from "@/store/useUserStore";
import ProtectRoute from "@/components/auth/ProtectRoute";
import { LoadingPage } from "@/components/loading/loading";
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
    return <LoadingPage message="Verificando autenticación..." />;
  }

  if (!branches.length && roles.some((role) => role.Tipo !== "SUPERADMIN")) {
    return redirect("/not-branches");
  }

  return (
    <ProtectRoute>
      <div className="bg-[#ffffff] flex">
        <section
          onClick={() => setshow(false)}
          className={`z-99 transition-all duration-400 ease-in-out sm:relative absolute  sm:w-auto w-screen sm:h-auto h-screen  ${
            show ? `translate-x-[0%]` : `-translate-x-full`
          }`}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </section>

        <div className="flex-1 main-content overflow-y-auto">
          <DashboardHeader isShow={setshow} show={show} />
          <main className="sm:overflow-x-clip overflow-x-hidden">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </ProtectRoute>
  );
}

function Footer() {
  return (
    <footer className="bg-white/50 backdrop-blur-sm  py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between sm:gap-0 gap-2 text-sm text-[#76b7c8]">
        <p className="text-center">
          ЖИ 2026 Punto X. Todos los derechos reservados.
        </p>
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
  );
}
