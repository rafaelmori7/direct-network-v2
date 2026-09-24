"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/admin";
import { getEvent, eventRuleInput, rulesFor } from "@/lib/data/repo";
import { prisma } from "@/lib/db";
import { isSaleClosed } from "@/lib/rules/engine";

export async function setListingStatus(listingId: string, status: "ATIVO" | "REMOVIDO"): Promise<void> {
  await requireAdminAction();
  const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId }, include: { seller: true } });
  let next: "ATIVO" | "REMOVIDO" | "ENCERRADO" = status;
  if (status === "ATIVO") {
    if (listing.seller.blockedAt) throw new Error("Vendedor bloqueado.");
    const event = await getEvent(listing.eventId);
    if (!event || isSaleClosed(rulesFor(event), eventRuleInput(event), new Date())) next = "ENCERRADO";
  }
  await prisma.listing.update({ where: { id: listingId }, data: { status: next } });
  revalidatePath("/admin/anuncios");
}
