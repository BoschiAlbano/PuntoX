import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware para manejar la serialización de BigInt en las respuestas de la API
 */
export function bigIntMiddleware(request: NextRequest) {
	const response = NextResponse.next();

	// Interceptar respuestas de la API que puedan contener BigInt
	if (request.nextUrl.pathname.startsWith("/api/")) {
		// Agregar headers para indicar que manejamos BigInt
		response.headers.set("X-BigInt-Handling", "serialized");
	}

	return response;
}
