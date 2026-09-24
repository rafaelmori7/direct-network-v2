import { describe, expect, it } from "vitest";
import { splitAmount } from "@/lib/money/fees";
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

  it("aceita CPF mascarado só se os dígitos visíveis batem", () => {
    expect(payerMatchesBuyer("***.456.789-**", "12345678900")).toBe(true);
    expect(payerMatchesBuyer("***.456.780-**", "12345678900")).toBe(false);
    // Poucos dígitos visíveis não provam nada.
    expect(payerMatchesBuyer("***.***.789-**", "12345678900")).toBe(false);
    expect(payerMatchesBuyer("***.456.789-*", "12345678900")).toBe(false);
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
