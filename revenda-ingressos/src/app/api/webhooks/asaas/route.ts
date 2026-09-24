import { timingSafeEqual } from "node:crypto";
import { handlePaymentReceived } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";

// Configurado no painel do Asaas (Integrações > Webhooks) apontando para
// https://<site>/api/webhooks/asaas, com o "Token de autenticação" igual a ASAAS_WEBHOOK_TOKEN.
// O Asaas envia esse token no header "asaas-access-token".

const PAYMENT_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

function tokenMatches(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !tokenMatches(request.headers.get("asaas-access-token"), expected)) {
    return new Response("Não autorizado", { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { event?: string; payment?: { id?: string } } | null;
  const chargeId = body?.payment?.id;
  if (!body?.event || !PAYMENT_EVENTS.has(body.event) || !chargeId) {
    return Response.json({ ok: true, ignored: true });
  }

  // Erro aqui devolve 500 e o Asaas tenta de novo; o tratamento é idempotente.
  const outcome = await handlePaymentReceived(chargeId, getPaymentProvider());
  return Response.json({ ok: true, outcome });
}
