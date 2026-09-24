export interface PixChargeRequest {
  orderId: string;
  totalCents: number;
  /** Parte do vendedor; fica retida na subconta dele até a liberação. */
  sellerNetCents: number;
  sellerWalletId: string;
  buyer: { name: string; cpf: string; email: string };
  expiresAt: Date;
  description: string;
}

export interface PixCharge {
  chargeId: string;
  pixCopyPaste: string;
  qrCodeBase64: string | null;
  expiresAt: Date;
}

export interface PaymentProvider {
  createPixCharge(req: PixChargeRequest): Promise<PixCharge>;
  /** Libera a parte do vendedor retida na custódia. */
  releaseEscrow(chargeId: string): Promise<void>;
  /** Devolve o valor integral ao comprador. */
  refund(chargeId: string): Promise<void>;
}

/** Só aceitamos Pix pago pelo próprio comprador: CPF do pagador = CPF do cadastro. */
export function payerMatchesBuyer(payerCpf: string | null | undefined, buyerCpf: string): boolean {
  if (!payerCpf) return false;
  return onlyDigits(payerCpf) === onlyDigits(buyerCpf);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
