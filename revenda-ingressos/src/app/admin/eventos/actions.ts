"use server";

import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { parseEventForm, uniqueEventSlug } from "@/lib/events/form";

export type EventFormState = { errors: string[] };

export async function saveEvent(eventId: string | null, _prev: EventFormState, form: FormData): Promise<EventFormState> {
  await requireAdminAction();
  const parsed = await parseEventForm(form);
  if (!parsed.ok) return { errors: parsed.errors };
  if (eventId) await prisma.event.update({ where: { id: eventId }, data: parsed.data });
  else await prisma.event.create({ data: { ...parsed.data, slug: await uniqueEventSlug(String(parsed.data.name), parsed.startsAt) } });
  redirect("/admin/eventos");
}
