import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { eventRuleInput, getEvent, rulesFor } from "@/lib/data/repo";
import { splitAmount } from "@/lib/money/fees";
import { payerMatchesBuyer, type PaymentProvider } from "@/lib/payments/provider";
import { checkPurchase, disputeDeadline, releaseAt, transferDeadline, type Violation } from "@/lib/rules/engine";
import type { BuyerIdentifier, TicketType } from "@/lib/rules/types";
import { addMinutes } from "@/lib/time";
import { transition, type Actor, type Effect, type OrderAction, type OrderStatus } from "./state-machine";

/** Tempo para pagar o Pix. Enquanto isso, a quantidade fica reservada. */
export const PIX_EXPIRATION_MINUTES = 30;

export interface CreateOrderInput {
  listingId: string;
  buyer: { id: string; name: string; cpf: string; email: string; canBuy: boolean };
  quantity: number;
  identifiers: Partial<Record<BuyerIdentifier, string>>;
  buyerDeclaresHalfPriceEligible: boolean;
  feeBps: number;
  now?: Date;
}

export type CreateOrderResult = { ok: true; orderId: string } | { ok: false; errors: string[] };

export async function createOrder(input: CreateOrderInput, provider: PaymentProvider): Promise<CreateOrderResult> {
  const now = input.now ?? new Date();
  const listing = await prisma.listing.findUnique({ where: { id: input.listingId }, include: { seller: true } });
  if (!listing || listing.status !== "ATIVO") return { ok: false, errors: ["Anúncio indisponível."] };
  const event = await getEvent(listing.eventId);
  if (!event) return { ok: false, errors: ["Evento não encontrado."] };

  if (!Number.isInteger(input.quantity) || input.quantity < 1) return { ok: false, errors: ["Quantidade inválida."] };

  const rules = rulesFor(event);
  const eventInput = eventRuleInput(event);
  const violations: Violation[] = checkPurchase(
    rules,
    eventInput,
    {
      buyerId: input.buyer.id,
      sellerId: listing.sellerId,
      buyerVerified: input.buyer.canBuy,
      buyerIdentifiers: input.identifiers,
      ticketType: listing.ticketType as TicketType,
      buyerDeclaresHalfPriceEligible: input.buyerDeclaresHalfPriceEligible,
    },
    now,
  );
  if (violations.length > 0) return { ok: false, errors: violations.map((v) => v.message) };

  const sellerWalletId = listing.seller.gatewayWalletId ?? (process.env.PAYMENT_PROVIDER === "asaas" ? null : "mock-wallet");
  if (!sellerWalletId) return { ok: false, errors: ["O vendedor ainda não concluiu o cadastro de recebimento."] };

  const { totalCents, platformFeeCents, sellerNetCents } = splitAmount(listing.priceCents * input.quantity, input.feeBps);
  const paymentExpiresAt = addMinutes(now, PIX_EXPIRATION_MINUTES);

  // Reserva atômica: só decrementa se ainda houver quantidade. Duas compras
  // simultâneas do último ingresso: uma passa, a outra recebe "esgotado".
  const order = await prisma.$transaction(async (tx) => {
    const reserved = await tx.listing.updateMany({
      where: { id: listing.id, status: "ATIVO", quantityAvailable: { gte: input.quantity } },
      data: { quantityAvailable: { decrement: input.quantity } },
    });
    if (reserved.count === 0) return null;
    return tx.order.create({
      data: {
        listingId: listing.id,
        buyerId: input.buyer.id,
        quantity: input.quantity,
        totalCents,
        platformFeeCents,
        sellerNetCents,
        buyerIdentifiers: input.identifiers,
        paymentExpiresAt,
        disputeDeadlineAt: disputeDeadline(rules, eventInput),
        releaseAt: releaseAt(rules, eventInput),
      },
    });
  });
  if (!order) return { ok: false, errors: ["Esses ingressos acabaram de ser reservados por outra pessoa."] };

  try {
    const charge = await provider.createPixCharge({
      orderId: order.id,
      totalCents,
      sellerNetCents,
      sellerWalletId,
      buyer: { name: input.buyer.name, cpf: input.buyer.cpf, email: input.buyer.email },
      expiresAt: paymentExpiresAt,
      description: `${event.name} - ${listing.sector} (${input.quantity}x)`,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { chargeId: charge.chargeId, pixCopyPaste: charge.pixCopyPaste },
    });
  } catch (error) {
    await applyAction(order.id, { type: "PAGAMENTO_EXPIRADO" }, "SISTEMA", null, provider, { now, note: "Falha ao gerar o Pix" });
    throw error;
  }
  return { ok: true, orderId: order.id };
}

type ApplyResult = { ok: true; status: OrderStatus } | { ok: false; error: string };

/**
 * Aplica uma ação no pedido: valida pela máquina de estados, grava o novo
 * status só se ninguém mudou o pedido no meio tempo, registra o histórico e,
 * depois do commit, executa os efeitos no gateway.
 */
export async function applyAction(
  orderId: string,
  action: OrderAction,
  actor: Actor,
  actorId: string | null,
  provider: PaymentProvider,
  opts: { now?: Date; note?: string } = {},
): Promise<ApplyResult> {
  const now = opts.now ?? new Date();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order) return { ok: false, error: "Pedido não encontrado." };

  const result = transition(
    {
      status: order.status,
      transferDeadlineAt: order.transferDeadlineAt,
      disputeDeadlineAt: order.disputeDeadlineAt,
      releaseAt: order.releaseAt,
    },
    action,
    actor,
    now,
  );
  if (!result.ok) return result;

  const data: Prisma.OrderUpdateManyMutationInput = { status: result.next };
  if (action.type === "PAGAMENTO_CONFIRMADO") {
    const event = await getEvent(order.listing.eventId);
    if (!event) return { ok: false, error: "Evento não encontrado." };
    data.paidAt = now;
    data.transferDeadlineAt = transferDeadline(rulesFor(event), eventRuleInput(event), now);
  }

  const committed = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data });
    if (updated.count === 0) return false;
    if (order.status === "AGUARDANDO_PAGAMENTO" && (result.next === "CANCELADO" || result.next === "REEMBOLSADO")) {
      // Pix não pago (ou recusado): devolve a quantidade reservada ao anúncio.
      await tx.listing.update({ where: { id: order.listingId }, data: { quantityAvailable: { increment: order.quantity } } });
    }
    if (action.type === "PRAZO_TRANSFERENCIA_ESGOTADO") {
      // Vendedor não entregou: tira o anúncio do ar até o admin revisar.
      await tx.listing.update({ where: { id: order.listingId }, data: { status: "PAUSADO" } });
    }
    await tx.orderLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: result.next,
        action: action.type,
        actor,
        actorId,
        note: opts.note ?? ("reason" in action ? action.reason : "note" in action ? action.note : null),
      },
    });
    return true;
  });
  if (!committed) return { ok: false, error: "O pedido foi alterado ao mesmo tempo. Atualize a página." };

  await runEffects(result.effects, order.chargeId, provider);
  return { ok: true, status: result.next };
}

// TODO: mover para uma fila com novas tentativas; se o gateway falhar aqui, o
// status já mudou e o efeito precisa ser reexecutado pelo admin.
async function runEffects(effects: Effect[], chargeId: string | null, provider: PaymentProvider): Promise<void> {
  for (const effect of effects) {
    if (!chargeId) throw new Error(`Pedido sem cobrança para executar ${effect.type}`);
    if (effect.type === "REEMBOLSAR_COMPRADOR") await provider.refund(chargeId);
    if (effect.type === "LIBERAR_CUSTODIA") await provider.releaseEscrow(chargeId);
  }
}

/** Rotina agendada: cancela Pix vencidos e devolve a reserva ao anúncio. */
export async function expireUnpaidOrders(provider: PaymentProvider, now = new Date()): Promise<number> {
  const expired = await prisma.order.findMany({
    where: { status: "AGUARDANDO_PAGAMENTO", paymentExpiresAt: { lt: now } },
    select: { id: true },
  });
  let count = 0;
  for (const { id } of expired) {
    const r = await applyAction(id, { type: "PAGAMENTO_EXPIRADO" }, "SISTEMA", null, provider, { now });
    if (r.ok) count++;
  }
  return count;
}

export type PaymentNotificationResult =
  | "CONFIRMADO"
  | "RECUSADO_PAGADOR"
  | "REEMBOLSADO_APOS_VENCIMENTO"
  | "IGNORADO";

/**
 * Chamado pelo webhook quando o gateway avisa que um Pix foi pago. Não confia
 * no corpo do webhook: consulta a cobrança no gateway. Pode ser chamado várias
 * vezes para a mesma cobrança (o gateway reenvia) sem efeito repetido.
 *
 * - Pix pelo CPF do comprador: pedido PAGO.
 * - Pix por outro CPF: reembolso e reserva devolvida (evita golpe com conta de terceiro e MED).
 * - Pix pago depois do vencimento (pedido já cancelado): reembolso.
 *
 * `allowUnknownPayer` só no sandbox, onde o pagamento simulado não traz o pagador.
 */
export async function handlePaymentReceived(
  chargeId: string,
  provider: PaymentProvider,
  opts: { now?: Date; allowUnknownPayer?: boolean } = {},
  retried = false,
): Promise<PaymentNotificationResult> {
  const now = opts.now ?? new Date();
  const order = await prisma.order.findUnique({ where: { chargeId }, include: { buyer: true } });
  if (!order) return "IGNORADO";

  const charge = await provider.getChargeStatus(chargeId);
  if (!charge.paid) return "IGNORADO";

  if (order.status === "CANCELADO") {
    const alreadyRefunded = await prisma.orderLog.findFirst({ where: { orderId: order.id, action: "PIX_PAGO_APOS_VENCIMENTO" } });
    if (alreadyRefunded) return "IGNORADO";
    await prisma.orderLog.create({
      data: {
        orderId: order.id,
        fromStatus: "CANCELADO",
        toStatus: "CANCELADO",
        action: "PIX_PAGO_APOS_VENCIMENTO",
        actor: "SISTEMA",
        note: "Pix pago depois do vencimento: valor devolvido ao pagador",
      },
    });
    await provider.refund(chargeId);
    return "REEMBOLSADO_APOS_VENCIMENTO";
  }
  if (order.status !== "AGUARDANDO_PAGAMENTO") return "IGNORADO";

  const unknownAllowed = !charge.payerCpf && opts.allowUnknownPayer === true;
  if (!unknownAllowed && !payerMatchesBuyer(charge.payerCpf, order.buyer.cpf)) {
    const reason = charge.payerCpf
      ? "Pix pago por um CPF diferente do comprador"
      : "O banco não informou o CPF de quem pagou o Pix";
    const r = await applyAction(order.id, { type: "PAGAMENTO_RECUSADO", reason }, "SISTEMA", null, provider, { now });
    if (r.ok) return "RECUSADO_PAGADOR";
  } else {
    const r = await applyAction(order.id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, {
      now,
      note: unknownAllowed ? "Pagador não informado (sandbox)" : undefined,
    });
    if (r.ok) return "CONFIRMADO";
  }
  // O pedido mudou no meio (ex.: a rotina de expiração cancelou agora): trata
  // de novo com o status atual para o dinheiro não ficar parado.
  return retried ? "IGNORADO" : handlePaymentReceived(chargeId, provider, opts, true);
}
