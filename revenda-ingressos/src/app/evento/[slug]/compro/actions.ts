"use server";

import { redirect } from "next/navigation";
import { DEMO_USER } from "@/lib/data/demo-user";
import { addWanted, getEventBySlug } from "@/lib/data/store";
import { parseBRLToCents } from "@/lib/format";

export type WantedState = { errors: string[] };

export async function createWanted(_prev: WantedState, form: FormData): Promise<WantedState> {
  const event = getEventBySlug(String(form.get("evento") ?? ""));
  if (!event) return { errors: ["Evento não encontrado."] };

  const sector = String(form.get("setor") ?? "").trim() || null;
  const quantity = Number(form.get("quantidade"));
  const maxRaw = String(form.get("precoMaximo") ?? "").trim();
  const maxPriceCents = maxRaw ? parseBRLToCents(maxRaw) : null;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4) return { errors: ["Quantidade inválida."] };
  if (maxPriceCents !== null && (!Number.isFinite(maxPriceCents) || maxPriceCents <= 0)) {
    return { errors: ["Preço máximo inválido."] };
  }

  addWanted({ eventId: event.id, buyerName: DEMO_USER.name, sector, ticketType: null, quantity, maxPriceCents });
  redirect(`/evento/${event.slug}`);
}
