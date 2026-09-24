import { saleWindow } from "@/lib/rules/engine";
import { eventRuleInput, rulesFor, type EventRecord } from "./store";

export type SaleState =
  | { kind: "ABERTA"; closesAt: Date }
  | { kind: "EM_BREVE"; opensAt: Date; closesAt: Date }
  | { kind: "ENCERRADA" }
  | { kind: "BLOQUEADA"; reason: string };

export function saleState(event: EventRecord, now = new Date()): SaleState {
  if (event.nominalBiometric) return { kind: "BLOQUEADA", reason: "Ingresso nominal com biometria: não pode ser revendido." };
  if (event.transferAllowed === "NAO") return { kind: "BLOQUEADA", reason: "Este evento não permite transferência de ingressos." };
  if (event.transferAllowed === "DESCONHECIDO") {
    return { kind: "BLOQUEADA", reason: "Estamos confirmando se este evento permite transferência. Em breve liberamos a revenda." };
  }
  const { opensAt, closesAt } = saleWindow(rulesFor(event), eventRuleInput(event));
  if (now >= closesAt) return { kind: "ENCERRADA" };
  if (now < opensAt) return { kind: "EM_BREVE", opensAt, closesAt };
  return { kind: "ABERTA", closesAt };
}
