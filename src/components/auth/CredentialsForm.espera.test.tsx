/**
 * Límite de pedidos en el login: el formulario muestra cuánto falta para
 * poder reintentar y lo descuenta solo, sin recargar la página.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithQueryClient } from "@/test/render";
import CredentialsForm from "./CredentialsForm";

vi.mock("./AuthTransitionContext", () => ({
  useAuthTransition: () => ({
    startSigningIn: vi.fn(),
    startVerifying: vi.fn(),
    resetTransition: vi.fn(),
  }),
}));
vi.mock("@/lib/supabase/browserClient", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

const enviar = async () => {
  fireEvent.change(document.getElementById("username")!, { target: { value: "juan" } });
  fireEvent.change(document.getElementById("password")!, { target: { value: "secreta1" } });
  await act(async () => {
    fireEvent.submit(screen.getByRole("button", { name: /iniciar sesión/i }).closest("form")!);
  });
};

describe("CredentialsForm - espera por límite de pedidos", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Demasiados intentos." }), {
        status: 429,
        headers: { "Retry-After": "3" },
      }),
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("descuenta los segundos y habilita el botón al terminar", async () => {
    renderWithQueryClient(<CredentialsForm />);
    await enviar();

    expect(await screen.findByText("3 segundos")).toBeInTheDocument();
    const boton = screen.getByRole("button", { name: /iniciar sesión/i });
    expect(boton).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("2 segundos")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByText(/Podés volver a intentar/)).not.toBeInTheDocument();
    expect(boton).not.toBeDisabled();
  });
});
