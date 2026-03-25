"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden bg-white">
      {/* Background Gradients & Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_2px,transparent_1px),linear-gradient(to_bottom,#f8fafc_2px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#67afc3]/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 backdrop-blur-sm text-[#67afc3] text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67afc3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#67afc3]"></span>
            </span>
            La solución definitiva para tu negocio
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
            Control total de tu <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#2dd4bf]">
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
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#67afc3] text-white font-bold text-lg hover:bg-[#5fa7b8] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(103,175,195,0.4)] flex items-center justify-center gap-2"
            >
              Comenzar Ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-100 text-slate-900 font-semibold text-lg border border-slate-200 hover:bg-slate-200 transition-all">
              Ver Demo
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 70,
            damping: 20,
            delay: 0.2,
          }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="rounded-xl bg-white p-2 border border-slate-200 shadow-2xl overflow-hidden aspect-video relative group mb-10">
            <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent z-20" />

            {/* Simulated UI Content */}
            <div className="h-full w-full bg-slate-50 rounded-lg overflow-hidden flex flex-col items-center justify-center text-gray-500">
              <div className="grid grid-cols-3 gap-6 p-8 w-full h-full opacity-50 blur-sm group-hover:blur-0 transition-all duration-700">
                <div className="col-span-2 space-y-4">
                  <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
                  <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
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

      {/* Seamless transition gradient to blend with the next section (bg-slate-50) */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-linear-to-b from-white/0 to-slate-50 pointer-events-none z-30" />
    </section>
  );
};
