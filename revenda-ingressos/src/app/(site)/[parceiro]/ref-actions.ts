"use server";

import { cookies } from "next/headers";
import { REF_COOKIE, REF_COOKIE_DAYS, isValidPartnerSlug } from "@/lib/partners/slug";

/** Grava a indicação quando a página do parceiro abre sem passar pelo middleware (ex.: redirect após login). */
export async function rememberPartner(slug: string): Promise<void> {
  if (!isValidPartnerSlug(slug)) return;
  (await cookies()).set(REF_COOKIE, slug, {
    maxAge: REF_COOKIE_DAYS * 24 * 3600,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
