/**
 * Tests para LandingFooter: render estático.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingFooter } from "./LandingFooter";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

describe("LandingFooter", () => {
  it("renderiza footer con enlaces", () => {
    render(<LandingFooter />);

    expect(screen.getByText("Punto X Saas")).toBeInTheDocument();
    expect(screen.getByText("Características")).toBeInTheDocument();
    expect(screen.getByText("Precios")).toBeInTheDocument();
    expect(screen.getByText("Testimonios")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("Sobre Nosotros")).toBeInTheDocument();
    expect(screen.getByText("Contacto")).toBeInTheDocument();
    expect(screen.getByText("Privacidad")).toBeInTheDocument();
    expect(screen.getByText("Términos")).toBeInTheDocument();
    expect(
      screen.getByText(/Todos los derechos reservados/i)
    ).toBeInTheDocument();
  });
});
