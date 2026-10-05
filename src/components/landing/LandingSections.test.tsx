/**
 * Prueba de render para las secciones agregadas a la landing.
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingComparison } from "./LandingComparison";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingMetrics } from "./LandingMetrics";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

describe("Landing sections", () => {
  it("renderiza beneficios, comparativa y CTA con destinos válidos", () => {
    render(
      <>
        <LandingMetrics />
        <LandingComparison />
        <LandingFinalCta />
      </>,
    );

    expect(screen.getByText("Ventas ágiles")).toBeInTheDocument();
    expect(
      screen.getByText("Con herramientas desconectadas"),
    ).toBeInTheDocument();
    expect(screen.getByText("Con Punto X")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /comenzar prueba gratuita/i }),
    ).toHaveAttribute("href", "/signin");
    expect(
      screen.getByRole("link", { name: /contactar ventas/i }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });
});
