/**
 * Header x-sucursal-id: antes, para administradores y superadmins no se
 * verificaba nada y podían mandar el Id de una sucursal de OTRO comercio.
 * Ahora la sucursal tiene que existir y ser del tenant (admins) o estar
 * asignada al usuario (empleados).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/DB/prisma";
import { getAuthContext, invalidateUserCache } from "./getAuthUser";

vi.mock("./requestContext", () => ({
  getRequestAuthContext: vi.fn().mockReturnValue(null),
  setRequestAuthContext: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(null) }),
}));
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "auth-1", app_metadata: { tenantId: 1, permissions: [] } } },
      }),
    },
  }),
}));
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
    usuarioSucursal: { count: vi.fn() },
    sucursal: { count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

const conPerfil = (Tipo: string) =>
  vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
    Id: 10n,
    EstaBloqueado: false,
    PerfilUsuario: [{ Perfiles: { Tipo } }],
  } as any);

// Ids distintos en cada test para no pegarle a la cache de 30 s.
let n = 100;
const pedido = (sucursal: string) =>
  new NextRequest("http://localhost/api/x", { headers: { "x-sucursal-id": sucursal } });

describe("getAuthContext - x-sucursal-id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateUserCache("auth-1");
  });

  it("administrador: rechaza una sucursal que no es de su comercio", async () => {
    conPerfil("ADMINISTRADOR");
    vi.mocked(prisma.sucursal.count).mockResolvedValue(0);
    const id = String(n++);
    await expect(getAuthContext({ req: pedido(id) })).rejects.toThrow(
      "No tienes acceso a la sucursal solicitada",
    );
    expect(prisma.sucursal.count).toHaveBeenCalledWith({
      where: { Id: BigInt(id), TenantId: 1n, EstaEliminado: false },
    });
  });

  it("administrador: acepta cualquier sucursal de su comercio", async () => {
    conPerfil("ADMINISTRADOR");
    vi.mocked(prisma.sucursal.count).mockResolvedValue(1);
    const ctx = await getAuthContext({ req: pedido(String(n++)) });
    expect(ctx.isAdministrador).toBe(true);
    expect(prisma.usuarioSucursal.count).not.toHaveBeenCalled();
  });

  it("empleado: sigue exigiendo que la sucursal esté asignada", async () => {
    conPerfil("EMPLEADO");
    vi.mocked(prisma.usuarioSucursal.count).mockResolvedValue(0);
    await expect(getAuthContext({ req: pedido(String(n++)) })).rejects.toThrow(
      "No tienes acceso a la sucursal solicitada",
    );
  });

  it("rechaza un header que no es un número (antes daba error 500)", async () => {
    conPerfil("ADMINISTRADOR");
    await expect(getAuthContext({ req: pedido("abc") })).rejects.toThrow(
      "No tienes acceso a la sucursal solicitada",
    );
    expect(prisma.sucursal.count).not.toHaveBeenCalled();
  });
});
