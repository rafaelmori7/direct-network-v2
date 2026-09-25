import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { applyAction, createOrder, expireUnpaidOrders } from "@/lib/orders/service";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { PLATFORMS } from "@/lib/platforms/profiles";
import { addDays, addMinutes } from "@/lib/time";

const provider = new MockPaymentProvider();
const now = new Date();

async function reset() {
  await prisma.emailLog.deleteMany();
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
  createOrder({ listingId, buyer, quantity: 1, identifiers: { EMAIL: buyer.email }, buyerDeclaresHalfPriceEligible: false, fees: { buyerFeeBps: 0, sellerFeeBps: 1000 }, now }, provider);

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

describe("rotinas", () => {
  it("reembolsa quem não transferiu, libera após o evento e encerra anúncios", async () => {
    const { runRoutines } = await import("@/lib/orders/service");
    // Pedido pago e não transferido.
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    provider.markPaid(order.chargeId!);
    await applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now });

    const report1 = await runRoutines(provider, addDays(now, 2));
    expect(report1.prazosDeTransferenciaEsgotados).toBe(1);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: "REEMBOLSADO", refundStatus: "CONCLUIDO" });

    // Segundo pedido (outro anúncio): transferido e recebido, liberado depois do evento.
    await prisma.listing.update({ where: { id: listingId }, data: { status: "ATIVO", quantityAvailable: 1 } });
    const r2 = await orderFor(buyers[1]);
    const id2 = r2.ok ? r2.orderId : "";
    const o2 = await prisma.order.findUniqueOrThrow({ where: { id: id2 } });
    provider.markPaid(o2.chargeId!);
    await applyAction(id2, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now });
    await applyAction(id2, { type: "VENDEDOR_TRANSFERIU" }, "VENDEDOR", null, provider, { now });

    expect((await runRoutines(provider, addDays(now, 5))).pagamentosLiberados).toBe(0);
    const report2 = await runRoutines(provider, addDays(o2.releaseAt, 0.01));
    expect(report2.pagamentosLiberados).toBe(1);
    // Vendedor sem carteira no mock: nada a transferir, o valor fica na conta da plataforma.
    expect(await prisma.order.findUniqueOrThrow({ where: { id: id2 } })).toMatchObject({ status: "LIBERADO", payoutStatus: "CONCLUIDO", sellerTransferId: null });

    // Rodar de novo não faz nada.
    expect(await runRoutines(provider, addDays(o2.releaseAt, 0.02))).toMatchObject({ pagamentosLiberados: 0, prazosDeTransferenciaEsgotados: 0 });
  });

  it("anúncio sai do ar quando a venda do evento fecha", async () => {
    const { runRoutines } = await import("@/lib/orders/service");
    expect((await runRoutines(provider, addDays(now, 9))).anunciosEncerrados).toBe(1);
    expect((await prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).status).toBe("ENCERRADO");
  });
});

describe("disputa", () => {
  it("registra a disputa e a decisão do admin", async () => {
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    const o = await prisma.order.findUniqueOrThrow({ where: { id } });
    provider.markPaid(o.chargeId!);
    await applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now });
    await applyAction(id, { type: "ABRIR_DISPUTA", reason: "Vendedor não responde" }, "COMPRADOR", buyers[0].id, provider, { now });
    expect(await prisma.dispute.findFirstOrThrow({ where: { orderId: id } })).toMatchObject({ reason: "Vendedor não responde", resolvedAt: null });

    await applyAction(id, { type: "ADMIN_DECIDIU", winner: "COMPRADOR", note: "Sem transferência" }, "ADMIN", null, provider, { now });
    expect(await prisma.dispute.findFirstOrThrow({ where: { orderId: id } })).toMatchObject({ winner: "COMPRADOR", resolution: "Sem transferência" });
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: "REEMBOLSADO", refundStatus: "CONCLUIDO" });
    const msgs = await prisma.message.findMany({ where: { orderId: id, kind: "SISTEMA" } });
    expect(msgs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("avisos por e-mail", () => {
  it("avisa comprador e vendedor no pagamento e lembra o vendedor uma única vez", async () => {
    const { runRoutines } = await import("@/lib/orders/service");
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    const o = await prisma.order.findUniqueOrThrow({ where: { id } });
    provider.markPaid(o.chargeId!);
    await applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now });

    const paidEmails = await prisma.emailLog.findMany({ where: { orderId: id } });
    expect(paidEmails.map((e) => e.kind).sort()).toEqual(["PAGO_COMPRADOR", "PAGO_VENDEDOR"]);
    expect(paidEmails.every((e) => e.status === "REGISTRADO")).toBe(true);
    expect(paidEmails.find((e) => e.kind === "PAGO_VENDEDOR")?.body).toMatch(/Transfira pelo app oficial/);

    // 20h depois do pagamento faltam 4h para o prazo (24h): lembrete, uma vez só.
    const later = new Date(now.getTime() + 20 * 3600_000);
    expect((await runRoutines(provider, later)).lembretesDeTransferencia).toBe(1);
    expect((await runRoutines(provider, new Date(later.getTime() + 60_000))).lembretesDeTransferencia).toBe(0);
  });

  it("WhatsApp só para quem aceitou, com o modelo certo", async () => {
    await prisma.user.update({ where: { id: buyers[0].id }, data: { whatsappOptIn: true, phone: "21912345678" } });
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    const o = await prisma.order.findUniqueOrThrow({ where: { id } });
    provider.markPaid(o.chargeId!);
    await applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now });

    const whats = await prisma.emailLog.findMany({ where: { orderId: id, channel: "WHATSAPP" } });
    expect(whats).toHaveLength(1); // o vendedor não aceitou
    expect(whats[0]).toMatchObject({ to: "5521912345678", subject: "pagamento_confirmado", kind: "PAGO_COMPRADOR", status: "REGISTRADO" });
    expect(whats[0].body).toMatch(/^Olá, Ana! Seu pagamento de R\$\s?500,00 para Teste foi confirmado/);
    expect(await prisma.emailLog.count({ where: { orderId: id, channel: "EMAIL" } })).toBe(2);
  });

  it("chat avisa a outra parte no máximo a cada 15 minutos", async () => {
    const { notifyChatMessage } = await import("@/lib/notify/order-emails");
    const r = await orderFor(buyers[0]);
    const id = r.ok ? r.orderId : "";
    await notifyChatMessage(id, "COMPRADOR");
    await notifyChatMessage(id, "COMPRADOR");
    await notifyChatMessage(id, "VENDEDOR");
    const chat = await prisma.emailLog.findMany({ where: { orderId: id, kind: "CHAT" } });
    expect(chat).toHaveLength(2); // um para o vendedor, um para o comprador
  });
});

describe("vendedor com cadastro em análise", () => {
  it("vende na hora, mas só recebe depois da aprovação", async () => {
    const { runRoutines } = await import("@/lib/orders/service");
    const { handleSellerAccountStatus } = await import("@/lib/sellers/service");
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    await prisma.user.update({
      where: { id: listing.sellerId },
      data: { verifiedAt: null, gatewayAccountId: "acc_teste", gatewayWalletId: "wallet_teste", gatewayAccountStatus: "EM_ANALISE" },
    });

    const r = await orderFor(buyers[0]);
    expect(r.ok).toBe(true);
    const id = r.ok ? r.orderId : "";
    const o = await prisma.order.findUniqueOrThrow({ where: { id } });
    provider.markPaid(o.chargeId!);
    await applyAction(id, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", null, provider, { now });
    await applyAction(id, { type: "VENDEDOR_TRANSFERIU" }, "VENDEDOR", null, provider, { now });

    const afterEvent = addDays(o.releaseAt, 0.01);
    await runRoutines(provider, afterEvent);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: "LIBERADO", payoutStatus: "AGUARDANDO_CADASTRO" });
    expect(provider.transfers.filter((t) => t.externalReference === `pedido-${id}-vendedor`)).toHaveLength(0);
    expect(await prisma.emailLog.findFirst({ where: { orderId: id, kind: "LIBERADO_AGUARDANDO_CADASTRO" } })).not.toBeNull();

    expect(await handleSellerAccountStatus("acc_teste", true)).toBe(true);
    expect((await runRoutines(provider, addDays(afterEvent, 0.01))).pagamentosLiberados).toBe(1);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ payoutStatus: "CONCLUIDO" });
    expect(provider.transfers.filter((t) => t.externalReference === `pedido-${id}-vendedor`)).toEqual([
      expect.objectContaining({ walletId: "wallet_teste", cents: o.sellerNetCents }),
    ]);
  });
});
