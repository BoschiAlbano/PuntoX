import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Intentar obtener el token con diferentes configuraciones
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Especificar el nombre de la cookie explícitamente
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
  });

  const { pathname } = req.nextUrl;

  console.log("🔍 Middleware Debug:");
  console.log("  - Pathname:", pathname);
  console.log("  - Token:", token);
  console.log(
    "  - Cookies:",
    req.cookies.getAll().map((c) => c.name)
  );

  // Si el usuario está autenticado, permitir acceso
  if (token) {
    console.log("✅ Usuario autenticado, permitiendo acceso");
    return NextResponse.next();
  }

  // Si no está autenticado, redirigir a signin
  console.log("❌ Usuario NO autenticado, redirigiendo a signin");
  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    // "/ventas/:path*",
    // "/panel/:path*",
    // "/test",
    // Proteger todas las rutas excepto las públicas
    // "/((?!api|_next/static|_next/image|favicon.ico|signin|signup).*)",

    "/((?!api|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp)$|signin|signup).*)",
  ],
};
