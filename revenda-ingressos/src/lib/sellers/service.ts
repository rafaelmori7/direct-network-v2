import { prisma } from "@/lib/db";

/**
 * Aviso do gateway sobre a análise da conta de recebimento do vendedor.
 * Aprovada: o vendedor passa a receber (a rotina paga as vendas que estavam esperando).
 */
export async function handleSellerAccountStatus(accountId: string, approved: boolean): Promise<boolean> {
  const updated = await prisma.user.updateMany({
    where: { gatewayAccountId: accountId },
    data: approved
      ? { gatewayAccountStatus: "APROVADA", verifiedAt: new Date() }
      : { gatewayAccountStatus: "REPROVADA", verifiedAt: null },
  });
  return updated.count > 0;
}
