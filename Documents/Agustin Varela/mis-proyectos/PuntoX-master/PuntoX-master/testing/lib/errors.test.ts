/**
 * Tests para el sistema de manejo de errores
 */
import { describe, it, expect } from "vitest";
import { createError, AppErrorClass, ErrorCode } from "@/lib/errors/types";

describe("createError", () => {
  it("debe crear un error de no autorizado con valores por defecto", () => {
    const error = createError.unauthorized();

    expect(error).toBeInstanceOf(AppErrorClass);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.message).toBe("No autenticado");
    expect(error.statusCode).toBe(401);
  });

  it("debe crear un error de no autorizado con mensaje personalizado", () => {
    const error = createError.unauthorized("Sesión expirada");

    expect(error.message).toBe("Sesión expirada");
    expect(error.statusCode).toBe(401);
  });

  it("debe crear un error de prohibido", () => {
    const error = createError.forbidden();

    expect(error.code).toBe(ErrorCode.FORBIDDEN);
    expect(error.statusCode).toBe(403);
  });

  it("debe crear un error de validación", () => {
    const error = createError.validation("Campo requerido");

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Campo requerido");
  });

  it("debe crear un error de no encontrado", () => {
    const error = createError.notFound("Usuario no encontrado");

    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  it("debe crear un error de conflicto", () => {
    const error = createError.conflict("El recurso ya existe");

    expect(error.code).toBe(ErrorCode.CONFLICT);
    expect(error.statusCode).toBe(409);
  });

  it("debe crear un error interno", () => {
    const error = createError.internal("Error inesperado");

    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
  });

  it("debe crear un error de base de datos", () => {
    const error = createError.database("Error de conexión");

    expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.statusCode).toBe(500);
  });

  it("debe crear un error de servicio no disponible", () => {
    const error = createError.serviceUnavailable("Servicio temporalmente no disponible");

    expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(error.statusCode).toBe(503);
  });

  it("debe incluir detalles opcionales en el error", () => {
    const details = { field: "email", reason: "invalid format" };
    const error = createError.validation("Error de validación", details);

    expect(error.details).toEqual(details);
  });

  it("debe crear errores con diferentes mensajes y detalles", () => {
    const error1 = createError.validation("Error 1", { field: "name" });
    const error2 = createError.validation("Error 2", { field: "email" });

    expect(error1.message).toBe("Error 1");
    expect(error1.details).toEqual({ field: "name" });
    expect(error2.message).toBe("Error 2");
    expect(error2.details).toEqual({ field: "email" });
  });
});

describe("AppErrorClass", () => {
  it("debe ser una instancia de Error", () => {
    const error = createError.internal("Test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppErrorClass);
  });

  it("debe tener las propiedades correctas", () => {
    const error = createError.validation("Test", { field: "test" });

    expect(error).toHaveProperty("code");
    expect(error).toHaveProperty("message");
    expect(error).toHaveProperty("statusCode");
    expect(error).toHaveProperty("details");
    expect(error.name).toBe("AppError");
  });
});
