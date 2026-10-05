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
          ? "bg-landing-surface-lowest/90 backdrop-blur-md border-b border-landing-outline-variant/70 shadow-sm py-3"
          : "bg-landing-surface-lowest/60 backdrop-blur-sm border-b border-landing-outline-variant/40 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Lockup Oficial */}
        <Link
          href="/"
          className="flex items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-landing-primary-container"
          aria-label="PuntoX Inicio"
        >
          <BrandLockup variant="light" size="sm" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-7 text-sm font-medium text-landing-on-surface-variant md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-sm transition-colors hover:text-landing-on-surface focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-landing-primary-container"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/signin"
            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-landing-on-surface transition-colors hover:bg-landing-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary-container"
          >
            <span>Iniciar Sesión</span>
          </a>
          <a
            href="/signin"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-landing-secondary-container px-4 py-2 text-sm font-semibold text-landing-on-secondary shadow-sm transition-colors hover:bg-landing-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-secondary-container focus-visible:ring-offset-2"
          >
            <span>Prueba gratis</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile Actions: CTA + Hamburger Button */}
        <div className="flex md:hidden items-center gap-2.5">
          <a
            href="/signin"
            className="rounded-lg bg-landing-secondary-container px-3.5 py-1.5 text-xs font-semibold text-landing-on-secondary shadow-sm transition-colors hover:bg-landing-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-landing-secondary-container"
          >
            Ingresar
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-landing-on-surface-variant transition-colors hover:bg-landing-surface-low hover:text-landing-on-surface focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-landing-primary-container"
            aria-label={
              mobileMenuOpen
                ? "Cerrar menú de navegación"
                : "Abrir menú de navegación"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="mt-3 space-y-3 border-b border-landing-outline-variant/60 bg-landing-surface-lowest/95 px-4 pt-3 pb-5 shadow-md backdrop-blur-md md:hidden"
        >
          <nav
            aria-label="Navegación móvil"
            className="flex flex-col space-y-1"
          >
            {navLinks.map((link) => (
              <Link
                key={`mobile-${link.label}`}
                href={link.href}
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-2 text-sm font-medium text-landing-on-surface-variant transition-colors hover:bg-landing-surface-low hover:text-landing-on-surface focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-landing-primary-container"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-landing-outline-variant/50 pt-2">
            <a
              href="/signin"
              onClick={closeMobileMenu}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-landing-secondary-container py-2.5 text-sm font-semibold text-landing-on-secondary shadow-sm transition-colors hover:bg-landing-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-landing-secondary-container focus-visible:ring-offset-1"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
