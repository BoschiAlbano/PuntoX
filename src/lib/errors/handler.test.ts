/**
 * Tests unitarios para lib/errors/handler
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isDatabaseConnectionError,
  handlePrismaError,
  handleError,
} from "./handler";
import { AppErrorClass, createError, ErrorCode } from "./types";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";

describe("isDatabaseConnectionError", () => {
  it("retorna true para P1001", () => {
    expect(isDatabaseConnectionError({ code: "P1001" })).toBe(true);
  });
  it("retorna true para P1002", () => {
    expect(isDatabaseConnectionError({ code: "P1002" })).toBe(true);
  });
  it("retorna true para P1003", () => {
    expect(isDatabaseConnectionError({ code: "P1003" })).toBe(true);
  });
  it("retorna true para ECONNREFUSED", () => {
    expect(isDatabaseConnectionError({ code: "ECONNREFUSED" })).toBe(true);
  });
  it("retorna true para ETIMEDOUT", () => {
    expect(isDatabaseConnectionError({ code: "ETIMEDOUT" })).toBe(true);
  });
  it("retorna false para objeto sin code", () => {
    expect(isDatabaseConnectionError({})).toBe(false);
  });
  it("retorna false para código no de conexión", () => {
    expect(isDatabaseConnectionError({ code: "P2002" })).toBe(false);
  });
  it("retorna false para null/undefined", () => {
    expect(isDatabaseConnectionError(null)).toBe(false);
    expect(isDatabaseConnectionError(undefined)).toBe(false);
  });
});

describe("handlePrismaError", () => {
  it("convierte P2002 en error de conflicto (409)", () => {
    const err = new PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "x",
      meta: { target: ["email"] },
    });
    const appError = handlePrismaError(err);
    expect(appError.statusCode).toBe(409);
    expect(appError.code).toBe(ErrorCode.CONFLICT);
    expect(appError.message).toContain("existe");
  });
  it("convierte P2025 en notFound (404)", () => {
    const err = new PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "x",
    });
    const appError = handlePrismaError(err);
    expect(appError.statusCode).toBe(404);
    expect(appError.code).toBe(ErrorCode.NOT_FOUND);
  });
  it("convierte P2003 en validación (400)", () => {
    const err = new PrismaClientKnownRequestError("Foreign key", {
      code: "P2003",
      clientVersion: "x",
      meta: { field_name: "ClienteId" },
    });
    const appError = handlePrismaError(err);
    expect(appError.statusCode).toBe(400);
    expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
  it("convierte PrismaClientValidationError en validación (400)", () => {
    const err = new PrismaClientValidationError("Invalid value", { clientVersion: "x" });
    const appError = handlePrismaError(err);
    expect(appError.statusCode).toBe(400);
    expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
  it("convierte error desconocido en internal (500)", () => {
    const appError = handlePrismaError(new Error("generic"));
    expect(appError.statusCode).toBe(500);
    expect(appError.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});

describe("handleError", () => {
  it("retorna respuesta con status y body para AppErrorClass", async () => {
    const appError = createError.forbidden("Sin permiso");
    const res = handleError(appError);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe("Sin permiso");
    expect(data.error.code).toBe(ErrorCode.FORBIDDEN);
  });
  it("retorna 409 para error de conflicto Prisma P2002", async () => {
    const err = new PrismaClientKnownRequestError("Unique", {
      code: "P2002",
      clientVersion: "x",
    });
    const res = handleError(err);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.message).toContain("existe");
  });
  it("retorna 404 para P2025", async () => {
    const err = new PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "x",
    });
    const res = handleError(err);
    expect(res.status).toBe(404);
  });
  it("retorna 503 para error de conexión a BD", async () => {
    const res = handleError({ code: "P1001" });
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error.message).toContain("conectar");
  });
  it("retorna 500 para error genérico", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = handleError(new Error("Algo falló"));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe(ErrorCode.INTERNAL_ERROR);
    consoleSpy.mockRestore();
  });
});
