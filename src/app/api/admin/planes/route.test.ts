/**
 * Planes SaaS: los límites llegan como campos validados (Limites) y se
 * guardan como JSON. Antes eran texto libre y un error de tipeo dejaba el
 * plan sin ningún límite.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PATCH } from "./route";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { parsePlanFeatures } from "@/lib/planes/features";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({
  default: {
    planSaaS: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const LIMITES_BASICO = { maxSucursales: 1, maxUsuarios: 3, maxArticulos: 1000, incluyeAFIP: true };

const pedido = (method: string, body: unknown) =>
  new NextRequest("http://localhost/api/admin/planes", { method, body: JSON.stringify(body) });

const filaPlan = (caracteristicas: string | null) => ({
  Id: 2n,
  Nombre: "Plan Básico",
  Descripcion: null,
  CostoMensual: 25000,
  Caracteristicas: caracteristicas,
  _count: { Tenants: 1 },
});

describe("/api/admin/planes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({ isSuperAdmin: true } as any);
  });

  it("GET devuelve los límites ya parseados", async () => {
    vi.mocked(prisma.planSaaS.findMany).mockResolvedValue([
      filaPlan(JSON.stringify(LIMITES_BASICO)),
    ] as any);
    vi.mocked(prisma.planSaaS.count).mockResolvedValue(1);
    const data = await (await GET(new NextRequest("http://localhost/api/admin/planes"))).json();
    expect(data.data[0].Limites).toEqual(LIMITES_BASICO);
    expect(data.data[0]).not.toHaveProperty("Caracteristicas");
  });

  it("POST guarda los límites como JSON que parsePlanFeatures entiende", async () => {
    vi.mocked(prisma.planSaaS.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.planSaaS.create).mockImplementation(
      (async ({ data }: any) => ({ Id: 5n, ...data })) as any,
    );
    const limitesPro = { maxSucursales: null, maxUsuarios: null, maxArticulos: null, incluyeAFIP: true };
    const res = await POST(
      pedido("POST", { Nombre: "Plan Pro", CostoMensual: 60000, Limites: limitesPro }),
    );
    expect(res.status).toBe(200);
    const guardado = vi.mocked(prisma.planSaaS.create).mock.calls[0][0].data.Caracteristicas;
    expect(parsePlanFeatures(guardado as string)).toEqual(limitesPro);
    expect((await res.json()).Limites).toEqual(limitesPro);
  });

  it.each([
    ["límite en 0", { ...LIMITES_BASICO, maxUsuarios: 0 }],
    ["límite decimal", { ...LIMITES_BASICO, maxArticulos: 10.5 }],
    ["límite como texto", { ...LIMITES_BASICO, maxSucursales: "3" }],
    ["sin incluyeAFIP", { maxSucursales: 1, maxUsuarios: 3, maxArticulos: 100 }],
  ])("POST rechaza %s sin guardar nada", async (_caso, limites) => {
    const res = await POST(pedido("POST", { Nombre: "X", CostoMensual: 1, Limites: limites }));
    expect(res.status).toBe(400);
    expect(prisma.planSaaS.create).not.toHaveBeenCalled();
  });

  it("POST rechaza un plan sin límites (antes quedaba ilimitado)", async () => {
    const res = await POST(pedido("POST", { Nombre: "X", CostoMensual: 1 }));
    expect(res.status).toBe(400);
  });

  it("PATCH actualiza solo los límites si es lo único que llega", async () => {
    vi.mocked(prisma.planSaaS.update).mockResolvedValue(
      filaPlan(JSON.stringify({ ...LIMITES_BASICO, maxUsuarios: 5 })) as any,
    );
    const res = await PATCH(pedido("PATCH", { Id: 2, Limites: { ...LIMITES_BASICO, maxUsuarios: 5 } }));
    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.planSaaS.update).mock.calls[0][0].data;
    expect(Object.keys(data)).toEqual(["Caracteristicas"]);
    expect(parsePlanFeatures(data.Caracteristicas as string).maxUsuarios).toBe(5);
  });

  it("solo el superadmin puede crear planes", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ isSuperAdmin: false } as any);
    const res = await POST(pedido("POST", { Nombre: "X", CostoMensual: 1, Limites: LIMITES_BASICO }));
    expect(res.status).toBe(403);
  });
});
