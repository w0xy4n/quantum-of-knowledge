import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/** Fast redirect hints only; every page and API still verifies the session server-side. */
export async function updateSession(request: NextRequest, extraRequestHeaders: Record<string, string> = {}) {
  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(extraRequestHeaders)) headers.set(key, value);
  const user = getSessionCookie(request.headers);
  const path = request.nextUrl.pathname;

  const redirect = (pathname: string, includeNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    if (includeNext) url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  };

  if (path === "/") return redirect(user ? "/dashboard" : "/preview");
  const protectedPage = ["/dashboard", "/groups", "/schedule", "/settings", "/join"].some((prefix) => path.startsWith(prefix));
  if (protectedPage && !user) return redirect("/auth/login", true);
  if ((path === "/auth/login" || path === "/auth/error") && user) return redirect("/dashboard");
  return NextResponse.next({ request: { headers } });
}
