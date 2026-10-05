import { Activity, BarChart3, Boxes, ReceiptText } from "lucide-react";
import { LandingReveal } from "@/components/landing/LandingReveal";

const capabilities = [
  {
    icon: Activity,
    value: "Ventas ágiles",
    detail: "Atajos de teclado y cobro simple desde el mostrador.",
  },
  {
    icon: Boxes,
    value: "Stock al día",
    detail: "Movimientos y alertas para reponer a tiempo.",
  },
  {
    icon: ReceiptText,
    value: "Facturación",
    detail: "Comprobantes electrónicos desde el punto de venta.",
  },
  {
    icon: BarChart3,
    value: "Tu negocio, claro",
    detail: "Reportes para decidir desde cualquier lugar.",
  },
];

export const LandingMetrics = () => (
  <section
    aria-label="Beneficios principales"
    className="bg-landing-surface-lowest py-10 sm:py-14"
  >
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
      {capabilities.map(({ icon: Icon, value, detail }, index) => (
        <LandingReveal
          key={value}
          delay={index * 0.07}
          className={`flex gap-4 py-5 sm:px-5 lg:py-2 ${index > 0 ? "border-t border-landing-outline-variant/60 sm:border-t-0 lg:border-l" : ""} ${index === 2 ? "sm:border-l-0 lg:border-l" : ""}`}
        >
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-landing-primary-container/10 text-landing-primary-container">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-landing-on-surface">{value}</h2>
            <p className="mt-1 max-w-[28ch] text-sm leading-5 text-landing-on-surface-variant">
              {detail}
            </p>
          </div>
        </LandingReveal>
      ))}
    </div>
  </section>
);
