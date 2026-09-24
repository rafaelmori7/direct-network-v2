export interface PixChargeRequest {
  orderId: string;
  totalCents: number;
  /** Parte do vendedor; fica retida na subconta dele até a liberação. */
  sellerNetCents: number;
  /** null só em testes, quando o gateway aceita cobrança sem split. */
  sellerWalletId: string | null;
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

/** CONCLUIDO: devolvido. AGUARDANDO_APROVACAO: precisa ser aprovado no painel do gateway. */
export type RefundResult = { status: "CONCLUIDO" | "AGUARDANDO_APROVACAO" | "SOLICITADO" };

export interface PaymentProvider {
  /** "mock" aceita vendedor sem subconta no gateway (desenvolvimento e testes). */
  readonly kind: "mock" | "asaas";
  /** Em produção toda venda exige a subconta (com custódia) do vendedor. */
  readonly requiresSellerWallet: boolean;
  createPixCharge(req: PixChargeRequest): Promise<PixCharge>;
  /** Libera a parte do vendedor retida na custódia. */
  releaseEscrow(chargeId: string): Promise<void>;
  /**
   * Devolve o valor integral ao comprador. A taxa do gateway já descontada no
   * recebimento sai do saldo da plataforma.
   */
  refund(chargeId: string): Promise<RefundResult>;
  /** Cancela uma cobrança ainda não paga, para o Pix não poder mais ser pago. */
  cancelCharge(chargeId: string): Promise<void>;
  /** CPF de quem pagou o Pix, possivelmente mascarado ("***.444.777-**"), ou null. */
  getPayerCpf(chargeId: string): Promise<string | null>;
  /** Só em ambiente de testes: simula o pagamento do Pix. */
  simulatePayment?(chargeId: string): Promise<void>;
}

/**
 * Só aceitamos Pix pago pelo próprio comprador. O Asaas devolve o CPF do
 * pagador mascarado ("***.444.777-**"): comparamos os dígitos visíveis, que
 * precisam ser pelo menos 6.
 */
export function payerMatchesBuyer(payerCpf: string | null | undefined, buyerCpf: string): boolean {
  if (!payerCpf) return false;
  const pattern = payerCpf.replace(/[^\d*]/g, "");
  const cpf = onlyDigits(buyerCpf);
  if (pattern.length !== cpf.length) return false;
  let visible = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "*") continue;
    if (pattern[i] !== cpf[i]) return false;
    visible++;
  }
  return visible >= 6;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
