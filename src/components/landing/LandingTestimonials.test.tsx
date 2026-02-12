/**
 * Tests para LandingTestimonials: render estático.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingTestimonials } from "./LandingTestimonials";

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

describe("LandingTestimonials", () => {
  it("renderiza testimonios", () => {
    render(<LandingTestimonials />);

    expect(
      screen.getByText(/Lo que dicen nuestros/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Carlos Rodríguez")).toBeInTheDocument();
    expect(screen.getByText("Ana Martínez")).toBeInTheDocument();
    expect(screen.getByText("Javier López")).toBeInTheDocument();
    expect(
      screen.getByText(/Desde que implementamos Punto X/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/La facilidad de uso es increíble/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Buscábamos un sistema que pudiera crecer/i)
    ).toBeInTheDocument();
  });
});
