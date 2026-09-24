import { randomUUID } from "node:crypto";
import type { PaymentProvider, PixCharge, PixChargeRequest } from "./provider";

type MockChargeState = "PENDENTE" | "RETIDO" | "LIBERADO" | "REEMBOLSADO";

/** Gateway falso para desenvolvimento e testes. Guarda tudo em memória. */
export class MockPaymentProvider implements PaymentProvider {
  readonly charges = new Map<string, { request: PixChargeRequest; state: MockChargeState }>();

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
  markPaid(chargeId: string): void {
    this.require(chargeId, "PENDENTE").state = "RETIDO";
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
