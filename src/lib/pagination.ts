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
export function parsePaginationParams(req: { nextUrl: { searchParams: URLSearchParams } }): PaginationParams {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);

  // Validar valores
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Máximo 100 items por página

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
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
  const { page = 1, limit = 20 } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

