/**
 * Tests para LandingFeatures: render estático.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingFeatures } from "./LandingFeatures";

vi.mock("framer-motion", () => {
  const React = require("react");
  const createMockComponent = (tag: string) => {
    const MockComponent = ({ children, ...props }: any) => {
      const { initial, animate, transition, whileInView, whileHover, viewport, ...restProps } = props;
      return React.createElement(tag, restProps, children);
    };
    MockComponent.displayName = `motion.${tag}`;
    return MockComponent;
  };

  return {
    motion: {
      div: createMockComponent("div"),
      section: createMockComponent("section"),
      h1: createMockComponent("h1"),
      h2: createMockComponent("h2"),
      p: createMockComponent("p"),
      span: createMockComponent("span"),
      a: createMockComponent("a"),
      nav: createMockComponent("nav"),
      button: createMockComponent("button"),
      ul: createMockComponent("ul"),
      li: createMockComponent("li"),
      img: createMockComponent("img"),
      header: createMockComponent("header"),
      footer: createMockComponent("footer"),
    },
    useScroll: () => ({ scrollYProgress: { on: vi.fn() } }),
    useTransform: () => 0,
    useInView: () => true,
    AnimatePresence: ({ children }: any) => children,
  };
});

describe("LandingFeatures", () => {
  it("renderiza grid de features", () => {
    render(<LandingFeatures />);

    expect(
      screen.getByText(/Todo lo que necesitas para/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Gestión de Inventario")).toBeInTheDocument();
    expect(screen.getByText("Analíticas Potentes")).toBeInTheDocument();
    expect(screen.getByText("Gestión de Clientes")).toBeInTheDocument();
    expect(screen.getByText("Seguridad Avanzada")).toBeInTheDocument();
    expect(screen.getByText("Facturación Rápida")).toBeInTheDocument();
    expect(screen.getByText("Acceso Móvil")).toBeInTheDocument();
  });
});
