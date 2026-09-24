"use server";

import { DEMO_USER } from "@/lib/data/demo-user";
import { eventRuleInput, getEvent, getListing, rulesFor } from "@/lib/data/store";
import { splitAmount } from "@/lib/money/fees";
import { getPaymentProvider } from "@/lib/payments";
import { checkPurchase } from "@/lib/rules/engine";
import type { BuyerIdentifier } from "@/lib/rules/types";
import { addHours } from "@/lib/time";

export type CheckoutState =
  | { status: "form"; errors: string[] }
  | { status: "pix"; pixCopyPaste: string; totalCents: number; expiresAt: string };

const PIX_EXPIRATION_HOURS = 1;

export async function startCheckout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const listing = getListing(String(form.get("anuncio") ?? ""));
  const event = listing && getEvent(listing.eventId);
  if (!listing || !event) return { status: "form", errors: ["Anúncio não encontrado."] };

  const quantity = Number(form.get("quantidade"));
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > listing.quantityAvailable) {
    return { status: "form", errors: ["Quantidade indisponível."] };
  }

  const identifiers: Partial<Record<BuyerIdentifier, string>> = {};
  for (const id of ["EMAIL", "CPF", "NOME_COMPLETO", "QUENTRO_ID"] as const) {
    const value = String(form.get(id) ?? "").trim();
    if (value) identifiers[id] = value;
  }

  const violations = checkPurchase(
    rulesFor(event),
    eventRuleInput(event),
    {
      buyerId: DEMO_USER.id,
      sellerId: listing.sellerId,
      buyerVerified: DEMO_USER.verified,
      buyerIdentifiers: identifiers,
      ticketType: listing.ticketType,
      buyerDeclaresHalfPriceEligible: form.get("meia") === "on",
    },
    new Date(),
  );
  if (!form.get("termos")) violations.push({ code: "TERMOS", message: "Aceite as condições da compra garantida." });
  if (violations.length > 0) return { status: "form", errors: violations.map((v) => v.message) };

  const { totalCents, sellerNetCents } = splitAmount(
    listing.priceCents * quantity,
    Number(process.env.PLATFORM_FEE_BPS ?? 1000),
  );
  const expiresAt = addHours(new Date(), PIX_EXPIRATION_HOURS);
  // TODO: criar o pedido (AGUARDANDO_PAGAMENTO) e reservar a quantidade até o Pix expirar.
  const charge = await getPaymentProvider().createPixCharge({
    orderId: `demo-${Date.now()}`,
    totalCents,
    sellerNetCents,
    sellerWalletId: "demo-wallet",
    buyer: { name: DEMO_USER.name, cpf: DEMO_USER.cpf, email: DEMO_USER.email },
    expiresAt,
    description: `${event.name} - ${listing.sector} (${quantity}x)`,
  });

  return { status: "pix", pixCopyPaste: charge.pixCopyPaste, totalCents, expiresAt: expiresAt.toISOString() };
}
