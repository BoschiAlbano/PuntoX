import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { procesarAvisosVencimiento } from "@/lib/suscripcion/avisos";

vi.mock("@/lib/suscripcion/avisos", () => ({
  procesarAvisosVencimiento: vi.fn(),
}));

const llamar = (headers: Record<string, string> = {}, host = "www.puntox.com.ar") =>
  GET(
    new NextRequest(`https://${host}/api/cron/suscripciones`, {
      headers: { host, ...headers },
    }),
  );

describe("GET /api/cron/suscripciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(procesarAvisosVencimiento).mockResolvedValue({ revisados: 1, avisos: [] });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rechaza sin el CRON_SECRET correcto", async () => {
    vi.stubEnv("CRON_SECRET", "secreto");
    expect((await llamar()).status).toBe(401);
    expect((await llamar({ authorization: "Bearer otro" })).status).toBe(401);
    expect(procesarAvisosVencimiento).not.toHaveBeenCalled();
  });

  it("procesa con el CRON_SECRET correcto", async () => {
    vi.stubEnv("CRON_SECRET", "secreto");
    const res = await llamar({ authorization: "Bearer secreto" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revisados: 1, avisos: [] });
  });

  it("sin CRON_SECRET solo permite localhost", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await llamar()).status).toBe(401);
    expect((await llamar({}, "localhost:3000")).status).toBe(200);
  });
});
