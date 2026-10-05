import CredentialsForm from "@/components/auth/CredentialsForm";
import { BrandLockup } from "@/components/auth/BrandLockup";
import { SigninEntrance } from "@/components/auth/SigninEntrance";
import { ArrowLeft, Info } from "lucide-react";
import { MotionConfig } from "framer-motion";
import Link from "next/link";

export default function SignIn() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="signin-page min-h-screen flex flex-col lg:flex-row bg-landing-surface lg:bg-landing-surface-lowest pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] px-[max(1rem,env(safe-area-inset-left))] lg:p-0">
        {/* Panel Izquierdo: Branding Institucional (Solo Desktop) */}
        <aside className="relative hidden shrink-0 select-none flex-col justify-between overflow-hidden bg-landing-tertiary p-12 lg:flex lg:w-[45%] xl:w-[42%] xl:p-16">
          {/* Halos ambientales suaves y refinados de la marca */}
          <div
            className="pointer-events-none absolute -top-36 -left-36 h-[450px] w-[450px] rounded-full bg-landing-primary-container/15 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-36 -right-36 h-[450px] w-[450px] rounded-full bg-landing-primary/15 blur-[100px]"
            aria-hidden="true"
          />

          <SigninEntrance
            variant="brand"
            className="relative z-10 flex flex-1 flex-col justify-between"
          >
            {/* Cabecera institucional: Brand Lockup oficial */}
            <div data-signin-entrance>
              <BrandLockup variant="dark" size="md" />
            </div>

            {/* Contenido principal: Propuesta de valor, tipografía y pills */}
            <div className="my-auto max-w-lg py-12">
              <p
                data-signin-entrance
                className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-landing-primary-container"
              >
                TECNOLOGÍA COMERCIAL
              </p>

              <h2
                data-signin-entrance
                className="text-3xl font-bold leading-[1.15] tracking-tight text-landing-on-tertiary xl:text-4xl 2xl:text-[44px]"
              >
                Tu negocio,
                <br />
                más simple y{" "}
                <span className="text-landing-primary-fixed-dim">veloz.</span>
              </h2>

              <p
                data-signin-entrance
                className="mt-5 max-w-md text-sm leading-relaxed text-landing-surface-high xl:text-base"
              >
                Punto de venta y control de inventario diseñado para el ritmo
                real del mostrador.
              </p>

              {/* Chips / Pills refinadas y sobrias */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  "Operación rápida",
                  "Control de stock",
                  "Control de caja",
                ].map((benefit) => (
                  <div
                    key={benefit}
                    data-signin-entrance
                    className="inline-flex items-center gap-2 rounded-lg border border-landing-on-tertiary/10 bg-landing-on-tertiary/[0.06] px-3.5 py-1.5 text-xs font-medium text-landing-surface-low"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-landing-secondary-container"
                      aria-hidden="true"
                    />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer institucional */}
            <div
              data-signin-entrance
              className="border-t border-landing-on-tertiary/10 pt-8 text-xs text-landing-surface-high"
            >
              <p>© 2026 PuntoX. Todos los derechos reservados.</p>
            </div>
          </SigninEntrance>
        </aside>

        {/* Panel Derecho: Contenedor con soporte PWA y Card en Mobile */}
        <main className="relative flex flex-1 items-center justify-center bg-landing-surface px-2 py-2 sm:p-6 md:p-8 lg:bg-landing-surface-lowest lg:p-14 xl:p-16">
          {/* Halo sutil de fondo en mobile */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 h-64 w-full max-w-md -translate-x-1/2 rounded-full bg-landing-primary-container/5 blur-3xl lg:hidden"
            aria-hidden="true"
          />

          <SigninEntrance
            variant="content"
            className="relative z-10 mx-auto w-full max-w-[420px] py-4 sm:py-6"
          >
            <Link
              data-signin-entrance
              href="/"
              aria-label="Volver al inicio"
              className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-landing-secondary-container transition-colors hover:text-landing-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-secondary-container"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              <span>Volver al inicio</span>
            </Link>

            {/* Logo oficial con mayor presencia en mobile/tablet */}
            <div
              data-signin-entrance
              className="lg:hidden mb-6 sm:mb-8 flex justify-center"
            >
              <BrandLockup variant="light" size="md" />
            </div>

            {/* Card blanca envolvente en mobile/PWA, transparente en desktop */}
            <div className="rounded-xl border border-landing-outline-variant/60 bg-landing-surface-lowest p-6 shadow-sm sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              {/* Encabezado del login */}
              <div data-signin-entrance className="mb-6 sm:mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-landing-on-surface sm:text-3xl">
                  Bienvenido
                </h1>
                <p className="mt-1.5 text-sm text-landing-on-surface-variant">
                  Iniciá sesión en tu cuenta de Punto X
                </p>
              </div>

              {/* Formulario con soporte para loading con delay ~250ms */}
              <div data-signin-entrance>
                <CredentialsForm />
              </div>
            </div>

            {/* Aviso de acceso por invitación */}
            <div
              data-signin-entrance
              className="mt-4 flex items-start gap-3 rounded-lg border border-landing-outline-variant/60 bg-landing-surface-lowest/90 p-3.5 shadow-sm sm:mt-6 lg:bg-landing-surface-low lg:shadow-none"
            >
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-landing-primary"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-landing-on-surface-variant">
                El acceso es solo por invitación. Contactá a un administrador
                para obtener acceso.
              </p>
            </div>

            {/* Términos y privacidad */}
            <div
              data-signin-entrance
              className="mt-5 px-2 text-center text-xs leading-relaxed text-landing-outline"
            >
              <p>
                Al continuar, aceptás nuestros términos de servicio y política
                de privacidad
              </p>
            </div>
          </SigninEntrance>
        </main>
      </div>
    </MotionConfig>
  );
}
