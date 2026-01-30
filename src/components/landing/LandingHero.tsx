"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden bg-[#182337]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#90c472]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[#90c472] text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#90c472] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#90c472]"></span>
            </span>
            La solución definitiva para tu negocio
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Control total de tu <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#90c472] to-emerald-400">
              Negocio
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Optimiza operaciones, gestiona inventario y aumenta tus ventas con
            la plataforma más elegante y potente del mercado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signin"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#90c472] text-[#182337] font-bold text-lg hover:bg-[#7db361] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(144,196,114,0.4)] flex items-center justify-center gap-2"
            >
              Comenzar Ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-semibold text-lg border border-white/10 hover:bg-white/10 transition-all">
              Ver Demo
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="rounded-xl bg-[#1e2a40] p-2 border border-white/10 shadow-2xl overflow-hidden aspect-video relative group">
            <div className="absolute inset-0 bg-linear-to-t from-[#182337] via-transparent to-transparent z-20" />

            {/* Simulated UI Content */}
            <div className="h-full w-full bg-[#0f172a] rounded-lg overflow-hidden flex flex-col items-center justify-center text-gray-500">
              <div className="grid grid-cols-3 gap-6 p-8 w-full h-full opacity-50 blur-sm group-hover:blur-0 transition-all duration-700">
                <div className="col-span-2 space-y-4">
                  <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="h-64 bg-slate-800 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <div className="w-full h-full m-4 sm:m-10 flex flex-col items-center justify-center">
                  <Image
                    src="/puntoxDemo.png"
                    alt="Dashboard Preview"
                    className=" object-cover rounded-lg"
                    layout="responsive"
                    width={1024}
                    height={768}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
