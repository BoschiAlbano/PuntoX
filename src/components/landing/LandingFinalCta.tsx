import { ArrowRight, Headset } from "lucide-react";
import { LandingReveal } from "@/components/landing/LandingReveal";

export const LandingFinalCta = () => (
  <section
    id="contact"
    className="relative overflow-hidden bg-landing-tertiary py-20 text-landing-on-tertiary sm:py-24"
  >
    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(0,102,255,0.24),transparent_68%)]" />
    <div className="relative mx-auto flex max-w-5xl flex-col items-start px-6 lg:px-12">
      <LandingReveal>
        <h2 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[42px]">
          Tu negocio puede funcionar con más claridad.
        </h2>
      </LandingReveal>
      <LandingReveal delay={0.08} className="mt-5">
        <p className="max-w-2xl text-base leading-7 text-landing-surface-high sm:text-lg">
          Probá Punto X durante 30 días y reuní ventas, inventario y gestión en
          un solo lugar.
        </p>
      </LandingReveal>
      <LandingReveal delay={0.16} className="mt-8 w-full sm:w-auto">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href="/signin"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-landing-secondary-container px-6 font-semibold text-landing-on-secondary shadow-[0_4px_14px_0_rgba(255,97,0,0.25)] transition-colors hover:bg-landing-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-on-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-landing-tertiary"
          >
            Comenzar prueba gratuita
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
          <a
            href="mailto:Boschi.albano.jose@gmail.com?subject=Consulta%20comercial%20Punto%20X"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-landing-on-tertiary/30 px-6 font-semibold text-landing-on-tertiary transition-colors hover:bg-landing-on-tertiary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-on-tertiary"
          >
            <Headset aria-hidden="true" className="h-4 w-4" />
            Contactar ventas
          </a>
        </div>
      </LandingReveal>
      <LandingReveal mode="view" delay={0.24} className="mt-5">
        <p className="text-sm text-landing-surface-high">
          Sin compromiso de permanencia · Asistencia para empezar
        </p>
      </LandingReveal>
    </div>
  </section>
);
