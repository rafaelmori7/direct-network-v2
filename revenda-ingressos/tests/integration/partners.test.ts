import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createOrder, handleTransferUpdate, refreshPayout, requestPayout, runRoutines } from "@/lib/orders/service";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { PLATFORMS } from "@/lib/platforms/profiles";
import { addDays } from "@/lib/time";

const provider = new MockPaymentProvider();
const now = new Date();
let listingId: string;
let eventId: string;
let buyer: { id: string; name: string; cpf: string; email: string; canBuy: boolean };

beforeEach(async () => {
  for (const t of ["emailLog", "message", "orderLog", "dispute", "order", "listing", "wantedPost", "event", "partner", "session", "sellerWithdrawal", "user", "platform"] as const) {
    // @ts-expect-error acesso dinâmico aos delegates do Prisma
    await prisma[t].deleteMany();
  }
  const platform = await prisma.platform.create({ data: { code: "INGRESSE", name: "Ingresse", profile: PLATFORMS.INGRESSE.profile as object } });
  const startsAt = addDays(now, 10);
  eventId = (
    await prisma.event.create({
      data: { slug: "p", name: "P", category: "Shows", venue: "V", city: "SP", platformId: platform.id, startsAt, endsAt: addDays(startsAt, 0.3), transferAllowed: "SIM" },
    })
  ).id;
  const mk = (name: string, cpf: string) =>
    prisma.user.create({ data: { name, email: `${cpf}@t.local`, cpf, phone: "11999999999", birthDate: new Date("1990-01-01"), passwordHash: "x", cpfCheckedAt: now, verifiedAt: now } });
  const seller = await mk("Vendedor P", "52998224725");
  await prisma.user.update({ where: { id: seller.id }, data: { gatewayWalletId: "wallet_vendedor" } });
  const b = await mk("Comprador P", "11144477735");
  buyer = { id: b.id, name: b.name, cpf: b.cpf, email: b.email, canBuy: true };
  listingId = (
    await prisma.listing.create({
      data: { eventId, sellerId: seller.id, sector: "Pista", ticketType: "INTEIRA", quantity: 5, quantityAvailable: 5, priceCents: 50_000, faceValueCents: 40_000, purchasedAt: addDays(now, -30), platformOrderRef: "X", sellerDeclaresOriginalBuyer: true },
    })
  ).id;
  await prisma.partner.create({ data: { slug: "timelapse", name: "Timelapse", couponCode: "TIMELAPSE", commissionShareBps: 5000, discountBps: 400, gatewayWalletId: "wallet_timelapse" } });
  await prisma.partner.create({ data: { slug: "outra", name: "Outra", couponCode: "OUTRA", commissionShareBps: 5000, discountBps: 0 } });
});

async function buy(extra: { couponCode?: string; refSlug?: string }) {
  const r = await createOrder(
    { listingId, buyer, quantity: 1, identifiers: { EMAIL: buyer.email }, buyerDeclaresHalfPriceEligible: false, fees: { buyerFeeBps: 0, sellerFeeBps: 1000 }, now, ...extra },
    provider,
  );
  if (!r.ok) return r;
  return { ok: true as const, order: await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { partner: true } }) };
}

describe("parceiros", () => {
  it("sem parceiro: comissão toda da plataforma", async () => {
    const r = await buy({});
    expect(r.ok && r.order).toMatchObject({ totalCents: 50_000, platformFeeCents: 5_000, partnerFeeCents: 0, partnerId: null });
  });

  it("link do parceiro: desconto e metade da comissão, parte dele transferida na liberação", async () => {
    const r = await buy({ refSlug: "timelapse" });
    expect(r.ok && r.order).toMatchObject({
      partnerAttribution: "LINK", discountCents: 2_000, totalCents: 48_000, sellerNetCents: 45_000, platformFeeCents: 1_500, partnerFeeCents: 1_500,
    });
    const charge = r.ok ? provider.charges.get(r.order.chargeId!) : undefined;
    expect(charge?.request?.totalCents).toBe(48_000);

    const id = r.ok ? r.order.id : "";
    const before = provider.transfers.length;
    expect(await requestPayout(id, "NENHUM", provider)).toBe(true);
    const made = provider.transfers.slice(before);
    expect(made).toEqual([
      expect.objectContaining({ walletId: "wallet_vendedor", cents: 45_000, externalReference: `pedido-${id}-vendedor` }),
      expect.objectContaining({ walletId: "wallet_timelapse", cents: 1_500, externalReference: `pedido-${id}-parceiro` }),
    ]);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({
      payoutStatus: "CONCLUIDO", sellerTransferId: made[0].transferId, partnerTransferId: made[1].transferId,
    });
  });

  it("se a transferência do parceiro falha, tentar de novo não paga o vendedor duas vezes", async () => {
    const r = await buy({ refSlug: "timelapse" });
    const id = r.ok ? r.order.id : "";
    const before = provider.transfers.length;
    const transferToWallet = provider.transferToWallet.bind(provider);
    let calls = 0;
    provider.transferToWallet = async (req) => {
      if (++calls === 2) throw new Error("saldo insuficiente");
      return transferToWallet(req);
    };
    try {
      await requestPayout(id, "NENHUM", provider);
      expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ payoutStatus: "FALHOU", partnerTransferId: null });
      expect(await requestPayout(id, "FALHOU", provider)).toBe(true);
    } finally {
      provider.transferToWallet = transferToWallet;
    }
    expect(provider.transfers.slice(before).map((t) => t.walletId)).toEqual(["wallet_vendedor", "wallet_timelapse"]);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ payoutStatus: "CONCLUIDO" });
  });

  it("transferência esperando autorização no painel: AGUARDANDO_APROVACAO até o Asaas concluir", async () => {
    const r = await buy({ refSlug: "timelapse" });
    const id = r.ok ? r.order.id : "";
    const before = provider.transfers.length;
    provider.nextTransferStatus = "AGUARDANDO_APROVACAO";
    try {
      await requestPayout(id, "NENHUM", provider);
    } finally {
      provider.nextTransferStatus = "CONCLUIDO";
    }
    const [seller, partner] = provider.transfers.slice(before);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({
      payoutStatus: "AGUARDANDO_APROVACAO", sellerTransferId: seller.transferId, partnerTransferId: partner.transferId,
    });

    // Só uma autorizada: continua esperando.
    provider.setTransferStatus(seller.transferId, "CONCLUIDO");
    expect(await handleTransferUpdate(seller.transferId, provider)).toBe(false);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ payoutStatus: "AGUARDANDO_APROVACAO" });

    // A rotina conclui mesmo sem o webhook.
    provider.setTransferStatus(partner.transferId, "CONCLUIDO");
    await runRoutines(provider, now);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ payoutStatus: "CONCLUIDO" });
    expect(await refreshPayout(id, provider)).toBe(false);
    expect(provider.transfers.length - before).toBe(2);
  });

  it("transferência cancelada no painel: FALHOU e tentar de novo transfere só a que faltou", async () => {
    const r = await buy({ refSlug: "timelapse" });
    const id = r.ok ? r.order.id : "";
    const before = provider.transfers.length;
    provider.nextTransferStatus = "AGUARDANDO_APROVACAO";
    try {
      await requestPayout(id, "NENHUM", provider);
    } finally {
      provider.nextTransferStatus = "CONCLUIDO";
    }
    const [seller, partner] = provider.transfers.slice(before);
    provider.setTransferStatus(seller.transferId, "CONCLUIDO");
    provider.setTransferStatus(partner.transferId, "FALHOU");
    expect(await handleTransferUpdate(partner.transferId, provider)).toBe(true);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({
      payoutStatus: "FALHOU", sellerTransferId: seller.transferId, partnerTransferId: null,
    });

    expect(await requestPayout(id, "FALHOU", provider)).toBe(true);
    expect(provider.transfers.slice(before).map((t) => t.walletId)).toEqual(["wallet_vendedor", "wallet_timelapse", "wallet_timelapse"]);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({ payoutStatus: "CONCLUIDO" });
  });

  it("cupom vale mais que o link", async () => {
    const r = await buy({ refSlug: "timelapse", couponCode: "outra" });
    expect(r.ok && r.order).toMatchObject({ partnerAttribution: "CUPOM", discountCents: 0, partnerFeeCents: 2_500 });
    expect(r.ok && r.order.partner?.slug).toBe("outra");
  });

  it("cupom inválido é recusado e não reserva o ingresso", async () => {
    const r = await buy({ couponCode: "NAOEXISTE" });
    expect(r).toEqual({ ok: false, errors: ["Cupom inválido."] });
    expect((await prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).quantityAvailable).toBe(5);
  });

  it("evento do parceiro: ele ganha mesmo sem link, sem desconto", async () => {
    const outra = await prisma.partner.findUniqueOrThrow({ where: { slug: "outra" } });
    await prisma.event.update({ where: { id: eventId }, data: { partnerId: outra.id } });
    const r = await buy({});
    expect(r.ok && r.order).toMatchObject({ partnerAttribution: "EVENTO", partnerId: outra.id, discountCents: 0, partnerFeeCents: 2_500 });
  });

  it("parceiro inativo não conta", async () => {
    await prisma.partner.update({ where: { slug: "timelapse" }, data: { active: false } });
    const r = await buy({ refSlug: "timelapse" });
    expect(r.ok && r.order).toMatchObject({ partnerId: null, partnerFeeCents: 0 });
  });
});
