/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SuscripcionBanner from "./SuscripcionBanner";
import { useUserStore } from "@/store/useUserStore";

vi.mock("@/store/useUserStore", () => ({ useUserStore: vi.fn() }));

const enDias = (dias: number) =>
  new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

const mockStore = (venceEnDias: number | null, isAdministrador = true) =>
  vi.mocked(useUserStore).mockReturnValue({
    isAdministrador,
    tenant: {
      Id: "5",
      Nombre: "Kiosco Ana",
      FechaVencimiento: venceEnDias === null ? null : enDias(venceEnDias),
    },
  } as any);

describe("SuscripcionBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_RENOVACION", "5493511234567");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("avisa al admin cuando faltan 7 días o menos, con botón de WhatsApp", () => {
    mockStore(3);
    render(<SuscripcionBanner />);
    expect(screen.getByText(/Tu suscripción vence en 3 días/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Renovar por WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5493511234567"),
    );
  });

  it("muestra el vencimiento cuando ya venció", () => {
    mockStore(-2);
    render(<SuscripcionBanner />);
    expect(screen.getByText(/Tu suscripción venció el/)).toBeInTheDocument();
  });

  it("no se muestra si faltan más de 7 días, sin vencimiento o a no-admins", () => {
    mockStore(10);
    const { container, rerender } = render(<SuscripcionBanner />);
    expect(container).toBeEmptyDOMElement();

    mockStore(null);
    rerender(<SuscripcionBanner />);
    expect(container).toBeEmptyDOMElement();

    mockStore(2, false);
    rerender(<SuscripcionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("se puede ocultar hasta el día siguiente", () => {
    mockStore(1);
    const { container } = render(<SuscripcionBanner />);
    fireEvent.click(screen.getByLabelText("Ocultar aviso hasta mañana"));
    expect(container).toBeEmptyDOMElement();
    expect(Object.keys(localStorage)).toEqual([
      expect.stringMatching(/^banner_suscripcion_5_\d{4}-\d{2}-\d{2}$/),
    ]);
  });
});
