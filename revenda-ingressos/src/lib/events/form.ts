import type { PlatformCode, Prisma, TransferAllowed } from "@prisma/client";
import { CATEGORIES } from "@/lib/data/repo";
import { parseBrtInput } from "@/lib/datetime-input";
import { prisma } from "@/lib/db";
import { parseBRLToCents } from "@/lib/format";

const PLATFORMS: PlatformCode[] = ["INGRESSE", "SYMPLA", "TICKETMASTER"];
const TRANSFER: TransferAllowed[] = ["SIM", "NAO", "DESCONHECIDO"];

/** Uma linha por setor: "Pista; 420,00". */
function parseSectors(text: string): { sectors: { name: string; faceValueCents: number }[]; errors: string[] } {
  const sectors: { name: string; faceValueCents: number }[] = [];
  const errors: string[] = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [name, price] = line.split(";").map((p) => p.trim());
    const cents = parseBRLToCents(price ?? "");
    if (!name || !Number.isFinite(cents) || cents <= 0) errors.push(`Setor inválido: "${line}" (use "Nome; 420,00").`);
    else sectors.push({ name, faceValueCents: cents });
  }
  return { sectors, errors };
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export type ParsedEvent = { ok: true; data: Omit<Prisma.EventUncheckedCreateInput, "slug">; startsAt: Date } | { ok: false; errors: string[] };

/** Lê e valida o formulário de evento (admin e painel do parceiro). */
export async function parseEventForm(form: FormData): Promise<ParsedEvent> {
  const name = String(form.get("nome") ?? "").trim();
  const venue = String(form.get("local") ?? "").trim();
  const city = String(form.get("cidade") ?? "").trim();
  const category = String(form.get("categoria") ?? "");
  const platformCode = String(form.get("ticketeira") ?? "") as PlatformCode;
  const transferAllowed = String(form.get("transferencia") ?? "") as TransferAllowed;
  const startsAt = parseBrtInput(form.get("inicio"));
  const endsAt = parseBrtInput(form.get("fim"));
  const transferOpensAt = parseBrtInput(form.get("transferenciaAbre"));
  const transferEndsAt = parseBrtInput(form.get("transferenciaFecha"));
  const deadlineRaw = String(form.get("prazoVendedor") ?? "").trim();
  const { sectors, errors } = parseSectors(String(form.get("setores") ?? ""));

  if (!name) errors.push("Informe o nome.");
  if (!venue || !city) errors.push("Informe local e cidade.");
  if (!(CATEGORIES as readonly string[]).includes(category)) errors.push("Escolha a categoria.");
  if (!PLATFORMS.includes(platformCode)) errors.push("Escolha a ticketeira.");
  if (!TRANSFER.includes(transferAllowed)) errors.push("Informe se a transferência é permitida.");
  if (!startsAt || !endsAt) errors.push("Informe início e fim do evento.");
  else if (endsAt <= startsAt) errors.push("O fim precisa ser depois do início.");
  if (transferOpensAt && transferEndsAt && transferEndsAt <= transferOpensAt) errors.push("O fim da transferência precisa ser depois da abertura.");
  if (transferEndsAt && startsAt && transferEndsAt > startsAt) errors.push("A transferência não pode terminar depois do início do evento.");
  const deadline = deadlineRaw ? Number(deadlineRaw) : null;
  if (deadline !== null && (!Number.isInteger(deadline) || deadline < 1 || deadline > 72)) errors.push("Prazo do vendedor entre 1 e 72 horas.");
  if (errors.length > 0) return { ok: false, errors };

  const platform = await prisma.platform.findUnique({ where: { code: platformCode } });
  if (!platform) return { ok: false, errors: ["Ticketeira não cadastrada (rode o seed)."] };

  const data = {
    name,
    venue,
    city,
    category,
    platformId: platform.id,
    startsAt: startsAt!,
    endsAt: endsAt!,
    isSports: form.get("esportivo") === "on",
    transferAllowed,
    nominalBiometric: form.get("biometria") === "on",
    officialResaleActive: form.get("revendaOficial") === "on",
    transferOpensAt,
    transferEndsAt,
    ruleOverrides: deadline ? { sellerTransferDeadlineHours: deadline } : {},
    sectors,
    hue: Number(form.get("cor") ?? 260) || 260,
    partnerId: String(form.get("parceiro") ?? "") || null,
  };

  return { ok: true, data, startsAt: startsAt! };
}

/** Slug único a partir do nome e da data. */
export async function uniqueEventSlug(name: string, startsAt: Date): Promise<string> {
  const slug = slugify(`${name} ${startsAt.toISOString().slice(0, 10)}`);
  return (await prisma.event.findUnique({ where: { slug } })) ? `${slug}-${Date.now().toString(36)}` : slug;
}
