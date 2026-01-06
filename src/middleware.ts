import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Cache simple para verificación de sesión en middleware (evita verificar en cada request)
const sessionCache = new Map<string, { valid: boolean; timestamp: number }>();
const SESSION_CACHE_TTL = 10 * 1000; // 10 segundos de cache

// Limpiar cache expirado periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > SESSION_CACHE_TTL) {
      sessionCache.delete(key);
    }
  }
}, 30 * 1000); // Limpiar cada 30 segundos

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    "/",
    "/signin",
    "/signup",
    "/favicon.ico",
    "/favicon-light.ico",
    "/favicon-dark.ico",
    "/new-tenant",
  ];

  const isPublic =
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/) ||
    publicPaths.some((p) => pathname.startsWith(p));

  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  if (isPublic) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Faltan variables de entorno de Supabase para la autenticacion."
    );
    return response;
  }

  // Obtener session token de cookies para usar como cache key
  const sessionToken =
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get("sb-refresh-token")?.value ||
    "unknown";
  const cacheKey = `${sessionToken}-${pathname}`;

  // Verificar cache primero
  const cached = sessionCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < SESSION_CACHE_TTL) {
    if (cached.valid) {
      return response;
    } else {
      // Sesión inválida en cache, redirigir
      const signInUrl = new URL("/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options) {
        response.cookies.set({
          name,
          value: "",
          ...options,
          maxAge: 0,
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Actualizar cache
  sessionCache.set(cacheKey, {
    valid: !!session,
    timestamp: now,
  });

  // Limitar tamaño del cache (mantener solo últimos 500)
  if (sessionCache.size > 500) {
    const entries = Array.from(sessionCache.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    sessionCache.clear();
    entries.slice(0, 500).forEach(([key, value]) => {
      sessionCache.set(key, value);
    });
  }

  if (session) {
    return response;
  }

  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp)$|signin|signup|new-tenant).*)",
  ],
};
