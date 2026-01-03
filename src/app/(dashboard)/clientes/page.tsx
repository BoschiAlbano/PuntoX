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

      <Tabs 
        aria-label="Options" 
        className="relative"
        classNames={{
          tabList: "bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
          tab: "data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-[#67afc3] data-[selected=true]:to-[#529aa6] data-[selected=true]:text-white data-[selected=true]:shadow-lg transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2",
          tabContent: "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
          cursor: "bg-gradient-to-r from-[#67afc3] to-[#529aa6] shadow-lg",
        }}
      >
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
    <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200/50 bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] mb-10 transition-all duration-300 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)]">
      {/* Blurred circles decorativos para profundidad con parallax ligero (optimizado) */}
      <div className="absolute inset-0 overflow-hidden" style={{ willChange: 'transform' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl parallax-bg" style={{ willChange: 'transform' }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/8 rounded-full blur-2xl parallax-bg" style={{ animationDelay: '2s', willChange: 'transform' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl parallax-bg" style={{ animationDelay: '4s', willChange: 'transform' }} />
      </div>
      
      {/* Glass panel semitransparente con blur más suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm" />
      
      {/* Radial gradient overlay para más profundidad */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_50%)]" />
      
      <div className="relative p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <Chip 
              variant="flat" 
              className="bg-white/25 text-white backdrop-blur-sm border border-white/40 shadow-lg shadow-white/20 transition-all duration-300 hover:bg-white/30 hover:shadow-xl hover:shadow-white/30"
            >
              Clientes
            </Chip>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-white drop-shadow-lg">
                Gestión de Clientes
              </h1>
              <p className="text-white/95 max-w-2xl md:text-lg leading-relaxed drop-shadow-md">
                Administra tu base de clientes, cuentas corrientes y relaciones comerciales desde un solo lugar
              </p>
            </div>
          </div>
          
          {/* Ícono grande de clientes/relaciones comerciales a la derecha (complementario al sidebar) */}
          <div className="hidden md:flex items-center justify-center flex-shrink-0">
            <div className="relative group">
              {/* Glow alrededor del icono - efecto premium */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 rounded-full blur-xl group-hover:from-white/40 group-hover:to-white/30 transition-all duration-500" />
              {/* Blur suave de fondo */}
              <div className="absolute inset-0 bg-white/15 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300" />
              <svg
                className="w-32 h-32 md:w-40 md:h-40 text-white relative z-10 drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{
                  animation: 'fadeIn 0.4s ease-out 0.1s forwards',
                  willChange: 'transform, opacity',
                  opacity: 0
                }}
              >
                {/* Icono de red de clientes - más elaborado que el del sidebar */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
