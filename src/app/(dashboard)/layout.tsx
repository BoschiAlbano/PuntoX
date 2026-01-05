"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Loading from "@/components/loading/loading";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";

// Lazy loading de componentes pesados del layout
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), {
  loading: () => <div className="w-[280px] bg-slate-800 animate-pulse rounded-lg" />,
  ssr: false, // Sidebar no necesita SSR
});

const DashboardHeader = dynamic(() => import("@/components/dashboard/DashboardHeader"), {
  loading: () => <div className="h-16 bg-white animate-pulse rounded-lg" />,
  ssr: true, // Header puede ser SSR
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSupabaseAuthContext();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [show, setshow] = useState(true);

  // Monitorear inactividad y cerrar sesión automáticamente
  useInactivityTimeout();

  useEffect(() => {
    setshow(window.innerWidth > 768);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Mostrar loading solo si realmente está cargando (no bloquear si ya tenemos sesión)
  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Redirigiendo a inicio de sesion...
      </div>
    );
  }

  // Si está autenticado, renderizar inmediatamente sin esperar más verificaciones
  // Esto evita el delay en la primera carga

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex">
      <section
        onClick={() => setshow(false)}
        className={`z-[99] transition-all duration-300 ease-in-out sm:relative fixed sm:w-auto w-screen  sm:h-auto h-screen  ${
          show ? `translate-x-[0%]` : `translate-x-[-100%]`
        }`}
      >
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </section>

      <div className="flex-1 flex flex-col h-screen overflow-y-scroll overflow-x-hidden">
        <DashboardHeader isShow={setshow} show={show} />

        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
  );
}
