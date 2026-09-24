import { runRoutines } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";

// Chamar a cada ~5 minutos com "Authorization: Bearer $CRON_SECRET".
// Cancela Pix vencidos, reembolsa quando o vendedor perde o prazo, libera o
// pagamento após o evento e tira do ar anúncios de eventos com venda encerrada.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  return Response.json(await runRoutines(getPaymentProvider()));
}
