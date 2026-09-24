import { randomUUID } from "node:crypto";
import { PLATFORMS } from "@/lib/platforms/profiles";
import { effectiveRules } from "@/lib/rules/engine";
import type { EventRuleInput, PlatformCode, RuleProfile, TicketType, TransferAllowed } from "@/lib/rules/types";
import { addDays, addHours } from "@/lib/time";

// Armazenamento em memória para desenvolver as telas sem banco. Será trocado
// pelo Prisma (mesmos formatos) quando o cadastro e o login entrarem.

export type Category = "Música Eletrônica" | "Sertanejo" | "Rock" | "Samba e Pagode" | "Festivais" | "Shows" | "Rap e Trap" | "Esportes";

export const CATEGORIES: Category[] = [
  "Música Eletrônica",
  "Festivais",
  "Shows",
  "Rock",
  "Sertanejo",
  "Samba e Pagode",
  "Rap e Trap",
  "Esportes",
];

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  venue: string;
  city: string;
  category: Category;
  platform: PlatformCode;
  startsAt: Date;
  endsAt: Date;
  isSports: boolean;
  transferAllowed: TransferAllowed;
  nominalBiometric: boolean;
  transferOpensAt: Date | null;
  transferEndsAt: Date | null;
  officialResaleActive: boolean;
  overrides: Partial<RuleProfile>;
  /** Cor do cartaz provisório (0–360) enquanto não há imagem do evento. */
  hue: number;
  /** Setores e valores de face, para ajudar o vendedor a preencher. */
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

interface Store {
  events: EventRecord[];
  listings: ListingRecord[];
  wanted: WantedRecord[];
}

const globalStore = globalThis as unknown as { __revendaStore?: Store };

function store(): Store {
  globalStore.__revendaStore ??= seed(new Date());
  return globalStore.__revendaStore;
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
  return effectiveRules(PLATFORMS[event.platform].profile, eventRuleInput(event));
}

export function listEvents(filter: { q?: string; category?: string } = {}): EventRecord[] {
  const q = normalize(filter.q ?? "");
  return store()
    .events.filter((e) => e.endsAt > new Date())
    .filter((e) => !filter.category || e.category === filter.category)
    .filter((e) => !q || normalize(`${e.name} ${e.venue} ${e.city}`).includes(q))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function getEventBySlug(slug: string): EventRecord | undefined {
  return store().events.find((e) => e.slug === slug);
}

export function getEvent(id: string): EventRecord | undefined {
  return store().events.find((e) => e.id === id);
}

export function listingsForEvent(eventId: string): ListingRecord[] {
  return store()
    .listings.filter((l) => l.eventId === eventId && l.quantityAvailable > 0)
    .sort((a, b) => a.priceCents - b.priceCents);
}

export function getListing(id: string): ListingRecord | undefined {
  return store().listings.find((l) => l.id === id);
}

export function wantedForEvent(eventId: string): WantedRecord[] {
  return store()
    .wanted.filter((w) => w.eventId === eventId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function ticketsListedBySeller(eventId: string, sellerId: string): number {
  return store()
    .listings.filter((l) => l.eventId === eventId && l.sellerId === sellerId)
    .reduce((sum, l) => sum + l.quantityAvailable, 0);
}

export function addListing(listing: Omit<ListingRecord, "id" | "createdAt">): ListingRecord {
  const record = { ...listing, id: randomUUID(), createdAt: new Date() };
  store().listings.push(record);
  return record;
}

export function addWanted(wanted: Omit<WantedRecord, "id" | "createdAt">): WantedRecord {
  const record = { ...wanted, id: randomUUID(), createdAt: new Date() };
  store().wanted.push(record);
  return record;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Dados de demonstração, com datas relativas a hoje para as janelas estarem abertas.

function at(base: Date, days: number, hourBrt: number): Date {
  const day = addDays(base, days);
  const key = new Date(day.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  return new Date(Date.parse(`${key}T00:00:00Z`) + (hourBrt + 3) * 3600_000);
}

function seed(now: Date): Store {
  const ev = (
    e: Omit<EventRecord, "id" | "endsAt" | "transferOpensAt" | "transferEndsAt" | "overrides" | "isSports" | "nominalBiometric" | "officialResaleActive"> &
      Partial<EventRecord> & { hours: number },
  ): EventRecord => ({
    id: e.slug,
    endsAt: addHours(e.startsAt, e.hours),
    transferOpensAt: null,
    transferEndsAt: null,
    overrides: {},
    isSports: false,
    nominalBiometric: false,
    officialResaleActive: false,
    ...e,
  });

  const events: EventRecord[] = [
    ev({
      slug: "adriatique-x-future",
      name: "Adriatique — X-Future",
      venue: "Arca",
      city: "São Paulo, SP",
      category: "Música Eletrônica",
      platform: "INGRESSE",
      startsAt: at(now, 9, 23),
      hours: 8,
      transferAllowed: "SIM",
      hue: 265,
      sectors: [
        { name: "Pista", faceValueCents: 42_000 },
        { name: "Pista Social", faceValueCents: 38_000 },
        { name: "Área VIP", faceValueCents: 95_000 },
        { name: "Backstage", faceValueCents: 120_000 },
      ],
    }),
    ev({
      slug: "arca-de-noe-eden-sp",
      name: "Arca de Noé — Éden SP",
      venue: "Éden",
      city: "São Paulo, SP",
      category: "Música Eletrônica",
      platform: "INGRESSE",
      startsAt: at(now, 2, 22),
      hours: 8,
      transferAllowed: "SIM",
      hue: 330,
      sectors: [
        { name: "Pista Masculino", faceValueCents: 18_000 },
        { name: "Pista Feminino", faceValueCents: 12_000 },
      ],
    }),
    ev({
      slug: "sunset-5521-sp",
      name: "Sunset 5521 SP",
      venue: "Bosque Esperia",
      city: "São Paulo, SP",
      category: "Festivais",
      platform: "SYMPLA",
      startsAt: at(now, 30, 17),
      hours: 11,
      transferAllowed: "SIM",
      hue: 28,
      sectors: [
        { name: "Open Bar Masculino", faceValueCents: 39_000 },
        { name: "Open Bar Feminino", faceValueCents: 29_000 },
      ],
    }),
    ev({
      slug: "a-liga-sonora-garden",
      name: "A Liga",
      venue: "Sonora Garden",
      city: "São Paulo, SP",
      category: "Samba e Pagode",
      platform: "SYMPLA",
      startsAt: at(now, 16, 16),
      hours: 7,
      transferAllowed: "SIM",
      hue: 145,
      sectors: [
        { name: "Pista", faceValueCents: 8_000 },
        { name: "Área VIP", faceValueCents: 10_000 },
      ],
    }),
    ev({
      slug: "a-perfect-circle-puscifer",
      name: "A Perfect Circle + Puscifer",
      venue: "Suhai Music Hall",
      city: "São Paulo, SP",
      category: "Rock",
      platform: "TICKETMASTER",
      startsAt: at(now, 26, 21),
      hours: 4,
      transferAllowed: "SIM",
      hue: 215,
      sectors: [
        { name: "Pista", faceValueCents: 56_000 },
        { name: "Mezanino 2º Piso", faceValueCents: 89_000 },
      ],
    }),
    ev({
      slug: "festival-quentro-exemplo",
      name: "Festival de Verão",
      venue: "Autódromo",
      city: "São Paulo, SP",
      category: "Festivais",
      platform: "TICKETMASTER",
      startsAt: at(now, 60, 12),
      hours: 12,
      transferAllowed: "SIM",
      hue: 190,
      sectors: [{ name: "Pista", faceValueCents: 79_000 }],
    }),
    ev({
      slug: "classico-exemplo",
      name: "Clássico no Pacaembu",
      venue: "Mercado Pago Hall",
      city: "São Paulo, SP",
      category: "Esportes",
      platform: "SYMPLA",
      startsAt: at(now, 12, 16),
      hours: 3,
      isSports: true,
      transferAllowed: "DESCONHECIDO",
      hue: 100,
      sectors: [{ name: "Arquibancada", faceValueCents: 17_000 }],
    }),
  ];

  const l = (
    eventId: string,
    sellerName: string,
    sector: string,
    ticketType: TicketType,
    quantityAvailable: number,
    priceCents: number,
    faceValueCents: number,
    hoursAgo: number,
  ): ListingRecord => ({
    id: randomUUID(),
    eventId,
    sellerId: `seed-${sellerName}`,
    sellerName,
    sector,
    ticketType,
    quantityAvailable,
    priceCents,
    faceValueCents,
    createdAt: addHours(now, -hoursAgo),
  });

  const listings = [
    l("adriatique-x-future", "Juan", "Pista", "INTEIRA", 1, 50_000, 42_000, 2),
    l("adriatique-x-future", "Juan", "Área VIP", "INTEIRA", 1, 105_000, 95_000, 2),
    l("adriatique-x-future", "Isabela", "Pista Social", "MEIA_SOCIAL", 1, 47_000, 38_000, 5),
    l("adriatique-x-future", "Diego", "Pista Social", "MEIA_SOCIAL", 2, 40_000, 38_000, 9),
    l("adriatique-x-future", "Carol", "Backstage", "INTEIRA", 1, 100_000, 120_000, 20),
    l("arca-de-noe-eden-sp", "Pedro", "Pista Masculino", "INTEIRA", 1, 17_000, 18_000, 11),
    l("sunset-5521-sp", "Marina", "Open Bar Feminino", "INTEIRA", 2, 30_000, 29_000, 30),
    l("a-liga-sonora-garden", "Gabriel", "Área VIP", "INTEIRA", 3, 10_000, 10_000, 3),
    l("a-perfect-circle-puscifer", "Rafa", "Pista", "MEIA", 1, 30_000, 28_000, 6),
  ];

  const w = (eventId: string, buyerName: string, sector: string | null, maxPriceCents: number | null, hoursAgo: number): WantedRecord => ({
    id: randomUUID(),
    eventId,
    buyerName,
    sector,
    ticketType: null,
    quantity: 1,
    maxPriceCents,
    createdAt: addHours(now, -hoursAgo),
  });

  const wanted = [
    w("adriatique-x-future", "Jota", "Pista", 45_000, 1),
    w("adriatique-x-future", "Leo", null, null, 4),
    w("sunset-5521-sp", "Beatriz", "Open Bar Feminino", 28_000, 12),
  ];

  return { events, listings, wanted };
}
