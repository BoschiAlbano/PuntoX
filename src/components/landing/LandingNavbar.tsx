"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { PuntoXLogo } from "../ui/PuntoXLogo";

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12">
            <PuntoXLogo className="relative w-12 h-12 border border-slate-200/60 rounded-xl p-1.5 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-300/50" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-800 to-slate-500">
            Punto X
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link
            href="#features"
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Características
          </Link>
          <Link
            href="#testimonials"
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Testimonios
          </Link>
          <Link
            href="#pricing"
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Precios
          </Link>
          <Link
            href="#contact"
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Contacto
          </Link>
        </div>

        <Link
          href="/signin"
          className="px-6 py-2.5 rounded-full bg-[#67afc3] text-white font-semibold text-sm hover:bg-[#5fa7b8] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(103,175,195,0.3)]"
        >
          Iniciar Sesión
        </Link>
      </div>
    </nav>
  );
};
