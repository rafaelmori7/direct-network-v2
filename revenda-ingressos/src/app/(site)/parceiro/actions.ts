"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePartnerAction } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { parseEventForm, uniqueEventSlug } from "@/lib/events/form";

export type PartnerEventState = { errors: string[] };

/** A agência cria e edita só os próprios eventos; o dono é sempre ela. */
export async function savePartnerEvent(eventId: string | null, _prev: PartnerEventState, form: FormData): Promise<PartnerEventState> {
  const user = await requirePartnerAction();
  const parsed = await parseEventForm(form);
  if (!parsed.ok) return { errors: parsed.errors };
  const data = { ...parsed.data, partnerId: user.partner.id };
  if (eventId) {
    const existing = await prisma.event.findUnique({ where: { id: eventId }, select: { partnerId: true } });
    if (existing?.partnerId !== user.partner.id) return { errors: ["Este evento não é da sua agência."] };
    await prisma.event.update({ where: { id: eventId }, data });
  } else {
    await prisma.event.create({ data: { ...data, slug: await uniqueEventSlug(String(data.name), parsed.startsAt) } });
  }
  redirect("/parceiro");
}

export async function updateBranding(form: FormData): Promise<void> {
  const user = await requirePartnerAction();
  const color = String(form.get("cor") ?? "");
  const logoUrl = String(form.get("logo") ?? "").trim();
  await prisma.partner.update({
    where: { id: user.partner.id },
    data: {
      ...(/^#[0-9a-fA-F]{6}$/.test(color) && { color }),
      logoUrl: /^https:\/\//.test(logoUrl) ? logoUrl : null,
    },
  });
  revalidatePath("/parceiro");
}
