import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "./BrandLockup";

interface AuthSimpleShellProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}

/**
 * Contenedor centrado para pantallas secundarias del flujo de autenticación
 * (recuperar / restablecer contraseña). Usa los mismos tokens que /signin.
 */
export function AuthSimpleShell({
  title,
  subtitle,
  backHref = "/signin",
  backLabel = "Volver a iniciar sesión",
  children,
}: AuthSimpleShellProps) {
  return (
    // .signin-page define los tokens --landing-* y las tipografías (globals.css)
    <div className="signin-page min-h-screen bg-landing-surface px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[420px] flex-col justify-center py-6">
        <Link
          href={backHref}
          className="mb-5 inline-flex min-h-10 items-center gap-2 self-start rounded-lg px-2 text-sm font-semibold text-landing-secondary-container transition-colors hover:text-landing-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-secondary-container"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          <span>{backLabel}</span>
        </Link>

        <div className="mb-6 flex justify-center">
          <BrandLockup variant="light" size="md" />
        </div>

        <div className="rounded-xl border border-landing-outline-variant/60 bg-landing-surface-lowest p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-landing-on-surface">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm leading-relaxed text-landing-on-surface-variant">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** Clases compartidas por los inputs del flujo de auth (iguales a /signin). */
export const authInputClass =
  "w-full rounded-lg border border-landing-outline-variant bg-landing-surface-lowest px-4 py-3.5 text-base text-landing-on-surface placeholder:text-landing-outline transition-colors hover:border-landing-outline focus:border-landing-primary-container focus:outline-none focus:ring-4 focus:ring-landing-primary-container/10 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm";

/** Botón principal del flujo de auth (igual a "Iniciar sesión"). */
export const authSubmitClass =
  "w-full min-h-[48px] rounded-lg bg-landing-secondary-container px-4 py-3 text-base font-semibold text-landing-on-secondary shadow-sm transition-colors hover:bg-landing-secondary focus:outline-none focus:ring-4 focus:ring-landing-secondary-container/25 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[44px] sm:text-sm";

export const authLabelClass =
  "mb-1.5 block text-sm font-medium text-landing-on-surface-variant";
