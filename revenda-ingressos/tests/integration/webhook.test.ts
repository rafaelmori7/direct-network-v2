import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createOrder, expireUnpaidOrders, handlePaymentReceived } from "@/lib/orders/service";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { PLATFORMS } from "@/lib/platforms/profiles";
import { addDays, addMinutes } from "@/lib/time";

const provider = new MockPaymentProvider();
vi.mock("@/lib/payments", () => ({ getPaymentProvider: () => provider }));

const now = new Date();
const BUYER_CPF = "11144477735";
let listingId: string;
let buyer: { id: string; name: string; cpf: string; email: string; canBuy: boolean };

beforeEach(async () => {
  for (const table of ["emailLog", "message", "orderLog", "dispute", "order", "listing", "wantedPost", "event", "session", "withdrawal", "user", "platform"] as const) {
    // @ts-expect-error acesso dinâmico aos delegates do Prisma
    await prisma[table].deleteMany();
  }
  const platform = await prisma.platform.create({ data: { code: "SYMPLA", name: "Sympla", profile: PLATFORMS.SYMPLA.profile as object } });
  const startsAt = addDays(now, 10);
  const event = await prisma.event.create({
    data: { slug: "w", name: "W", category: "Shows", venue: "V", city: "SP", platformId: platform.id, startsAt, endsAt: addDays(startsAt, 0.3), transferAllowed: "SIM" },
  });
  const mk = (name: string, cpf: string) =>
    prisma.user.create({ data: { name, email: `${cpf}@t.local`, cpf, phone: "11999999999", birthDate: new Date("1990-01-01"), passwordHash: "x", cpfCheckedAt: now, verifiedAt: now } });
  const seller = await mk("Vendedor W", "52998224725");
  const b = await mk("Comprador W", BUYER_CPF);
  buyer = { id: b.id, name: b.name, cpf: b.cpf, email: b.email, canBuy: true };
  listingId = (
    await prisma.listing.create({
      data: { eventId: event.id, sellerId: seller.id, sector: "Pista", ticketType: "INTEIRA", quantity: 1, quantityAvailable: 1, priceCents: 20_000, faceValueCents: 20_000, purchasedAt: addDays(now, -30), platformOrderRef: "X", sellerDeclaresOriginalBuyer: true },
    })
  ).id;
});

async function newOrder() {
  const r = await createOrder(
    { listingId, buyer, quantity: 1, identifiers: { EMAIL: buyer.email, CPF: buyer.cpf, NOME_COMPLETO: buyer.name }, buyerDeclaresHalfPriceEligible: false, fees: { buyerFeeBps: 0, sellerFeeBps: 1000 }, now },
    provider,
  );
  if (!r.ok) throw new Error(r.errors.join(", "));
  return prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
}

describe("aviso de pagamento", () => {
  it("Pix do próprio comprador confirma o pedido; aviso repetido é ignorado", async () => {
    const order = await newOrder();
    provider.markPaid(order.chargeId!, "***.444.777-**");
    expect(await handlePaymentReceived(order.chargeId!, provider, now)).toBe("CONFIRMADO");
    expect(await handlePaymentReceived(order.chargeId!, provider, now)).toBe("IGNORADO");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAGO");
  });

  it("Pix de outro CPF é devolvido e o ingresso volta para a venda", async () => {
    const order = await newOrder();
    provider.markPaid(order.chargeId!, "***.533.447-**");
    expect(await handlePaymentReceived(order.chargeId!, provider, now)).toBe("PAGADOR_DIFERENTE");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELADO");
    expect(provider.charges.get(order.chargeId!)?.state).toBe("REEMBOLSADO");
    expect((await prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).quantityAvailable).toBe(1);
  });

  it("sem CPF do pagador, confirma e deixa aviso no histórico", async () => {
    const order = await newOrder();
    provider.markPaid(order.chargeId!, undefined);
    provider.charges.get(order.chargeId!)!.payerCpf = undefined;
    expect(await handlePaymentReceived(order.chargeId!, provider, now)).toBe("CONFIRMADO");
    const log = await prisma.orderLog.findFirstOrThrow({ where: { orderId: order.id } });
    expect(log.note).toMatch(/CPF do pagador/);
  });

  it("Pix vencido cancela a cobrança; se pagar mesmo assim, devolve uma única vez", async () => {
    const order = await newOrder();
    await expireUnpaidOrders(provider, addMinutes(now, 31));
    expect(provider.charges.get(order.chargeId!)?.state).toBe("CANCELADA");
    provider.markPaid(order.chargeId!, BUYER_CPF);
    expect(await handlePaymentReceived(order.chargeId!, provider, now)).toBe("REEMBOLSADO_APOS_VENCER");
    expect(provider.charges.get(order.chargeId!)?.state).toBe("REEMBOLSADO");
    expect(await handlePaymentReceived(order.chargeId!, provider, now)).toBe("IGNORADO");
  });

  it("cobrança desconhecida é ignorada", async () => {
    expect(await handlePaymentReceived("nao-existe", provider, now)).toBe("IGNORADO");
  });
});

describe("rota do webhook", () => {
  const call = async (token: string | null, body: unknown) => {
    process.env.ASAAS_WEBHOOK_TOKEN = "segredo-teste";
    const { POST } = await import("@/app/api/webhooks/asaas/route");
    return POST(
      new Request("http://x/api/webhooks/asaas", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token && { "asaas-access-token": token }) },
        body: JSON.stringify(body),
      }),
    );
  };

  it("recusa sem o token certo", async () => {
    expect((await call(null, {})).status).toBe(401);
    expect((await call("errado", {})).status).toBe(401);
  });

  it("processa PAYMENT_RECEIVED e ignora outros eventos", async () => {
    const order = await newOrder();
    provider.markPaid(order.chargeId!, BUYER_CPF);
    const ignored = await call("segredo-teste", { event: "PAYMENT_CREATED", payment: { id: order.chargeId } });
    expect(await ignored.json()).toMatchObject({ ignored: true });
    const res = await call("segredo-teste", { event: "PAYMENT_RECEIVED", payment: { id: order.chargeId } });
    expect(await res.json()).toMatchObject({ outcome: "CONFIRMADO" });
  });
});

describe("reembolso com aprovação manual", () => {
  async function paidByOther() {
    const order = await newOrder();
    provider.markPaid(order.chargeId!, "***.533.447-**");
    return order;
  }

  it("fica aguardando aprovação e conclui com o aviso PAYMENT_REFUNDED", async () => {
    const order = await paidByOther();
    provider.nextRefundStatus = "AGUARDANDO_APROVACAO";
    await handlePaymentReceived(order.chargeId!, provider, now);
    provider.nextRefundStatus = "CONCLUIDO";
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).refundStatus).toBe("AGUARDANDO_APROVACAO");

    process.env.ASAAS_WEBHOOK_TOKEN = "segredo-teste";
    const { POST } = await import("@/app/api/webhooks/asaas/route");
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        headers: { "asaas-access-token": "segredo-teste" },
        body: JSON.stringify({ event: "PAYMENT_REFUNDED", payment: { id: order.chargeId } }),
      }),
    );
    expect(await res.json()).toMatchObject({ refundCompleted: true });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).refundStatus).toBe("CONCLUIDO");
  });

  it("falha do gateway fica registrada e pode ser refeita pelo admin", async () => {
    const { requestRefund } = await import("@/lib/orders/service");
    const order = await paidByOther();
    provider.failNextRefund = "Saldo insuficiente.";
    await handlePaymentReceived(order.chargeId!, provider, now);
    const failed = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(failed).toMatchObject({ status: "CANCELADO", refundStatus: "FALHOU", refundError: "Saldo insuficiente." });

    expect(await requestRefund(order.id, "FALHOU", provider)).toBe(true);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).refundStatus).toBe("CONCLUIDO");
    // Não refaz o que já foi feito.
    expect(await requestRefund(order.id, "FALHOU", provider)).toBe(false);
  });

  it("avisos simultâneos de Pix pago após vencer geram um único reembolso", async () => {
    const order = await newOrder();
    await expireUnpaidOrders(provider, addMinutes(now, 31));
    provider.markPaid(order.chargeId!, BUYER_CPF);
    const spy = vi.spyOn(provider, "refund");
    const results = await Promise.all([1, 2, 3].map(() => handlePaymentReceived(order.chargeId!, provider, now)));
    expect(results.filter((r) => r === "REEMBOLSADO_APOS_VENCER")).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe("devolução por Pix depois do prazo de estorno", () => {
  async function paidLongAgo(days: number) {
    const order = await newOrder();
    provider.markPaid(order.chargeId!, "***.444.777-**");
    await handlePaymentReceived(order.chargeId!, provider, now);
    await prisma.order.update({ where: { id: order.id }, data: { paidAt: addDays(now, -days) } });
    return prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  }

  it("até 85 dias estorna a cobrança", async () => {
    const { requestRefund } = await import("@/lib/orders/service");
    const recent = await paidLongAgo(80);
    const sentBefore = provider.pixSent.length;
    expect(await requestRefund(recent.id, "NENHUM", provider, now)).toBe(true);
    expect(provider.charges.get(recent.chargeId!)?.state).toBe("REEMBOLSADO");
    expect(provider.pixSent).toHaveLength(sentBefore);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: recent.id } })).toMatchObject({ refundStatus: "CONCLUIDO", refundByPix: false });
  });

  it("depois de 85 dias envia Pix para a chave CPF do comprador", async () => {
    const { requestRefund } = await import("@/lib/orders/service");
    const sentBefore = provider.pixSent.length;
    const old = await paidLongAgo(100);
    expect(await requestRefund(old.id, "NENHUM", provider, now)).toBe(true);
    expect(provider.charges.get(old.chargeId!)?.state).toBe("RETIDO"); // Sem estorno.
    const [pix] = provider.pixSent.slice(sentBefore);
    expect(pix).toMatchObject({ cents: old.totalCents, pixKey: BUYER_CPF, pixKeyType: "CPF", externalReference: `reembolso-${old.id}` });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: old.id } })).toMatchObject({
      refundStatus: "CONCLUIDO", refundByPix: true, refundTransferId: pix.transferId,
    });
  });

  it("Pix esperando autorização conclui pelo aviso TRANSFER_DONE; a validação por webhook aprova só ele", async () => {
    const { requestRefund, handleTransferUpdate } = await import("@/lib/orders/service");
    const { validateTransfer } = await import("@/lib/payments/transfer-validation");
    const order = await paidLongAgo(100);
    provider.nextPixStatus = "AGUARDANDO_APROVACAO";
    try {
      await requestRefund(order.id, "NENHUM", provider, now);
    } finally {
      provider.nextPixStatus = "CONCLUIDO";
    }
    const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(o.refundStatus).toBe("AGUARDANDO_APROVACAO");

    const payload = { id: o.refundTransferId!, value: o.totalCents / 100, externalReference: `reembolso-${o.id}`, operationType: "PIX", bankAccount: { pixAddressKey: BUYER_CPF } };
    expect(await validateTransfer(payload)).toEqual({ status: "APPROVED" });
    expect(await validateTransfer({ ...payload, bankAccount: { pixAddressKey: "52998224725" } })).toMatchObject({ status: "REFUSED" });
    expect(await validateTransfer({ ...payload, id: "outro" })).toMatchObject({ status: "REFUSED" });

    provider.setPixStatus(o.refundTransferId!, "CONCLUIDO");
    expect(await handleTransferUpdate(o.refundTransferId!, provider)).toBe(true);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).refundStatus).toBe("CONCLUIDO");
    expect(await validateTransfer(payload)).toMatchObject({ status: "REFUSED" }); // Já concluída.
  });

  it("CPF sem chave Pix: a rotina tenta de novo a cada 24h e avisa o comprador uma vez", async () => {
    const { requestRefund, runRoutines } = await import("@/lib/orders/service");
    const order = await paidLongAgo(100);
    const noKey = 'Asaas POST /transfers falhou: 400 {"errors":[{"code":"invalid_action","description":"A chave informada não foi encontrada."}]}';
    provider.failNextPix = noKey;
    await requestRefund(order.id, "NENHUM", provider, now);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ refundStatus: "FALHOU", refundByPix: true, refundTransferId: null });
    // Na primeira tentativa quem avisa é o e-mail de reembolso (mudança de status).
    expect(await prisma.emailLog.count({ where: { orderId: order.id, kind: "REEMBOLSO_PIX_FALHOU" } })).toBe(0);

    // Uma hora depois ainda não tenta; no dia seguinte, sim, e falha de novo: avisa.
    const sentBefore = provider.pixSent.length;
    await runRoutines(provider, addMinutes(now, 60));
    expect(provider.pixSent).toHaveLength(sentBefore);
    provider.failNextPix = noKey;
    await runRoutines(provider, addDays(now, 1.05));
    expect(await prisma.emailLog.count({ where: { orderId: order.id, kind: "REEMBOLSO_PIX_FALHOU" } })).toBe(1);

    // O comprador cadastra a chave: a tentativa seguinte devolve, sem repetir o aviso.
    await runRoutines(provider, addDays(now, 2.1));
    expect(provider.pixSent.slice(sentBefore)).toEqual([expect.objectContaining({ externalReference: `reembolso-${order.id}` })]);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).refundStatus).toBe("CONCLUIDO");
    expect(await prisma.emailLog.count({ where: { orderId: order.id, kind: "REEMBOLSO_PIX_FALHOU" } })).toBe(1);
  });

  it("Pix cancelado no painel: volta para FALHOU sem o id, para enviar de novo", async () => {
    const { requestRefund, handleTransferUpdate } = await import("@/lib/orders/service");
    const order = await paidLongAgo(100);
    provider.nextPixStatus = "AGUARDANDO_APROVACAO";
    try {
      await requestRefund(order.id, "NENHUM", provider, now);
    } finally {
      provider.nextPixStatus = "CONCLUIDO";
    }
    const { refundTransferId } = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    provider.setPixStatus(refundTransferId!, "FALHOU");
    expect(await handleTransferUpdate(refundTransferId!, provider)).toBe(true);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ refundStatus: "FALHOU", refundTransferId: null });
    expect(await requestRefund(order.id, "FALHOU", provider, now)).toBe(true);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).refundStatus).toBe("CONCLUIDO");
  });
});
