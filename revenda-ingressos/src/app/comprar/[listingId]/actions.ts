"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REF_COOKIE } from "@/lib/partners/attribution";
import { getCurrentUser } from "@/lib/auth/session";
import { createOrder } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";
import type { BuyerIdentifier } from "@/lib/rules/types";

export type CheckoutState = { errors: string[] };

export async function startCheckout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) return { errors: ["Entre na sua conta para comprar."] };
  if (!form.get("termos")) return { errors: ["Aceite as condições da compra garantida."] };

  const identifiers: Partial<Record<BuyerIdentifier, string>> = {};
  for (const id of ["EMAIL", "CPF", "NOME_COMPLETO", "QUENTRO_ID"] as const) {
    const value = String(form.get(id) ?? "").trim();
    if (value) identifiers[id] = value;
  }

  const result = await createOrder(
    {
      listingId: String(form.get("anuncio") ?? ""),
      buyer: { id: user.id, name: user.name, cpf: user.cpf, email: user.email, canBuy: user.canBuy },
      quantity: Number(form.get("quantidade")),
      identifiers,
      buyerDeclaresHalfPriceEligible: form.get("meia") === "on",
      feeBps: Number(process.env.PLATFORM_FEE_BPS ?? 1000),
      couponCode: String(form.get("cupom") ?? "") || null,
      refSlug: (await cookies()).get(REF_COOKIE)?.value ?? null,
    },
    getPaymentProvider(),
  );
  if (!result.ok) return { errors: result.errors };
  redirect(`/pedidos/${result.orderId}`);
}
