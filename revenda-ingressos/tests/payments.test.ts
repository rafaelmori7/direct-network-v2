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

describe("divisão com taxa do comprador e parceiro", () => {
  const fees = { buyerFeeBps: 1500, sellerFeeBps: 0 };
  const partner = { commissionShareBps: 5000, discountBps: 0 };

  it("comprador paga preço + taxa; vendedor recebe o preço inteiro", () => {
    expect(orderAmounts(10_000, fees, null, false)).toEqual({
      listCents: 10_000, buyerFeeCents: 1_500, sellerFeeCents: 0, discountCents: 0, totalCents: 11_500, sellerNetCents: 10_000, platformFeeCents: 1_500, partnerFeeCents: 0,
    });
  });

  it("cupom de 10% sobre o total: 100 + 15 = 115 → 103,50", () => {
    const a = orderAmounts(10_000, fees, { ...partner, discountBps: 1000 }, true);
    expect(a).toMatchObject({ discountCents: 1_150, totalCents: 10_350, sellerNetCents: 10_000, platformFeeCents: 175, partnerFeeCents: 175 });
  });

  it("sem desconto, a taxa é dividida 50/50 com o parceiro", () => {
    expect(orderAmounts(10_000, fees, partner, true)).toMatchObject({ totalCents: 11_500, platformFeeCents: 750, partnerFeeCents: 750 });
  });

  it("desconto nunca passa da receita do site (não sai do vendedor)", () => {
    const a = orderAmounts(10_000, fees, { ...partner, discountBps: 5000 }, true);
    expect(a).toMatchObject({ discountCents: 1_500, totalCents: 10_000, sellerNetCents: 10_000, platformFeeCents: 0, partnerFeeCents: 0 });
  });

  it("comissão do vendedor, se configurada, também entra na receita", () => {
    const a = orderAmounts(10_000, { buyerFeeBps: 1000, sellerFeeBps: 500 }, null, false);
    expect(a).toMatchObject({ totalCents: 11_000, sellerNetCents: 9_500, platformFeeCents: 1_500 });
  });

  it("parceiro dono do evento ganha sem dar desconto", () => {
    expect(orderAmounts(10_000, fees, { ...partner, discountBps: 1000 }, false)).toMatchObject({ discountCents: 0, partnerFeeCents: 750 });
  });

  it("os valores sempre fecham com o total pago", () => {
    for (const cents of [333, 12_345, 99_999]) {
      const a = orderAmounts(cents, { buyerFeeBps: 1500, sellerFeeBps: 300 }, { commissionShareBps: 5000, discountBps: 700 }, true);
      expect(a.sellerNetCents + a.platformFeeCents + a.partnerFeeCents).toBe(a.totalCents);
    }
  });
});
