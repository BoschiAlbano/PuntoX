/**
 * Helpers para paginación en API Routes
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Parsea los parámetros de paginación desde query params
 */
export function parsePaginationParams(req: {
  nextUrl: { searchParams: URLSearchParams };
}): PaginationParams {
  const pageParam = req.nextUrl.searchParams.get("page") || "1";
  const limitParam = req.nextUrl.searchParams.get("limit") || "20";
  
  const page = parseInt(pageParam, 10);
  const limit = parseInt(limitParam, 10);

  // Validar valores (manejar NaN)
  const validPage = isNaN(page) ? 1 : Math.max(1, page);
  // Validar límite: mínimo 1, máximo 100, y no puede ser 0
  const validLimit = isNaN(limit) 
    ? 20 
    : limit === 0 
      ? 20 // Si es 0, usar valor por defecto
      : Math.min(Math.max(1, limit), 100); // Máximo 100 items por página

  // Límite máximo de página para evitar problemas de memoria (ej: página 999999999)
  const MAX_PAGE = 10000; // Límite razonable
  const finalPage = validPage > MAX_PAGE ? MAX_PAGE : validPage;

  return {
    page: finalPage,
    limit: validLimit,
    skip: (finalPage - 1) * validLimit,
  };
}

/**
 * Crea la respuesta paginada
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginationResult<T> {
  const { page = 1, limit = 10 } = params;
  
  // Validar que total no sea negativo
  const validTotal = Math.max(0, total);
  
  // Validar que limit no sea 0 para evitar división por cero
  const validLimit = limit === 0 ? 10 : limit;
  
  const totalPages = validLimit > 0 ? Math.ceil(validTotal / validLimit) : 0;

  return {
    data,
    pagination: {
      page,
      limit: validLimit,
      total: validTotal,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
