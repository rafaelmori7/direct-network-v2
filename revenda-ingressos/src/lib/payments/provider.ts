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

/** Situação da cobrança consultada no gateway (não confiamos só no corpo do webhook). */
export interface ChargeStatus {
  paid: boolean;
  /** CPF de quem pagou o Pix, como o gateway informa (pode vir mascarado). */
  payerCpf: string | null;
}

export interface PaymentProvider {
  createPixCharge(req: PixChargeRequest): Promise<PixCharge>;
  getChargeStatus(chargeId: string): Promise<ChargeStatus>;
  /** Libera a parte do vendedor retida na custódia. */
  releaseEscrow(chargeId: string): Promise<void>;
  /** Devolve o valor integral ao comprador. */
  refund(chargeId: string): Promise<void>;
}

/**
 * Só aceitamos Pix pago pelo próprio comprador: CPF do pagador = CPF do cadastro.
 * O Pix às vezes informa o CPF mascarado ("***.456.789-**"): aí comparamos só
 * os dígitos visíveis, exigindo pelo menos 6 deles.
 */
export function payerMatchesBuyer(payerCpf: string | null | undefined, buyerCpf: string): boolean {
  if (!payerCpf) return false;
  const buyer = onlyDigits(buyerCpf);
  const payer = payerCpf.replace(/[^\d*]/g, "");
  if (!payer.includes("*")) return payer === buyer;
  if (payer.length !== buyer.length) return false;
  const visible = [...payer].filter((c) => c !== "*").length;
  return visible >= 6 && [...payer].every((c, i) => c === "*" || c === buyer[i]);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
