import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@repo/supabase/server";

/** Refresh the Supabase session cookie and gate the app behind login. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isPublic =
    isAuthPage || pathname.startsWith("/terms") || pathname.startsWith("/privacy");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // /api is excluded: handlers do their own auth via requireUser() and must
  // answer 401 JSON — a /login 307 would hand mobile clients an HTML page.
  // /ingest is excluded: the PostHog reverse proxy (next.config.js rewrites)
  // must accept events from logged-out visitors too (e.g. /login pageviews).
  matcher: [
    "/((?!api|ingest|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
