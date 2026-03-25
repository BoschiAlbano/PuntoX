"use client";

import VentasScreen from "@/components/ventas/VentasScreen";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";

export default function VentasPage() {
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
           <ShoppingCart className="w-3.5 h-3.5" />
           Punto de Venta
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Gestión de <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#2dd4bf]">Ventas</span>
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Atiende a tus clientes, carga productos rápidamente y completa el pago en una interfaz fluida y optimizada.
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
          <VentasScreen />
        </div>
      </motion.div>
    </div>
  );
}
