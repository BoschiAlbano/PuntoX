"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { motion } from "framer-motion";
import {
  Settings,
  Store,
  ShoppingCart,
  Bell,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { PerfilTab } from "@/components/configuracion/PerfilTab";
import { VentasTab } from "@/components/configuracion/VentasTab";
import { NotificacionesTab } from "@/components/configuracion/NotificacionesTab";
import { SeguridadTab } from "@/components/configuracion/SeguridadTab";
import { FiscalTab } from "@/components/configuracion/FiscalTab";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("perfil");

  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col gap-2 px-1 sm:px-0"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/50 border border-slate-200/50 backdrop-blur-md text-[#67afc3] text-xs font-semibold w-fit shadow-sm">
          <Settings className="w-3.5 h-3.5" />
          Ajustes del sistema
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Centro de{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#2dd4bf]">
            Configuración
          </span>
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Administrá la información de tu negocio, preferencias de venta,
          seguridad y datos fiscales desde un solo lugar.
        </p>
      </motion.div>

      {/* Tabs container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col"
      >
        <Tabs
          aria-label="Configuración"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="relative"
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
          {/* Perfil */}
          <Tab
            key="perfil"
            title={
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4" />
                <span>Perfil del negocio</span>
              </div>
            }
          >
            <motion.div
              key="perfil"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <PerfilTab />
            </motion.div>
          </Tab>

          {/* Ventas */}
          <Tab
            key="ventas"
            title={
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Preferencias de venta</span>
              </div>
            }
          >
            <motion.div
              key="ventas"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <VentasTab />
            </motion.div>
          </Tab>

          {/* Notificaciones */}
          <Tab
            key="notificaciones"
            title={
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notificaciones</span>
              </div>
            }
          >
            <motion.div
              key="notificaciones"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <NotificacionesTab />
            </motion.div>
          </Tab>

          {/* Seguridad */}
          <Tab
            key="seguridad"
            title={
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Seguridad y acceso</span>
              </div>
            }
          >
            <motion.div
              key="seguridad"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <SeguridadTab />
            </motion.div>
          </Tab>

          {/* Fiscal */}
          <Tab
            key="fiscal"
            title={
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Facturación y región</span>
              </div>
            }
          >
            <motion.div
              key="fiscal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <FiscalTab />
            </motion.div>
          </Tab>
        </Tabs>
      </motion.div>
    </div>
  );
}
