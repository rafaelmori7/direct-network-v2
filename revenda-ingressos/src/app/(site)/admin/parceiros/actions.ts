"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { isValidCnpj } from "@/lib/auth/cpf";
import { encrypt } from "@/lib/crypto";
import { parseBRLToCents } from "@/lib/format";
import { getPaymentProvider } from "@/lib/payments";
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
  if (discountBps > 5000) errors.push("Desconto máximo de 50%.");
  if (errors.length > 0) return { errors };

  const data = { name, slug, couponCode, color, logoUrl, gatewayWalletId, commissionShareBps, discountBps, active: form.get("ativo") === "on" };
  // Com conta de recebimento criada por nós, a carteira é a dela e não se edita à mão.
  const current = partnerId ? await prisma.partner.findUnique({ where: { id: partnerId }, select: { gatewayAccountId: true } }) : null;
  if (current?.gatewayAccountId) delete (data as Partial<typeof data>).gatewayWalletId;
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

/** Dá acesso ao painel da agência para uma pessoa já cadastrada no site. */
export async function addPartnerMember(partnerId: string, form: FormData): Promise<void> {
  await requireAdminAction();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Nenhuma conta com este e-mail. A pessoa precisa se cadastrar no site antes.");
  await prisma.partnerMember.upsert({
    where: { partnerId_userId: { partnerId, userId: user.id } },
    update: {},
    create: { partnerId, userId: user.id },
  });
  revalidatePath(`/admin/parceiros/${partnerId}`);
}

export async function removePartnerMember(partnerId: string, memberId: string): Promise<void> {
  await requireAdminAction();
  await prisma.partnerMember.deleteMany({ where: { id: memberId, partnerId } });
  revalidatePath(`/admin/parceiros/${partnerId}`);
}

const COMPANY_TYPES = ["MEI", "LIMITED", "INDIVIDUAL", "ASSOCIATION"] as const;

/**
 * Cria a conta de recebimento da agência (subconta CNPJ no Asaas). A comissão
 * cai nela no repasse e sai sozinha por Pix para a chave CNPJ da agência.
 */
export async function createPartnerPayoutAccount(partnerId: string, _prev: PartnerFormState, form: FormData): Promise<PartnerFormState> {
  await requireAdminAction();
  const partner = await prisma.partner.findUniqueOrThrow({ where: { id: partnerId } });
  if (partner.gatewayAccountId) return { errors: ["Esta agência já tem conta de recebimento."] };

  const field = (name: string) => String(form.get(name) ?? "").trim();
  const cnpj = field("cnpj").replace(/\D/g, "");
  const email = field("email").toLowerCase();
  const phone = field("celular").replace(/\D/g, "");
  const postalCode = field("cep").replace(/\D/g, "");
  const companyType = field("tipo") as (typeof COMPANY_TYPES)[number];
  const incomeCents = parseBRLToCents(field("faturamento"));
  const errors: string[] = [];
  if (!field("razao")) errors.push("Informe a razão social.");
  if (!isValidCnpj(cnpj)) errors.push("CNPJ inválido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail inválido.");
  if (phone.length < 10 || phone.length > 11) errors.push("Celular inválido (com DDD).");
  if (!COMPANY_TYPES.includes(companyType)) errors.push("Escolha o tipo de empresa.");
  if (!Number.isFinite(incomeCents) || incomeCents <= 0) errors.push("Informe o faturamento mensal aproximado.");
  if (postalCode.length !== 8) errors.push("CEP inválido.");
  if (!field("endereco") || !field("numero") || !field("bairro")) errors.push("Preencha endereço, número e bairro.");
  if (errors.length > 0) return { errors };

  const provider = getPaymentProvider();
  try {
    const account = await provider.createSellerAccount({
      name: field("razao"),
      email,
      cpfCnpj: cnpj,
      companyType,
      mobilePhone: phone,
      incomeCents,
      address: field("endereco"),
      addressNumber: field("numero"),
      complement: field("complemento") || undefined,
      province: field("bairro"),
      postalCode,
    });
    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        cnpj,
        payoutEmail: email,
        gatewayAccountId: account.accountId,
        gatewayWalletId: account.walletId,
        gatewayApiKeyEnc: account.apiKey && provider.kind === "asaas" ? encrypt(account.apiKey) : null,
        gatewayAccountStatus: "EM_ANALISE",
      },
    });
  } catch (error) {
    return { errors: [`Não foi possível criar a conta agora. ${error instanceof Error ? error.message : ""}`.trim()] };
  }
  revalidatePath(`/admin/parceiros/${partnerId}`);
  return { errors: [] };
}

/** Aprovação manual da conta da agência (quando o aviso do gateway não chegar). */
export async function approvePartnerPayoutAccount(partnerId: string): Promise<void> {
  await requireAdminAction();
  await prisma.partner.updateMany({ where: { id: partnerId, gatewayAccountId: { not: null } }, data: { gatewayAccountStatus: "APROVADA" } });
  revalidatePath(`/admin/parceiros/${partnerId}`);
}
