import { timingSafeEqual } from "node:crypto";

/** Compara o token enviado pelo Asaas no header "asaas-access-token" com o esperado. */
export function tokenMatches(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
