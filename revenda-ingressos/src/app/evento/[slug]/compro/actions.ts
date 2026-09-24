"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getEventBySlug } from "@/lib/data/repo";
import { prisma } from "@/lib/db";
import { parseBRLToCents } from "@/lib/format";

export type WantedState = { errors: string[] };

export async function createWanted(_prev: WantedState, form: FormData): Promise<WantedState> {
  const user = await getCurrentUser();
  if (!user) return { errors: ["Entre na sua conta para publicar."] };
  const event = await getEventBySlug(String(form.get("evento") ?? ""));
  if (!event) return { errors: ["Evento não encontrado."] };

  const sector = String(form.get("setor") ?? "").trim() || null;
  const quantity = Number(form.get("quantidade"));
  const maxRaw = String(form.get("precoMaximo") ?? "").trim();
  const maxPriceCents = maxRaw ? parseBRLToCents(maxRaw) : null;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4) return { errors: ["Quantidade inválida."] };
  if (maxPriceCents !== null && (!Number.isFinite(maxPriceCents) || maxPriceCents <= 0)) {
    return { errors: ["Preço máximo inválido."] };
  }

  await prisma.wantedPost.create({ data: { eventId: event.id, buyerId: user.id, sector, quantity, maxPriceCents } });
  redirect(`/evento/${event.slug}`);
}
