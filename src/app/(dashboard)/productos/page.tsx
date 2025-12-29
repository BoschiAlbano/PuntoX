"use client";

import { Tabs, Tab, Chip } from "@heroui/react";
import ProductoCRUD from "@/components/productos/ProductoCRUD";
import RubroCRUD from "@/components/rubros/RubroCRUD";
import UnidadMedidaCRUD from "@/components/unidad-medida/UnidadMedidaCRUD";
import MarcaCRUD from "@/components/marcas/MarcaCRUD";
import { useState } from "react";
import { usePagePermission } from "@/lib/permissions/usePagePermission";

export default function ProductosPage() {
  usePagePermission(); // Proteger página con permisos
  const [selected, setSelected] = useState<
    "productos" | "marcas" | "rubros" | "unidades" | "marcas-test"
  >("productos");
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
    <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-500 to-[#90c472] text-white shadow-xl mb-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="relative p-4 md:p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Chip variant="flat" className="bg-white/10 text-white">
              Productos
            </Chip>
            <h1 className="text-3xl md:text-[32px] font-bold">
              Gestion de Productos
            </h1>
            <p className="text-white max-w-3xl">
              Administra tus productos, marcas, rubros y unidades de medida
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
