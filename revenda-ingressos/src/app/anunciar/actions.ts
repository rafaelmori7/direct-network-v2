"use server";

import { redirect } from "next/navigation";
import { DEMO_USER } from "@/lib/data/demo-user";
import { addListing, eventRuleInput, getEventBySlug, rulesFor, ticketsListedBySeller } from "@/lib/data/store";
import { parseBRLToCents } from "@/lib/format";
import { checkListing } from "@/lib/rules/engine";
import type { TicketType } from "@/lib/rules/types";

export type FormState = { errors: string[] };

const TICKET_TYPES: TicketType[] = ["INTEIRA", "MEIA", "MEIA_SOCIAL", "CORTESIA"];

export async function createListing(_prev: FormState, form: FormData): Promise<FormState> {
  const event = getEventBySlug(String(form.get("evento") ?? ""));
  if (!event) return { errors: ["Evento não encontrado."] };

  const sector = String(form.get("setor") ?? "").trim();
  const ticketType = String(form.get("tipo") ?? "") as TicketType;
  const quantity = Number(form.get("quantidade"));
  const priceCents = parseBRLToCents(String(form.get("preco") ?? ""));
  const faceValueCents = parseBRLToCents(String(form.get("valorOriginal") ?? ""));
  const purchasedAtRaw = String(form.get("dataCompra") ?? "");
  const purchasedAt = new Date(`${purchasedAtRaw}T12:00:00-03:00`);
  const orderRef = String(form.get("pedido") ?? "").trim();

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
    { priceCents, faceValueCents, quantity, purchasedAt, sellerDeclaresOriginalBuyer: form.get("compradorOriginal") === "on" },
    { verified: DEMO_USER.verified, ticketsAlreadyListedForEvent: ticketsListedBySeller(event.id, DEMO_USER.id) },
    new Date(),
  );
  if (violations.length > 0) return { errors: violations.map((v) => v.message) };

  addListing({
    eventId: event.id,
    sellerId: DEMO_USER.id,
    sellerName: DEMO_USER.name,
    sector,
    ticketType,
    quantityAvailable: quantity,
    priceCents,
    faceValueCents,
  });
  redirect(`/evento/${event.slug}?anunciado=1`);
}
