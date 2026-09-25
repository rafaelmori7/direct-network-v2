import { describe, expect, it } from "vitest";
import { PLATFORMS } from "@/lib/platforms/profiles";
import {
  checkListing,
  checkPurchase,
  effectiveRules,
  releaseAt,
  saleWindow,
  transferDeadline,
  type ListingInput,
  type PurchaseInput,
} from "@/lib/rules/engine";
import type { EventRuleInput } from "@/lib/rules/types";
import { endOfNthBusinessDay } from "@/lib/time";

const ingresse = PLATFORMS.INGRESSE.profile;
const sympla = PLATFORMS.SYMPLA.profile;
const ticketmaster = PLATFORMS.TICKETMASTER.profile;

// Sábado 17/10/2026, 23h em Brasília, até 06h de domingo.
const event: EventRuleInput = {
  startsAt: new Date("2026-10-18T02:00:00Z"),
  endsAt: new Date("2026-10-18T09:00:00Z"),
  isSports: false,
  transferAllowed: "SIM",
  nominalBiometric: false,
  overrides: {},
};

const listing: ListingInput = {
  priceCents: 50_000,
  faceValueCents: 40_000,
  quantity: 1,
  purchasedAt: new Date("2026-08-01T12:00:00Z"),
  sellerDeclaresOriginalBuyer: true,
};

const seller = { hasPayoutAccount: true, payoutApproved: true, ticketsAlreadyListedForEvent: 0, activeTicketsListed: 0 };

const purchase: PurchaseInput = {
  buyerId: "comprador",
  sellerId: "vendedor",
  buyerVerified: true,
  buyerIdentifiers: { EMAIL: "comprador@exemplo.com", CPF: "123.456.789-00", NOME_COMPLETO: "Fulano" },
  ticketType: "INTEIRA",
  buyerDeclaresHalfPriceEligible: false,
};

const codes = (violations: { code: string }[]) => violations.map((v) => v.code);

describe("dias úteis", () => {
  it("pula o fim de semana e fecha o dia em Brasília", () => {
    // Domingo 06h BRT + 3 dias úteis = quarta 21/10, 23:59:59 BRT.
    expect(endOfNthBusinessDay(event.endsAt, 3).toISOString()).toBe("2026-10-22T02:59:59.999Z");
  });

  it("pula feriados", () => {
    const holidays = new Set(["2026-10-20"]);
    expect(endOfNthBusinessDay(event.endsAt, 3, holidays).toISOString()).toBe("2026-10-23T02:59:59.999Z");
  });
});

describe("regras efetivas", () => {
  it("evento sobrescreve o perfil da ticketeira", () => {
    const rules = effectiveRules(ticketmaster, { ...event, overrides: { transferLockHoursBefore: 2 } });
    expect(rules.transferLockHoursBefore).toBe(2);
    expect(rules.sellerMustBeOriginalBuyer).toBe(true);
  });

  it("evento esportivo sempre trava no valor de face", () => {
    const rules = effectiveRules(ingresse, { ...event, isSports: true, overrides: { priceCapMode: "LIVRE" } });
    expect(rules.priceCapMode).toBe("VALOR_DE_FACE");
  });

  it("transferência não confirmada ou biometria desliga os anúncios", () => {
    expect(effectiveRules(ingresse, { ...event, transferAllowed: "DESCONHECIDO" }).listingEnabled).toBe(false);
    expect(effectiveRules(ingresse, { ...event, nominalBiometric: true }).listingEnabled).toBe(false);
  });
});

describe("anúncio", () => {
  const now = new Date("2026-10-01T12:00:00Z");

  it("aceita um anúncio válido", () => {
    expect(checkListing(effectiveRules(ingresse, event), event, listing, seller, now)).toEqual([]);
  });

  it("bloqueia evento sem transferência confirmada", () => {
    const e = { ...event, transferAllowed: "DESCONHECIDO" as const };
    expect(codes(checkListing(effectiveRules(ingresse, e), e, listing, seller, now))).toContain(
      "TRANSFERENCIA_NAO_CONFIRMADA",
    );
  });

  it("Quentro e Sympla exigem comprador original", () => {
    const l = { ...listing, sellerDeclaresOriginalBuyer: false };
    for (const profile of [ticketmaster, sympla]) {
      expect(codes(checkListing(effectiveRules(profile, event), event, l, seller, now))).toContain(
        "SOMENTE_COMPRADOR_ORIGINAL",
      );
    }
    expect(codes(checkListing(effectiveRules(ingresse, event), event, l, seller, now))).not.toContain(
      "SOMENTE_COMPRADOR_ORIGINAL",
    );
  });

  it("recusa ingresso comprado dentro do prazo de arrependimento", () => {
    const l = { ...listing, purchasedAt: new Date("2026-09-28T12:00:00Z") };
    expect(codes(checkListing(effectiveRules(ingresse, event), event, l, seller, now))).toContain("INGRESSO_RECENTE");
  });

  it("recusa preço acima do valor de face em evento esportivo", () => {
    const e = { ...event, isSports: true };
    const found = checkListing(effectiveRules(ingresse, e), e, listing, seller, now);
    expect(codes(found)).toContain("PRECO_ACIMA_DO_LIMITE");
    expect(found.find((v) => v.code === "PRECO_ACIMA_DO_LIMITE")?.message).toMatch(/art\. 166/);
  });

  it("limita ingressos por vendedor no evento", () => {
    const s = { ...seller, ticketsAlreadyListedForEvent: 9 };
    const l = { ...listing, quantity: 2 };
    expect(codes(checkListing(effectiveRules(ingresse, event), event, l, s, now))).toContain("LIMITE_POR_VENDEDOR");
  });

  it("exige conta de recebimento criada para anunciar", () => {
    const s = { ...seller, hasPayoutAccount: false, payoutApproved: false };
    expect(codes(checkListing(effectiveRules(ingresse, event), event, listing, s, now))).toContain("SEM_CONTA_DE_RECEBIMENTO");
  });

  it("cadastro em análise anuncia na hora, até 10 ingressos ativos", () => {
    const novo = { ...seller, payoutApproved: false, activeTicketsListed: 9 };
    expect(checkListing(effectiveRules(ingresse, event), event, listing, novo, now)).toEqual([]);
    const cheio = { ...novo, activeTicketsListed: 10 };
    expect(codes(checkListing(effectiveRules(ingresse, event), event, listing, cheio, now))).toContain("LIMITE_VENDEDOR_NOVO");
    const aprovado = { ...cheio, payoutApproved: true };
    expect(checkListing(effectiveRules(ingresse, event), event, listing, aprovado, now)).toEqual([]);
  });
});

describe("janela de venda", () => {
  it("sem trava de custódia: vende longe do evento quando a ticketeira não restringe", () => {
    const rules = effectiveRules(ingresse, event);
    expect(saleWindow(rules, event).opensAt).toBeNull();
    const farAway = new Date("2026-08-20T12:00:00Z");
    expect(codes(checkPurchase(rules, event, purchase, farAway))).not.toContain("VENDA_AINDA_NAO_ABERTA");
  });

  it("não abre antes de a ticketeira liberar a transferência", () => {
    const rules = effectiveRules(ticketmaster, event);
    const tooEarly = new Date("2026-08-20T12:00:00Z");
    expect(codes(checkPurchase(rules, event, purchase, tooEarly))).toContain("VENDA_AINDA_NAO_ABERTA");
  });

  it("Ticketmaster só vende a partir de 30 dias e fecha 7 dias + prazo do vendedor antes", () => {
    const rules = effectiveRules(ticketmaster, event);
    const { opensAt, closesAt } = saleWindow(rules, event);
    expect(opensAt?.toISOString()).toBe("2026-09-18T02:00:00.000Z");
    expect(closesAt.toISOString()).toBe("2026-10-10T02:00:00.000Z");
  });

  it("Sympla fecha a venda 48h antes (24h de bloqueio + 24h do vendedor)", () => {
    const { closesAt } = saleWindow(effectiveRules(sympla, event), event);
    expect(closesAt.toISOString()).toBe("2026-10-16T02:00:00.000Z");
  });

  it("prazo do vendedor não passa do bloqueio da ticketeira", () => {
    const rules = effectiveRules(sympla, event);
    const paidLate = new Date("2026-10-16T03:00:00Z");
    expect(transferDeadline(rules, event, paidLate).toISOString()).toBe("2026-10-17T02:00:00.000Z");
  });

  it("libera no maior entre D+3 úteis e o fim da janela de disputa", () => {
    const rules = effectiveRules(ingresse, event);
    expect(releaseAt(rules, event).toISOString()).toBe("2026-10-22T02:59:59.999Z");
    const longDispute = { ...rules, disputeWindowHoursAfterEvent: 24 * 10 };
    expect(releaseAt(longDispute, event).toISOString()).toBe("2026-10-28T09:00:00.000Z");
  });
});

describe("compra", () => {
  const now = new Date("2026-10-05T12:00:00Z");

  it("aceita compra válida", () => {
    expect(checkPurchase(effectiveRules(sympla, event), event, purchase, now)).toEqual([]);
  });

  it("exige os dados que a ticketeira pede", () => {
    const p = { ...purchase, buyerIdentifiers: { EMAIL: "x@y.com" } };
    const found = checkPurchase(effectiveRules(sympla, event), event, p, now);
    expect(codes(found)).toContain("DADOS_DO_COMPRADOR");
  });

  it("Quentro ID é opcional", () => {
    const p = { ...purchase, buyerIdentifiers: { EMAIL: "x@y.com" } };
    const rules = effectiveRules(ticketmaster, event);
    expect(codes(checkPurchase(rules, event, p, new Date("2026-09-25T12:00:00Z")))).toEqual([]);
  });

  it("meia-entrada exige declaração do comprador; meia social não", () => {
    const rules = effectiveRules(ingresse, event);
    expect(codes(checkPurchase(rules, event, { ...purchase, ticketType: "MEIA" }, now))).toContain("MEIA_ENTRADA");
    expect(checkPurchase(rules, event, { ...purchase, ticketType: "MEIA_SOCIAL" }, now)).toEqual([]);
  });

  it("não deixa comprar o próprio anúncio", () => {
    const p = { ...purchase, buyerId: "vendedor" };
    expect(codes(checkPurchase(effectiveRules(ingresse, event), event, p, now))).toContain("COMPRA_PROPRIA");
  });
});
