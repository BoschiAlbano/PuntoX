import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/DB/prisma";
import { assertPuedeActuarSobreDueno, idDuenoDelTenant } from "./dueno";

vi.mock("@/DB/prisma", () => ({ default: { tenant: { findUnique: vi.fn() } } }));

const base = { tenantId: 4, isSuperAdmin: false, accion: "bloquear" };

describe("dueño del comercio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ UsuarioDuenoId: 5n } as any);
  });

  it("idDuenoDelTenant devuelve el usuario dueño", async () => {
    expect(await idDuenoDelTenant(4)).toBe(5n);
  });

  it("otro administrador no puede actuar sobre el dueño", async () => {
    await expect(
      assertPuedeActuarSobreDueno({ ...base, usuarioAfectadoId: 5, actorId: 6 }),
    ).rejects.toThrow("No podés bloquear al dueño del comercio.");
  });

  it("el dueño sí puede actuar sobre sí mismo", async () => {
    await expect(
      assertPuedeActuarSobreDueno({ ...base, usuarioAfectadoId: 5, actorId: 5 }),
    ).resolves.toBeUndefined();
  });

  it("el superadmin puede actuar sobre el dueño (sin consultar)", async () => {
    await expect(
      assertPuedeActuarSobreDueno({ ...base, isSuperAdmin: true, usuarioAfectadoId: 5, actorId: 1 }),
    ).resolves.toBeUndefined();
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it("sobre cualquier otro usuario no restringe nada", async () => {
    await expect(
      assertPuedeActuarSobreDueno({ ...base, usuarioAfectadoId: 7, actorId: 6 }),
    ).resolves.toBeUndefined();
  });

  it("un comercio sin dueño no restringe nada", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ UsuarioDuenoId: null } as any);
    await expect(
      assertPuedeActuarSobreDueno({ ...base, usuarioAfectadoId: 5, actorId: 6 }),
    ).resolves.toBeUndefined();
  });
});
