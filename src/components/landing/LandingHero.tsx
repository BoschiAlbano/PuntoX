"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, TrendingUp, Package, Users } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export const LandingHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Tilt effect for the dashboard mockup
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 10]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-20 overflow-hidden bg-white perspective-1000"
    >
      {/* Background Gradients & Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_2px,transparent_1px),linear-gradient(to_bottom,#f8fafc_2px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#67afc3]/15 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#1d293d]/8 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center flex-1">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200 shadow-sm backdrop-blur-md text-[#1d293d] text-sm font-semibold mb-8 hover:shadow-md transition-shadow">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67afc3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#67afc3]"></span>
            </span>
            La solución definitiva para tu negocio
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
            Control total de tu <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] via-[#4a6fa5] to-[#1d293d] animate-gradient-x">
              Negocio
            </span>
          </h1>

          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Optimiza operaciones, gestiona inventario y aumenta tus ventas con
            la plataforma más elegante y potente del mercado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signin"
              className="group w-full sm:w-auto px-8 py-4 rounded-full bg-linear-to-r from-[#67afc3] to-[#4a6fa5] text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_-10px_rgba(103,175,195,0.8)] flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Comenzar Ahora</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-700 font-semibold text-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-2">
              Ver Demo
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup with 3D effect */}
        <motion.div
          style={{ y, rotateX }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.2 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-12 top-10 z-30 hidden md:flex items-center gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/40"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">+45% Ventas</p>
              <p className="text-xs text-slate-500">Este mes</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 15, 0] }} 
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-8 top-32 z-30 hidden md:flex items-center gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/40"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Package size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Stock Ideal</p>
              <p className="text-xs text-slate-500">Optimizado</p>
            </div>
          </motion.div>

          <div className="rounded-2xl bg-slate-900/5 p-2 md:p-4 border border-slate-200/50 shadow-2xl backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent z-20 pointer-events-none" />
            
            <div className="rounded-xl overflow-hidden relative bg-white shadow-inner">
              <Image
                src="/puntoxDemo.png"
                alt="Punto X Dashboard Preview"
                className="w-full h-auto object-cover rounded-xl transform transition-transform duration-700 group-hover:scale-[1.02]"
                layout="responsive"
                width={1200}
                height={800}
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Seamless transition gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-b from-transparent to-slate-50 pointer-events-none z-30" />
    </section>
  );
};
