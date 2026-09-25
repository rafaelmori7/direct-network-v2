import {
  onlyDigits,
  type PaymentProvider,
  type PixCharge,
  type PixChargeRequest,
  type RefundResult,
  type SellerAccount,
  type SellerAccountRequest,
  type TransferRequest,
  type TransferResult,
  type WithdrawalRequest,
} from "./provider";

interface AsaasTransfer {
  id: string;
  status?: string;
  authorized?: boolean;
  failReason?: string | null;
}

/**
 * Integração com o Asaas (Pix + repasse por transferência).
 *
 * Como o dinheiro fica protegido:
 * - a cobrança é criada na conta principal (plataforma), SEM split: o valor todo
 *   fica no saldo da plataforma até a liberação;
 * - na liberação, transferimos a parte do vendedor e a do parceiro para as
 *   subcontas deles (POST /transfers com walletId);
 * - no reembolso, o Asaas devolve o valor todo da conta principal, e ninguém
 *   precisa devolver nada.
 *
 * Por que não split + Conta Escrow (testado no sandbox em 25/09/2026): o split
 * vindo da conta principal cai LIVRE no saldo da subconta; o escrow só retém
 * cobranças criadas com a chave da própria subconta. Ver README.
 *
 * Testado no sandbox (25/09/2026, conta principal CNPJ):
 * - subconta criada por POST /accounts;
 * - reembolso de Pix sem split: fica aguardando autorização no painel. Logo
 *   depois do pagamento o Asaas responde "tente novamente em alguns instantes";
 * - POST /transfers: a chave precisa da permissão de saque via API (sem ela: 403
 *   insufficient_permission). Com a permissão, subconta ainda não aprovada é
 *   recusada (400 "...quando a aprovação do cadastro da conta de destino for
 *   concluída"); por isso o repasse ao vendedor espera a aprovação
 *   (AGUARDANDO_CADASTRO);
 * - com a subconta aprovada, POST /transfers é aceito e volta PENDING com
 *   authorized: false (o saldo já sai da conta principal) até alguém autorizar
 *   no painel: o repasse fica em AGUARDANDO_APROVACAO e é concluído pelo
 *   webhook TRANSFER_DONE ou pela rotina, que consulta GET /transfers/{id}.
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

  async transferToWallet(req: TransferRequest): Promise<TransferResult> {
    const transfer = await this.request<AsaasTransfer>("POST", "/transfers", {
      value: req.cents / 100,
      walletId: req.walletId,
      externalReference: req.externalReference,
      description: req.description,
    });
    return transferResult(transfer);
  }

  async getTransfer(transferId: string): Promise<TransferResult> {
    return transferResult(await this.request<AsaasTransfer>("GET", `/transfers/${transferId}`));
  }

  // Saque automático: a subconta (BaaS, sem acesso ao painel) envia o saldo por Pix
  // para a chave CPF do vendedor ou CNPJ da agência. Feito com a chave da subconta.
  // Ainda não testado no sandbox (precisa de chave Pix CPF de destino válida).
  async getAccountBalance(accountApiKey: string): Promise<number> {
    const body = await this.request<{ balance?: number }>("GET", "/finance/balance", undefined, accountApiKey);
    return Math.round((body.balance ?? 0) * 100);
  }

  async withdrawToPix(accountApiKey: string, req: WithdrawalRequest): Promise<TransferResult> {
    const transfer = await this.request<AsaasTransfer>(
      "POST",
      "/transfers",
      {
        value: req.cents / 100,
        operationType: "PIX",
        pixAddressKey: onlyDigits(req.pixKey),
        pixAddressKeyType: req.pixKeyType,
        externalReference: req.externalReference,
        description: req.description,
      },
      accountApiKey,
    );
    return transferResult(transfer);
  }

  async getAccountTransfer(accountApiKey: string, transferId: string): Promise<TransferResult> {
    return transferResult(await this.request<AsaasTransfer>("GET", `/transfers/${transferId}`, undefined, accountApiKey));
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

  // No sandbox de conta CPF não há subcontas; lá aceitamos vendedor sem carteira.
  get requiresSellerWallet(): boolean {
    return !this.isSandbox;
  }

  // Testado no sandbox com conta principal CNPJ: cria a subconta e devolve walletId e chave.
  // Não ligamos a Conta Escrow dela: o dinheiro fica na conta da plataforma até o repasse.
  async createSellerAccount(req: SellerAccountRequest): Promise<SellerAccount> {
    const account = await this.request<{ id: string; walletId: string; apiKey?: string }>("POST", "/accounts", {
      name: req.name,
      email: req.email,
      cpfCnpj: onlyDigits(req.cpfCnpj),
      ...(req.birthDate && { birthDate: req.birthDate.toISOString().slice(0, 10) }),
      ...(req.companyType && { companyType: req.companyType }),
      mobilePhone: onlyDigits(req.mobilePhone),
      incomeValue: req.incomeCents / 100,
      address: req.address,
      addressNumber: req.addressNumber,
      complement: req.complement,
      province: req.province,
      postalCode: onlyDigits(req.postalCode),
      // Avisos da análise de documentos da subconta chegam no mesmo webhook do site.
      ...(process.env.SITE_URL &&
        process.env.ASAAS_WEBHOOK_TOKEN && {
          webhooks: [
            {
              name: "Análise da conta",
              url: `${process.env.SITE_URL.replace(/\/$/, "")}/api/webhooks/asaas`,
              email: process.env.ASAAS_WEBHOOK_EMAIL ?? req.email,
              sendType: "SEQUENTIALLY",
              enabled: true,
              interrupted: false,
              authToken: process.env.ASAAS_WEBHOOK_TOKEN,
              events: ["ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED", "ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED"],
            },
          ],
        }),
    });
    return { accountId: account.id, walletId: account.walletId, apiKey: account.apiKey ?? null };
  }

  // Documentos pendentes da subconta; o link é consultado com a chave da própria subconta.
  async getOnboardingUrl(account: SellerAccount): Promise<string | null> {
    if (!account.apiKey) return null;
    const res = await fetch(`${this.apiUrl}/myAccount/documents`, {
      headers: { "Content-Type": "application/json", "User-Agent": "revenda-ingressos", access_token: account.apiKey },
    });
    if (!res.ok) throw new Error(`Asaas GET /myAccount/documents falhou: ${res.status}`);
    const body = (await res.json()) as { data?: { onboardingUrl?: string | null }[] };
    return body.data?.find((d) => d.onboardingUrl)?.onboardingUrl ?? null;
  }

  get isSandbox(): boolean {
    return this.apiUrl.includes("sandbox");
  }

  async simulatePayment(chargeId: string): Promise<void> {
    if (!this.isSandbox) throw new Error("Simulação de pagamento só existe no sandbox");
    await this.request("POST", `/sandbox/payment/${chargeId}/confirm`);
  }

  /** `apiKey` troca a chave da conta principal pela de uma subconta. */
  private async request<T = unknown>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown, apiKey = this.apiKey): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "revenda-ingressos",
        ...(apiKey && { access_token: apiKey }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Asaas ${method} ${path} falhou: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as T;
  }
}

// Status do Asaas: PENDING, BANK_PROCESSING, DONE, CANCELLED, FAILED (BLOCKED no webhook).
function transferResult(t: AsaasTransfer): TransferResult {
  const base = { transferId: t.id, error: t.failReason ?? null };
  if (t.status === "DONE") return { ...base, status: "CONCLUIDO" };
  if (t.status === "FAILED" || t.status === "CANCELLED") return { ...base, status: "FALHOU", error: t.failReason ?? `Transferência ${t.status}` };
  if (t.status === "PENDING" && t.authorized === false) return { ...base, status: "AGUARDANDO_APROVACAO" };
  return { ...base, status: "SOLICITADO" };
}
