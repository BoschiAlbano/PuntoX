/**
 * Tests para LandingNavbar: render estático.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingNavbar } from "./LandingNavbar";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

describe("LandingNavbar", () => {
  it("renderiza navbar con logo o nombre del proyecto y navegación", () => {
    render(<LandingNavbar />);

    // Branding oficial con BrandLockup
    expect(screen.getByText("Punto")).toBeInTheDocument();
    expect(screen.getByAltText("PuntoX")).toBeInTheDocument();

    // Enlaces de navegación
    expect(screen.getByText("Características")).toBeInTheDocument();
    expect(screen.getByText("Testimonios")).toBeInTheDocument();
    expect(screen.getByText("Precios")).toBeInTheDocument();
    expect(screen.getByText("Contacto")).toBeInTheDocument();

    // CTA de Iniciar Sesión con destino /signin
    const signinLinks = screen.getAllByRole("link", { name: /iniciar sesión/i });
    expect(signinLinks.length).toBeGreaterThan(0);
    expect(signinLinks.some((link) => link.getAttribute("href") === "/signin")).toBe(true);
  });
});
