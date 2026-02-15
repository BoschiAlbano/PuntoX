/**
 * Tests mínimos para KPICard: render con valor y título.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KPICard from "./KPICard";

vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => "ARS",
}));

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...actual,
    addToast: vi.fn(),
    useDisclosure: () => ({ isOpen: false, onOpen: vi.fn(), onClose: vi.fn() }),
    Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{typeof children === 'function' ? children(() => {}) : children}</div> : null,
    ModalContent: ({ children }: any) => <div>{typeof children === 'function' ? children(() => {}) : children}</div>,
    ModalHeader: ({ children }: any) => <div>{children}</div>,
    ModalBody: ({ children }: any) => <div>{children}</div>,
    ModalFooter: ({ children }: any) => <div>{children}</div>,
  };
});

describe("KPICard", () => {
  it("renderiza con valor y título", () => {
    render(<KPICard title="Ventas Totales" value={15000} format="currency" />);
    expect(screen.getByText("Ventas Totales")).toBeDefined();
  });
});
