import { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Punto X Saas - Gestión Integral para tu Negocio",
  description:
    "Optimiza tu inventario, ventas y clientes con Punto X Saas. La solución más elegante y potente para hacer crecer tu empresa.",
  keywords: [
    "saas",
    "punto de venta",
    "gestión de stock",
    "inventario",
    "facturación",
    "crm",
    "negocios",
  ],
  openGraph: {
    title: "Punto X Saas - Gestión Integral para tu Negocio",
    description:
      "La solución más elegante y potente para hacer crecer tu empresa.",
    type: "website",
    locale: "es_ES",
    // images: ['/og-image.jpg'], // TODO: Add OG Image
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#182337] text-white selection:bg-[#90c472] selection:text-[#182337] overflow-x-hidden">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFooter />
    </main>
  );
}
