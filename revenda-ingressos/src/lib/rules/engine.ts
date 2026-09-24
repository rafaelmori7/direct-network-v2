import { addDays, addHours, endOfNthBusinessDay, maxDate, minDate } from "@/lib/time";
import type { BuyerIdentifier, EventRuleInput, RuleProfile, TicketType } from "./types";

/**
 * A Conta Escrow do Asaas libera sozinha depois de no máximo 45 dias.
 * Usamos uma margem para nunca deixar a custódia vencer antes da liberação.
 */
export const ESCROW_MAX_DAYS = 45;
export const ESCROW_SAFETY_MARGIN_DAYS = 2;

export type Violation = { code: string; message: string };

/** Perfil da ticketeira com as sobreposições do evento e as travas legais. */
export function effectiveRules(profile: RuleProfile, event: EventRuleInput): RuleProfile {
  const rules: RuleProfile = { ...profile, ...stripUndefined(event.overrides) };
  if (event.isSports) rules.priceCapMode = "VALOR_DE_FACE";
  if (event.transferAllowed !== "SIM" || event.nominalBiometric) rules.listingEnabled = false;
  return rules;
}

/** Quando o dinheiro pode ir para o vendedor, se não houver disputa. */
export function releaseAt(rules: RuleProfile, event: EventRuleInput, holidays?: ReadonlySet<string>): Date {
  return maxDate(
    endOfNthBusinessDay(event.endsAt, rules.releaseBusinessDaysAfterEvent, holidays),
    addHours(event.endsAt, rules.disputeWindowHoursAfterEvent),
  );
}

export function disputeDeadline(rules: RuleProfile, event: EventRuleInput): Date {
  return addHours(event.endsAt, rules.disputeWindowHoursAfterEvent);
}

/**
 * Momento em que a ticketeira deixa de aceitar transferências. A data/hora
 * exata cadastrada no evento vale sobre a regra geral da ticketeira (X horas
 * antes), porque quem cadastra conferiu aquele evento; a regra geral é o
 * padrão para eventos sem data cadastrada.
 */
export function transferLockAt(rules: RuleProfile, event: EventRuleInput): Date {
  return event.transferEndsAt ?? addHours(event.startsAt, -rules.transferLockHoursBefore);
}

/** Momento em que a transferência abre (data do evento ou regra geral), ou null se já está aberta. */
export function transferOpensAt(rules: RuleProfile, event: EventRuleInput): Date | null {
  if (event.transferOpensAt) return event.transferOpensAt;
  return rules.transferOpensDaysBefore === null ? null : addDays(event.startsAt, -rules.transferOpensDaysBefore);
}

/**
 * Janela em que uma compra pode ser paga:
 * - abre quando a transferência já é possível E quando a custódia de 45 dias
 *   ainda cobre a data de liberação;
 * - fecha a tempo de o vendedor transferir antes do bloqueio da ticketeira
 *   (o prazo do vendedor pode ser encurtado por evento para vender até mais tarde).
 */
export function saleWindow(rules: RuleProfile, event: EventRuleInput, holidays?: ReadonlySet<string>) {
  const release = releaseAt(rules, event, holidays);
  const escrowBound = addDays(release, -(ESCROW_MAX_DAYS - ESCROW_SAFETY_MARGIN_DAYS));
  const opens = transferOpensAt(rules, event);
  const opensAt = opens ? maxDate(escrowBound, opens) : escrowBound;
  const closesAt = addHours(transferLockAt(rules, event), -rules.sellerTransferDeadlineHours);
  return { opensAt, closesAt, releaseAt: release };
}

/** Prazo do vendedor: X horas após o pagamento, sem passar do bloqueio da ticketeira. */
export function transferDeadline(rules: RuleProfile, event: EventRuleInput, paidAt: Date): Date {
  return minDate(addHours(paidAt, rules.sellerTransferDeadlineHours), transferLockAt(rules, event));
}

export function maxPriceCents(rules: RuleProfile, faceValueCents: number): number | null {
  switch (rules.priceCapMode) {
    case "LIVRE":
      return null;
    case "VALOR_DE_FACE":
      return faceValueCents;
    case "PERCENTUAL":
      return Math.floor((faceValueCents * (100 + rules.maxMarkupPercent)) / 100);
  }
}

export interface ListingInput {
  priceCents: number;
  faceValueCents: number;
  quantity: number;
  purchasedAt: Date;
  sellerDeclaresOriginalBuyer: boolean;
}

/** Vendedor com a conta de recebimento ainda em análise pode ter até isto anunciado ao mesmo tempo. */
export const NEW_SELLER_MAX_ACTIVE_TICKETS = 10;

export interface SellerInput {
  /** Conta de recebimento criada (documentos enviados ou em análise). Obrigatória para anunciar. */
  hasPayoutAccount: boolean;
  /** Conta de recebimento aprovada. Sem ela o vendedor anuncia com limite e só recebe depois da aprovação. */
  payoutApproved: boolean;
  /** Ingressos que o vendedor já tem anunciados ou vendidos neste evento. */
  ticketsAlreadyListedForEvent: number;
  /** Ingressos ainda disponíveis em todos os anúncios ativos do vendedor. */
  activeTicketsListed: number;
}

export function checkListing(
  rules: RuleProfile,
  event: EventRuleInput,
  listing: ListingInput,
  seller: SellerInput,
  now: Date,
): Violation[] {
  const v: Violation[] = [];
  if (event.nominalBiometric) {
    v.push({ code: "NOMINAL_BIOMETRIA", message: "Ingresso nominal com biometria não pode ser revendido." });
  } else if (event.transferAllowed === "NAO") {
    v.push({ code: "TRANSFERENCIA_BLOQUEADA", message: "Este evento não permite transferência." });
  } else if (event.transferAllowed === "DESCONHECIDO") {
    v.push({ code: "TRANSFERENCIA_NAO_CONFIRMADA", message: "Ainda não confirmamos se este evento permite transferência." });
  } else if (!rules.listingEnabled) {
    v.push({ code: "ANUNCIOS_DESLIGADOS", message: "Anúncios desligados para este evento." });
  }
  if (!seller.hasPayoutAccount) {
    v.push({ code: "SEM_CONTA_DE_RECEBIMENTO", message: "Cadastre sua conta de recebimento para anunciar (leva 2 minutos)." });
  } else if (!seller.payoutApproved && seller.activeTicketsListed + listing.quantity > NEW_SELLER_MAX_ACTIVE_TICKETS) {
    v.push({
      code: "LIMITE_VENDEDOR_NOVO",
      message: `Enquanto seu cadastro está em análise, você pode ter até ${NEW_SELLER_MAX_ACTIVE_TICKETS} ingressos anunciados.`,
    });
  }
  if (now >= saleWindow(rules, event).closesAt) {
    v.push({ code: "FORA_DA_JANELA", message: "Prazo para vender este evento encerrado." });
  }
  if (listing.quantity < 1 || !Number.isInteger(listing.quantity)) {
    v.push({ code: "QUANTIDADE_INVALIDA", message: "Quantidade inválida." });
  }
  if (seller.ticketsAlreadyListedForEvent + listing.quantity > rules.maxTicketsPerSellerPerEvent) {
    v.push({
      code: "LIMITE_POR_VENDEDOR",
      message: `Limite de ${rules.maxTicketsPerSellerPerEvent} ingressos por vendedor neste evento.`,
    });
  }
  if (rules.sellerMustBeOriginalBuyer && !listing.sellerDeclaresOriginalBuyer) {
    v.push({
      code: "SOMENTE_COMPRADOR_ORIGINAL",
      message: "Nesta ticketeira só quem comprou direto nela consegue transferir.",
    });
  }
  if (listing.purchasedAt > addDays(now, -rules.minTicketAgeDays)) {
    v.push({
      code: "INGRESSO_RECENTE",
      message: `Ingressos comprados há menos de ${rules.minTicketAgeDays} dias ainda podem ser cancelados na ticketeira.`,
    });
  }
  const cap = maxPriceCents(rules, listing.faceValueCents);
  if (listing.priceCents <= 0) {
    v.push({ code: "PRECO_INVALIDO", message: "Preço inválido." });
  } else if (cap !== null && listing.priceCents > cap) {
    v.push({
      code: "PRECO_ACIMA_DO_LIMITE",
      message: event.isSports
        ? "Em eventos esportivos o preço não pode passar do valor de face (Lei 14.597/2023, art. 166)."
        : "Preço acima do limite permitido para este evento.",
    });
  }
  return v;
}

export interface PurchaseInput {
  buyerId: string;
  sellerId: string;
  buyerVerified: boolean;
  buyerIdentifiers: Partial<Record<BuyerIdentifier, string>>;
  ticketType: TicketType;
  /** Comprador declarou ter direito à meia-entrada (documento é exigido na portaria). */
  buyerDeclaresHalfPriceEligible: boolean;
}

export function checkPurchase(
  rules: RuleProfile,
  event: EventRuleInput,
  purchase: PurchaseInput,
  now: Date,
): Violation[] {
  const v: Violation[] = [];
  if (!rules.listingEnabled) {
    v.push({ code: "ANUNCIOS_DESLIGADOS", message: "Vendas desligadas para este evento." });
  }
  if (purchase.buyerId === purchase.sellerId) {
    v.push({ code: "COMPRA_PROPRIA", message: "Você não pode comprar o próprio anúncio." });
  }
  if (!purchase.buyerVerified) {
    v.push({ code: "COMPRADOR_NAO_VERIFICADO", message: "Confirme seu CPF para comprar." });
  }
  const window = saleWindow(rules, event);
  if (now < window.opensAt) {
    v.push({
      code: "VENDA_AINDA_NAO_ABERTA",
      message: "As compras deste evento ainda não abriram (transferência ou custódia indisponível).",
    });
  }
  if (now >= window.closesAt) {
    v.push({ code: "FORA_DA_JANELA", message: "Não há mais tempo para o vendedor transferir." });
  }
  const missing = requiredIdentifiers(rules).filter((id) => !purchase.buyerIdentifiers[id]?.trim());
  if (missing.length > 0) {
    v.push({ code: "DADOS_DO_COMPRADOR", message: `Informe: ${missing.join(", ")}.` });
  }
  if (purchase.ticketType === "MEIA" && !purchase.buyerDeclaresHalfPriceEligible) {
    v.push({ code: "MEIA_ENTRADA", message: "Ingresso de meia-entrada exige documento na entrada do evento." });
  }
  return v;
}

/** QUENTRO_ID é alternativa ao e-mail, não obrigatório. */
function requiredIdentifiers(rules: RuleProfile): BuyerIdentifier[] {
  return rules.buyerIdentifiers.filter((id) => id !== "QUENTRO_ID");
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

/**
 * Anúncio fica visível enquanto a venda não fechou. A rotina agendada usa isto
 * para marcar como ENCERRADO os anúncios de eventos cuja transferência acabou.
 */
export function isSaleClosed(rules: RuleProfile, event: EventRuleInput, now: Date): boolean {
  return now >= saleWindow(rules, event).closesAt;
}
