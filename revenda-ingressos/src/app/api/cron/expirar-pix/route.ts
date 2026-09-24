import { expireUnpaidOrders } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";

// Chamado a cada poucos minutos pelo agendador (ex.: Vercel Cron) com
// "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  const expired = await expireUnpaidOrders(getPaymentProvider());
  return Response.json({ expired });
}
