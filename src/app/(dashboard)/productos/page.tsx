"use client";

import { Tabs, Tab, Chip } from "@heroui/react";
import ProductoCRUD from "@/components/productos/ProductoCRUD";
import RubroCRUD from "@/components/rubros/RubroCRUD";
import UnidadMedidaCRUD from "@/components/unidad-medida/UnidadMedidaCRUD";
import MarcaCRUD from "@/components/marcas/MarcaCRUD";
import { useState } from "react";
import { usePagePermission } from "@/lib/permissions/usePagePermission";

export default function ProductosPage() {
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission(); // Proteger página con permisos
  const [selected, setSelected] = useState<
    "productos" | "marcas" | "rubros" | "unidades" | "marcas-test"
  >("productos");

  // No renderizar contenido hasta que los permisos estén verificados
  if (isLoadingPermisos) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si tieneAcceso es undefined, aún está cargando
  if (tieneAcceso === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, no renderizar nada (usePagePermission ya redirige)
  if (tieneAcceso === false) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch justify-center">
      {/* Header de la página */}
      <Header />
      {/* Tabs con los diferentes CRUDs */}
      <Tabs
        aria-label="Options"
        selectedKey={selected}
        onSelectionChange={(key) =>
          setSelected(
            key as
              | "productos"
              | "marcas"
              | "rubros"
              | "unidades"
              | "marcas-test"
          )
        }
        className="relative"
        classNames={{
          tabList: "bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
          tab: "data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-[#67afc3] data-[selected=true]:to-[#529aa6] data-[selected=true]:text-white data-[selected=true]:shadow-lg transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2",
          tabContent: "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
          cursor: "bg-gradient-to-r from-[#67afc3] to-[#529aa6] shadow-lg",
        }}
      >
        <Tab
          key="productos"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                  <path
                    fillRule="evenodd"
                    d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Productos</span>
            </div>
          }
        >
          <ProductoCRUD />
        </Tab>

        <Tab
          key="marcas"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Marcas</span>
            </div>
          }
        >
          <MarcaCRUD />
        </Tab>

        <Tab
          key="rubros"
          title={
            <div className="flex items-center space-x-2">
              <span>
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
              </span>
              <span>Rubros</span>
            </div>
          }
        >
          <RubroCRUD />
        </Tab>

        <Tab
          key="unidades"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668.83.75.75 0 0 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.339 1.462A18.558 18.558 0 0 0 10 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 0 1-.338-1.462 20.01 20.01 0 0 1 3.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 0 1-.387.83A4.98 4.98 0 0 1 5 14a4.98 4.98 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.37.07-.738.148-1.103.232a.75.75 0 0 1-.336-1.462 32.845 32.845 0 0 1 6.668-.829V2.75A.75.75 0 0 1 10 2ZM5 7.543 3.92 12.33a3.499 3.499 0 0 0 2.16 0L5 7.543Zm10 0-1.08 4.787a3.498 3.498 0 0 0 2.16 0L15 7.543Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Unidades de Medida</span>
            </div>
          }
        >
          <UnidadMedidaCRUD />
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
              Productos
            </Chip>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-white drop-shadow-lg">
                Gestión de Productos
              </h1>
              <p className="text-white/95 max-w-2xl md:text-lg leading-relaxed drop-shadow-md">
                Administra tu catálogo de productos, marcas, rubros y unidades de medida desde un solo lugar
              </p>
            </div>
          </div>
          
          {/* Ícono grande de catálogo/productos a la derecha (complementario al sidebar) */}
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
                {/* Icono de catálogo/productos apilados - más elaborado que el del sidebar */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
