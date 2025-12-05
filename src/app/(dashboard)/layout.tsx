"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import Loading from "@/components/loading/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (status === "loading") {
    return <Loading />;
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Redirigiendo a inicio de sesión...
      </div>
    );
  }

  // Si está autenticado, mostrar el contenido del dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <DashboardHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-200 py-4 px-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>© 2024 Punto X SaaS. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-blue-600 transition-colors">
                Términos
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
