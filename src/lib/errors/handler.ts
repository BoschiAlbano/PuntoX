/**
 * Helper para manejo consistente de errores en API Routes
 */
import { NextResponse } from "next/server";
import { AppErrorClass, createError } from "./types";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { PermisoError } from "@/lib/requirePermiso";
import { ZodError } from "zod";

/**
 * Detecta si un error es de conexión a la base de datos
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    return (
      code === "P1001" || // Can't reach database server
      code === "P1002" || // Database timeout
      code === "P1003" || // Database does not exist
      code === "ECONNREFUSED" || // Connection refused
      code === "ETIMEDOUT" // Timeout
    );
  }
  return false;
}

/**
 * Convierte un error de Prisma a AppError
 */
export function handlePrismaError(error: unknown): AppErrorClass {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return createError.conflict(
          "Ya existe un recurso con estos valores únicos",
          {
            field: error.meta?.target,
          },
        );
      case "P2025":
        return createError.notFound(
          "El recurso que intentas actualizar no existe",
        );
      case "P2003":
        return createError.validation("Referencia inválida a otro recurso", {
          field: error.meta?.field_name,
        });
      default:
        if (isDatabaseConnectionError(error)) {
          return createError.serviceUnavailable(
            "No se pudo conectar a la base de datos",
          );
        }
        return createError.database("Error en la base de datos", {
          code: error.code,
        });
    }
  }

  if (error instanceof PrismaClientValidationError) {
    return createError.validation("Error de validación en los datos", {
      message: error.message,
    });
  }

  if (isDatabaseConnectionError(error)) {
    return createError.serviceUnavailable(
      "No se pudo conectar a la base de datos",
    );
  }

  return createError.internal("Error inesperado");
}

/**
 * Maneja errores y retorna una respuesta NextResponse apropiada
 */
export function handleError(error: unknown): NextResponse {
  // Si ya es un AppErrorClass, usarlo directamente
  if (error instanceof AppErrorClass) {
    const errorResponse: {
      code: string;
      message: string;
      details?: unknown;
    } = {
      code: error.code,
      message: error.message,
    };
    if (error.details) {
      errorResponse.details = error.details;
    }
    return NextResponse.json(
      {
        error: errorResponse,
      },
      { status: error.statusCode },
    );
  }

  // Si es un error de permisos/autorizacion, convertirlo al formato estandar
  if (error instanceof PermisoError) {
    const appError =
      error.status === 401
        ? createError.unauthorized(error.message)
        : createError.forbidden(error.message);

    return NextResponse.json(
      {
        error: {
          code: appError.code,
          message: appError.message,
        },
      },
      { status: appError.statusCode },
    );
  }

  // Si es un error de validacion de Zod, convertirlo al formato estandar
  if (error instanceof ZodError) {
    const appError = createError.validation("Datos inválidos", {
      issues: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });

    return NextResponse.json(
      {
        error: {
          code: appError.code,
          message: appError.message,
          details: appError.details,
        },
      },
      { status: appError.statusCode },
    );
  }

  // Si es un error de Prisma, convertirlo
  if (
    error instanceof PrismaClientKnownRequestError ||
    error instanceof PrismaClientValidationError
  ) {
    const appError = handlePrismaError(error);
    const errorResponse: {
      code: string;
      message: string;
      details?: unknown;
    } = {
      code: appError.code,
      message: appError.message,
    };
    if (appError.details) {
      errorResponse.details = appError.details;
    }
    return NextResponse.json(
      {
        error: errorResponse,
      },
      { status: appError.statusCode },
    );
  }

  // Si es un error de conexión a la BD
  if (isDatabaseConnectionError(error)) {
    const appError = createError.serviceUnavailable(
      "No se pudo conectar a la base de datos",
    );
    return NextResponse.json(
      {
        error: {
          code: appError.code,
          message: appError.message,
        },
      },
      { status: 503 },
    );
  }

  // Error genérico
  console.error("Error no manejado:", error);
  const appError = createError.internal("Error interno del servidor");
  return NextResponse.json(
    {
      error: {
        code: appError.code,
        message: appError.message,
      },
    },
    { status: 500 },
  );
}

/**
 * Wrapper para manejar errores en funciones async de API Routes
 */
export function withErrorHandler<
  T extends (...args: unknown[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  }) as T;
}
