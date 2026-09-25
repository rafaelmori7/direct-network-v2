"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { parseBRLToCents } from "@/lib/format";
import { getPaymentProvider } from "@/lib/payments";
import { syncAccountApproval } from "@/lib/sellers/service";

export type PayoutFormState = { errors: string[] };

function safeReturn(value: FormDataEntryValue | null): string {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/conta/recebimento";
}

export async function createPayoutAccount(_prev: PayoutFormState, form: FormData): Promise<PayoutFormState> {
  const current = await getCurrentUser();
  if (!current) return { errors: ["Entre na sua conta."] };
  const user = await prisma.user.findUniqueOrThrow({ where: { id: current.id } });
  if (user.gatewayAccountId) redirect(safeReturn(form.get("voltar")));

  const field = (name: string) => String(form.get(name) ?? "").trim();
  const postalCode = field("cep").replace(/\D/g, "");
  const incomeCents = parseBRLToCents(field("renda"));
  const errors: string[] = [];
  if (postalCode.length !== 8) errors.push("CEP inválido.");
  if (!field("endereco") || !field("numero") || !field("bairro")) errors.push("Preencha endereço, número e bairro.");
  if (!Number.isFinite(incomeCents) || incomeCents <= 0) errors.push("Informe a renda mensal aproximada (exigida pela instituição de pagamento).");
  if (!form.get("termos")) errors.push("Aceite as condições de recebimento.");
  if (errors.length > 0) return { errors };

  const provider = getPaymentProvider();
  try {
    const account = await provider.createSellerAccount({
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpf,
      birthDate: user.birthDate,
      mobilePhone: user.phone,
      incomeCents,
      address: field("endereco"),
      addressNumber: field("numero"),
      complement: field("complemento") || undefined,
      province: field("bairro"),
      postalCode,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        gatewayAccountId: account.accountId,
        gatewayWalletId: account.walletId,
        // A chave da subconta real é sensível: só é guardada criptografada.
        gatewayApiKeyEnc: account.apiKey && provider.kind === "asaas" ? encrypt(account.apiKey) : null,
        gatewayAccountStatus: "EM_ANALISE",
      },
    });
    await syncAccountApproval(account.accountId, account.apiKey, provider);
  } catch (error) {
    return { errors: [`Não foi possível criar a conta de recebimento agora. ${error instanceof Error ? error.message : ""}`.trim()] };
  }
  redirect(safeReturn(form.get("voltar")));
}
