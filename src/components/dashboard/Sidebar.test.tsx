/**
 * Tests mínimos para Sidebar: render y enlaces de menú.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ventas",
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  // Badge de cobros pendientes (solo activo con cobro diferido)
  useQuery: () => ({ data: undefined }),
}));
vi.mock("@/hooks/useConfiguracion", () => {
  const value = { configuracion: { puestoCajaSeparado: false } };
  return { useConfiguracion: () => value };
});
vi.mock("@/components/auth/sessionProvider", () => ({
  useSupabaseAuthContext: () => ({ session: { user: {} } }),
}));
vi.mock("@/lib/permissions/routePermissions", () => ({
  filtrarRutasPorPermisos: (_: any, items: any[]) => items,
}));
vi.mock("@/components/sucursal", () => ({
  SucursalSelector: () => <div data-testid="sucursal-selector">Sucursal</div>,
}));
vi.mock("@/store/useUserStore", () => ({
  useUserStore: () => ({
    branches: [{ Id: 1, Nombre: "Central" }],
    roles: [{ Tipo: "EMPLEADO" }],
    canAccessRoute: () => true,
    tenant: { OnboardingCompleto: true }, // sin esto los links apuntan a "#"
    isSuperAdmin: false,
  }),
}));
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

describe("Sidebar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza sin crash y muestra enlace Ventas", () => {
    render(<Sidebar isCollapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /ventas/i })).toBeInTheDocument();
  });

  it("agrupa la navegación en secciones y muestra Productos al abrir Artículos", async () => {
    render(<Sidebar isCollapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^clientes$/i })).toBeInTheDocument();
    const articulos = screen.getByRole("button", { name: /^artículos$/i });
    fireEvent.click(articulos);
    expect(
      await screen.findByRole("link", { name: /^productos$/i }),
    ).toHaveAttribute("href", "/productos");
  });
});
