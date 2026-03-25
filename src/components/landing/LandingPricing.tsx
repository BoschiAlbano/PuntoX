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
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-[#67afc3]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-[#67afc3]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
            Planes a tu <span className="text-[#67afc3]">medida</span>
          </h2>
          <p className="text-slate-500">
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
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 80,
                damping: 15,
                mass: 1,
              }}
              className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-500 ease-out group hover:-translate-y-2 ${
                plan.highlight
                  ? "bg-white border-[#67afc3] shadow-2xl shadow-[#67afc3]/15 lg:scale-105 z-10 hover:shadow-[#67afc3]/30"
                  : "bg-white border-slate-200 hover:border-[#67afc3]/40 hover:shadow-2xl hover:shadow-[#67afc3]/5"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-[#67afc3] to-[#5fa7b8] text-white text-sm font-bold px-5 py-1.5 rounded-full shadow-lg shadow-[#67afc3]/30 flex items-center justify-center whitespace-nowrap">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Más Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 ml-2">{plan.period}</span>
                </div>
                <p className="text-slate-500 text-sm mt-4">{plan.description}</p>
              </div>

              <div className="grow">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-[#67afc3]/20 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#67afc3]" />
                      </div>
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-sm ${
                  plan.highlight
                    ? "bg-[#67afc3] text-white hover:bg-[#5fa7b8] hover:shadow-lg hover:shadow-[#67afc3]/20 hover:-translate-y-0.5"
                    : "bg-slate-50 text-slate-800 hover:bg-slate-100 hover:shadow-md border border-slate-200 hover:border-slate-300 hover:-translate-y-0.5"
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
