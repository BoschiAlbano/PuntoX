"use client";

import { motion } from "framer-motion";
import { LandingReveal } from "@/components/landing/LandingReveal";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Package } from "lucide-react";

export const LandingHero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-landing-surface-low via-landing-surface to-landing-primary-container/5 pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12 lg:gap-8 lg:px-12">
        <div className="flex flex-col items-start text-left lg:col-span-6">
          {/* Eyebrow */}
          <LandingReveal mode="mount" className="mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-landing-outline-variant/70 bg-landing-surface-lowest px-4 py-1.5 text-xs font-semibold text-landing-on-surface shadow-sm transition-shadow hover:shadow-md sm:text-sm">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-landing-primary-container opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-landing-primary-container" />
              </span>
              <span>La solución definitiva para tu negocio</span>
            </div>
          </LandingReveal>

          {/* Título Principal */}
          <LandingReveal mode="mount" delay={0.07} className="mb-5">
            <h1 className="text-[30px] font-extrabold leading-[38px] text-landing-on-surface sm:text-[34px] sm:leading-[42px] lg:text-[40px] lg:leading-[48px]">
              Control total de tu negocio, con una operación más{" "}
              <span className="text-landing-primary-container">
                ágil y rentable.
              </span>
            </h1>
          </LandingReveal>

          {/* Descripción */}
          <LandingReveal mode="mount" delay={0.14} className="mb-7">
            <p className="max-w-xl text-base leading-7 text-landing-on-surface-variant sm:text-lg">
              Agilizá las ventas, controlá el inventario en tiempo real y
              gestioná la facturación electrónica desde una sola plataforma.
            </p>
          </LandingReveal>

          {/* CTAs Centrados */}
          <LandingReveal mode="mount" delay={0.21} className="w-full sm:w-auto">
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              <a
                href="/signin"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-landing-secondary-container px-6 font-semibold text-landing-on-secondary shadow-[0_4px_14px_0_rgba(255,97,0,0.25)] transition-colors hover:bg-landing-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-secondary-container focus-visible:ring-offset-2"
              >
                <span>Comenzar Ahora</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                href="#features"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-landing-outline-variant bg-landing-surface-lowest px-6 font-semibold text-landing-on-surface transition-colors hover:bg-landing-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary-container"
              >
                <span>Ver Demo</span>
              </Link>
            </div>
          </LandingReveal>
          <LandingReveal mode="mount" delay={0.28} className="mt-5">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-landing-on-surface-variant sm:text-sm">
              <span>30 días de prueba</span>
              <span>Ventas y stock conectados</span>
              <span>Acceso desde cualquier lugar</span>
            </div>
          </LandingReveal>
        </div>

        {/* Dashboard Preview Mockup Grande Debajo con Floating Cards */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
          className="relative mx-auto w-full lg:col-span-6"
        >
          {/* Floating Card 1: +45% Ventas (Izquierda) */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-2.5 left-2 z-20 flex origin-top-left scale-90 items-center gap-2.5 rounded-xl border border-landing-outline-variant/60 bg-landing-surface-lowest p-2.5 shadow-lg sm:-left-4 sm:top-6 sm:scale-100 sm:gap-3 sm:p-3 lg:-left-6 md:top-8"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp
                className="w-4 h-4 sm:w-5 sm:h-5"
                aria-hidden="true"
              />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight text-landing-on-surface sm:text-sm">
                Ventas registradas
              </p>
              <p className="text-[10px] font-medium text-landing-on-surface-variant sm:text-xs">
                En tiempo real
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
            className="absolute bottom-2.5 right-2 z-20 flex origin-bottom-right scale-90 items-center gap-2.5 rounded-xl border border-landing-outline-variant/60 bg-landing-surface-lowest p-2.5 shadow-lg sm:-right-4 sm:top-20 sm:bottom-auto sm:origin-top-right sm:scale-100 sm:gap-3 sm:p-3 lg:-right-6"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-landing-primary-container/10 text-landing-primary-container sm:h-10 sm:w-10">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight text-landing-on-surface sm:text-sm">
                Stock actualizado
              </p>
              <p className="text-[10px] font-medium text-landing-on-surface-variant sm:text-xs">
                Optimizado
              </p>
            </div>
          </motion.div>

          {/* Contenedor App Frame */}
          <div className="relative overflow-hidden rounded-xl border border-landing-outline-variant/70 bg-landing-surface-lowest p-1.5 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] sm:p-2 md:p-2.5">
            {/* Window Header */}
            <div className="mb-1.5 flex items-center justify-between border-b border-landing-outline-variant/50 px-3 py-1 sm:mb-2 sm:py-1.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
              </div>
              <div className="text-[10px] font-medium text-landing-outline sm:text-[11px]">
                PuntoX — Sistema de Gestión Comercial
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-landing-success sm:text-[11px]">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                <span>En línea</span>
              </div>
            </div>

            {/* Captura Real del Dashboard */}
            <div className="relative overflow-hidden rounded-lg border border-landing-outline-variant/40 bg-landing-surface-low">
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
