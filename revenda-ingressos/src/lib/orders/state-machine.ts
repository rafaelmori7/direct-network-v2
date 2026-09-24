/**
 * Ciclo de vida do pedido. Funções puras: recebem o pedido e a ação e devolvem
 * o próximo status mais os efeitos que o chamador precisa executar (reembolso,
 * liberação da custódia). Nada aqui fala com banco ou gateway.
 *
 *   AGUARDANDO_PAGAMENTO ─pago─▶ PAGO ─vendedor transferiu─▶ TRANSFERIDO ─comprador recebeu─▶ RECEBIDO
 *          │                      │                            │                                │
 *        expirou          prazo esgotado              não recebi / disputa                   disputa
 *          ▼                      ▼                            ▼                                ▼
 *      CANCELADO             REEMBOLSADO ◀── admin ── EM_DISPUTA ── admin ──▶ LIBERADO ◀── liberação automática
 */

export type OrderStatus =
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "TRANSFERIDO"
  | "RECEBIDO"
  | "EM_DISPUTA"
  | "LIBERADO"
  | "REEMBOLSADO"
  | "CANCELADO";

export type Actor = "COMPRADOR" | "VENDEDOR" | "SISTEMA" | "ADMIN";

export type OrderAction =
  | { type: "PAGAMENTO_CONFIRMADO" }
  | { type: "PAGAMENTO_EXPIRADO" }
  | { type: "PAGADOR_DIFERENTE" }
  | { type: "VENDEDOR_TRANSFERIU" }
  | { type: "PRAZO_TRANSFERENCIA_ESGOTADO" }
  | { type: "COMPRADOR_CONFIRMOU_RECEBIMENTO"; checklistConfirmed: boolean }
  | { type: "ABRIR_DISPUTA"; reason: string }
  | { type: "LIBERACAO_AUTOMATICA" }
  | { type: "ADMIN_DECIDIU"; winner: "COMPRADOR" | "VENDEDOR"; note: string };

export type Effect = { type: "REEMBOLSAR_COMPRADOR" } | { type: "LIBERAR_CUSTODIA" } | { type: "CANCELAR_COBRANCA" };

export interface OrderSnapshot {
  status: OrderStatus;
  transferDeadlineAt: Date | null;
  disputeDeadlineAt: Date;
  releaseAt: Date;
}

export type TransitionResult =
  | { ok: true; next: OrderStatus; effects: Effect[] }
  | { ok: false; error: string };

const ALLOWED_ACTORS: Record<OrderAction["type"], Actor[]> = {
  PAGAMENTO_CONFIRMADO: ["SISTEMA"],
  PAGAMENTO_EXPIRADO: ["SISTEMA"],
  PAGADOR_DIFERENTE: ["SISTEMA"],
  VENDEDOR_TRANSFERIU: ["VENDEDOR"],
  PRAZO_TRANSFERENCIA_ESGOTADO: ["SISTEMA"],
  COMPRADOR_CONFIRMOU_RECEBIMENTO: ["COMPRADOR"],
  ABRIR_DISPUTA: ["COMPRADOR", "VENDEDOR"],
  LIBERACAO_AUTOMATICA: ["SISTEMA"],
  ADMIN_DECIDIU: ["ADMIN"],
};

export function transition(
  order: OrderSnapshot,
  action: OrderAction,
  actor: Actor,
  now: Date,
): TransitionResult {
  if (!ALLOWED_ACTORS[action.type].includes(actor)) {
    return fail(`${actor} não pode executar ${action.type}`);
  }
  const { status } = order;

  switch (action.type) {
    case "PAGAMENTO_CONFIRMADO":
      return status === "AGUARDANDO_PAGAMENTO" ? ok("PAGO") : badState(status, action);

    case "PAGAMENTO_EXPIRADO":
      return status === "AGUARDANDO_PAGAMENTO" ? ok("CANCELADO", [{ type: "CANCELAR_COBRANCA" }]) : badState(status, action);

    case "PAGADOR_DIFERENTE":
      // Pix pago por outro CPF: devolve e cancela. Só aceitamos Pix do próprio comprador.
      return status === "AGUARDANDO_PAGAMENTO" ? ok("CANCELADO", [{ type: "REEMBOLSAR_COMPRADOR" }]) : badState(status, action);

    case "VENDEDOR_TRANSFERIU":
      if (status !== "PAGO") return badState(status, action);
      if (order.transferDeadlineAt && now > order.transferDeadlineAt) {
        return fail("Prazo de transferência esgotado");
      }
      return ok("TRANSFERIDO");

    case "PRAZO_TRANSFERENCIA_ESGOTADO":
      if (status !== "PAGO") return badState(status, action);
      if (!order.transferDeadlineAt || now <= order.transferDeadlineAt) {
        return fail("Prazo de transferência ainda não esgotou");
      }
      return ok("REEMBOLSADO", [{ type: "REEMBOLSAR_COMPRADOR" }]);

    case "COMPRADOR_CONFIRMOU_RECEBIMENTO":
      if (status !== "TRANSFERIDO") return badState(status, action);
      if (!action.checklistConfirmed) return fail("Confirme todos os itens antes de marcar como recebido");
      // Fase 1: confirmar o recebimento NÃO libera o dinheiro. A liberação só
      // acontece depois do evento, porque o vendedor ainda pode cancelar a compra
      // original ou a ticketeira pode cancelar o ingresso.
      return ok("RECEBIDO");

    case "ABRIR_DISPUTA":
      if (!["PAGO", "TRANSFERIDO", "RECEBIDO"].includes(status)) return badState(status, action);
      if (now > order.disputeDeadlineAt) return fail("Prazo para abrir disputa encerrado");
      if (!action.reason.trim()) return fail("Descreva o problema");
      return ok("EM_DISPUTA");

    case "LIBERACAO_AUTOMATICA":
      // Comprador que não reclamou até o fim da janela de disputa aceitou a entrega.
      if (status !== "TRANSFERIDO" && status !== "RECEBIDO") return badState(status, action);
      if (now < order.releaseAt) return fail("Ainda não chegou a data de liberação");
      return ok("LIBERADO", [{ type: "LIBERAR_CUSTODIA" }]);

    case "ADMIN_DECIDIU":
      if (status !== "EM_DISPUTA") return badState(status, action);
      if (!action.note.trim()) return fail("Registre o motivo da decisão");
      return action.winner === "COMPRADOR"
        ? ok("REEMBOLSADO", [{ type: "REEMBOLSAR_COMPRADOR" }])
        : ok("LIBERADO", [{ type: "LIBERAR_CUSTODIA" }]);
  }
}

export const FINAL_STATUSES: ReadonlySet<OrderStatus> = new Set(["LIBERADO", "REEMBOLSADO", "CANCELADO"]);

function ok(next: OrderStatus, effects: Effect[] = []): TransitionResult {
  return { ok: true, next, effects };
}

function fail(error: string): TransitionResult {
  return { ok: false, error };
}

function badState(status: OrderStatus, action: OrderAction): TransitionResult {
  return fail(`Ação ${action.type} inválida no status ${status}`);
}
