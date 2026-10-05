"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { LandingReveal } from "@/components/landing/LandingReveal";

// Duplicamos la data para que el efecto marquee sea continuo sin cortes
const testimonialsData = [
  {
    name: "Carlos Rodríguez",
    role: "Dueño de Market Express",
    content:
      "Desde que implementamos Punto X, el control de nuestro inventario es absoluto. Hemos reducido las pérdidas en un 40% y el proceso de venta es mucho más rápido. Es una herramienta indispensable.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Gerente de Tienda de Ropa",
    content:
      "La facilidad de uso es increíble. Mis empleados aprendieron a usar el sistema en minutos. Además, los reportes de ventas me ayudan a saber qué productos reponer. ¡Totalmente recomendado!",
    rating: 5,
  },
  {
    name: "Javier López",
    role: "Fundador de TechSolutions",
    content:
      "Buscábamos un sistema que pudiera crecer con nosotros y Punto X ha sido la elección perfecta. La gestión de clientes y la facturación nos han ahorrado horas de trabajo cada semana.",
    rating: 5,
  },
];

export const LandingTestimonials = () => {
  return (
    <section
      id="testimonials"
      className="relative bg-landing-surface-low py-20 text-landing-on-surface sm:py-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <LandingReveal mode="view">
            <motion.h2 className="mb-5 text-3xl font-extrabold text-landing-on-surface sm:text-4xl">
              Lo que dicen nuestros{" "}
              <span className="text-landing-primary-container">clientes</span>
            </motion.h2>
          </LandingReveal>
          <LandingReveal mode="view" delay={0.1}>
            <p className="text-base leading-7 text-landing-on-surface-variant sm:text-lg">
              Descubre por qué cientos de negocios eligen Punto X para gestionar
              su crecimiento día a día.
            </p>
          </LandingReveal>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 md:grid-cols-3 lg:gap-6 lg:px-12">
        {testimonialsData.map((testimonial) => (
          <LandingReveal
            key={testimonial.name}
            delay={0.08}
            className="relative flex flex-col justify-between rounded-xl bg-landing-surface-lowest p-6 transition-shadow hover:shadow-[0_16px_36px_-18px_rgba(15,23,42,0.16)] sm:p-7"
          >
            <div className="absolute top-6 right-8 text-landing-primary-container/10 transition-colors">
              <Quote className="w-12 h-12" />
            </div>

            <div className="flex gap-1 mb-6">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-amber-500 text-amber-500"
                />
              ))}
            </div>

            <blockquote className="relative z-10 mb-8 text-sm leading-6 text-landing-on-surface-variant sm:text-base">
              {testimonial.content}
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-landing-primary-container text-lg font-bold text-landing-on-primary shadow-md">
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-landing-on-surface">
                  {testimonial.name}
                </h4>
                <p className="text-sm font-medium text-landing-primary">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </LandingReveal>
        ))}
      </div>
    </section>
  );
};
