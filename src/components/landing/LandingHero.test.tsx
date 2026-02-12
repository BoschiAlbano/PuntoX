/**
 * Tests para LandingHero: render estático.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { LandingHero } from "./LandingHero";

vi.mock("framer-motion", () => {
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

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

describe("LandingHero", () => {
  it("renderiza sección hero con CTA", () => {
    render(<LandingHero />);

    expect(
      screen.getByText(/Control total de tu/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Negocio/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Comenzar Ahora")).toBeInTheDocument();
    expect(screen.getByText("Ver Demo")).toBeInTheDocument();
    expect(
      screen.getByText(/La solución definitiva para tu negocio/i)
    ).toBeInTheDocument();
  });
});
