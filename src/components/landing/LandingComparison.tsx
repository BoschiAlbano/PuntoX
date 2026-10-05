import { Check, X } from "lucide-react";
import { LandingReveal } from "@/components/landing/LandingReveal";

const manualPainPoints = [
  "Ventas y stock repartidos entre planillas o sistemas distintos.",
  "Cierres de caja que dependen de revisar todo a mano.",
  "Poca visibilidad de lo que pasa en cada sucursal.",
  "Información difícil de consultar cuando no estás en el local.",
];

const puntoXBenefits = [
  "Ventas, inventario y clientes conectados en una sola plataforma.",
  "Movimientos de caja registrados para simplificar el arqueo.",
  "Stock y operación organizados para cada sucursal.",
  "Acceso a reportes y datos del negocio desde cualquier lugar.",
];

export const LandingComparison = () => (
  <section className="bg-landing-surface-lowest py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-6 lg:px-12">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <LandingReveal>
          <h2 className="text-3xl font-extrabold leading-tight text-landing-on-surface sm:text-4xl">
            De tareas dispersas a una operación bajo control.
          </h2>
        </LandingReveal>
        <LandingReveal delay={0.08} className="mt-4">
          <p className="mx-auto max-w-2xl text-base leading-7 text-landing-on-surface-variant sm:text-lg">
            Reuní las tareas diarias de tu comercio y consultá la información
            que necesitás, sin depender de planillas sueltas.
          </p>
        </LandingReveal>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LandingReveal className="rounded-xl bg-landing-surface-low p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-landing-error-container text-landing-on-error-container">
              <X aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-landing-on-surface">
                Con herramientas desconectadas
              </h3>
              <p className="mt-1 text-sm text-landing-on-surface-variant">
                Más trabajo manual para mantener todo en orden.
              </p>
            </div>
          </div>
          <ul className="space-y-4">
            {manualPainPoints.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-6 text-landing-on-surface-variant sm:text-base"
              >
                <X
                  aria-hidden="true"
                  className="mt-1 h-4 w-4 shrink-0 text-landing-error"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </LandingReveal>

        <LandingReveal
          delay={0.1}
          className="rounded-xl bg-landing-tertiary p-6 text-landing-on-tertiary sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-landing-success/15 text-emerald-300">
              <Check aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold">Con Punto X</h3>
              <p className="mt-1 text-sm text-slate-300">
                Una sola plataforma para el trabajo de todos los días.
              </p>
            </div>
          </div>
          <ul className="space-y-4">
            {puntoXBenefits.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-6 text-landing-surface-low sm:text-base"
              >
                <Check
                  aria-hidden="true"
                  className="mt-1 h-4 w-4 shrink-0 text-emerald-300"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </LandingReveal>
      </div>
    </div>
  </section>
);
