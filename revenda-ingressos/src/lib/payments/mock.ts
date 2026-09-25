import { randomUUID } from "node:crypto";
import type { PaymentProvider, PixCharge, PixChargeRequest, RefundResult, SellerAccount, SellerAccountRequest, TransferRequest, TransferResult, TransferStatus } from "./provider";

type MockChargeState = "PENDENTE" | "RETIDO" | "REEMBOLSADO" | "CANCELADA";

/** Gateway falso para desenvolvimento e testes. Guarda tudo em memória. */
export class MockPaymentProvider implements PaymentProvider {
  readonly kind = "mock" as const;
  readonly requiresSellerWallet = false;
  readonly charges = new Map<string, { request: PixChargeRequest | null; state: MockChargeState; payerCpf?: string }>();

  async createPixCharge(request: PixChargeRequest): Promise<PixCharge> {
    const chargeId = `mock_${randomUUID()}`;
    this.charges.set(chargeId, { request, state: "PENDENTE" });
    return {
      chargeId,
      pixCopyPaste: `00020126MOCK${chargeId}`,
      qrCodeBase64: null,
      expiresAt: request.expiresAt,
    };
  }

  /** Simula o webhook de pagamento recebido. */
  markPaid(chargeId: string, payerCpf?: string): void {
    const charge = this.charges.get(chargeId);
    // Depois de reiniciar o servidor a memória some: aceita a cobrança mesmo assim.
    if (!charge) {
      this.charges.set(chargeId, { request: null, state: "RETIDO", payerCpf: payerCpf ?? undefined });
      return;
    }
    // Uma cobrança cancelada ainda pode ter sido paga no mesmo instante (Pix já emitido).
    if (charge.state !== "CANCELADA") this.require(chargeId, "PENDENTE");
    charge.state = "RETIDO";
    charge.payerCpf = payerCpf ?? charge.request?.buyer.cpf;
  }

  readonly sellerAccounts = new Map<string, SellerAccountRequest>();

  async createSellerAccount(req: SellerAccountRequest): Promise<SellerAccount> {
    const accountId = `mock_acc_${randomUUID()}`;
    this.sellerAccounts.set(accountId, req);
    return { accountId, walletId: `mock_wallet_${randomUUID()}`, apiKey: `mock_key_${randomUUID()}` };
  }

  async getOnboardingUrl(): Promise<string | null> {
    return null; // Em testes a aprovação é feita pelo admin ou pelo botão de simulação.
  }

  async simulatePayment(chargeId: string): Promise<void> {
    this.markPaid(chargeId);
  }

  async cancelCharge(chargeId: string): Promise<void> {
    this.require(chargeId, "PENDENTE").state = "CANCELADA";
  }

  async getPayerCpf(chargeId: string): Promise<string | null> {
    return this.charges.get(chargeId)?.payerCpf ?? null;
  }

  readonly transfers: (TransferRequest & { transferId: string; status: TransferStatus })[] = [];

  /** Situação das próximas transferências (para simular a autorização no painel do Asaas). */
  nextTransferStatus: TransferStatus = "CONCLUIDO";

  /** Faz a próxima transferência falhar (ex.: saldo insuficiente). */
  failNextTransfer: string | null = null;

  async transferToWallet(req: TransferRequest): Promise<TransferResult> {
    if (this.failNextTransfer) {
      const message = this.failNextTransfer;
      this.failNextTransfer = null;
      throw new Error(message);
    }
    const transferId = `mock_tra_${randomUUID()}`;
    this.transfers.push({ ...req, transferId, status: this.nextTransferStatus });
    return { transferId, status: this.nextTransferStatus };
  }

  async getTransfer(transferId: string): Promise<TransferResult> {
    const t = this.transfers.find((t) => t.transferId === transferId);
    if (!t) throw new Error(`Transferência ${transferId} não existe`);
    return { transferId, status: t.status };
  }

  /** Simula a autorização (ou o cancelamento) de uma transferência no painel. */
  setTransferStatus(transferId: string, status: TransferStatus): void {
    const t = this.transfers.find((t) => t.transferId === transferId);
    if (!t) throw new Error(`Transferência ${transferId} não existe`);
    t.status = status;
  }

  /** Resultado do próximo reembolso (para simular a aprovação manual do Asaas). */
  nextRefundStatus: RefundResult["status"] = "CONCLUIDO";

  /** Faz o próximo reembolso falhar (ex.: saldo insuficiente). */
  failNextRefund: string | null = null;

  async refund(chargeId: string): Promise<RefundResult> {
    if (this.failNextRefund) {
      const message = this.failNextRefund;
      this.failNextRefund = null;
      throw new Error(message);
    }
    this.require(chargeId, "RETIDO").state = "REEMBOLSADO";
    return { status: this.nextRefundStatus };
  }

  private require(chargeId: string, expected: MockChargeState) {
    const charge = this.charges.get(chargeId);
    if (!charge) throw new Error(`Cobrança ${chargeId} não existe`);
    if (charge.state !== expected) throw new Error(`Cobrança ${chargeId} está ${charge.state}, esperado ${expected}`);
    return charge;
  }
}
