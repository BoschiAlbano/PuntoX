"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { PerfilTab } from "@/components/configuracion/PerfilTab";
import { VentasTab } from "@/components/configuracion/VentasTab";
import { NotificacionesTab } from "@/components/configuracion/NotificacionesTab";
import { SeguridadTab } from "@/components/configuracion/SeguridadTab";
import { FiscalTab } from "@/components/configuracion/FiscalTab";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("perfil");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Administre la configuración general de su negocio y preferencias del
          sistema
        </p>
      </div>

      <Tabs
        aria-label="Configuración"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        color="primary"
        variant="underlined"
        classNames={{
          tabList:
            "bg-white backdrop-blur-sm rounded-lg shadow-none border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
          tab: "m-[5px] p-[20px] data-[selected=true]:bg-[#67afc3]/90 data-[selected=true]:text-white data-[selected=true]:shadow-none transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2 text-[16px] cursor-pointer transform hover:scale-105 active:scale-95",
          tabContent:
            "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
          cursor: "bg-[#67afc3]/90",
          panel: "h-full",
        }}
      >
        <Tab
          key="perfil"
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
                    d="M1 2a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2Zm9 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0-8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
                    clipRule="evenodd"
                  />
                  <path d="M5.5 12.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5Z" />
                </svg>
              </span>
              <span>Perfil del negocio</span>
            </div>
          }
        >
          <PerfilTab />
        </Tab>
        <Tab
          key="ventas"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.645 48.645 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6a2.503 2.503 0 0 0-2.292 1.5H17.25a.75.75 0 0 1 0 1.5H2.76a.75.75 0 0 1-.748-.807 4.002 4.002 0 0 1 .252-1.996A2.5 2.5 0 0 0 3.912 8.5H1.75A.75.75 0 0 1 1 7.75ZM6 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                </svg>
              </span>
              <span>Preferencias de venta</span>
            </div>
          }
        >
          <VentasTab />
        </Tab>
        <Tab
          key="notificaciones"
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
                    d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.94 32.94 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.933 32.933 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.717 11.717 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Notificaciones</span>
            </div>
          }
        >
          <NotificacionesTab />
        </Tab>
        <Tab
          key="seguridad"
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
                    d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Seguridad y acceso</span>
            </div>
          }
        >
          <SeguridadTab />
        </Tab>
        <Tab
          key="fiscal"
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
                    d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Facturacion y region</span>
            </div>
          }
        >
          <FiscalTab />
        </Tab>
      </Tabs>
    </div>
  );
}
