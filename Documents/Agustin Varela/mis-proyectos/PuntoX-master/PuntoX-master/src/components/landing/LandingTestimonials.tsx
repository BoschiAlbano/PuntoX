"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Rodríguez",
    role: "Dueño de Market Express",
    content:
      "Desde que implementamos Punto X, el control de nuestro inventario es absoluto. Hemos reducido las pérdidas en un 40% y el proceso de venta es mucho más rápido. Es una herramienta indispensable para nosotros.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Gerente de Tienda de Ropa",
    content:
      "La facilidad de uso es increíble. Mis empleados aprendieron a usar el sistema en minutos. Además, los reportes de ventas me ayudan a saber qué productos reponer y cuáles promocionar. ¡Totalmente recomendado!",
    rating: 5,
  },
  {
    name: "Javier López",
    role: "Fundador de TechSolutions",
    content:
      "Buscábamos un sistema que pudiera crecer con nosotros y Punto X ha sido la elección perfecta. La gestión de clientes y la facturación automática nos han ahorrado horas de trabajo administrativo cada semana.",
    rating: 5,
  },
];

export const LandingTestimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-[#0f1623] text-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lo que dicen nuestros{" "}
            <span className="text-[#90c472]">clientes</span>
          </h2>
          <p className="text-gray-400">
            Descubre por qué cientos de negocios eligen Punto X para gestionar
            su crecimiento día a día.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-[#182337] border border-white/5 relative group hover:border-[#90c472]/30 transition-all"
            >
              <div className="absolute top-6 right-8 text-[#90c472]/10 group-hover:text-[#90c472]/20 transition-colors">
                <Quote className="w-12 h-12" />
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#90c472] text-[#90c472]"
                  />
                ))}
              </div>

              <blockquote className="text-gray-300 mb-6 relative z-10 text-lg leading-relaxed">
                {testimonial.content}
              </blockquote>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#90c472] to-[#6a9e50] flex items-center justify-center text-[#182337] font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-[#90c472] text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
