import { tokenMatches } from "@/lib/payments/webhook-auth";
import { validateTransfer, type AsaasTransferPayload } from "@/lib/payments/transfer-validation";

// Validação de saque por webhook: o suporte do Asaas liga o mecanismo com esta URL
// (https://<site>/api/webhooks/asaas/saques) e o authToken igual a ASAAS_WEBHOOK_TOKEN.
// Responde APPROVED só para transferências que o próprio site pediu.
export async function POST(request: Request) {
  if (!tokenMatches(request.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN)) {
    return new Response("Não autorizado", { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { type?: string; transfer?: AsaasTransferPayload } | null;
  if (body?.type !== "TRANSFER" || !body.transfer) {
    return Response.json({ status: "REFUSED", refuseReason: "Tipo de validação não suportado" });
  }
  // Erro aqui devolve 500 e o Asaas tenta de novo (até três vezes, depois cancela).
  return Response.json(await validateTransfer(body.transfer));
}
