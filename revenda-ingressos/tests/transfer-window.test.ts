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

  it("a data cadastrada no evento vale sobre a regra geral da ticketeira", () => {
    // Ticketmaster: regra geral fecha 7 dias antes; o evento libera até a véspera.
    const event = { ...festival, transferEndsAt: new Date("2026-10-16T21:00:00Z"), overrides: { sellerTransferDeadlineHours: 6 } };
    const tm = effectiveRules(PLATFORMS.TICKETMASTER.profile, event);
    expect(saleWindow(tm, event).closesAt.toISOString()).toBe("2026-10-16T15:00:00.000Z");
    // Sem data cadastrada, vale a regra geral.
    const semData = { ...event, transferEndsAt: null };
    expect(saleWindow(tm, semData).closesAt.toISOString()).toBe("2026-10-10T11:00:00.000Z");
  });

  it("não abre a venda antes da data de abertura da transferência", () => {
    const event = { ...festival, transferOpensAt: new Date("2026-10-10T15:00:00Z") };
    const r = effectiveRules(PLATFORMS.INGRESSE.profile, event);
    expect(saleWindow(r, event).opensAt?.toISOString()).toBe("2026-10-10T15:00:00.000Z");
    const codes = checkPurchase(r, event, purchase, new Date("2026-10-09T12:00:00Z")).map((v) => v.code);
    expect(codes).toContain("VENDA_AINDA_NAO_ABERTA");
  });
});
