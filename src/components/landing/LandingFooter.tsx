"use client";

import Link from "next/link";
import { Facebook, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import { LandingReveal } from "@/components/landing/LandingReveal";
export const LandingFooter = () => {
  return (
    <footer className="border-t border-landing-outline-variant/60 bg-landing-surface-lowest pt-20 pb-10 text-landing-on-surface">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <LandingReveal mode="view" className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image
                src="/brand/puntox-isotipo.png"
                alt="PuntoX"
                width={42}
                height={42}
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-landing-on-surface">
                Punto X Saas
              </span>
            </Link>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-landing-on-surface-variant">
              La plataforma integral para la gestión de negocios modernos.
              Simplifica, optimiza y crece con Punto X.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/puntox"
                target="_blank"
                rel="noreferrer"
                aria-label="Punto X en Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-landing-surface-low text-landing-on-surface-variant transition-colors hover:bg-landing-tertiary hover:text-landing-on-tertiary"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/puntox"
                target="_blank"
                rel="noreferrer"
                aria-label="Punto X en X"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-landing-surface-low text-landing-on-surface-variant transition-colors hover:bg-landing-tertiary hover:text-landing-on-tertiary"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/puntox"
                target="_blank"
                rel="noreferrer"
                aria-label="Punto X en LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-landing-surface-low text-landing-on-surface-variant transition-colors hover:bg-landing-tertiary hover:text-landing-on-tertiary"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </LandingReveal>

          <LandingReveal mode="view" delay={0.08}>
            <h4 className="font-semibold mb-6">Producto</h4>
            <ul className="space-y-4 text-sm text-landing-on-surface-variant">
              <li>
                <Link
                  href="#features"
                  className="transition-colors hover:text-landing-primary"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="transition-colors hover:text-landing-primary"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="#testimonials"
                  className="transition-colors hover:text-landing-primary"
                >
                  Testimonios
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="transition-colors hover:text-landing-primary"
                >
                  API
                </Link>
              </li>
            </ul>
          </LandingReveal>

          <LandingReveal mode="view" delay={0.16}>
            <h4 className="font-semibold mb-6">Compañía</h4>
            <ul className="space-y-4 text-sm text-landing-on-surface-variant">
              <li>
                <Link
                  href="#contact"
                  className="transition-colors hover:text-landing-primary"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="transition-colors hover:text-landing-primary"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="transition-colors hover:text-landing-primary"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="transition-colors hover:text-landing-primary"
                >
                  Términos
                </Link>
              </li>
            </ul>
          </LandingReveal>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-landing-outline-variant/60 pt-8 text-xs text-landing-on-surface-variant md:flex-row">
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
