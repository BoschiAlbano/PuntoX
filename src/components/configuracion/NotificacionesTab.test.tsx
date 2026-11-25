/**
 * Tests mínimos para NotificacionesTab: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotificacionesTab } from "./NotificacionesTab";

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

vi.mock("@/hooks/useConfiguracion", () => {
  // Objeto estable: el hook real devuelve query.data (misma referencia entre
  // renders). Crear un objeto nuevo en cada llamada dispara un loop infinito
  // en los useEffect([xxxData]) del componente.
  const mockValue = {
    notificaciones: { push: true, resumenDiario: false, stockBajo: true },
    saveNotificaciones: vi.fn(),
    isSavingNotificaciones: false,
  };
  return { useConfiguracion: vi.fn(() => mockValue) };
});

describe("NotificacionesTab", () => {
  it("renderiza sin crash", () => {
    render(<NotificacionesTab />);
    expect(screen.getByText("Canales de notificación")).toBeDefined();
  });
});
