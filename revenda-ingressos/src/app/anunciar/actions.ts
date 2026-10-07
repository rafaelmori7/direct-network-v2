"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { eventRuleInput, getEventBySlug, rulesFor, ticketsListedBySeller } from "@/lib/data/repo";
import { prisma } from "@/lib/db";
import { parseBRLToCents } from "@/lib/format";
import { checkListing } from "@/lib/rules/engine";
import type { TicketType } from "@/lib/rules/types";

export type FormState = { errors: string[] };

const TICKET_TYPES: TicketType[] = ["INTEIRA", "MEIA", "MEIA_SOCIAL", "CORTESIA"];

export async function createListing(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: ["Entre na sua conta para anunciar."] };

  const event = await getEventBySlug(String(form.get("evento") ?? ""));
  if (!event) return { errors: ["Evento não encontrado."] };

  const sector = String(form.get("setor") ?? "").trim();
  const ticketType = String(form.get("tipo") ?? "") as TicketType;
  const quantity = Number(form.get("quantidade"));
  const priceCents = parseBRLToCents(String(form.get("preco") ?? ""));
  const faceValueCents = parseBRLToCents(String(form.get("valorOriginal") ?? ""));
  const purchasedAtRaw = String(form.get("dataCompra") ?? "");
  const purchasedAt = new Date(`${purchasedAtRaw}T12:00:00-03:00`);
  const orderRef = String(form.get("pedido") ?? "").trim();
  const sellerDeclaresOriginalBuyer = form.get("compradorOriginal") === "on";

  const errors: string[] = [];
  if (!sector) errors.push("Informe o setor.");
  if (!TICKET_TYPES.includes(ticketType)) errors.push("Escolha o tipo de ingresso.");
  if (!Number.isFinite(priceCents)) errors.push("Preço inválido.");
  if (!Number.isFinite(faceValueCents) || faceValueCents <= 0) errors.push("Informe o valor original pago.");
  if (!purchasedAtRaw || Number.isNaN(purchasedAt.getTime())) errors.push("Informe a data da compra.");
  if (!orderRef) errors.push("Informe o número do pedido na ticketeira (usado só em caso de disputa).");
  if (!form.get("confirmaTransferencia")) errors.push("Confirme que vai transferir pelo app oficial dentro do prazo.");
  if (errors.length > 0) return { errors };

  const violations = checkListing(
    rulesFor(event),
    eventRuleInput(event),
    { priceCents, faceValueCents, quantity, purchasedAt, sellerDeclaresOriginalBuyer },
    { verified: user.canSell, ticketsAlreadyListedForEvent: await ticketsListedBySeller(event.id, user.id) },
    new Date(),
  );
  if (violations.length > 0) return { errors: violations.map((v) => v.message) };

  await prisma.listing.create({
    data: {
      eventId: event.id,
      sellerId: user.id,
      sector,
      ticketType,
      quantity,
      quantityAvailable: quantity,
      priceCents,
      faceValueCents,
      purchasedAt,
      platformOrderRef: orderRef,
      sellerDeclaresOriginalBuyer,
    },
  });
  redirect(`/evento/${event.slug}`);
}
