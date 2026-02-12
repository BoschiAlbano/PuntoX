/**
 * Tests para LandingPricing: render estático.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPricing } from "./LandingPricing";

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

describe("LandingPricing", () => {
  it("renderiza planes de precios", () => {
    render(<LandingPricing />);

    expect(screen.getByText(/Planes a tu/i)).toBeInTheDocument();
    expect(screen.getByText("Básico")).toBeInTheDocument();
    expect(screen.getByText("Intermedio")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("$59")).toBeInTheDocument();
    expect(screen.getByText("$99")).toBeInTheDocument();
    expect(screen.getByText("Más Popular")).toBeInTheDocument();
    expect(screen.getAllByText("Comenzar ahora")).toHaveLength(3);
  });
});
