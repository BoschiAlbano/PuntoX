import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserStore } from "./useUserStore";

vi.mock("@heroui/react", () => ({ addToast: vi.fn() }));

const datosSuperadmin = {
  user: { Id: "1", Nombre: "superadmin", Email: "" },
  tenant: { Id: "1", OnboardingCompleto: true },
  branches: [{ Id: "10", Nombre: "Central", EsPrincipal: true, esDefault: true }],
  currentBranch: { Id: "10", Nombre: "Central", EsPrincipal: true, esDefault: true },
  permissions: ["ventas.ver"],
  roles: [{ Id: "1", Descripcion: "SuperAdmin", Tipo: "SUPERADMIN" }],
  planFeatures: null,
  planUsage: null,
};

describe("useUserStore.reset", () => {
  beforeEach(() => {
    useUserStore.getState().reset();
    vi.restoreAllMocks();
  });

  it("borra los datos del usuario anterior y permite volver a inicializar", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(datosSuperadmin)));
    await useUserStore.getState().initialize();
    expect(useUserStore.getState().user?.Nombre).toBe("superadmin");
    expect(useUserStore.getState().isSuperAdmin).toBe(true);

    useUserStore.getState().reset();
    const s = useUserStore.getState();
    expect(s.user).toBeNull();
    expect(s.roles).toEqual([]);
    expect(s.permissions).toEqual([]);
    expect(s.branches).toEqual([]);
    expect(s.tenant).toBeNull();
    expect(s.isSuperAdmin).toBe(false);
    expect(s.isInitialized).toBe(false);

    // El próximo usuario se carga de nuevo (antes initialize() no hacía nada)
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...datosSuperadmin,
          user: { Id: "2", Nombre: "jose.cortez", Email: "" },
          roles: [{ Id: "3", Descripcion: "Empleado", Tipo: "EMPLEADO" }],
        }),
      ),
    );
    await useUserStore.getState().initialize();
    expect(useUserStore.getState().user?.Nombre).toBe("jose.cortez");
    expect(useUserStore.getState().isSuperAdmin).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
