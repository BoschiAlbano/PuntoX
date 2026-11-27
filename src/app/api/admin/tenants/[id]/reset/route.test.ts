/**
 * Reset de tienda: solo superadmin y con el nombre exacto del comercio.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "./route";
import prisma from "@/DB/prisma";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { conteoReset, resetearTienda } from "@/lib/tenant/reset";
import { registrarAuditoria } from "@/lib/auditoria/registrarAuditoria";
import { notificarAdministradores } from "@/lib/notificaciones/notificar";

vi.mock("@/lib/auth/requireSuperAdmin", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/DB/prisma", () => ({ default: { tenant: { findUnique: vi.fn() } } }));
vi.mock("@/lib/tenant/reset", () => ({ conteoReset: vi.fn(), resetearTienda: vi.fn() }));
vi.mock("@/lib/auditoria/registrarAuditoria", () => ({ registrarAuditoria: vi.fn() }));
vi.mock("@/lib/notificaciones/notificar", () => ({ notificarAdministradores: vi.fn() }));

const params = (id = "4") => ({ params: Promise.resolve({ id }) });
const resetear = (confirmacion: unknown) =>
  POST(
    new NextRequest("http://localhost/api/admin/tenants/4/reset", {
      method: "POST",
      body: JSON.stringify({ confirmacion }),
    }),
    params(),
  );

describe("/api/admin/tenants/[id]/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireSuperAdmin).mockResolvedValue({ isSuperAdmin: true, usuarioId: 1, tenantId: 1 } as any);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ Id: 4n, Nombre: "Test Plan Basico" } as any);
    vi.mocked(conteoReset).mockResolvedValue({ comprobantes: 3 } as any);
    vi.mocked(resetearTienda).mockResolvedValue({ comprobantes: 3, cajas: 1, gastos: 0 });
  });

  it("solo el superadmin puede verlo o ejecutarlo", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(
      NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    );
    expect((await GET(new NextRequest("http://localhost/x"), params())).status).toBe(403);
    expect((await resetear("Test Plan Basico")).status).toBe(403);
    expect(resetearTienda).not.toHaveBeenCalled();
  });

  it("GET devuelve el nombre y lo que se borraría", async () => {
    const data = await (await GET(new NextRequest("http://localhost/x"), params())).json();
    expect(data).toEqual({ nombre: "Test Plan Basico", comprobantes: 3 });
    expect(resetearTienda).not.toHaveBeenCalled();
  });

  it.each([["test plan basico"], ["Test Plan"], [""], [undefined]])(
    "no resetea si la confirmación no es el nombre exacto (%s)",
    async (confirmacion) => {
      const res = await resetear(confirmacion);
      expect(res.status).toBe(400);
      expect(resetearTienda).not.toHaveBeenCalled();
    },
  );

  it("con el nombre exacto resetea, audita y avisa a los administradores del comercio", async () => {
    const res = await resetear("  Test Plan Basico ");
    expect(res.status).toBe(200);
    expect(resetearTienda).toHaveBeenCalledWith(4n);
    expect(registrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 4n, accion: "RESET_TIENDA", usuarioId: 1 }),
    );
    expect(notificarAdministradores).toHaveBeenCalledWith(4n, expect.objectContaining({ titulo: "Se reinició la tienda" }));
  });

  it("404 si la tienda no existe", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
    expect((await resetear("x")).status).toBe(404);
  });
});
