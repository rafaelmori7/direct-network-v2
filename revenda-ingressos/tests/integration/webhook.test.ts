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
  for (const table of ["message", "orderLog", "dispute", "order", "listing", "wantedPost", "event", "session", "user", "platform"] as const) {
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
    { listingId, buyer, quantity: 1, identifiers: { EMAIL: buyer.email, CPF: buyer.cpf, NOME_COMPLETO: buyer.name }, buyerDeclaresHalfPriceEligible: false, feeBps: 1000, now },
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
