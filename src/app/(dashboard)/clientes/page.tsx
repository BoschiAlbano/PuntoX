"use client";

import ClienteCRUD from "@/components/clientes/ClienteCRUD";
import { Chip, Tab, Tabs } from "@heroui/react";
import { usePagePermission } from "@/lib/permissions/usePagePermission";

export default function ClientesPage() {
  usePagePermission(); // Proteger página con permisos
  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch justify-center">
      {/* Header de la página */}
      <Header />

      <Tabs aria-label="Options" className="relative">
        <Tab
          key="clientes"
          title={
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
              </svg>

              <span>Clientes</span>
            </div>
          }
        >
          <ClienteCRUD />
        </Tab>

        <Tab
          key="cuentas-corrientes"
          title={
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path
                  fillRule="evenodd"
                  d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5V7A2.5 2.5 0 0 0 11 4.5H8.128a2.252 2.252 0 0 1 1.884-1.488A2.25 2.25 0 0 1 12.25 1h1.5a2.25 2.25 0 0 1 2.238 2.012ZM11.5 3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.25h-3v-.25Z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M2 7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Zm2 3.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>

              <span>Cuentas Corrientes</span>
            </div>
          }
        >
          <div>No Implementado</div>
        </Tab>
      </Tabs>
    </div>
  );
}

function Header() {
  return (
    <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-r from-blue-500 to-[#90c472] text-white shadow-xl mb-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="relative p-4 md:p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Chip variant="flat" className="bg-white/10 text-white">
              Clientes
            </Chip>
            <h1 className="text-3xl md:text-[32px] font-bold">
              Gestión de Clientes
            </h1>
            <p className="text-white max-w-3xl">
              Gestiona tu base de clientes y configuración de cuenta corriente
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
