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
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn().mockResolvedValue({ auth: { getUser } }),
}));
/** El estado de suscripción se cachea por tenant: cada caso usa uno distinto. */
const conTenant = (tenantId: number) =>
  getUser.mockResolvedValue({
    data: { user: { id: "auth-1", app_metadata: { tenantId, permissions: [] } } },
  });
vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: { findFirst: vi.fn() },
    usuarioSucursal: { count: vi.fn() },
    sucursal: { count: vi.fn() },
    tenant: { findUnique: vi.fn() },
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
    conTenant(1);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      EstaActivo: true,
      FechaVencimiento: null,
    } as any);
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

describe("getAuthContext - suscripción del comercio", () => {
  const hace = (dias: number) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  let tenant = 500;

  beforeEach(() => {
    vi.clearAllMocks();
    conTenant(++tenant);
  });

  const conSuscripcion = (EstaActivo: boolean, FechaVencimiento: Date | null) =>
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ EstaActivo, FechaVencimiento } as any);

  it("en la semana de gracia sigue funcionando", async () => {
    conPerfil("ADMINISTRADOR");
    conSuscripcion(true, hace(5));
    await expect(getAuthContext()).resolves.toMatchObject({ tenantId: tenant });
  });

  it("pasada la gracia responde 403 con el motivo para el cliente", async () => {
    conPerfil("EMPLEADO");
    conSuscripcion(true, hace(10));
    await expect(getAuthContext()).rejects.toMatchObject({
      statusCode: 403,
      details: { motivo: "SUSCRIPCION_BLOQUEADA", estado: "vencida" },
    });
  });

  it("un comercio desactivado a mano también queda bloqueado", async () => {
    conPerfil("ADMINISTRADOR");
    conSuscripcion(false, null);
    await expect(getAuthContext()).rejects.toMatchObject({
      details: { estado: "desactivada" },
    });
  });

  it("el superadmin nunca queda bloqueado", async () => {
    conPerfil("SUPERADMIN");
    conSuscripcion(false, hace(30));
    await expect(getAuthContext()).resolves.toMatchObject({ isSuperAdmin: true });
  });

  it("permitirSuscripcionBloqueada deja pasar (pantalla de suscripción vencida)", async () => {
    conPerfil("ADMINISTRADOR");
    conSuscripcion(true, hace(30));
    await expect(getAuthContext({ permitirSuscripcionBloqueada: true })).resolves.toBeTruthy();
  });
});
