import { createHash, timingSafeEqual } from "node:crypto";
import { handlePaymentReceived } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";

/** Eventos do Asaas que indicam dinheiro recebido. O resto só é confirmado com 200. */
const PAID_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

// Configurado no painel do Asaas (Integrações → Webhooks) apontando para
// /api/webhooks/asaas, com o token de autenticação igual a ASAAS_WEBHOOK_TOKEN.
// Respondemos 200 para tudo que foi processado ou ignorado; erro só quando
// queremos que o Asaas reenvie (falha no banco ou no gateway).
export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !sameToken(request.headers.get("asaas-access-token"), expected)) {
    return new Response("Não autorizado", { status: 401 });
  }

  let body: { event?: string; payment?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const chargeId = body.payment?.id;
  if (!body.event || !PAID_EVENTS.has(body.event) || !chargeId) {
    return Response.json({ result: "IGNORADO" });
  }

  const result = await handlePaymentReceived(chargeId, getPaymentProvider(), {
    allowUnknownPayer: process.env.ASAAS_API_URL?.includes("sandbox") ?? false,
  });
  return Response.json({ result });
}

function sameToken(received: string | null, expected: string): boolean {
  if (!received) return false;
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(received), digest(expected));
}
