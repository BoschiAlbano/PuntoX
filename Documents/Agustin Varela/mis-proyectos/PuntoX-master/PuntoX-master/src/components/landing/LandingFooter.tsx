"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";
import Image from "next/image";
export const LandingFooter = () => {
  return (
    <footer className="bg-[#182337] pt-20 pb-10 border-t border-white/5 text-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image
                src="/XPdark.ico"
                alt="Punto X"
                className="w-8 h-8 object-contain"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold">Punto X Saas</span>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
              La plataforma integral para la gestión de negocios modernos.
              Simplifica, optimiza y crece con Punto X.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#90c472] hover:text-[#182337] transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#90c472] hover:text-[#182337] transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#90c472] hover:text-[#182337] transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Producto</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  Testimonios
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  API
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Compañía</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#90c472] transition-colors"
                >
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
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
