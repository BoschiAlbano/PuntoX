import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/DB/prisma";
import {
  aplicarLimites,
  consumirLimite,
  ipDelCliente,
  reiniciarLimite,
  respuestaLimiteExcedido,
  type ReglaLimite,
} from "./rateLimit";

vi.mock("@/DB/prisma", () => ({ default: { $queryRaw: vi.fn(), $executeRaw: vi.fn() } }));

const regla: ReglaLimite = { nombre: "prueba:ip", limite: 3, ventanaSeg: 60 };

/** Simula la fila que devuelve el INSERT ... RETURNING. */
const fila = (conteo: number, restan = 40) =>
  vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ conteo, restan }] as any);

describe("reiniciarLimite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("borra la misma clave (hasheada) que usa consumirLimite", async () => {
    fila(1);
    await consumirLimite(regla, "Ana");
    await reiniciarLimite(regla, "ana");
    const [, claveConsumo] = vi.mocked(prisma.$queryRaw).mock.calls[0];
    const [sql, claveBorrada] = vi.mocked(prisma.$executeRaw).mock.calls[0];
    expect(sql.join("?")).toContain('DELETE FROM "RateLimit"');
    expect(claveBorrada).toBe(claveConsumo);
  });

  it("si la base falla, no lanza error", async () => {
    vi.mocked(prisma.$executeRaw).mockRejectedValueOnce(new Error("db caída"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(reiniciarLimite(regla, "ana")).resolves.toBeUndefined();
  });
});

describe("consumirLimite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite hasta el límite y bloquea al superarlo", async () => {
    fila(3);
    expect(await consumirLimite(regla, "1.2.3.4")).toEqual({ ok: true, restantes: 0 });
    fila(4, 25);
    expect(await consumirLimite(regla, "1.2.3.4")).toEqual({ ok: false, reintentarEnSeg: 25 });
  });

  it("guarda un hash, no la IP ni el usuario en texto plano", async () => {
    fila(1);
    await consumirLimite(regla, "200.45.10.7");
    const [, clave] = vi.mocked(prisma.$queryRaw).mock.calls[0];
    expect(clave).toMatch(/^prueba:ip:[0-9a-f]{32}$/);
    expect(String(clave)).not.toContain("200.45.10.7");
  });

  it("no distingue mayúsculas (Ana y ana cuentan juntos)", async () => {
    fila(1);
    fila(1);
    await consumirLimite(regla, "Ana");
    await consumirLimite(regla, "ana");
    const claves = vi.mocked(prisma.$queryRaw).mock.calls.map((c) => c[1]);
    expect(claves[0]).toBe(claves[1]);
  });

  it("si la base falla, permite el pedido (fail open)", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("db caída"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await consumirLimite(regla, "1.2.3.4")).toEqual({ ok: true, restantes: 3 });
    errorSpy.mockRestore();
  });
});

describe("aplicarLimites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve null si todas las reglas permiten", async () => {
    fila(1);
    fila(1);
    const res = await aplicarLimites([
      { regla, valor: "ip" },
      { regla: { ...regla, nombre: "prueba:usuario" }, valor: "ana" },
    ]);
    expect(res).toBeNull();
  });

  it("corta en la primera regla excedida y no consume las siguientes", async () => {
    fila(9, 120);
    const res = await aplicarLimites([
      { regla, valor: "ip" },
      { regla: { ...regla, nombre: "prueba:usuario" }, valor: "ana" },
    ]);
    expect(res?.status).toBe(429);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});

describe("respuestaLimiteExcedido", () => {
  it("responde 429 con Retry-After y mensaje en castellano", async () => {
    const seg = respuestaLimiteExcedido(30);
    expect(seg.status).toBe(429);
    expect(seg.headers.get("Retry-After")).toBe("30");
    expect((await seg.json()).error).toBe("Demasiados intentos. Probá de nuevo en 30 segundos.");
    expect((await respuestaLimiteExcedido(61).json()).error).toBe(
      "Demasiados intentos. Probá de nuevo en 2 minutos.",
    );
  });
});

describe("ipDelCliente", () => {
  const req = (headers: Record<string, string>) =>
    new NextRequest("http://localhost/api/x", { headers });

  it("toma la primera IP de x-forwarded-for", () => {
    expect(ipDelCliente(req({ "x-forwarded-for": "200.1.1.1, 10.0.0.1" }))).toBe("200.1.1.1");
  });
  it("usa x-real-ip o 'desconocida' como respaldo", () => {
    expect(ipDelCliente(req({ "x-real-ip": "190.2.2.2" }))).toBe("190.2.2.2");
    expect(ipDelCliente(req({}))).toBe("desconocida");
  });
});
