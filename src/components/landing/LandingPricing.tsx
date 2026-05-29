"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Básico",
    monthlyPrice: 29,
    annualPrice: 24, // approx 20% off
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
    monthlyPrice: 59,
    annualPrice: 49,
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
    monthlyPrice: 99,
    annualPrice: 79,
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
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-[#67afc3]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-[#1d293d]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900"
          >
            Planes a tu <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#4a6fa5]">medida</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 mb-10"
          >
            Elige el plan que mejor se adapte a las necesidades de tu empresa.
            Sin costos ocultos, cancela cuando quieras.
          </motion.p>

          {/* Toggle Switch */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? "text-slate-900" : "text-slate-400"}`}>Mensual</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-16 h-8 rounded-full bg-slate-200 border border-slate-300 shadow-inner flex items-center p-1 transition-colors hover:bg-slate-300"
            >
              <motion.div 
                animate={{ x: isAnnual ? 32 : 0 }}
                className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-200"
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold transition-colors ${isAnnual ? "text-slate-900" : "text-slate-400"}`}>Anual</span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold animate-pulse">Ahorra 20%</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
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
              className={`relative p-8 rounded-3xl flex flex-col h-full transition-all duration-500 ease-out group hover:-translate-y-2 ${
                plan.highlight
                  ? "bg-[#1d293d] border border-[#1d293d] shadow-[0_20px_50px_-15px_rgba(29,41,61,0.5)] lg:scale-105 z-10"
                  : "bg-white border border-slate-200 hover:border-[#67afc3]/30 hover:shadow-xl hover:shadow-[#67afc3]/10"
              }`}
            >
              {plan.highlight && (
                <>
                  {/* Subtle animated background glow for the popular plan */}
                  <div className="absolute inset-0 bg-linear-to-br from-[#67afc3]/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-700 pointer-events-none" />
                  
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-[#67afc3] to-[#4a6fa5] text-white text-sm font-bold px-5 py-1.5 rounded-full shadow-lg flex items-center justify-center whitespace-nowrap">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Más Popular
                  </div>
                </>
              )}

              <div className="mb-6 relative z-10">
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-end h-16 mb-2">
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`text-5xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}
                    >
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </motion.span>
                  </AnimatePresence>
                  <span className={`ml-2 mb-2 font-medium ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>
                    /mes
                  </span>
                </div>
                {isAnnual && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm ${plan.highlight ? "text-[#67afc3]" : "text-[#67afc3]"}`}>
                    Facturado anualmente (${plan.annualPrice * 12})
                  </motion.div>
                )}
                {!isAnnual && <div className="h-5" />} {/* Spacer to prevent layout shift */}
                
                <p className={`text-sm mt-4 leading-relaxed ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>{plan.description}</p>
              </div>

              <div className="grow relative z-10">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0 mt-0.5 ${
                        plan.highlight ? "bg-white/10" : "bg-[#67afc3]/10"
                      }`}>
                        <Check className={`w-3.5 h-3.5 ${plan.highlight ? "text-[#67afc3]" : "text-[#67afc3]"}`} />
                      </div>
                      <span className={`text-sm font-medium ${plan.highlight ? "text-slate-200" : "text-slate-700"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`relative z-10 w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 overflow-hidden group/btn ${
                  plan.highlight
                    ? "bg-white text-[#1d293d] hover:bg-slate-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    : "bg-slate-100 text-slate-900 hover:bg-[#67afc3] hover:text-white shadow-sm"
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
