/** Valores sempre em centavos inteiros. `feeBps`: 1000 = 10%. */
export function splitAmount(totalCents: number, feeBps: number) {
  if (!Number.isInteger(totalCents) || totalCents <= 0) throw new Error("Valor inválido");
  const platformFeeCents = Math.round((totalCents * feeBps) / 10_000);
  return { totalCents, platformFeeCents, sellerNetCents: totalCents - platformFeeCents };
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export interface PartnerTerms {
  /** Parte da comissão que vai para o parceiro (5000 = 50%). */
  commissionShareBps: number;
  /** Desconto ao comprador sobre o valor dos ingressos (100 = 1%), limitado à comissão. */
  discountBps: number;
}

export interface OrderAmounts {
  /** Soma dos preços anunciados. */
  listCents: number;
  discountCents: number;
  /** O que o comprador paga. */
  totalCents: number;
  /** O vendedor sempre recebe o preço anunciado menos a comissão, com ou sem desconto. */
  sellerNetCents: number;
  platformFeeCents: number;
  partnerFeeCents: number;
}

/**
 * Divide uma venda entre vendedor, plataforma e parceiro. O desconto do cupom
 * sai da comissão (nunca do vendedor) e o que sobra da comissão é dividido
 * com o parceiro.
 */
export function orderAmounts(listCents: number, feeBps: number, partner: PartnerTerms | null, applyDiscount: boolean): OrderAmounts {
  const { platformFeeCents: commission, sellerNetCents } = splitAmount(listCents, feeBps);
  const discountCents = partner && applyDiscount ? Math.min(commission, Math.round((listCents * partner.discountBps) / 10_000)) : 0;
  const remaining = commission - discountCents;
  const partnerFeeCents = partner ? Math.round((remaining * partner.commissionShareBps) / 10_000) : 0;
  return {
    listCents,
    discountCents,
    totalCents: listCents - discountCents,
    sellerNetCents,
    platformFeeCents: remaining - partnerFeeCents,
    partnerFeeCents,
  };
}
