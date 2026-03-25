"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";
import Image from "next/image";
import { PuntoXLogo } from "../ui/PuntoXLogo";
export const LandingFooter = () => {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-slate-200 text-slate-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <PuntoXLogo className="relative w-12 h-12 border border-slate-200/60 rounded-xl p-1.5 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-300/50" />
              <span className="text-xl font-bold">Punto X Saas</span>
            </Link>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
              La plataforma integral para la gestión de negocios modernos.
              Simplifica, optimiza y crece con Punto X.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-[#67afc3] hover:text-slate-900 transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-[#67afc3] hover:text-slate-900 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-[#67afc3] hover:text-slate-900 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Producto</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  Testimonios
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  API
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Compañía</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#67afc3] transition-colors"
                >
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Punto X Saas. Todos los derechos
            reservados.
          </p>
          <p>Hecho con ❤️ para emprendedores.</p>
        </div>
      </div>
    </footer>
  );
};
