import { NextResponse } from "next/server";

/** Backward-compatible landing URL; Better Auth callbacks live under /api/auth. */
export function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const candidate = searchParams.get("next") || "/dashboard";
  const next = /^\/(?!\/)/.test(candidate) ? candidate : "/dashboard";
  return NextResponse.redirect(`${origin}${next}`);
}
