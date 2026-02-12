/**
 * Tests mínimos para SeguridadTab: render sin crash.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeguridadTab } from "./SeguridadTab";

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

vi.mock("@/hooks/useConfiguracion", () => ({
  useConfiguracion: vi.fn(() => ({
    seguridad: {
      dobleFactor: false,
      expirarSesiones30Dias: true,
      bloquearTrasIntentos: "5",
      alertarNuevoDispositivo: true,
      bloquearPorInactividad: false,
      tiempoInactividadMinutos: 30,
      recordarSesion30Dias: true,
    },
    saveSeguridad: vi.fn(),
    isSavingSeguridad: false,
  })),
}));

// Mock global fetch for the API calls inside the component
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        sesiones: [],
        dispositivos: [],
        estadisticas: {
          sesionesActivas: 0,
          dispositivosActivos: 0,
          ultimaActividad: null,
          intentosFallidos7Dias: 0,
          intentosExitosos7Dias: 0,
        },
        sospechosos: [],
        alertas: [],
        ultimosIntentos: [],
      }),
  })
);

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockClear();
});

describe("SeguridadTab", () => {
  it("renderiza sin crash", () => {
    render(<SeguridadTab />);
    expect(screen.getByText("Seguridad y acceso")).toBeDefined();
  });
});
