/**
 * Tipos de errores específicos para el manejo consistente de errores en la aplicación
 */

export enum ErrorCode {
  // Errores de autenticación (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  
  // Errores de autorización (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  
  // Errores de validación (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  
  // Errores de recursos (404)
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
  
  // Errores de conflicto (409)
  CONFLICT = "CONFLICT",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  
  // Errores del servidor (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  
  // Errores de conexión (503)
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  statusCode: number;
}

export class AppErrorClass extends Error implements AppError {
  code: ErrorCode;
  statusCode: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Factory functions para crear errores específicos
 */
export const createError = {
  unauthorized: (message = "No autenticado", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.UNAUTHORIZED, message, 401, details);
  },

  forbidden: (message = "No tienes permisos para realizar esta acción", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.FORBIDDEN, message, 403, details);
  },

  validation: (message = "Error de validación", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.VALIDATION_ERROR, message, 400, details);
  },

  notFound: (message = "Recurso no encontrado", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.NOT_FOUND, message, 404, details);
  },

  conflict: (message = "Conflicto con el estado actual", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.CONFLICT, message, 409, details);
  },

  internal: (message = "Error interno del servidor", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.INTERNAL_ERROR, message, 500, details);
  },

  database: (message = "Error de base de datos", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.DATABASE_ERROR, message, 500, details);
  },

  serviceUnavailable: (message = "Servicio no disponible", details?: unknown): AppErrorClass => {
    return new AppErrorClass(ErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
  },
};

