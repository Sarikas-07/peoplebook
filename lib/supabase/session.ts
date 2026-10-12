import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ROLE, PROTECTED_PREFIXES } from "@/lib/constants";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getClaims() checks the signed session token locally (and refreshes it when it expires), so most
  // requests need no round trip to Supabase. A slow or flaky connection no longer signs you out.
  const { data } = await supabase.auth.getClaims();
  // Signed in is not enough: the account must carry the admin role (also enforced by RLS).
  const role = (data?.claims?.app_metadata as { role?: string } | undefined)?.role;
  const isAdmin = role === ADMIN_ROLE;
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  if (!isAdmin && (isProtected || path === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url, 303);
  }
  if (isAdmin && (path === "/login" || path === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url, 303);
  }
  return response;
}
