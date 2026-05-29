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
    <section id="features" className="py-24 bg-slate-50 text-slate-900 relative">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Todo lo que necesitas para{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#4a6fa5]">crecer</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500"
          >
            Herramientas diseñadas específicamente para potenciar la eficiencia
            y rentabilidad de tu negocio, todas en una sola plataforma.
          </motion.p>
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
                className={`p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 hover:border-[#67afc3]/40 transition-all duration-500 ease-out group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(103,175,195,0.2)] flex flex-col justify-start overflow-hidden relative ${bentoClasses[index]}`}
              >
                {/* Decorative background glow on hover */}
                <div className="absolute -right-20 -top-20 w-56 h-56 bg-linear-to-br from-[#67afc3] to-[#4a6fa5] opacity-0 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-700 pointer-events-none will-change-transform" />
                
                <div className="w-14 h-14 rounded-2xl bg-[#67afc3]/10 flex items-center justify-center text-[#67afc3] mb-6 group-hover:bg-linear-to-br group-hover:from-[#67afc3] group-hover:to-[#4a6fa5] group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-md relative z-10">
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-slate-800 z-10 group-hover:text-[#1d293d] transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-base leading-relaxed z-10 group-hover:text-slate-600 transition-colors">
                  {feature.description}
                </p>
                
                {/* Subtle inner border to enhance glass effect */}
                <div className="absolute inset-0 rounded-3xl border border-white/40 pointer-events-none" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
