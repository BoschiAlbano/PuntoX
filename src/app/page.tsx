import { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: {
    default: "Punto X - Sistema de Gestión Integral para Negocios",
    template: "%s | Punto X",
  },
  description:
    "Software de gestión empresarial completo. Control de inventario, punto de venta, facturación electrónica, CRM y reportes en tiempo real. Prueba gratuita de 30 días.",
  keywords: [
    // Términos principales
    "punto x",
    "sistema de gestión empresarial",
    "software punto de venta",
    "gestión de inventario",
    "facturación electrónica",
    "crm para negocios",

    // Long-tail keywords
    "software para pequeñas empresas",
    "sistema pos en la nube",
    "control de stock en tiempo real",
    "gestión de ventas y clientes",
    "facturación online",
    "reportes de ventas",

    // Localización (Argentina)
    "sistema de gestión argentina",
    "facturación electrónica afip",
    "punto de venta argentina",
  ],
  authors: [{ name: "Boschi Albano Jose" }, { name: "Varela Agustin" }],
  creator: "Punto X",
  publisher: "Punto X",

  // Open Graph
  openGraph: {
    title: "Punto X - Sistema de Gestión Integral para Negocios",
    description:
      "Control total de tu negocio: inventario, ventas, facturación y CRM en una sola plataforma. Prueba gratuita de 30 días.",
    type: "website",
    locale: "es_AR",
    siteName: "Punto X",
    url: "https://www.puntox.com.ar",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Punto X - Sistema de Gestión Empresarial",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Punto X - Sistema de Gestión Integral",
    description:
      "Control total de tu negocio en una sola plataforma. Prueba gratuita.",
    images: ["/og-image.png"], // TODO: Crear imagen para Twitter
    creator: "@puntox", // TODO: Actualizar con tu handle
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Additional metadata
  category: "Business Software",
  alternates: {
    canonical: "https://puntox.com.ar",
  },
};

export default function LandingPage() {
  // JSON-LD Structured Data para SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Punto X",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ARS",
      description: "Prueba gratuita de 30 días",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
    },
    description:
      "Sistema de gestión empresarial completo con control de inventario, punto de venta, facturación electrónica y CRM.",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Punto X",
    url: "https://www.puntox.com.ar",
    logo: "https://www.puntox.com.ar/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Sales",
      email: "Boschi.albano.jose@gmail.com",
    },
    sameAs: [
      "https://www.facebook.com/puntox",
      "https://twitter.com/puntox",
      "https://www.linkedin.com/company/puntox",
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <main className="min-h-screen bg-white text-slate-900 selection:bg-[#67afc3] selection:text-white overflow-x-hidden">
        <LandingNavbar />
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
        <LandingTestimonials />
        <LandingFooter />
      </main>
    </>
  );
}
