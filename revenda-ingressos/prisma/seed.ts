import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { PLATFORMS } from "../src/lib/platforms/profiles";
import type { PlatformCode } from "../src/lib/rules/types";
import { addDays, addHours } from "../src/lib/time";

const prisma = new PrismaClient();

async function seedPlatforms() {
  for (const [code, { name, profile }] of Object.entries(PLATFORMS) as [PlatformCode, (typeof PLATFORMS)[PlatformCode]][]) {
    await prisma.platform.upsert({
      where: { code },
      create: { code, name, profile: profile as object },
      // Não sobrescreve o perfil: ele é ajustado pelo admin depois do seed.
      update: { name },
    });
  }
  console.log(`Ticketeiras: ${Object.keys(PLATFORMS).join(", ")}`);
}

/** Data em Brasília `days` dias a partir de hoje, na hora indicada. */
function brt(base: Date, days: number, hour: number): Date {
  const key = new Date(addDays(base, days).getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  return new Date(Date.parse(`${key}T00:00:00Z`) + (hour + 3) * 3600_000);
}

// Dados de demonstração (só com --demo). Senha de todos: "demo1234".
async function seedDemo() {
  const now = new Date();
  const passwordHash = await hashPassword("demo1234");
  const platforms = Object.fromEntries((await prisma.platform.findMany()).map((p) => [p.code, p.id]));

  const people = [
    ["Juan Pereira", "juan@demo.local", "52998224725"],
    ["Isabela Costa", "isabela@demo.local", "11144477735"],
    ["Diego Alves", "diego@demo.local", "39053344705"],
    ["Marina Souza", "marina@demo.local", "15350946056"],
    ["Admin Demo", "admin@demo.local", "71428793860"],
  ] as const;
  const users: Record<string, string> = {};
  for (const [name, email, cpf] of people) {
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        cpf,
        phone: "11999999999",
        birthDate: new Date("1995-05-10"),
        passwordHash,
        cpfCheckedAt: now,
        verifiedAt: now,
        isAdmin: email.startsWith("admin"),
      },
    });
    users[email] = u.id;
  }

  const events = [
    { slug: "adriatique-x-future", name: "Adriatique — X-Future", venue: "Arca", category: "Música Eletrônica", platform: "INGRESSE", startsAt: brt(now, 9, 23), hours: 8, hue: 265, transferAllowed: "SIM",
      sectors: [["Pista", 42_000], ["Pista Social", 38_000], ["Área VIP", 95_000], ["Backstage", 120_000]] },
    { slug: "arca-de-noe-eden-sp", name: "Arca de Noé — Éden SP", venue: "Éden", category: "Música Eletrônica", platform: "INGRESSE", startsAt: brt(now, 2, 22), hours: 8, hue: 330, transferAllowed: "SIM",
      sectors: [["Pista Masculino", 18_000], ["Pista Feminino", 12_000]] },
    { slug: "sunset-5521-sp", name: "Sunset 5521 SP", venue: "Bosque Esperia", category: "Festivais", platform: "SYMPLA", startsAt: brt(now, 30, 17), hours: 11, hue: 28, transferAllowed: "SIM",
      sectors: [["Open Bar Masculino", 39_000], ["Open Bar Feminino", 29_000]] },
    { slug: "a-perfect-circle-puscifer", name: "A Perfect Circle + Puscifer", venue: "Suhai Music Hall", category: "Rock", platform: "TICKETMASTER", startsAt: brt(now, 26, 21), hours: 4, hue: 215, transferAllowed: "SIM",
      sectors: [["Pista", 56_000], ["Mezanino 2º Piso", 89_000]] },
    { slug: "classico-exemplo", name: "Clássico no Pacaembu", venue: "Mercado Pago Hall", category: "Esportes", platform: "SYMPLA", startsAt: brt(now, 12, 16), hours: 3, hue: 100, transferAllowed: "DESCONHECIDO", isSports: true,
      sectors: [["Arquibancada", 17_000]] },
  ] as const;

  for (const e of events) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        name: e.name,
        venue: e.venue,
        city: "São Paulo, SP",
        category: e.category,
        hue: e.hue,
        platformId: platforms[e.platform],
        startsAt: e.startsAt,
        endsAt: addHours(e.startsAt, e.hours),
        transferAllowed: e.transferAllowed,
        isSports: "isSports" in e ? e.isSports : false,
        sectors: e.sectors.map(([name, faceValueCents]) => ({ name, faceValueCents })),
      },
    });
  }

  if ((await prisma.listing.count()) === 0) {
    const eventId = async (slug: string) => (await prisma.event.findUniqueOrThrow({ where: { slug } })).id;
    const listings = [
      ["adriatique-x-future", "juan@demo.local", "Pista", "INTEIRA", 1, 50_000, 42_000],
      ["adriatique-x-future", "juan@demo.local", "Área VIP", "INTEIRA", 1, 105_000, 95_000],
      ["adriatique-x-future", "isabela@demo.local", "Pista Social", "MEIA_SOCIAL", 1, 47_000, 38_000],
      ["adriatique-x-future", "diego@demo.local", "Pista Social", "MEIA_SOCIAL", 2, 40_000, 38_000],
      ["sunset-5521-sp", "marina@demo.local", "Open Bar Feminino", "INTEIRA", 2, 30_000, 29_000],
      ["a-perfect-circle-puscifer", "diego@demo.local", "Pista", "MEIA", 1, 30_000, 28_000],
    ] as const;
    for (const [slug, email, sector, ticketType, quantity, priceCents, faceValueCents] of listings) {
      await prisma.listing.create({
        data: {
          eventId: await eventId(slug),
          sellerId: users[email],
          sector,
          ticketType,
          quantity,
          quantityAvailable: quantity,
          priceCents,
          faceValueCents,
          purchasedAt: addDays(now, -40),
          platformOrderRef: "DEMO",
          sellerDeclaresOriginalBuyer: true,
        },
      });
    }
    await prisma.wantedPost.create({
      data: { eventId: await eventId("adriatique-x-future"), buyerId: users["marina@demo.local"], sector: "Pista", quantity: 1, maxPriceCents: 45_000 },
    });
  }
  console.log("Dados de demonstração criados (senha: demo1234)");
}

async function main() {
  await seedPlatforms();
  if (process.argv.includes("--demo")) await seedDemo();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
