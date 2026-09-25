import { prisma } from "@/lib/db";
import { onlyDigits } from "./provider";

/**
 * Validação de saque por webhook do Asaas (liberada pelo suporte, recomendada
 * para BaaS). Cinco segundos depois de criar uma transferência, o Asaas manda o
 * mesmo corpo da criação e espera APPROVED ou REFUSED; sem resposta em três
 * tentativas, cancela. Ligada, vale para a conta principal e todas as subcontas,
 * e toda transferência passa a ter de sair pela API.
 *
 * Só aprovamos o que o próprio site pediu e ainda está em andamento, com o
 * mesmo valor e destino:
 * - `saque-<id>`: Pix da subconta para a chave CPF do vendedor ou CNPJ da agência;
 * - `pedido-<id>-vendedor` / `pedido-<id>-parceiro`: repasse da conta principal.
 */
export interface AsaasTransferPayload {
  id?: string;
  value?: number;
  externalReference?: string | null;
  operationType?: string | null;
  walletId?: string | null;
  bankAccount?: { pixAddressKey?: string | null } | null;
}

export type TransferValidation = { status: "APPROVED" } | { status: "REFUSED"; refuseReason: string };

const IN_PROGRESS = ["SOLICITADO", "AGUARDANDO_APROVACAO"] as const;

export async function validateTransfer(t: AsaasTransferPayload): Promise<TransferValidation> {
  if (!t.id || typeof t.value !== "number") return refuse("Transferência sem id ou valor");
  const cents = Math.round(t.value * 100);
  const ref = t.externalReference ?? "";

  const withdrawal = ref.startsWith("saque-")
    ? await prisma.withdrawal.findUnique({ where: { id: ref.slice("saque-".length) } })
    : !ref
      ? await prisma.withdrawal.findFirst({ where: { transferId: t.id } })
      : null;
  if (withdrawal) {
    if (!IN_PROGRESS.includes(withdrawal.status as (typeof IN_PROGRESS)[number])) return refuse("Saque não está em andamento");
    if (withdrawal.transferId && withdrawal.transferId !== t.id) return refuse("Outra transferência já registrada para este saque");
    if (withdrawal.cents !== cents) return refuse("Valor diferente do saque pedido");
    if (t.operationType !== "PIX" || onlyDigits(t.bankAccount?.pixAddressKey ?? "") !== onlyDigits(withdrawal.pixKey)) {
      return refuse("Destino diferente da chave do titular");
    }
    return { status: "APPROVED" };
  }

  const payout = /^pedido-(.+)-(vendedor|parceiro)$/.exec(ref);
  const order = payout
    ? await prisma.order.findUnique({ where: { id: payout[1] }, include: orderInclude })
    : !ref
      ? await prisma.order.findFirst({ where: { OR: [{ sellerTransferId: t.id }, { partnerTransferId: t.id }] }, include: orderInclude })
      : null;
  if (order) {
    const toSeller = payout ? payout[2] === "vendedor" : order.sellerTransferId === t.id;
    const expected = toSeller
      ? { cents: order.sellerNetCents, walletId: order.listing.seller.gatewayWalletId, transferId: order.sellerTransferId }
      : { cents: order.partnerFeeCents, walletId: order.partner?.gatewayWalletId ?? null, transferId: order.partnerTransferId };
    // Comissão que esperou a aprovação da conta da agência: é transferida depois,
    // com o repasse já CONCLUIDO (payWaitingPartnerCommission tira a trava antes).
    const lateCommission = !toSeller && order.payoutStatus === "CONCLUIDO" && !order.partnerPayoutWaiting && !order.partnerTransferId;
    if (!IN_PROGRESS.includes(order.payoutStatus as (typeof IN_PROGRESS)[number]) && !lateCommission) return refuse("Repasse não está em andamento");
    if (expected.transferId && expected.transferId !== t.id) return refuse("Outra transferência já registrada para este repasse");
    if (expected.cents !== cents) return refuse("Valor diferente do repasse");
    if (!expected.walletId || t.walletId !== expected.walletId) return refuse("Destino diferente da conta de recebimento");
    return { status: "APPROVED" };
  }

  return refuse("Transferência não reconhecida pelo site");
}

const orderInclude = {
  partner: { select: { gatewayWalletId: true } },
  listing: { select: { seller: { select: { gatewayWalletId: true } } } },
} as const;

function refuse(refuseReason: string): TransferValidation {
  return { status: "REFUSED", refuseReason };
}
