import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { applyAction, createOrder, expireUnpaidOrders, handlePaymentReceived } from "@/lib/orders/service";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { PLATFORMS } from "@/lib/platforms/profiles";
import { addDays, addMinutes } from "@/lib/time";

const provider = new MockPaymentProvider();
const now = new Date();

async function reset() {
  await prisma.message.deleteMany();
  await prisma.orderLog.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.wantedPost.deleteMany();
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platform.deleteMany();
}

async function user(name: string, cpf: string) {
  return prisma.user.create({
    data: { name, email: `${cpf}@t.local`, cpf, phone: "11999999999", birthDate: new Date("1990-01-01"), passwordHash: "x", cpfCheckedAt: now, verifiedAt: now },
  });
}

let listingId: string;
let buyers: { id: string; name: string; cpf: string; email: string; canBuy: boolean }[];

beforeEach(async () => {
  await reset();
  const platform = await prisma.platform.create({ data: { code: "INGRESSE", name: "Ingresse", profile: PLATFORMS.INGRESSE.profile as object } });
  const startsAt = addDays(now, 10);
  const event = await prisma.event.create({
    data: { slug: "teste", name: "Teste", category: "Shows", venue: "Casa", city: "SP", platformId: platform.id, startsAt, endsAt: addDays(startsAt, 0.3), transferAllowed: "SIM" },
  });
  const seller = await user("Vendedor Teste", "52998224725");
  const listing = await prisma.listing.create({
    data: { eventId: event.id, sellerId: seller.id, sector: "Pista", ticketType: "INTEIRA", quantity: 1, quantityAvailable: 1, priceCents: 50_000, faceValueCents: 40_000, purchasedAt: addDays(now, -30), platformOrderRef: "X", sellerDeclaresOriginalBuyer: true },
  });
  listingId = listing.id;
  buyers = await Promise.all(
    [["Ana Um", "11144477735"], ["Bia Dois", "39053344705"]].map(async ([n, c]) => {
      const u = await user(n, c);
      return { id: u.id, name: u.name, cpf: u.cpf, email: u.email, canBuy: true };
    }),
  );
});

const orderFor = (buyer: (typeof buyers)[number]) =>
  createOrder({ listingId, buyer, quantity: 1, identifiers: { EMAIL: buyer.email }, buyerDeclaresHalfPriceEligible: false, feeBps: 1000, now }, provider);

describe("reserva", () => {
  it("duas compras simultâneas do último ingresso: só uma reserva", async () => {
    const results = await Promise.all(buyers.map(orderFor));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toHaveLength(1);
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    expect(listing.quantityAvailable).toBe(0);
    expect(await prisma.order.count()).toBe(1);
  });

  it("guarda comissão, valor do vendedor e cobrança Pix", async () => {
    const r = await orderFor(buyers[0]);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.ok ? r.orderId : "" } });
    expect(order).toMatchObject({ status: "AGUARDANDO_PAGAMENTO", totalCents: 50_000, platformFeeCents: 5_000, sellerNetCents: 45_000 });
    expect(order.pixCopyPaste).toBeTruthy();
  });

  it("Pix vencido cancela o pedido e devolve o ingresso ao anúncio", async () => {
    await orderFor(buyers[0]);
    expect(await expireUnpaidOrders(provider, addMinutes(now, 10))).toBe(0);
    expect(await expireUnpaidOrders(provider, addMinutes(now, 31))).toBe(1);
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    expect(listing.quantityAvailable).toBe(1);
    const order = await prisma.order.findFirstOrThrow();
    expect(order.status).toBe("CANCELADO");
    expect(await orderFor(buyers[1])).toMatchObject({ ok: true });
  });
});

describe("ciclo do pedido", () => {
  it("pagamento define o prazo de transferência e registra histórico", async () => {
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    provider.markPaid(order.chargeId!);
    expect(await applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now })).toEqual({ ok: true, status: "PAGO" });
    const paid = await prisma.order.findUniqueOrThrow({ where: { id }, include: { logs: true } });
    expect(paid.transferDeadlineAt?.getTime()).toBe(now.getTime() + 24 * 3600_000);
    expect(paid.logs.map((l) => l.action)).toEqual(["PAGAMENTO_CONFIRMADO"]);
    // Pix pago não pode mais expirar.
    expect(await expireUnpaidOrders(provider, addMinutes(now, 60))).toBe(0);
  });

  it("vendedor que perde o prazo: reembolso e anúncio pausado", async () => {
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    provider.markPaid(order.chargeId!);
    await applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now });
    const late = addDays(now, 2);
    expect(await applyAction(id, { type: "PRAZO_TRANSFERENCIA_ESGOTADO" }, "SISTEMA", null, provider, { now: late })).toEqual({ ok: true, status: "REEMBOLSADO" });
    expect(provider.charges.get(order.chargeId!)?.state).toBe("REEMBOLSADO");
    expect((await prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).status).toBe("PAUSADO");
  });

  it("duas ações ao mesmo tempo: só uma vale", async () => {
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    const results = await Promise.all([
      applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now }),
      applyAction(id, { type: "PAGAMENTO_EXPIRADO" }, "SISTEMA", null, provider, { now }),
    ]);
    expect(results.filter((x) => x.ok)).toHaveLength(1);
    expect(await prisma.orderLog.count()).toBe(1);
  });
});

describe("webhook de pagamento", () => {
  async function pending() {
    const r = await orderFor(buyers[0]);
    return prisma.order.findUniqueOrThrow({ where: { id: r.ok ? r.orderId : "" } });
  }

  it("Pix do próprio comprador confirma o pedido, e o reenvio não repete nada", async () => {
    const order = await pending();
    expect(await handlePaymentReceived(order.chargeId!, provider, { now })).toBe("IGNORADO"); // ainda não pago
    provider.markPaid(order.chargeId!);
    expect(await handlePaymentReceived(order.chargeId!, provider, { now })).toBe("CONFIRMADO");
    expect(await handlePaymentReceived(order.chargeId!, provider, { now })).toBe("IGNORADO");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAGO");
    expect(await prisma.orderLog.count()).toBe(1);
  });

  it("Pix de outro CPF: reembolso e ingresso de volta ao anúncio", async () => {
    const order = await pending();
    provider.markPaid(order.chargeId!, buyers[1].cpf);
    expect(await handlePaymentReceived(order.chargeId!, provider, { now })).toBe("RECUSADO_PAGADOR");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("REEMBOLSADO");
    expect(provider.charges.get(order.chargeId!)?.state).toBe("REEMBOLSADO");
    expect((await prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).quantityAvailable).toBe(1);
  });

  it("pagador desconhecido é aceito no sandbox", async () => {
    const order = await pending();
    provider.markPaid(order.chargeId!, null);
    expect(await handlePaymentReceived(order.chargeId!, provider, { now, allowUnknownPayer: true })).toBe("CONFIRMADO");
  });

  it("pagador desconhecido fora do sandbox: reembolso", async () => {
    const order = await pending();
    provider.markPaid(order.chargeId!, null);
    expect(await handlePaymentReceived(order.chargeId!, provider, { now })).toBe("RECUSADO_PAGADOR");
  });

  it("Pix pago depois do vencimento: devolve o dinheiro uma única vez", async () => {
    const order = await pending();
    await expireUnpaidOrders(provider, addMinutes(now, 31));
    provider.markPaid(order.chargeId!);
    expect(await handlePaymentReceived(order.chargeId!, provider, { now })).toBe("REEMBOLSADO_APOS_VENCIMENTO");
    expect(await handlePaymentReceived(order.chargeId!, provider, { now })).toBe("IGNORADO");
    expect(provider.charges.get(order.chargeId!)?.state).toBe("REEMBOLSADO");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELADO");
  });

  it("cobrança desconhecida é ignorada", async () => {
    expect(await handlePaymentReceived("pay_inexistente", provider, { now })).toBe("IGNORADO");
  });
});
