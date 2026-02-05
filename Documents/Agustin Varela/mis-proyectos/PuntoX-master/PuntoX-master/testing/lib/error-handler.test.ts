import { describe, expect, it, vi } from "vitest";
import { createError } from "@/lib/errors/types";
import {
  handleError,
  isDatabaseConnectionError,
  withErrorHandler,
} from "@/lib/errors/handler";

describe("isDatabaseConnectionError", () => {
  it("detecta codigos de conexion de Prisma y red", () => {
    expect(isDatabaseConnectionError({ code: "P1001" })).toBe(true);
    expect(isDatabaseConnectionError({ code: "ECONNREFUSED" })).toBe(true);
  });

  it("retorna false para objetos sin codigo o codigos no mapeados", () => {
    expect(isDatabaseConnectionError({})).toBe(false);
    expect(isDatabaseConnectionError({ code: "P2002" })).toBe(false);
    expect(isDatabaseConnectionError("error")).toBe(false);
  });
});

describe("handleError", () => {
  it("respeta AppErrorClass y su status code", async () => {
    const response = handleError(createError.validation("Dato invalido"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
    expect(data.error.message).toBe("Dato invalido");
  });

  it("mapea errores de conexion a status 503", async () => {
    const response = handleError({ code: "P1001" });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("retorna 500 para errores genericos", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = handleError(new Error("boom"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("INTERNAL_ERROR");
    consoleSpy.mockRestore();
  });
});

describe("withErrorHandler", () => {
  it("devuelve la respuesta original si no hay excepcion", async () => {
    const wrapped = withErrorHandler(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const response = await wrapped();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("atrapa excepciones y delega en handleError", async () => {
    const wrapped = withErrorHandler(async () => {
      throw new Error("fallo wrapper");
    });

    const response = await wrapped();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
