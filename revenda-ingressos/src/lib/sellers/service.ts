import { prisma } from "@/lib/db";
import type { PaymentProvider } from "@/lib/payments/provider";

/**
 * Logo depois de criar a subconta: se o gateway já a aprovou (aprovação
 * automática), aplica na hora o mesmo que o aviso de aprovação faria. Falha
 * aqui não atrapalha: o webhook ou o admin aprovam depois.
 */
export async function syncAccountApproval(accountId: string, apiKey: string | null, provider: PaymentProvider): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const approval = await provider.getAccountApproval(apiKey);
    if (approval === "EM_ANALISE") return false;
    return handleSellerAccountStatus(accountId, approval === "APROVADA");
  } catch {
    return false;
  }
}

/**
 * Aviso do gateway sobre a análise da conta de recebimento do vendedor (ou da agência).
 * Aprovada: o vendedor passa a receber (a rotina paga as vendas que estavam esperando).
 */
export async function handleSellerAccountStatus(accountId: string, approved: boolean): Promise<boolean> {
  const updated = await prisma.user.updateMany({
    where: { gatewayAccountId: accountId },
    data: approved
      ? { gatewayAccountStatus: "APROVADA", verifiedAt: new Date() }
      : { gatewayAccountStatus: "REPROVADA", verifiedAt: null },
  });
  // A mesma análise vale para a conta de recebimento das agências (CNPJ).
  const partner = await prisma.partner.updateMany({
    where: { gatewayAccountId: accountId },
    data: { gatewayAccountStatus: approved ? "APROVADA" : "REPROVADA" },
  });
  return updated.count + partner.count > 0;
}
