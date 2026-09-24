import { describe, expect, it } from "vitest";
import { PLATFORMS } from "@/lib/platforms/profiles";
import { checkPurchase, effectiveRules, isSaleClosed, saleWindow, transferDeadline } from "@/lib/rules/engine";
import type { EventRuleInput } from "@/lib/rules/types";

// Festival no sábado 17/10/2026 às 14h (BRT); a ticketeira encerra as
// transferências na quinta 15/10 às 18h (BRT).
const festival: EventRuleInput = {
  startsAt: new Date("2026-10-17T17:00:00Z"),
  endsAt: new Date("2026-10-18T03:00:00Z"),
  isSports: false,
  transferAllowed: "SIM",
  nominalBiometric: false,
  transferEndsAt: new Date("2026-10-15T21:00:00Z"),
  overrides: {},
};

const purchase = {
  buyerId: "c",
  sellerId: "v",
  buyerVerified: true,
  buyerIdentifiers: { EMAIL: "c@x.com" },
  ticketType: "INTEIRA" as const,
  buyerDeclaresHalfPriceEligible: false,
};

describe("prazo exato de transferência do evento", () => {
  const rules = effectiveRules(PLATFORMS.INGRESSE.profile, festival);

  it("fecha a venda antes do prazo, com tempo para o vendedor transferir", () => {
    // 15/10 18h BRT menos 24h do vendedor = 14/10 18h BRT.
    expect(saleWindow(rules, festival).closesAt.toISOString()).toBe("2026-10-14T21:00:00.000Z");
  });

  it("o evento pode encurtar o prazo do vendedor para vender até mais tarde", () => {
    const event = { ...festival, overrides: { sellerTransferDeadlineHours: 3 } };
    const r = effectiveRules(PLATFORMS.INGRESSE.profile, event);
    expect(saleWindow(r, event).closesAt.toISOString()).toBe("2026-10-15T18:00:00.000Z");
  });

  it("prazo do vendedor nunca passa da data/hora do evento", () => {
    const paid = new Date("2026-10-14T20:00:00Z");
    expect(transferDeadline(rules, festival, paid).toISOString()).toBe("2026-10-15T20:00:00.000Z");
    const paidLater = new Date("2026-10-14T20:59:00Z");
    expect(transferDeadline(rules, festival, paidLater).toISOString()).toBe("2026-10-15T20:59:00.000Z");
    const paidAtClose = new Date("2026-10-15T02:00:00Z");
    const shortRules = { ...rules, sellerTransferDeadlineHours: 24 };
    expect(transferDeadline(shortRules, festival, paidAtClose).toISOString()).toBe("2026-10-15T21:00:00.000Z");
  });

  it("depois do fechamento não aceita compra e o anúncio sai do ar", () => {
    const after = new Date("2026-10-14T21:00:00Z");
    expect(isSaleClosed(rules, festival, after)).toBe(true);
    expect(checkPurchase(rules, festival, purchase, after).map((v) => v.code)).toContain("FORA_DA_JANELA");
    expect(isSaleClosed(rules, festival, new Date("2026-10-14T20:59:59Z"))).toBe(false);
  });

  it("usa a regra da ticketeira quando ela é mais restritiva que a data do evento", () => {
    const event = { ...festival, transferEndsAt: new Date("2026-10-17T16:00:00Z") };
    const sympla = effectiveRules(PLATFORMS.SYMPLA.profile, event);
    // Sympla bloqueia 24h antes do início (16/10 14h BRT), antes da data cadastrada.
    expect(saleWindow(sympla, event).closesAt.toISOString()).toBe("2026-10-15T17:00:00.000Z");
  });

  it("não abre a venda antes da data de abertura da transferência", () => {
    const event = { ...festival, transferOpensAt: new Date("2026-10-10T15:00:00Z") };
    const r = effectiveRules(PLATFORMS.INGRESSE.profile, event);
    expect(saleWindow(r, event).opensAt.toISOString()).toBe("2026-10-10T15:00:00.000Z");
    const codes = checkPurchase(r, event, purchase, new Date("2026-10-09T12:00:00Z")).map((v) => v.code);
    expect(codes).toContain("VENDA_AINDA_NAO_ABERTA");
  });
});
