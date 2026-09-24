import type { Event, Listing, Platform, Prisma, WantedPost } from "@prisma/client";
import { prisma } from "@/lib/db";
import { effectiveRules } from "@/lib/rules/engine";
import type { EventRuleInput, PlatformCode, RuleProfile, TicketType, TransferAllowed } from "@/lib/rules/types";

export const CATEGORIES = [
  "Música Eletrônica",
  "Festivais",
  "Shows",
  "Rock",
  "Sertanejo",
  "Samba e Pagode",
  "Rap e Trap",
  "Esportes",
] as const;

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  venue: string;
  city: string;
  category: string;
  platform: PlatformCode;
  platformName: string;
  profile: RuleProfile;
  startsAt: Date;
  endsAt: Date;
  isSports: boolean;
  transferAllowed: TransferAllowed;
  nominalBiometric: boolean;
  transferOpensAt: Date | null;
  transferEndsAt: Date | null;
  officialResaleActive: boolean;
  overrides: Partial<RuleProfile>;
  hue: number;
  imageUrl: string | null;
  sectors: { name: string; faceValueCents: number }[];
}

export interface ListingRecord {
  id: string;
  eventId: string;
  sellerId: string;
  sellerName: string;
  sector: string;
  ticketType: TicketType;
  quantityAvailable: number;
  priceCents: number;
  faceValueCents: number;
  createdAt: Date;
}

export interface WantedRecord {
  id: string;
  eventId: string;
  buyerName: string;
  sector: string | null;
  ticketType: TicketType | null;
  quantity: number;
  maxPriceCents: number | null;
  createdAt: Date;
}

type EventWithPlatform = Event & { platform: Platform };

function toEventRecord(e: EventWithPlatform): EventRecord {
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    venue: e.venue,
    city: e.city,
    category: e.category,
    platform: e.platform.code,
    platformName: e.platform.name,
    profile: e.platform.profile as unknown as RuleProfile,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    isSports: e.isSports,
    transferAllowed: e.transferAllowed,
    nominalBiometric: e.nominalBiometric,
    transferOpensAt: e.transferOpensAt,
    transferEndsAt: e.transferEndsAt,
    officialResaleActive: e.officialResaleActive,
    overrides: e.ruleOverrides as Partial<RuleProfile>,
    hue: e.hue,
    imageUrl: e.imageUrl,
    sectors: e.sectors as EventRecord["sectors"],
  };
}

function toListingRecord(l: Listing & { seller: { name: string } }): ListingRecord {
  return {
    id: l.id,
    eventId: l.eventId,
    sellerId: l.sellerId,
    sellerName: firstName(l.seller.name),
    sector: l.sector,
    ticketType: l.ticketType,
    quantityAvailable: l.quantityAvailable,
    priceCents: l.priceCents,
    faceValueCents: l.faceValueCents,
    createdAt: l.createdAt,
  };
}

function toWantedRecord(w: WantedPost & { buyer: { name: string } }): WantedRecord {
  return {
    id: w.id,
    eventId: w.eventId,
    buyerName: firstName(w.buyer.name),
    sector: w.sector,
    ticketType: w.ticketType,
    quantity: w.quantity,
    maxPriceCents: w.maxPriceCents,
    createdAt: w.createdAt,
  };
}

/** Só o primeiro nome aparece publicamente. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function eventRuleInput(event: EventRecord): EventRuleInput {
  return {
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    isSports: event.isSports,
    transferAllowed: event.transferAllowed,
    nominalBiometric: event.nominalBiometric,
    transferOpensAt: event.transferOpensAt,
    transferEndsAt: event.transferEndsAt,
    overrides: event.overrides,
  };
}

export function rulesFor(event: EventRecord): RuleProfile {
  return effectiveRules(event.profile, eventRuleInput(event));
}

export async function listEvents(filter: { q?: string; category?: string } = {}): Promise<EventRecord[]> {
  const q = filter.q?.trim();
  const where: Prisma.EventWhereInput = {
    endsAt: { gt: new Date() },
    ...(filter.category && { category: filter.category }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { venue: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const events = await prisma.event.findMany({ where, include: { platform: true }, orderBy: { startsAt: "asc" } });
  return events.map(toEventRecord);
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  const e = await prisma.event.findUnique({ where: { slug }, include: { platform: true } });
  return e && toEventRecord(e);
}

export async function getEvent(id: string): Promise<EventRecord | null> {
  const e = await prisma.event.findUnique({ where: { id }, include: { platform: true } });
  return e && toEventRecord(e);
}

export async function listingsForEvent(eventId: string): Promise<ListingRecord[]> {
  const listings = await prisma.listing.findMany({
    where: { eventId, status: "ATIVO", quantityAvailable: { gt: 0 } },
    include: { seller: { select: { name: true } } },
    orderBy: { priceCents: "asc" },
  });
  return listings.map(toListingRecord);
}

/** Resumo por evento para os cards da home: quantidade e menor preço. */
export async function listingSummary(eventIds: string[]) {
  const rows = await prisma.listing.groupBy({
    by: ["eventId"],
    where: { eventId: { in: eventIds }, status: "ATIVO", quantityAvailable: { gt: 0 } },
    _sum: { quantityAvailable: true },
    _min: { priceCents: true },
  });
  return new Map(rows.map((r) => [r.eventId, { available: r._sum.quantityAvailable ?? 0, cheapest: r._min.priceCents }]));
}

export async function getListing(id: string): Promise<ListingRecord | null> {
  const l = await prisma.listing.findUnique({ where: { id }, include: { seller: { select: { name: true } } } });
  return l && toListingRecord(l);
}

export async function wantedForEvent(eventId: string): Promise<WantedRecord[]> {
  const rows = await prisma.wantedPost.findMany({
    where: { eventId, active: true },
    include: { buyer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rows.map(toWantedRecord);
}

/** Ingressos que o vendedor tem anunciados (ainda disponíveis ou já vendidos) neste evento. */
export async function ticketsListedBySeller(eventId: string, sellerId: string): Promise<number> {
  const agg = await prisma.listing.aggregate({
    where: { eventId, sellerId, status: { not: "REMOVIDO" } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

/** Ingressos ainda disponíveis em todos os anúncios ativos do vendedor. */
export async function activeTicketsBySeller(sellerId: string): Promise<number> {
  const agg = await prisma.listing.aggregate({ where: { sellerId, status: "ATIVO" }, _sum: { quantityAvailable: true } });
  return agg._sum.quantityAvailable ?? 0;
}
