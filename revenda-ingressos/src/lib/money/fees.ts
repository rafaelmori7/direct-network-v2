/** Valores sempre em centavos inteiros. `feeBps`: 1000 = 10%. */
export function splitAmount(totalCents: number, feeBps: number) {
  if (!Number.isInteger(totalCents) || totalCents <= 0) throw new Error("Valor inválido");
  const platformFeeCents = Math.round((totalCents * feeBps) / 10_000);
  return { totalCents, platformFeeCents, sellerNetCents: totalCents - platformFeeCents };
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export interface FeeConfig {
  /** Taxa de serviço paga pelo comprador, somada ao preço (1500 = 15%). */
  buyerFeeBps: number;
  /** Comissão descontada do vendedor (0 = o vendedor recebe o preço anunciado inteiro). */
  sellerFeeBps: number;
}

/** Taxas do site. BUYER_FEE_BPS e SELLER_FEE_BPS em pontos-base. */
export function feeConfig(): FeeConfig {
  const read = (name: string, fallback: number) => {
    const n = Number(process.env[name]);
    return Number.isInteger(n) && n >= 0 && n <= 5000 ? n : fallback;
  };
  return { buyerFeeBps: read("BUYER_FEE_BPS", 1500), sellerFeeBps: read("SELLER_FEE_BPS", 0) };
}

export function buyerFeeCents(listCents: number, fees: FeeConfig): number {
  return Math.round((listCents * fees.buyerFeeBps) / 10_000);
}

export interface PartnerTerms {
  /** Parte da receita do site que vai para o parceiro (5000 = 50%). */
  commissionShareBps: number;
  /** Desconto sobre o total da compra (preço + taxa) para quem veio pelo link/cupom (1000 = 10%). */
  discountBps: number;
}

export interface OrderAmounts {
  /** Soma dos preços anunciados. */
  listCents: number;
  buyerFeeCents: number;
  sellerFeeCents: number;
  discountCents: number;
  /** O que o comprador paga: preço + taxa − desconto. */
  totalCents: number;
  /** O vendedor recebe o preço anunciado menos a comissão dele, com ou sem desconto. */
  sellerNetCents: number;
  platformFeeCents: number;
  partnerFeeCents: number;
}

/**
 * Divide uma venda. O comprador paga preço + taxa de serviço; o cupom dá
 * desconto sobre esse total, limitado à receita do site (nunca sai do
 * vendedor); o que sobra da receita é dividido com o parceiro.
 * Ex.: ingresso R$ 100, taxa 15%, cupom 10% → paga R$ 103,50.
 */
export function orderAmounts(listCents: number, fees: FeeConfig, partner: PartnerTerms | null, applyDiscount: boolean): OrderAmounts {
  if (!Number.isInteger(listCents) || listCents <= 0) throw new Error("Valor inválido");
  const buyerFee = buyerFeeCents(listCents, fees);
  const sellerFee = Math.round((listCents * fees.sellerFeeBps) / 10_000);
  const gross = listCents + buyerFee;
  const revenue = buyerFee + sellerFee;
  const discountCents = partner && applyDiscount ? Math.min(revenue, Math.round((gross * partner.discountBps) / 10_000)) : 0;
  const remaining = revenue - discountCents;
  const partnerFeeCents = partner ? Math.round((remaining * partner.commissionShareBps) / 10_000) : 0;
  return {
    listCents,
    buyerFeeCents: buyerFee,
    sellerFeeCents: sellerFee,
    discountCents,
    totalCents: gross - discountCents,
    sellerNetCents: listCents - sellerFee,
    platformFeeCents: remaining - partnerFeeCents,
    partnerFeeCents,
  };
}
