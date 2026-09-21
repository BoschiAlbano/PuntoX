"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Package } from "lucide-react";

export const LandingHero = () => {
  return (
    <section className="relative min-h-[calc(100vh-72px)] flex flex-col items-center justify-start pt-20 pb-14 md:pt-24 md:pb-16 overflow-hidden bg-[#F6FAFC]">
      {/* Background Gradients & Subtle Grid Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#0B1F3B08_1px,transparent_1px),linear-gradient(to_bottom,#0B1F3B08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_45%_at_50%_18%,#000_15%,transparent_70%)] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Ambient Halos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-10 left-1/2 -translate-x-[65%] w-[550px] h-[550px] bg-[#006AFC]/6 rounded-full blur-[140px]"
          aria-hidden="true"
        />
        <div
          className="absolute top-[10%] left-1/2 translate-x-[15%] w-[500px] h-[500px] bg-[#00B9D8]/7 rounded-full blur-[140px]"
          aria-hidden="true"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center w-full">
        {/* Bloque Textual Centrado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-3xl mx-auto mb-6 md:mb-8"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-[#0B1F3B] text-xs sm:text-sm font-semibold mb-4 sm:mb-5 hover:shadow-xs transition-shadow">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006AFC] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006AFC]" />
            </span>
            <span>La solución definitiva para tu negocio</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[64px] font-extrabold text-[#0B1F3B] mb-4 sm:mb-5 leading-[1.12] tracking-tight">
            Control total de tu <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#006AFC] via-[#00B9D8] to-[#0B1F3B]">
              Negocio
            </span>
          </h1>

          {/* Descripción */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed font-normal">
            Optimiza operaciones, gestiona inventario y aumenta tus ventas con
            la plataforma más elegante y potente del mercado.
          </p>

          {/* CTAs Centrados */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/signin"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-[#FC6A01] text-white font-bold text-base sm:text-lg transition-all hover:bg-[#e55f00] hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[#FC6A01]/25 flex items-center justify-center gap-2.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FC6A01] focus-visible:ring-offset-2"
            >
              <span>Comenzar Ahora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-white text-[#0B1F3B] font-semibold text-base sm:text-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006AFC]"
            >
              <span>Ver Demo</span>
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup Grande Debajo con Floating Cards */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Floating Card 1: +45% Ventas (Izquierda) */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-2.5 left-2 sm:-left-4 lg:-left-6 sm:top-6 md:top-8 z-20 flex items-center gap-2.5 sm:gap-3 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 scale-90 sm:scale-100 origin-top-left"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-bold text-[#0B1F3B] leading-tight">
                +45% Ventas
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Este mes
              </p>
            </div>
          </motion.div>

          {/* Floating Card 2: Stock Ideal (Derecha) */}
          <motion.div
            animate={{ y: [-4, 5, -4] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }}
            className="absolute bottom-2.5 right-2 sm:-right-4 lg:-right-6 sm:top-20 sm:bottom-auto z-20 flex items-center gap-2.5 sm:gap-3 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 scale-90 sm:scale-100 origin-bottom-right sm:origin-top-right"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#006AFC]/10 text-[#006AFC] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-bold text-[#0B1F3B] leading-tight">
                Stock Ideal
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Optimizado
              </p>
            </div>
          </motion.div>

          {/* Contenedor App Frame */}
          <div className="rounded-2xl bg-white p-1.5 sm:p-2 md:p-2.5 border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(11,31,59,0.14)] overflow-hidden relative">
            {/* Window Header */}
            <div className="flex items-center justify-between px-3 py-1 sm:py-1.5 border-b border-slate-100/90 mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                PuntoX — Sistema de Gestión Comercial
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>En línea</span>
              </div>
            </div>

            {/* Captura Real del Dashboard */}
            <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
              <Image
                src="/puntoxDemo.png"
                alt="PuntoX Dashboard Preview"
                width={1200}
                height={800}
                sizes="(max-width: 768px) 100vw, 1100px"
                className="w-full h-auto object-cover rounded-lg"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
