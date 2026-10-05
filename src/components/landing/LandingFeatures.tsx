"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Box,
  Users,
  ShieldCheck,
  Zap,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: <Box className="w-6 h-6" />,
    title: "Gestión de Inventario",
    description:
      "Controla tu stock en tiempo real, con alertas inteligentes y seguimiento detallado de movimientos.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analíticas Potentes",
    description:
      "Toma decisiones basadas en datos con reportes detallados de ventas, rendimientos y proyecciones.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Gestión de Clientes",
    description:
      "Fideliza a tus usuarios con perfiles detallados, historial de compras y herramientas de CRM.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Seguridad Avanzada",
    description:
      "Tus datos están protegidos con encriptación de grado bancario y copias de seguridad automáticas.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Facturación Rápida",
    description:
      "Genera comprobantes fiscales en segundos y agiliza el proceso de cobro en tu punto de venta.",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Acceso Móvil",
    description:
      "Gestiona tu negocio desde cualquier lugar con nuestra interfaz totalmente responsiva.",
  },
];

export const LandingFeatures = () => {
  return (
    <section
      id="features"
      className="relative bg-landing-surface-low py-20 text-landing-on-surface sm:py-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 text-3xl font-extrabold text-landing-on-surface sm:text-4xl"
          >
            Todo lo que necesitas para{" "}
            <span className="text-landing-primary-container">crecer</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base leading-7 text-landing-on-surface-variant sm:text-lg"
          >
            Herramientas diseñadas específicamente para potenciar la eficiencia
            y rentabilidad de tu negocio, todas en una sola plataforma.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:auto-rows-[260px] lg:gap-6">
          {features.map((feature, index) => {
            const bentoClasses = [
              "md:col-span-2",
              "md:col-span-1 md:row-span-2",
              "md:col-span-1",
              "md:col-span-1",
              "md:col-span-1",
              "md:col-span-2",
            ];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 80,
                  damping: 15,
                  mass: 1,
                }}
                className={`group relative flex flex-col justify-start overflow-hidden rounded-xl bg-landing-surface-lowest p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_rgba(15,23,42,0.16)] sm:p-7 ${bentoClasses[index]}`}
              >
                {/* Decorative background glow on hover */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-landing-primary-container opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-landing-primary-container/10 text-landing-primary-container transition-colors group-hover:bg-landing-primary-container group-hover:text-landing-on-primary">
                  {feature.icon}
                </div>

                <h3 className="z-10 mb-2 text-xl font-bold text-landing-on-surface transition-colors sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="z-10 max-w-[58ch] text-sm leading-6 text-landing-on-surface-variant sm:text-base">
                  {feature.description}
                </p>

                {/* Subtle inner border to enhance glass effect */}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
