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
    <section id="features" className="py-24 bg-[#0f1623] text-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas para{" "}
            <span className="text-[#90c472]">crecer</span>
          </h2>
          <p className="text-gray-400">
            Herramientas diseñadas específicamente para potenciar la eficiencia
            y rentabilidad de tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-[#182337] border border-white/5 hover:border-[#90c472]/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#90c472]/10 flex items-center justify-center text-[#90c472] mb-6 group-hover:bg-[#90c472] group-hover:text-[#182337] transition-all">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
