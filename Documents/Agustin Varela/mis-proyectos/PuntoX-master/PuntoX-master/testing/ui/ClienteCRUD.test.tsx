/**
 * Tests de UI para ClienteCRUD
 * - Verifica renderizado básico
 * - Verifica búsqueda
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../utils/renderWithProviders";
import ClienteCRUD from "@/components/clientes/ClienteCRUD";

// Mock de GenericCrud
vi.mock("@/components/shared/GenericCrud", () => ({
  default: ({ title, searchPlaceholder }: any) => (
    <div data-testid="generic-crud">
      <h1>{title}</h1>
      <input
        data-testid="search-input"
        placeholder={searchPlaceholder}
        aria-label="search"
      />
    </div>
  ),
}));

describe("ClienteCRUD - UI Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe renderizar el componente con título y buscador", () => {
    renderWithProviders(<ClienteCRUD />);

    expect(screen.getByText("Gestión de Clientes")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Buscar por nombre, email, dni")
    ).toBeInTheDocument();
  });
});
