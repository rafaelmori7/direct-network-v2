import { PrismaClient } from "@prisma/client";
import { PLATFORMS } from "../src/lib/platforms/profiles";
import type { PlatformCode } from "../src/lib/rules/types";

const prisma = new PrismaClient();

async function main() {
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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
