import { describe, expect, it } from "vitest";
import { orderAmounts, splitAmount } from "@/lib/money/fees";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { payerMatchesBuyer } from "@/lib/payments/provider";

describe("valores", () => {
  it("separa comissão e valor do vendedor em centavos", () => {
    expect(splitAmount(47_000, 1000)).toEqual({ totalCents: 47_000, platformFeeCents: 4_700, sellerNetCents: 42_300 });
    const { platformFeeCents, sellerNetCents } = splitAmount(333, 1000);
    expect(platformFeeCents + sellerNetCents).toBe(333);
  });

  it("recusa valores inválidos", () => {
    expect(() => splitAmount(0, 1000)).toThrow();
    expect(() => splitAmount(10.5, 1000)).toThrow();
  });
});

describe("pagador", () => {
  it("aceita só Pix do próprio CPF do comprador", () => {
    expect(payerMatchesBuyer("123.456.789-00", "12345678900")).toBe(true);
    expect(payerMatchesBuyer("98765432100", "12345678900")).toBe(false);
    expect(payerMatchesBuyer(null, "12345678900")).toBe(false);
  });

  it("compara o CPF mascarado que o Asaas devolve", () => {
    expect(payerMatchesBuyer("***.444.777-**", "111.444.777-35")).toBe(true);
    expect(payerMatchesBuyer("***.444.778-**", "11144477735")).toBe(false);
    expect(payerMatchesBuyer("***.***.***-**", "11144477735")).toBe(false);
    expect(payerMatchesBuyer("12.345.678/0001-90", "11144477735")).toBe(false);
  });
});

describe("gateway mock", () => {
  it("só libera ou reembolsa o que está retido, uma única vez", async () => {
    const gateway = new MockPaymentProvider();
    const charge = await gateway.createPixCharge({
      orderId: "o1",
      totalCents: 47_000,
      sellerNetCents: 42_300,
      sellerWalletId: "w1",
      buyer: { name: "Fulano", cpf: "12345678900", email: "f@x.com" },
      expiresAt: new Date("2026-10-05T13:00:00Z"),
      description: "Adriatique - Pista",
    });
    await expect(gateway.releaseEscrow(charge.chargeId)).rejects.toThrow();
    gateway.markPaid(charge.chargeId);
    await gateway.releaseEscrow(charge.chargeId);
    await expect(gateway.refund(charge.chargeId)).rejects.toThrow();
  });
});

describe("divisão com parceiro", () => {
  const partner = { commissionShareBps: 5000, discountBps: 0 };

  it("sem parceiro, a comissão toda fica com a plataforma", () => {
    expect(orderAmounts(50_000, 1000, null, false)).toEqual({
      listCents: 50_000, discountCents: 0, totalCents: 50_000, sellerNetCents: 45_000, platformFeeCents: 5_000, partnerFeeCents: 0,
    });
  });

  it("com parceiro, 50% da comissão para cada lado", () => {
    expect(orderAmounts(50_000, 1000, partner, true)).toMatchObject({ totalCents: 50_000, sellerNetCents: 45_000, platformFeeCents: 2_500, partnerFeeCents: 2_500 });
  });

  it("desconto do cupom sai da comissão, nunca do vendedor", () => {
    const withDiscount = { ...partner, discountBps: 400 }; // 4% de desconto
    const a = orderAmounts(50_000, 1000, withDiscount, true);
    expect(a).toMatchObject({ discountCents: 2_000, totalCents: 48_000, sellerNetCents: 45_000, platformFeeCents: 1_500, partnerFeeCents: 1_500 });
    expect(a.sellerNetCents + a.platformFeeCents + a.partnerFeeCents).toBe(a.totalCents);
  });

  it("desconto nunca passa da comissão", () => {
    const a = orderAmounts(50_000, 1000, { ...partner, discountBps: 5000 }, true);
    expect(a).toMatchObject({ discountCents: 5_000, totalCents: 45_000, sellerNetCents: 45_000, platformFeeCents: 0, partnerFeeCents: 0 });
  });

  it("parceiro dono do evento ganha sem dar desconto", () => {
    expect(orderAmounts(50_000, 1000, { ...partner, discountBps: 400 }, false)).toMatchObject({ discountCents: 0, partnerFeeCents: 2_500 });
  });

  it("os valores sempre fecham com o total pago", () => {
    for (const cents of [333, 12_345, 99_999]) {
      const a = orderAmounts(cents, 1000, { commissionShareBps: 5000, discountBps: 250 }, true);
      expect(a.sellerNetCents + a.platformFeeCents + a.partnerFeeCents).toBe(a.totalCents);
    }
  });
});
