/**
 * Tests para GET /api/auth/me.
 * Estructura de referencia: src/app/api/marcas/route.test.ts (convención describe por método, mismo estilo de it y mocks).
 * Esta ruta no usa getAuthContext con permission; usa getSupabaseServerClient.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findUnique: vi.fn() },
  },
}));

describe("GET /api/auth/me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("retorna 404 cuando el usuario no existe en DB", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-123" } },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("retorna 200 con user, tenant y permissions cuando existe", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-123" } },
          error: null,
        }),
      },
    } as any);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      Id: 1,
      Nombre: "juan",
      Password: "hash",
      Persona_Empleado: {
        Persona: {
          Nombre: "Juan",
          Apellido: "Pérez",
          Mail: "juan@test.com",
        },
      },
      Tenant: {
        Id: 1,
        Nombre: "Tenant",
        Plan: {
          Caracteristicas:
            '{"maxSucursales":1,"maxUsuarios":3,"maxArticulos":100,"incluyeAFIP":false}',
        },
        _count: { Sucursales: 1, Usuarios: 2, Articulos: 50 },
      },
      Sucursales: [],
      PerfilUsuario: [],
    } as any);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.Usuario).toBe("juan");
    expect(data.tenant).toBeDefined();
    expect(data.permissions).toEqual([]);
    expect(data.planFeatures).toEqual({
      maxSucursales: 1,
      maxUsuarios: 3,
      maxArticulos: 100,
      incluyeAFIP: false,
    });
    expect(data.planUsage).toEqual({ sucursales: 1, usuarios: 2, articulos: 50 });
  });
});
