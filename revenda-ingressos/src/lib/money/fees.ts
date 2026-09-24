/** Valores sempre em centavos inteiros. `feeBps`: 1000 = 10%. */
export function splitAmount(totalCents: number, feeBps: number) {
  if (!Number.isInteger(totalCents) || totalCents <= 0) throw new Error("Valor inválido");
  const platformFeeCents = Math.round((totalCents * feeBps) / 10_000);
  return { totalCents, platformFeeCents, sellerNetCents: totalCents - platformFeeCents };
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
