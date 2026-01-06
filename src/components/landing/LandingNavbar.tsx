"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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
        scrolled
          ? "bg-[#182337]/80 backdrop-blur-md py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-[#90c472] rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <img
              src="/XPdark.ico"
              alt="Punto X"
              className="relative w-full h-full object-contain"
            />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-300">
            Punto X
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link
            href="#features"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Características
          </Link>
          <Link
            href="#testimonials"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Testimonios
          </Link>
          <Link
            href="#pricing"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Precios
          </Link>
          <Link
            href="#contact"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Contacto
          </Link>
        </div>

        <Link
          href="/signin"
          className="px-6 py-2.5 rounded-full bg-[#90c472] text-[#182337] font-semibold text-sm hover:bg-[#7db361] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(144,196,114,0.3)]"
        >
          Iniciar Sesión
        </Link>
      </div>
    </nav>
  );
};
