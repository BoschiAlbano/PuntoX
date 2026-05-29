"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

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

const testimonials = [...testimonialsData, ...testimonialsData]; // Duplicado para loop

export const LandingTestimonials = () => {
  return (
    <section
      id="testimonials"
      className="py-24 bg-slate-50 text-slate-900 overflow-hidden relative"
    >
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Lo que dicen nuestros{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#4a6fa5]">
              clientes
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500"
          >
            Descubre por qué cientos de negocios eligen Punto X para gestionar
            su crecimiento día a día.
          </motion.p>
        </div>
      </div>

      {/* Marquee Wrapper */}
      <div className="relative w-full max-w-7xl mx-auto px-4 group">
        {/* Gradient fades for edges */}
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-linear-to-r from-slate-50 to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-linear-to-l from-slate-50 to-transparent z-20 pointer-events-none" />

        <div className="flex overflow-hidden relative">
          <motion.div
            animate={{ x: [0, -1035] }} // Adjust depending on card width + gap. (345px * 3 = 1035px)
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              },
            }}
            className="flex gap-6 py-4 px-2 hover:[animation-play-state:paused]"
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="w-[320px] md:w-[400px] shrink-0 p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-slate-200/60 relative hover:border-[#67afc3]/40 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(103,175,195,0.2)]"
              >
                <div className="absolute top-6 right-8 text-[#67afc3]/10 transition-colors">
                  <Quote className="w-12 h-12" />
                </div>

                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    />
                  ))}
                </div>

                <blockquote className="text-slate-600 mb-8 relative z-10 text-base leading-relaxed h-32 overflow-hidden">
                  {testimonial.content}
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#67afc3] to-[#4a6fa5] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#67afc3]/20">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-[#4a6fa5] text-sm font-medium">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
