import { onlyDigits, type PaymentProvider, type PixCharge, type PixChargeRequest, type RefundResult } from "./provider";

/**
 * Integração com o Asaas (Pix + split + Conta Escrow).
 *
 * Como o dinheiro fica protegido:
 * - a cobrança é criada na conta principal (plataforma) com split para a
 *   subconta do vendedor;
 * - a subconta do vendedor tem a Conta Escrow ligada (POST /accounts/{id}/escrow,
 *   daysToExpire = 45), então a parte dele fica bloqueada;
 * - liberamos com POST /escrow/{id}/finish depois do evento.
 *
 * Validar no sandbox antes de produção: se o finish/refund exigem a chave da
 * conta principal ou da subconta, e o comportamento do refund com escrow ativo.
 * Referência: https://docs.asaas.com/docs/introducao-conta-escrow
 */
export class AsaasPaymentProvider implements PaymentProvider {
  readonly kind = "asaas" as const;

  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string | null,
  ) {}

  async createPixCharge(req: PixChargeRequest): Promise<PixCharge> {
    const customer = await this.request<{ id: string }>("POST", "/customers", {
      name: req.buyer.name,
      cpfCnpj: onlyDigits(req.buyer.cpf),
      email: req.buyer.email,
      notificationDisabled: true,
    });

    const payment = await this.request<{ id: string }>("POST", "/payments", {
      customer: customer.id,
      billingType: "PIX",
      value: req.totalCents / 100,
      dueDate: req.expiresAt.toISOString().slice(0, 10),
      description: req.description,
      externalReference: req.orderId,
      ...(req.sellerWalletId && { split: [{ walletId: req.sellerWalletId, fixedValue: req.sellerNetCents / 100 }] }),
    });

    const qr = await this.request<{ encodedImage: string; payload: string; expirationDate: string }>(
      "GET",
      `/payments/${payment.id}/pixQrCode`,
    );

    return {
      chargeId: payment.id,
      pixCopyPaste: qr.payload,
      qrCodeBase64: qr.encodedImage,
      expiresAt: req.expiresAt,
    };
  }

  async releaseEscrow(chargeId: string): Promise<void> {
    const escrow = await this.request<{ id: string }>("GET", `/payments/${chargeId}/escrow`);
    await this.request("POST", `/escrow/${escrow.id}/finish`);
  }

  // Testado no sandbox: com a autorização de ações críticas ligada, o reembolso
  // volta como AWAITING_CRITICAL_ACTION_AUTHORIZATION até ser aprovado no painel.
  async refund(chargeId: string): Promise<RefundResult> {
    const payment = await this.request<{ refunds?: { status?: string }[] | null }>("POST", `/payments/${chargeId}/refund`);
    const last = payment.refunds?.at(-1)?.status;
    if (last === "DONE") return { status: "CONCLUIDO" };
    if (last === "AWAITING_CRITICAL_ACTION_AUTHORIZATION") return { status: "AGUARDANDO_APROVACAO" };
    return { status: "SOLICITADO" };
  }

  async cancelCharge(chargeId: string): Promise<void> {
    await this.request("DELETE", `/payments/${chargeId}`);
  }

  // Testado no sandbox: a cobrança paga traz "pixTransaction", e a transação traz
  // externalAccount.cpfCnpj mascarado ("***.444.777-**").
  async getPayerCpf(chargeId: string): Promise<string | null> {
    const payment = await this.request<{ pixTransaction?: string | null }>("GET", `/payments/${chargeId}`);
    if (!payment.pixTransaction) return null;
    const tx = await this.request<{ externalAccount?: { cpfCnpj?: string | null } }>(
      "GET",
      `/pix/transactions/${payment.pixTransaction}`,
    );
    return tx.externalAccount?.cpfCnpj ?? null;
  }

  // No sandbox de conta CPF não há subcontas; lá aceitamos cobrança sem split.
  get requiresSellerWallet(): boolean {
    return !this.isSandbox;
  }

  get isSandbox(): boolean {
    return this.apiUrl.includes("sandbox");
  }

  async simulatePayment(chargeId: string): Promise<void> {
    if (!this.isSandbox) throw new Error("Simulação de pagamento só existe no sandbox");
    await this.request("POST", `/sandbox/payment/${chargeId}/confirm`);
  }

  private async request<T = unknown>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "revenda-ingressos",
        ...(this.apiKey && { access_token: this.apiKey }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Asaas ${method} ${path} falhou: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as T;
  }
}
