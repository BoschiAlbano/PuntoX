"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import ProtectRoute from "@/components/auth/ProtectRoute";
import { LoadingPage } from "@/components/loading/loading";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initialize, isInitialized, isLoading, branches, roles } =
    useUserStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    initialize();

    const syncSidebarVisibility = () => {
      setShow(window.innerWidth > 768);
    };

    syncSidebarVisibility();
    window.addEventListener("resize", syncSidebarVisibility);

    return () => {
      window.removeEventListener("resize", syncSidebarVisibility);
    };
  }, [initialize]);

  if (isLoading && !isInitialized) {
    return <LoadingPage message="Verificando autenticación..." />;
  }

  if (!branches.length && roles.some((role) => role.Tipo !== "SUPERADMIN")) {
    return redirect("/not-branches");
  }

  return (
    <ProtectRoute>
      <div className=" bg-(--fondo) relative flex h-dvh w-full overflow-hidden print:h-auto print:overflow-visible">
        <section
          onClick={() => setShow(false)}
          className={`print:hidden z-50 transition-transform duration-400 ease-in-out sm:relative absolute sm:w-auto w-screen sm:h-auto h-dvh shrink-0 ${
            show ? `translate-x-[0%]` : `-translate-x-full`
          }`}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onClose={() => setShow(false)}
          />
        </section>

        <div
          className={`fixed inset-0 z-40  backdrop-blur-[1px] transition-opacity duration-300 sm:hidden print:hidden ${
            show ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setShow(false)}
          aria-hidden="true"
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative z-20 print:hidden">
            <DashboardHeader
              isShow={setShow}
              show={show}
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>

          <div className="relative flex min-h-0 flex-1 print:p-0 overflow-y-auto overflow-x-hidden">
            <div className=" relative flex min-h-0 flex-1 flex-col">
              <div className="relative z-10 flex min-h-0 flex-1 flex-col print:overflow-visible print:h-auto">
                <main className=" bg-white overflow-hidden rounded-tl-4xl  relative z-10 flex w-full min-h-0 flex-1 print:m-0 print:bg-white print:p-0">
                  <div className="shell-content-frame min-h-full w-full overflow-y-auto ">
                    <ProgressProvider
                      height="3px"
                      color="#67AFC3"
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
    </ProtectRoute>
  );
}
