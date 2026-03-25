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
    <section id="features" className="py-24 bg-slate-50 text-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas para{" "}
            <span className="text-[#67afc3]">crecer</span>
          </h2>
          <p className="text-slate-500">
            Herramientas diseñadas específicamente para potenciar la eficiencia
            y rentabilidad de tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[280px] gap-6">
          {features.map((feature, index) => {
            const bentoClasses = [
              "md:col-span-2", // Inventory: wide
              "md:col-span-1 md:row-span-2", // Analytics: tall
              "md:col-span-1", // Clients: square
              "md:col-span-1", // Security: square
              "md:col-span-1", // Mobile: square
              "md:col-span-2", // Billing: wide
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
                className={`p-8 rounded-3xl bg-white border border-slate-200 hover:border-[#67afc3]/40 transition-all duration-500 ease-out group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#67afc3]/10 flex flex-col justify-start overflow-hidden relative ${bentoClasses[index]}`}
              >
                {/* Decorative background glow on hover (GPU Optimized) */}
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#67afc3] opacity-0 rounded-full blur-3xl group-hover:opacity-15 transition-opacity duration-300 pointer-events-none will-change-transform" />
                
                <div className="w-12 h-12 rounded-xl bg-[#67afc3]/10 flex items-center justify-center text-[#67afc3] mb-6 group-hover:bg-[#67afc3] group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 z-10">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed z-10">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
