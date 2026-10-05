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
    <section
      id="pricing"
      className="relative overflow-hidden bg-landing-surface-lowest py-20 sm:py-24"
    >
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 h-96 w-96 rounded-full bg-landing-primary-container/10 blur-[120px]"></div>
        <div className="absolute bottom-1/4 -left-64 h-96 w-96 rounded-full bg-landing-tertiary/5 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 text-3xl font-extrabold text-landing-on-surface sm:text-4xl"
          >
            Planes a tu{" "}
            <span className="text-landing-primary-container">medida</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-8 text-base leading-7 text-landing-on-surface-variant sm:text-lg"
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
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-landing-surface-low p-1.5"
          >
            <span
              className={`text-sm font-semibold transition-colors ${!isAnnual ? "text-landing-on-surface" : "text-landing-outline"}`}
            >
              Mensual
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label="Cambiar entre facturación mensual y anual"
              aria-pressed={isAnnual}
              className="relative h-8 w-14 rounded-full border border-landing-outline-variant bg-landing-surface-high p-1 transition-colors hover:bg-landing-surface-highest"
            >
              <motion.div
                animate={{ x: isAnnual ? 24 : 0 }}
                className="block h-5 w-5 rounded-full border border-landing-outline-variant bg-landing-surface-lowest shadow-sm"
              />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold transition-colors ${isAnnual ? "text-landing-on-surface" : "text-landing-outline"}`}
              >
                Anual
              </span>
              <span className="rounded-full bg-landing-success-container px-2 py-0.5 text-xs font-bold text-landing-success">
                Ahorra 20%
              </span>
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
              className={`group relative flex h-full flex-col rounded-xl p-7 transition-all duration-300 hover:-translate-y-0.5 sm:p-8 ${
                plan.highlight
                  ? "z-10 bg-landing-tertiary text-landing-on-tertiary shadow-[0_20px_25px_-5px_rgba(15,23,42,0.16)] lg:-translate-y-2"
                  : "bg-landing-surface-low hover:shadow-[0_16px_36px_-18px_rgba(15,23,42,0.16)]"
              }`}
            >
              {plan.highlight && (
                <>
                  {/* Subtle animated background glow for the popular plan */}
                  <div className="pointer-events-none absolute inset-0 rounded-xl bg-landing-primary-container/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                  <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 transform items-center justify-center whitespace-nowrap rounded-full bg-landing-primary-container px-5 py-1.5 text-sm font-bold text-landing-on-primary shadow-md">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Más Popular
                  </div>
                </>
              )}

              <div className="mb-6 relative z-10">
                <h3
                  className={`mb-2 text-xl font-bold ${plan.highlight ? "text-landing-on-tertiary" : "text-landing-on-surface"}`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-end h-16 mb-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`font-landing-display text-4xl font-extrabold tabular-nums sm:text-5xl ${plan.highlight ? "text-landing-on-tertiary" : "text-landing-on-surface"}`}
                    >
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </motion.span>
                  </AnimatePresence>
                  <span
                    className={`ml-2 mb-2 font-medium ${plan.highlight ? "text-landing-surface-high" : "text-landing-on-surface-variant"}`}
                  >
                    /mes
                  </span>
                </div>
                {isAnnual && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-landing-primary-container"
                  >
                    Facturado anualmente (${plan.annualPrice * 12})
                  </motion.div>
                )}
                {!isAnnual && <div className="h-5" />}{" "}
                {/* Spacer to prevent layout shift */}
                <p
                  className={`mt-4 text-sm leading-relaxed ${plan.highlight ? "text-landing-surface-high" : "text-landing-on-surface-variant"}`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="grow relative z-10">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0 mt-0.5 ${
                          plan.highlight
                            ? "bg-landing-surface-lowest/10"
                            : "bg-landing-primary-container/10"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 text-landing-primary-container" />
                      </div>
                      <span
                        className={`text-sm font-medium ${plan.highlight ? "text-landing-surface-low" : "text-landing-on-surface-variant"}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="/signin"
                className={`relative z-10 inline-flex min-h-12 w-full items-center justify-center rounded-lg px-6 py-3 font-bold transition-colors ${
                  plan.highlight
                    ? "bg-landing-secondary-container text-landing-on-secondary hover:bg-landing-secondary"
                    : "bg-landing-surface-lowest text-landing-on-surface hover:bg-landing-primary-container hover:text-landing-on-primary"
                }`}
              >
                Comenzar ahora
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
