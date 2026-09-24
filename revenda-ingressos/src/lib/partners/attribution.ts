import type { Partner } from "@prisma/client";
import { prisma } from "@/lib/db";

export { REF_COOKIE, REF_COOKIE_DAYS, RESERVED_SLUGS, isValidPartnerSlug } from "./slug";

export type Attribution = "CUPOM" | "LINK" | "EVENTO";

export interface ResolvedPartner {
  partner: Partner;
  attribution: Attribution;
  /** Desconto só para quem chegou pelo link ou usou o cupom. */
  applyDiscount: boolean;
}

/**
 * Qual parceiro ganha nesta venda (um por pedido):
 * 1. cupom digitado no checkout; 2. link/página do parceiro (cookie, último clique);
 * 3. dono do evento. Parceiro inativo não conta.
 */
export async function resolvePartner(input: {
  couponCode?: string | null;
  refSlug?: string | null;
  eventPartnerId?: string | null;
}): Promise<ResolvedPartner | null> {
  const coupon = input.couponCode?.trim().toUpperCase();
  if (coupon) {
    const partner = await prisma.partner.findUnique({ where: { couponCode: coupon } });
    if (partner?.active) return { partner, attribution: "CUPOM", applyDiscount: true };
  }
  const slug = input.refSlug?.trim().toLowerCase();
  if (slug) {
    const partner = await prisma.partner.findUnique({ where: { slug } });
    if (partner?.active) return { partner, attribution: "LINK", applyDiscount: true };
  }
  if (input.eventPartnerId) {
    const partner = await prisma.partner.findUnique({ where: { id: input.eventPartnerId } });
    if (partner?.active) return { partner, attribution: "EVENTO", applyDiscount: false };
  }
  return null;
}
