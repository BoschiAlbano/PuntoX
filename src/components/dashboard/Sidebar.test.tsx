/**
 * Tests mínimos para Sidebar: render y enlaces de menú.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ventas",
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
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

  it("muestra enlaces Productos y Clientes", () => {
    render(<Sidebar isCollapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /productos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clientes/i })).toBeInTheDocument();
  });
});
