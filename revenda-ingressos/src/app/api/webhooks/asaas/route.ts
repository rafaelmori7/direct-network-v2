import { handlePaymentReceived, handleRefundCompleted, handleTransferUpdate } from "@/lib/orders/service";
import { handleSellerAccountStatus } from "@/lib/sellers/service";
import { getPaymentProvider } from "@/lib/payments";
import { tokenMatches } from "@/lib/payments/webhook-auth";

// Configurado no painel do Asaas (Integrações > Webhooks) apontando para
// https://<site>/api/webhooks/asaas, com o "Token de autenticação" igual a ASAAS_WEBHOOK_TOKEN.
// O Asaas envia esse token no header "asaas-access-token".
// Eventos usados: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_REFUNDED e
// TRANSFER_DONE, TRANSFER_FAILED e TRANSFER_CANCELLED (repasses autorizados no painel).

const PAYMENT_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const TRANSFER_EVENTS = new Set(["TRANSFER_DONE", "TRANSFER_FAILED", "TRANSFER_CANCELLED"]);

export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !tokenMatches(request.headers.get("asaas-access-token"), expected)) {
    return new Response("Não autorizado", { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    event?: string;
    payment?: { id?: string };
    transfer?: { id?: string };
    accountStatus?: { id?: string };
  } | null;
  const chargeId = body?.payment?.id;

  // Análise da conta de recebimento do vendedor (webhook configurado na subconta).
  // TODO(CNPJ): validar o formato do aviso no sandbox com subconta real.
  const accountId = body?.accountStatus?.id;
  if (accountId && body?.event === "ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED") {
    return Response.json({ ok: true, sellerApproved: await handleSellerAccountStatus(accountId, true) });
  }
  if (accountId && body?.event === "ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED") {
    return Response.json({ ok: true, sellerRejected: await handleSellerAccountStatus(accountId, false) });
  }
  // A situação é consultada no Asaas (não confiamos só no corpo do aviso).
  const transferId = body?.transfer?.id;
  if (body?.event && TRANSFER_EVENTS.has(body.event) && transferId) {
    return Response.json({ ok: true, payoutUpdated: await handleTransferUpdate(transferId, getPaymentProvider()) });
  }
  if (body?.event === "PAYMENT_REFUNDED" && chargeId) {
    return Response.json({ ok: true, refundCompleted: await handleRefundCompleted(chargeId) });
  }
  if (!body?.event || !PAYMENT_EVENTS.has(body.event) || !chargeId) {
    return Response.json({ ok: true, ignored: true });
  }

  // Erro aqui devolve 500 e o Asaas tenta de novo; o tratamento é idempotente.
  const outcome = await handlePaymentReceived(chargeId, getPaymentProvider());
  return Response.json({ ok: true, outcome });
}
