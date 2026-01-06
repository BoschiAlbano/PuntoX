"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: "$29",
    period: "/mes",
    description: "Ideal para pequeños negocios que están empezando.",
    features: [
      "Gestión de hasta 500 productos",
      "1 Usuario",
      "Facturación básica",
      "Soporte por email",
    ],
    highlight: false,
  },
  {
    name: "Intermedio",
    price: "$59",
    period: "/mes",
    description: "La mejor opción para negocios en crecimiento.",
    features: [
      "Productos ilimitados",
      "3 Usuarios",
      "Facturación avanzada",
      "Reportes detallados",
      "Soporte prioritario",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/mes",
    description: "Para empresas que necesitan control total.",
    features: [
      "Todo lo de Intermedio",
      "Usuarios ilimitados",
      "API de integración",
      "Soporte 24/7 dedicado",
      "Copia de seguridad en tiempo real",
    ],
    highlight: false,
  },
];

export const LandingPricing = () => {
  return (
    <section
      id="pricing"
      className="py-24 bg-[#182337] relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-[#90c472]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-[#90c472]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Planes a tu <span className="text-[#90c472]">medida</span>
          </h2>
          <p className="text-gray-400">
            Elige el plan que mejor se adapte a las necesidades de tu empresa.
            Sin costos ocultos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
                plan.highlight
                  ? "bg-[#182337] border-[#90c472] shadow-2xl shadow-[#90c472]/10 scale-105 z-10"
                  : "bg-[#0f1623]/50 border-white/10 hover:border-[#90c472]/30"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#90c472] text-[#182337] text-sm font-bold px-4 py-1 rounded-full">
                  Más Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm mt-4">{plan.description}</p>
              </div>

              <div className="grow">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-[#90c472]/20 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#90c472]" />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  plan.highlight
                    ? "bg-[#90c472] text-[#182337] hover:bg-[#a6d58a]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Comenzar ahora
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
