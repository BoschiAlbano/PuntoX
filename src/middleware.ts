import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = [
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
