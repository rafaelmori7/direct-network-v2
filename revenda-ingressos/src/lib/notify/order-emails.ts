import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import type { OrderStatus } from "@/lib/orders/state-machine";
import { alreadySent, sendEmail } from "./email";
import { sendWhatsApp, type WhatsAppTemplate } from "./whatsapp";

function orderUrl(orderId: string): string {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/pedidos/${orderId}`;
}

function footer(orderId: string): string {
  return `\n\nVer pedido: ${orderUrl(orderId)}\n\n${BRAND.name} — pagamento protegido até o fim do evento. Nunca pague por fora do site.`;
}

const CONTACT = { name: true, email: true, phone: true, whatsappOptIn: true } as const;

interface Contact {
  name: string;
  phone: string;
  whatsappOptIn: boolean;
}

/** WhatsApp só para os avisos que pedem ação ou envolvem dinheiro, e só para quem aceitou. */
async function whats(person: Contact, orderId: string, kind: string, template: WhatsAppTemplate, params: string[]) {
  if (!person.whatsappOptIn) return;
  await sendWhatsApp({ phone: person.phone, template, params: [person.name.split(" ")[0], ...params], kind, orderId });
}

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: CONTACT },
      listing: { include: { event: { select: { name: true } }, seller: { select: CONTACT } } },
    },
  });
}

/** Avisos de mudança de status. Chamado depois do commit; erros são engolidos. */
export async function notifyStatusChange(orderId: string, next: OrderStatus, action: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;
    const event = order.listing.event.name;
    const buyer = order.buyer;
    const seller = order.listing.seller;
    const first = (name: string) => name.split(" ")[0];
    const send = (to: string, kind: string, subject: string, text: string) =>
      sendEmail({ to, kind, orderId, subject, text: text + footer(orderId) });
    const link = orderUrl(orderId);
    const deadline = order.transferDeadlineAt ? formatDateTime(order.transferDeadlineAt) : "o prazo";

    switch (next) {
      case "PAGO":
        await send(buyer.email, "PAGO_COMPRADOR", `Pagamento confirmado: ${event}`,
          `Oi, ${first(buyer.name)}! Seu pagamento de ${formatBRL(order.totalCents)} foi confirmado e está retido com segurança.\n` +
          `O vendedor tem até ${order.transferDeadlineAt ? formatDateTime(order.transferDeadlineAt) : "o prazo"} para transferir o ingresso pelo app oficial. Se não transferir, você recebe o dinheiro de volta.`);
        await send(seller.email, "PAGO_VENDEDOR", `Você vendeu! Transfira o ingresso: ${event}`,
          `Oi, ${first(seller.name)}! Seu ingresso de ${event} foi vendido.\n` +
          `Transfira pelo app oficial até ${order.transferDeadlineAt ? formatDateTime(order.transferDeadlineAt) : "o prazo"} usando os dados do comprador que estão na página do pedido, e depois clique em "Já transferi".\n` +
          `Você recebe ${formatBRL(order.sellerNetCents)} depois do evento.`);
        await whats(buyer, orderId, "PAGO_COMPRADOR", "pagamento_confirmado", [formatBRL(order.totalCents), event, deadline, link]);
        await whats(seller, orderId, "PAGO_VENDEDOR", "venda_transferir", [event, deadline, link]);
        break;
      case "TRANSFERIDO":
        await send(buyer.email, "TRANSFERIDO", `O vendedor transferiu seu ingresso: ${event}`,
          `Abra o app oficial da ticketeira, aceite a transferência se for pedido e confirme o recebimento na página do pedido.`);
        await whats(buyer, orderId, "TRANSFERIDO", "ingresso_transferido", [event, link]);
        break;
      case "RECEBIDO":
        await send(seller.email, "RECEBIDO", `O comprador confirmou o recebimento: ${event}`,
          `Seu pagamento de ${formatBRL(order.sellerNetCents)} será liberado em ${formatDateTime(order.releaseAt)}, se não houver disputa.`);
        break;
      case "LIBERADO":
        if (order.payoutStatus === "AGUARDANDO_CADASTRO") {
          await send(seller.email, "LIBERADO_AGUARDANDO_CADASTRO", `Seu pagamento está esperando a aprovação do cadastro: ${event}`,
            `A venda foi concluída, mas ${formatBRL(order.sellerNetCents)} só podem ser liberados depois que sua conta de recebimento for aprovada. Envie seus documentos em Minha conta → Conta de recebimento.`);
        } else {
          await send(seller.email, "LIBERADO", `Pagamento liberado: ${event}`,
            `${formatBRL(order.sellerNetCents)} foram liberados na sua conta de recebimento.`);
          await whats(seller, orderId, "LIBERADO", "pagamento_liberado", [formatBRL(order.sellerNetCents), event, link]);
        }
        break;
      case "REEMBOLSADO":
      case "CANCELADO":
        if (next === "CANCELADO" && action === "PAGAMENTO_EXPIRADO") {
          await send(buyer.email, "PIX_VENCIDO", `Seu Pix venceu: ${event}`,
            `O prazo para pagar terminou e a reserva foi liberada. Se ainda quiser, faça uma nova compra no site.`);
        } else {
          await send(buyer.email, "REEMBOLSO", `Devolução do seu pagamento: ${event}`,
            `Vamos devolver ${formatBRL(order.totalCents)} para a conta que fez o Pix. Avisaremos quando concluir.`);
          await whats(buyer, orderId, "REEMBOLSO", "reembolso", [formatBRL(order.totalCents), event, link]);
          if (action === "PRAZO_TRANSFERENCIA_ESGOTADO") {
            await send(seller.email, "PRAZO_PERDIDO", `Venda cancelada: ${event}`,
              `O prazo para transferir terminou e o comprador foi reembolsado. Seu anúncio foi pausado.`);
          }
        }
        break;
      case "EM_DISPUTA": {
        const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { email: true } });
        for (const { email } of admins) {
          await send(email, "DISPUTA_ADMIN", `Nova disputa: ${event}`, `Uma disputa foi aberta. O dinheiro segue retido até a decisão.`);
        }
        for (const person of [buyer, seller]) {
          await send(person.email, "DISPUTA", `Disputa aberta: ${event}`,
            `Nossa equipe vai analisar a conversa e o histórico do pedido. O dinheiro segue retido até a decisão.`);
          await whats(person, orderId, "DISPUTA", "disputa_aberta", [event, link]);
        }
        break;
      }
    }
  } catch {
    // Aviso é secundário: nunca interrompe o fluxo do pedido.
  }
}

const CHAT_EMAIL_INTERVAL_MS = 15 * 60_000;

/** Nova mensagem no chat: avisa a outra parte, no máximo um e-mail a cada 15 min por pedido. */
export async function notifyChatMessage(orderId: string, fromRole: "COMPRADOR" | "VENDEDOR" | "ADMIN"): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;
    const recipients =
      fromRole === "COMPRADOR" ? [order.listing.seller] : fromRole === "VENDEDOR" ? [order.buyer] : [order.buyer, order.listing.seller];
    const since = new Date(Date.now() - CHAT_EMAIL_INTERVAL_MS);
    for (const person of recipients) {
      if (await alreadySent(orderId, "CHAT", person.email, since)) continue;
      await sendEmail({
        to: person.email,
        kind: "CHAT",
        orderId,
        subject: `Nova mensagem sobre ${order.listing.event.name}`,
        text: `Você recebeu uma nova mensagem no pedido. Responda pelo site.` + footer(orderId),
      });
    }
  } catch {
    // idem
  }
}

/** Lembrete ao vendedor quando faltam poucas horas para o fim do prazo de transferência. */
export async function sendTransferReminders(now: Date, hoursBefore = 6): Promise<number> {
  const soon = new Date(now.getTime() + hoursBefore * 3600_000);
  const orders = await prisma.order.findMany({
    where: { status: "PAGO", transferDeadlineAt: { gt: now, lte: soon } },
    include: { listing: { include: { seller: { select: CONTACT }, event: { select: { name: true } } } } },
  });
  let sent = 0;
  for (const o of orders) {
    const to = o.listing.seller.email;
    if (await alreadySent(o.id, "LEMBRETE_TRANSFERENCIA", to)) continue;
    await sendEmail({
      to,
      kind: "LEMBRETE_TRANSFERENCIA",
      orderId: o.id,
      subject: `Lembrete: transfira o ingresso até ${formatDateTime(o.transferDeadlineAt!)}`,
      text: `Faltam poucas horas para o fim do prazo de transferência de ${o.listing.event.name}. Se não transferir, a venda é cancelada e o comprador reembolsado.` + footer(o.id),
    });
    await whats(o.listing.seller, o.id, "LEMBRETE_TRANSFERENCIA", "lembrete_transferencia", [
      o.listing.event.name,
      formatDateTime(o.transferDeadlineAt!),
      orderUrl(o.id),
    ]);
    sent++;
  }
  return sent;
}
