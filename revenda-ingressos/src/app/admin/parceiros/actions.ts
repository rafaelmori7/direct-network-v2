"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { isValidPartnerSlug } from "@/lib/partners/attribution";

export type PartnerFormState = { errors: string[] };

function percentToBps(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export async function savePartner(partnerId: string | null, _prev: PartnerFormState, form: FormData): Promise<PartnerFormState> {
  await requireAdminAction();
  const name = String(form.get("nome") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const couponCode = String(form.get("cupom") ?? "").trim().toUpperCase();
  const color = String(form.get("cor") ?? "#5b2ee6");
  const logoUrl = String(form.get("logo") ?? "").trim() || null;
  const gatewayWalletId = String(form.get("wallet") ?? "").trim() || null;
  const commissionShareBps = percentToBps(form.get("participacao"));
  const discountBps = percentToBps(form.get("desconto"));

  const errors: string[] = [];
  if (!name) errors.push("Informe o nome.");
  if (!isValidPartnerSlug(slug)) errors.push("Endereço inválido: use letras minúsculas, números e hífen (3 a 40), sem nomes reservados.");
  if (!/^[A-Z0-9]{3,20}$/.test(couponCode)) errors.push("Cupom: 3 a 20 letras ou números, sem espaço.");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) errors.push("Cor inválida.");
  if (logoUrl && !/^https:\/\//.test(logoUrl)) errors.push("O logo precisa ser um link https.");
  if (!Number.isInteger(commissionShareBps) || commissionShareBps < 0 || commissionShareBps > 10_000) errors.push("Participação entre 0% e 100%.");
  if (!Number.isInteger(discountBps) || discountBps < 0 || discountBps > 10_000) errors.push("Desconto inválido.");
  const platformFeeBps = Number(process.env.PLATFORM_FEE_BPS ?? 1000);
  if (discountBps > platformFeeBps) errors.push(`O desconto não pode passar da comissão (${platformFeeBps / 100}%).`);
  if (errors.length > 0) return { errors };

  const data = { name, slug, couponCode, color, logoUrl, gatewayWalletId, commissionShareBps, discountBps, active: form.get("ativo") === "on" };
  try {
    if (partnerId) await prisma.partner.update({ where: { id: partnerId }, data });
    else await prisma.partner.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: ["Endereço ou cupom já usado por outro parceiro."] };
    }
    throw error;
  }
  redirect("/admin/parceiros");
}
