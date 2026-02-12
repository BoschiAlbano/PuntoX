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
  it("renderiza navbar con logo o nombre del proyecto", () => {
    render(<LandingNavbar />);

    expect(screen.getByText("Punto X")).toBeInTheDocument();
    expect(screen.getByText("Iniciar Sesión")).toBeInTheDocument();
    expect(screen.getByText("Características")).toBeInTheDocument();
    expect(screen.getByText("Testimonios")).toBeInTheDocument();
    expect(screen.getByText("Precios")).toBeInTheDocument();
    expect(screen.getByText("Contacto")).toBeInTheDocument();
  });
});
