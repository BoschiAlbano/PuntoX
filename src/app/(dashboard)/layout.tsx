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
      <div className="flex h-screen bg-white relative overflow-hidden">
        <section
          onClick={() => setshow(false)}
          className={`z-99 transition-transform duration-400 ease-in-out sm:relative absolute sm:w-auto w-screen sm:h-auto h-screen shrink-0 ${
            show ? `translate-x-[0%]` : `-translate-x-full`
          }`}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onClose={() => setshow(false)}
          />
        </section>

        {/* Background Gradients & Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_2px,transparent_1px),linear-gradient(to_bottom,#f8fafc_2px,transparent_1px)] bg-size-[4rem_4rem] z-0 pointer-events-none" />
        {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#67afc3]/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div> */}

        {/* Main Application Area */}
        <div
          id="main-scroll-container"
          className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden min-w-0 relative z-10 transition-all duration-300 w-full ml-0"
        >
          <DashboardHeader
            isShow={setshow}
            show={show}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          <main className="flex-1 flex flex-col z-10 w-full pt-10">
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
    <footer className="backdrop-blur-sm  py-4 px-6">
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
