import { randomUUID } from "node:crypto";
import type { ChargeStatus, PaymentProvider, PixCharge, PixChargeRequest } from "./provider";

type MockChargeState = "PENDENTE" | "RETIDO" | "LIBERADO" | "REEMBOLSADO";

/** Gateway falso para desenvolvimento e testes. Guarda tudo em memória. */
export class MockPaymentProvider implements PaymentProvider {
  readonly charges = new Map<string, { request: PixChargeRequest | null; state: MockChargeState; payerCpf?: string | null }>();

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

  /** Simula o Pix pago. Sem `payerCpf`, considera que o próprio comprador pagou. */
  markPaid(chargeId: string, payerCpf?: string | null): void {
    const charge = this.charges.get(chargeId);
    // Depois de reiniciar o servidor a memória some: aceita a cobrança mesmo assim.
    if (!charge) {
      this.charges.set(chargeId, { request: null, state: "RETIDO", payerCpf: payerCpf ?? null });
      return;
    }
    const paid = this.require(chargeId, "PENDENTE");
    paid.state = "RETIDO";
    paid.payerCpf = payerCpf === undefined ? (paid.request?.buyer.cpf ?? null) : payerCpf;
  }

  async getChargeStatus(chargeId: string): Promise<ChargeStatus> {
    const charge = this.charges.get(chargeId);
    if (!charge) throw new Error(`Cobrança ${chargeId} não existe`);
    return { paid: charge.state !== "PENDENTE", payerCpf: charge.payerCpf ?? null };
  }

  async releaseEscrow(chargeId: string): Promise<void> {
    this.require(chargeId, "RETIDO").state = "LIBERADO";
  }

  async refund(chargeId: string): Promise<void> {
    this.require(chargeId, "RETIDO").state = "REEMBOLSADO";
  }

  private require(chargeId: string, expected: MockChargeState) {
    const charge = this.charges.get(chargeId);
    if (!charge) throw new Error(`Cobrança ${chargeId} não existe`);
    if (charge.state !== expected) throw new Error(`Cobrança ${chargeId} está ${charge.state}, esperado ${expected}`);
    return charge;
  }
}
