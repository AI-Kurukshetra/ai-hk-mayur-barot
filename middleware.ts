import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/about", "/for-pathologies", "/for-facilities", "/features", "/blog", "/learn-more"]);

function withSessionCookies(base: NextResponse, target: NextResponse) {
  for (const cookie of base.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...(options ?? {}) }));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isApi = pathname.startsWith("/api");
  const isAuthCallback = pathname.startsWith("/auth/callback");

  if (isApi || isAuthCallback) {
    return response;
  }

  if (!user && !isAuthPage) {
    if (PUBLIC_ROUTES.has(pathname)) {
      return response;
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return withSessionCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user && isAuthPage) {
    return withSessionCookies(response, NextResponse.redirect(new URL("/overview", request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

