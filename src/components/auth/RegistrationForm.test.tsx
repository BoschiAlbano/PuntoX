/**
 * Tests para RegistrationForm: validación de campos.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegistrationForm from "./RegistrationForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/browserClient", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signInWithPassword: vi.fn() },
  }),
}));

const mockFetch = vi.fn();

describe("RegistrationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_TENANT_ID = "tenant-test";
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ Id: 1, Descripcion: "Localidad 1" }],
    });
    global.fetch = mockFetch;
  });

  it("renderiza formulario con campos obligatorios", async () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña \*/i)).toBeInTheDocument();
  });

  it("muestra error cuando las contraseñas no coinciden", async () => {
    render(<RegistrationForm />);
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Localidad 1" });
    await user.type(screen.getByLabelText(/apellido/i), "Perez");
    await user.type(screen.getByLabelText(/^Nombre \*/i), "Juan");
    await user.type(screen.getByLabelText(/dirección/i), "Calle 123");
    await user.type(screen.getByLabelText(/correo electrónico/i), "juan@test.com");
    await user.selectOptions(screen.getByLabelText(/localidad/i), "1");
    await user.type(screen.getByLabelText(/nombre de usuario/i), "juanperez");
    await user.type(screen.getByLabelText(/^contraseña \*/i), "12345678");
    await user.type(screen.getByLabelText(/confirmar contraseña \*/i), "87654321");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it("muestra error cuando la contraseña tiene menos de 8 caracteres", async () => {
    render(<RegistrationForm />);
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Localidad 1" });
    await user.type(screen.getByLabelText(/apellido/i), "Perez");
    await user.type(screen.getByLabelText(/^Nombre \*/i), "Juan");
    await user.type(screen.getByLabelText(/dirección/i), "Calle 123");
    await user.type(screen.getByLabelText(/correo electrónico/i), "juan@test.com");
    await user.selectOptions(screen.getByLabelText(/localidad/i), "1");
    await user.type(screen.getByLabelText(/nombre de usuario/i), "juanperez");
    await user.type(screen.getByLabelText(/^contraseña \*/i), "1234");
    await user.type(screen.getByLabelText(/confirmar contraseña \*/i), "1234");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    });
  });

  it("muestra error cuando el email no es válido", async () => {
    render(<RegistrationForm />);
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Localidad 1" });
    await user.type(screen.getByLabelText(/apellido/i), "Perez");
    await user.type(screen.getByLabelText(/^Nombre \*/i), "Juan");
    await user.type(screen.getByLabelText(/dirección/i), "Calle 123");
    await user.type(screen.getByLabelText(/correo electrónico/i), "emailinvalido");
    await user.selectOptions(screen.getByLabelText(/localidad/i), "1");
    await user.type(screen.getByLabelText(/nombre de usuario/i), "juanperez");
    await user.type(screen.getByLabelText(/^contraseña \*/i), "12345678");
    await user.type(screen.getByLabelText(/confirmar contraseña \*/i), "12345678");

    const form = screen.getByRole("button", { name: /crear cuenta/i }).closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/el email no es válido/i)).toBeInTheDocument();
    });
  });
});
