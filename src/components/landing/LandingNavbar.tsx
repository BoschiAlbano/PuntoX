"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { BrandLockup } from "@/components/auth/BrandLockup";
import { Menu, X, ArrowRight } from "lucide-react";

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        closeMobileMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, closeMobileMenu]);

  const navLinks = [
    { label: "Características", href: "#features" },
    { label: "Testimonios", href: "#testimonials" },
    { label: "Precios", href: "#pricing" },
    { label: "Contacto", href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3"
          : "bg-white/60 backdrop-blur-sm border-b border-slate-100/60 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Lockup Oficial */}
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006AFC] rounded-lg"
          aria-label="PuntoX Inicio"
        >
          <BrandLockup variant="light" size="sm" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-[#0B1F3B] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006AFC] rounded-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#FC6A01] text-white font-semibold text-sm hover:bg-[#e55f00] active:scale-[0.98] transition-all shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FC6A01] focus-visible:ring-offset-2"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Actions: CTA + Hamburger Button */}
        <div className="flex md:hidden items-center gap-2.5">
          <Link
            href="/signin"
            className="px-3.5 py-1.5 rounded-lg bg-[#FC6A01] text-white font-semibold text-xs hover:bg-[#e55f00] transition-colors shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FC6A01]"
          >
            Ingresar
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-600 hover:text-[#0B1F3B] hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006AFC]"
            aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg px-4 pt-3 pb-5 mt-3 space-y-3"
        >
          <nav aria-label="Navegación móvil" className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={`mobile-${link.label}`}
                href={link.href}
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-[#0B1F3B] hover:bg-slate-100/80 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006AFC]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/signin"
              onClick={closeMobileMenu}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FC6A01] text-white font-semibold text-sm hover:bg-[#e55f00] transition-colors shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FC6A01] focus-visible:ring-offset-1"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
