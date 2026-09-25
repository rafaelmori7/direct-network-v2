/**
 * Cobrança sem split: o valor todo fica na conta da plataforma até a liberação,
 * quando repassamos a parte do vendedor e a do parceiro com transferToWallet.
 */
export interface PixChargeRequest {
  orderId: string;
  totalCents: number;
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

/** Dados para abrir a conta de recebimento (subconta): vendedor (CPF) ou agência (CNPJ). */
export interface SellerAccountRequest {
  name: string;
  email: string;
  /** CPF do vendedor ou CNPJ da agência. */
  cpfCnpj: string;
  /** Obrigatório para CPF. */
  birthDate?: Date;
  /** Obrigatório para CNPJ. */
  companyType?: "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION";
  mobilePhone: string;
  incomeCents: number;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  postalCode: string;
}

export interface SellerAccount {
  accountId: string;
  walletId: string;
  /** Chave de API da subconta (guardar criptografada). null quando o gateway não devolve. */
  apiKey: string | null;
}

/** Repasse da conta da plataforma para a subconta (carteira) do vendedor ou do parceiro. */
export interface TransferRequest {
  walletId: string;
  cents: number;
  /** Identifica o repasse no extrato, ex.: "pedido-<id>-vendedor". */
  externalReference: string;
  description: string;
}

/**
 * Situação de uma transferência. AGUARDANDO_APROVACAO: criada, mas precisa ser
 * autorizada no painel do gateway (ação crítica). SOLICITADO: autorizada e em
 * processamento. FALHOU: recusada ou cancelada; o dinheiro não saiu.
 */
export type TransferStatus = "CONCLUIDO" | "AGUARDANDO_APROVACAO" | "SOLICITADO" | "FALHOU";

export interface TransferResult {
  transferId: string;
  status: TransferStatus;
  /** Motivo da falha informado pelo gateway, quando houver. */
  error?: string | null;
}

/** Saque da conta de recebimento para a chave Pix CPF/CNPJ do próprio titular. */
export interface WithdrawalRequest {
  cents: number;
  /** CPF do vendedor ou CNPJ da agência, só dígitos. */
  pixKey: string;
  pixKeyType: "CPF" | "CNPJ";
  externalReference: string;
  description: string;
}

/** CONCLUIDO: devolvido. AGUARDANDO_APROVACAO: precisa ser aprovado no painel do gateway. */
export type RefundResult = { status: "CONCLUIDO" | "AGUARDANDO_APROVACAO" | "SOLICITADO" };

export interface PaymentProvider {
  /** "mock" aceita vendedor sem subconta no gateway (desenvolvimento e testes). */
  readonly kind: "mock" | "asaas";
  /** Em produção toda venda exige a subconta do vendedor (para onde vai o repasse). */
  readonly requiresSellerWallet: boolean;
  createPixCharge(req: PixChargeRequest): Promise<PixCharge>;
  /** Transfere da conta da plataforma para uma subconta. */
  transferToWallet(req: TransferRequest): Promise<TransferResult>;
  /** Consulta uma transferência já feita (ex.: depois da aprovação no painel). */
  getTransfer(transferId: string): Promise<TransferResult>;
  /**
   * Devolve o valor integral ao comprador. A taxa do gateway já descontada no
   * recebimento sai do saldo da plataforma.
   */
  refund(chargeId: string): Promise<RefundResult>;
  /** Cancela uma cobrança ainda não paga, para o Pix não poder mais ser pago. */
  cancelCharge(chargeId: string): Promise<void>;
  /** CPF de quem pagou o Pix, possivelmente mascarado ("***.444.777-**"), ou null. */
  getPayerCpf(chargeId: string): Promise<string | null>;
  /** Cria a subconta do vendedor. */
  createSellerAccount(req: SellerAccountRequest): Promise<SellerAccount>;
  /** Saldo disponível da subconta, em centavos (consultado com a chave da subconta). */
  getAccountBalance(accountApiKey: string): Promise<number>;
  /** Envia o saldo da subconta por Pix para a chave CPF/CNPJ do titular (chave da subconta). */
  withdrawToPix(accountApiKey: string, req: WithdrawalRequest): Promise<TransferResult>;
  /** Consulta um saque feito pela subconta. */
  getAccountTransfer(accountApiKey: string, transferId: string): Promise<TransferResult>;
  /** Cancela um saque ainda pendente da subconta; o valor volta ao saldo dela. */
  cancelAccountTransfer(accountApiKey: string, transferId: string): Promise<TransferResult>;
  /** Link onde o vendedor envia documento e selfie; null se não houver pendência. */
  getOnboardingUrl(account: SellerAccount): Promise<string | null>;
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
