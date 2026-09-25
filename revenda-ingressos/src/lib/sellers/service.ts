import { prisma } from "@/lib/db";

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
