"use client";

import CajaActual from "@/components/caja/CajaActual";
import Cajas from "@/components/caja/Cajas";
import { Tab, Tabs } from "@heroui/react";
import { motion } from "framer-motion";
import { Banknote } from "lucide-react";

export default function CajaPage() {
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
           <Banknote className="w-3.5 h-3.5" />
           Gestión de Caja
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Control de <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#2dd4bf]">Flujo</span>
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Supervisa el estado de la caja actual, registra movimientos manuales y revisa el historial integral de todas las cajas cerradas.
        </p>
      </motion.div>

      {/* Main App Container with Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-2 sm:p-4 overflow-hidden relative flex flex-col"
      >
        {/* Subtle Inner Glows for Depth */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#67afc3]/10 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
        
        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
          <Tabs
            aria-label="Options"
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
            <Tab
              key="caja-actual"
              title={
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                  </svg>
                  <span>Caja Actual</span>
                </div>
              }
            >
              <CajaActual />
            </Tab>

            <Tab
              key="cajas"
              title={
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                  </svg>
                  <span>Historial Cajas</span>
                </div>
              }
            >
              <Cajas />
            </Tab>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
