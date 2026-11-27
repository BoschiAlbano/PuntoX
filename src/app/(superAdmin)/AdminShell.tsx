"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { useUserStore } from "@/store/useUserStore";

/**
 * Client-side shell for the SuperAdmin area.
 * Mismo aspecto que el layout de las tiendas (app/(dashboard)/layout.tsx):
 * header y contenido blancos, acento #0066FF.
 */
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [show, setShow] = useState(true);

  // Datos del usuario (nombre, roles) para el menú de usuario. Antes solo los
  // cargaba el layout de las tiendas y acá se veía "Usuario / Operador" sin la
  // opción "Dashboard Tienda".
  const initialize = useUserStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const syncSidebarVisibility = () => {
      setShow(window.innerWidth > 768);
    };

    syncSidebarVisibility();
    window.addEventListener("resize", syncSidebarVisibility);

    return () => {
      window.removeEventListener("resize", syncSidebarVisibility);
    };
  }, []);

  return (
    <div className="bg-white relative flex h-dvh w-full overflow-hidden">
      <section
        onClick={() => setShow(false)}
        className={`z-50 transition-transform duration-400 ease-in-out sm:relative absolute sm:w-auto w-screen sm:h-auto h-dvh shrink-0 ${
          show ? `translate-x-[0%]` : `-translate-x-full`
        }`}
      >
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          onClose={() => setShow(false)}
        />
      </section>

      <div
        className={`fixed inset-0 z-40 backdrop-blur-[1px] transition-opacity duration-300 sm:hidden ${
          show ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setShow(false)}
        aria-hidden="true"
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="relative z-20">
          <AdminHeader
            isShow={setShow}
            show={show}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <main className="bg-white rounded-tl-4xl relative z-10 flex w-full min-h-0 flex-1 min-w-0 overflow-hidden pb-2.5">
                <div className="shell-content-frame">
                  <ProgressProvider
                    height="3px"
                    color="#0066FF"
                    options={{ showSpinner: false }}
                    shallowRouting
                  >
                    {children}
                  </ProgressProvider>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
