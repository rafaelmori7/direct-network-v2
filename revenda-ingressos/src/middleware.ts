import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, REF_COOKIE_DAYS, isValidPartnerSlug } from "@/lib/partners/slug";

/**
 * Guarda de qual parceiro o comprador veio (último clique, 30 dias):
 * - página do parceiro: /timelapse
 * - qualquer link com ?ref=timelapse
 * O slug é conferido no banco só na hora da compra.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const fromPath = segments.length === 1 ? segments[0].toLowerCase() : null;
  const ref = (searchParams.get("ref") ?? fromPath ?? "").toLowerCase();
  const response = NextResponse.next();
  if (ref && isValidPartnerSlug(ref)) {
    response.cookies.set(REF_COOKIE, ref, {
      maxAge: REF_COOKIE_DAYS * 24 * 3600,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)"],
};
