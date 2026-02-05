/**
 * Tests para helpers de seguridad requireSuperAdminServer / requireAuthServer / requireAuthCliente
 *
 * Cubre:
 * - Redirección cuando no hay usuario autenticado
 * - requireSuperAdminServer redirige si el usuario no existe en DB
 * - requireSuperAdminServer redirige si el usuario no es SUPERADMIN
 * - requireSuperAdminServer retorna datos cuando el usuario es SUPERADMIN
 * - requireAuthServer / requireAuthCliente redirigen cuando no hay usuario
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requireSuperAdminServer,
  requireAuthServer,
  requireAuthCliente,
  NorequireAuthServer,
} from "@/lib/requireSuperAdmin";
import { PerfilTipo } from "../../src/prisma/generated/prisma";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/browserClient", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findUnique: vi.fn(),
    },
  },
}));

describe("requireSuperAdmin / requireAuth helpers", () => {
  const mockRedirect = vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("next/navigation").redirect,
  );
  const mockSupabaseServer = vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@/lib/supabase/serverClient").getSupabaseServerClient,
  );
  const mockSupabaseBrowser = vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@/lib/supabase/browserClient").getSupabaseBrowserClient,
  );
  const mockPrisma = vi.mocked(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@/DB/prisma").default,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupServerUser = (user: any | null) => {
    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    } as any);
  };

  it("requireSuperAdminServer redirige cuando no hay usuario autenticado", async () => {
    setupServerUser(null);

    await requireSuperAdminServer({ redirectUrl: "/login" });

    expect(mockRedirect).toHaveBeenCalledWith("/login");
    expect(mockPrisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("requireSuperAdminServer redirige cuando el usuario no existe en la base de datos", async () => {
    setupServerUser({ id: "auth-1" });
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    await requireSuperAdminServer({ redirectUrl: "/no-access" });

    expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { AuthUserId: "auth-1" },
      include: {
        PerfilUsuario: {
          include: { Perfiles: true },
        },
      },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/no-access");
  });

  it("requireSuperAdminServer redirige cuando el usuario no tiene perfil SUPERADMIN", async () => {
    setupServerUser({ id: "auth-2" });
    mockPrisma.usuario.findUnique.mockResolvedValue({
      Id: BigInt(1),
      PerfilUsuario: [
        {
          Perfiles: {
            Tipo: PerfilTipo.EMPLEADO,
          },
        },
      ],
    } as any);

    await requireSuperAdminServer({ redirectUrl: "/no-access" });

    expect(mockRedirect).toHaveBeenCalledWith("/no-access");
  });

  it("requireSuperAdminServer retorna authUser y dbUser cuando el usuario es SUPERADMIN", async () => {
    const authUser = { id: "auth-3" };
    setupServerUser(authUser);

    mockPrisma.usuario.findUnique.mockResolvedValue({
      Id: BigInt(2),
      PerfilUsuario: [
        {
          Perfiles: {
            Tipo: PerfilTipo.SUPERADMIN,
          },
        },
      ],
    } as any);

    const result = await requireSuperAdminServer({ redirectUrl: "/no-access" });

    expect(result.authUser).toEqual(authUser);
    expect(result.dbUser.Id).toBe(BigInt(2));
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("requireAuthServer redirige cuando no hay usuario autenticado", async () => {
    setupServerUser(null);

    await requireAuthServer({ redirectUrl: "/login" });

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("requireAuthServer NO redirige cuando hay usuario autenticado", async () => {
    setupServerUser({ id: "auth-4" });

    await requireAuthServer({ redirectUrl: "/login" });

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("requireAuthCliente redirige en cliente cuando no hay usuario autenticado", async () => {
    mockSupabaseBrowser.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    await requireAuthCliente({ redirectUrl: "/login" });

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("NorequireAuthServer redirige cuando YA hay usuario autenticado (ej. login público)", async () => {
    setupServerUser({ id: "auth-5" });

    await NorequireAuthServer({ redirectUrl: "/dashboard" });

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("NorequireAuthServer no hace nada cuando no hay usuario (permite acceso público)", async () => {
    setupServerUser(null);

    await NorequireAuthServer({ redirectUrl: "/dashboard" });

    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

