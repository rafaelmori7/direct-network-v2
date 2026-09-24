// Teste de ponta a ponta no sandbox do Asaas. Uso: npm run asaas:sandbox
// Lê ASAAS_API_URL e ASAAS_API_KEY do ambiente. Recusa rodar fora do sandbox.
//
// O que ele responde (as dúvidas de src/lib/payments/asaas.ts):
// 1. a chave funciona e a conta existe;
// 2. dá para criar cliente + cobrança Pix e gerar o QR Code;
// 3. o pagamento simulado do sandbox muda o status para RECEIVED;
// 4. em que formato vem o CPF do pagador na transação Pix;
// 5. o reembolso funciona e o endpoint de custódia (escrow) responde.
import { AsaasPaymentProvider } from "../src/lib/payments/asaas";

const apiUrl = process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3";
const apiKey = process.env.ASAAS_API_KEY ?? "";
if (!apiUrl.includes("sandbox")) {
  console.error(`ASAAS_API_URL não é o sandbox (${apiUrl}). Abortando.`);
  process.exit(1);
}

type Step = { name: string; ok: boolean; detail: string };
const steps: Step[] = [];

async function call<T = any>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "revenda-ingressos" };
  if (apiKey) headers.access_token = apiKey;
  const res = await fetch(`${apiUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: res.status, data };
}

async function step<T>(name: string, fn: () => Promise<{ ok: boolean; detail: string; value?: T }>): Promise<T | undefined> {
  try {
    const r = await fn();
    steps.push({ name, ok: r.ok, detail: r.detail });
    console.log(`${r.ok ? "✔" : "✘"} ${name}: ${r.detail}`);
    return r.ok ? r.value : undefined;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    steps.push({ name, ok: false, detail });
    console.log(`✘ ${name}: ${detail}`);
    return undefined;
  }
}

const brief = (r: { status: number; data: any }) =>
  `HTTP ${r.status} ${typeof r.data === "string" ? r.data.slice(0, 200) : JSON.stringify(r.data?.errors ?? r.data).slice(0, 300)}`;

async function main() {
  const account = await step("Conta (chave de API)", async () => {
    const r = await call("GET", "/myAccount");
    return r.status === 200
      ? { ok: true, detail: `${r.data.name ?? "?"} · walletId ${r.data.walletId ?? "?"}`, value: r.data }
      : { ok: false, detail: brief(r) };
  });
  if (!account) return;

  await step("Chaves Pix da conta", async () => {
    const r = await call("GET", "/pix/addressKeys?status=ACTIVE");
    const n = r.data?.totalCount ?? r.data?.data?.length ?? 0;
    return r.status === 200
      ? { ok: n > 0, detail: n > 0 ? `${n} chave(s) ativa(s)` : "nenhuma chave ativa (o QR Code pode falhar)" }
      : { ok: false, detail: brief(r) };
  });

  const customerId = await step<string>("Criar cliente", async () => {
    const r = await call("POST", "/customers", {
      name: "Comprador Teste Revenda",
      cpfCnpj: "24971563792",
      email: "comprador.teste@example.com",
      notificationDisabled: true,
    });
    return r.status === 200 ? { ok: true, detail: r.data.id, value: r.data.id } : { ok: false, detail: brief(r) };
  });
  if (!customerId) return;

  const due = new Date(Date.now() + 24 * 3600_000).toISOString().slice(0, 10);
  const paymentId = await step<string>("Criar cobrança Pix (R$ 10,00)", async () => {
    const r = await call("POST", "/payments", {
      customer: customerId,
      billingType: "PIX",
      value: 10,
      dueDate: due,
      description: "Teste sandbox revenda-ingressos",
      externalReference: `sandbox-${Date.now()}`,
    });
    return r.status === 200 ? { ok: true, detail: `${r.data.id} (${r.data.status})`, value: r.data.id } : { ok: false, detail: brief(r) };
  });
  if (!paymentId) return;

  await step("QR Code Pix", async () => {
    const r = await call("GET", `/payments/${paymentId}/pixQrCode`);
    return r.status === 200 && r.data.payload
      ? { ok: true, detail: `copia-e-cola com ${r.data.payload.length} caracteres` }
      : { ok: false, detail: brief(r) };
  });

  const paid = await step<boolean>("Simular pagamento (sandbox)", async () => {
    const r = await call("POST", `/sandbox/payment/${paymentId}/confirm`);
    if (r.status === 200) return { ok: true, detail: `status ${r.data.status}`, value: true };
    // Alternativa: "recebido em dinheiro" também marca como pago (sem transação Pix).
    const cash = await call("POST", `/payments/${paymentId}/receiveInCash`, { paymentDate: new Date().toISOString().slice(0, 10), value: 10 });
    return cash.status === 200
      ? { ok: true, detail: `confirm falhou (${brief(r)}); usei receiveInCash → ${cash.data.status}`, value: true }
      : { ok: false, detail: `confirm: ${brief(r)} · receiveInCash: ${brief(cash)}` };
  });

  if (paid) {
    await step("Transação Pix e CPF do pagador", async () => {
      const p = await call("GET", `/payments/${paymentId}`);
      if (!p.data.pixTransaction) return { ok: true, detail: `status ${p.data.status}; sem pixTransaction (pagamento simulado)` };
      const t = await call("GET", `/pix/transactions/${p.data.pixTransaction}`);
      return { ok: t.status === 200, detail: `externalAccount = ${JSON.stringify(t.data.externalAccount ?? null)}` };
    });

    await step("getChargeStatus do provider", async () => {
      const s = await new AsaasPaymentProvider(apiUrl, apiKey).getChargeStatus(paymentId);
      return { ok: s.paid, detail: JSON.stringify(s) };
    });

    await step("Custódia (GET /payments/{id}/escrow)", async () => {
      const r = await call("GET", `/payments/${paymentId}/escrow`);
      // Sem split para subconta com escrow, o esperado é não existir custódia.
      return { ok: true, detail: brief(r) };
    });

    await step("Reembolso", async () => {
      const r = await call("POST", `/payments/${paymentId}/refund`);
      return r.status === 200 ? { ok: true, detail: `status ${r.data.status}` } : { ok: false, detail: brief(r) };
    });
  } else {
    await step("Remover cobrança não paga", async () => {
      const r = await call("DELETE", `/payments/${paymentId}`);
      return { ok: r.status === 200, detail: brief(r) };
    });
  }

  await step("Remover cliente de teste", async () => {
    const r = await call("DELETE", `/customers/${customerId}`);
    return { ok: r.status === 200, detail: brief(r) };
  });
}

main().finally(() => {
  const failed = steps.filter((s) => !s.ok).length;
  console.log(`\n${steps.length - failed}/${steps.length} etapas ok`);
  process.exitCode = failed > 0 ? 1 : 0;
});
