import { describe, expect, it } from "vitest";
import { transition, type OrderSnapshot } from "@/lib/orders/state-machine";

const base: OrderSnapshot = {
  status: "AGUARDANDO_PAGAMENTO",
  transferDeadlineAt: new Date("2026-10-06T12:00:00Z"),
  disputeDeadlineAt: new Date("2026-10-20T09:00:00Z"),
  releaseAt: new Date("2026-10-22T02:59:59.999Z"),
};
const at = (iso: string) => new Date(iso);
const order = (status: OrderSnapshot["status"]) => ({ ...base, status });

describe("fluxo feliz", () => {
  it("pago → transferido → recebido → liberado só depois do evento", () => {
    let r = transition(base, { type: "PAGAMENTO_CONFIRMADO" }, "SISTEMA", at("2026-10-05T12:00:00Z"));
    expect(r).toEqual({ ok: true, next: "PAGO", effects: [] });

    r = transition(order("PAGO"), { type: "VENDEDOR_TRANSFERIU" }, "VENDEDOR", at("2026-10-05T15:00:00Z"));
    expect(r).toMatchObject({ ok: true, next: "TRANSFERIDO" });

    r = transition(
      order("TRANSFERIDO"),
      { type: "COMPRADOR_CONFIRMOU_RECEBIMENTO", checklistConfirmed: true },
      "COMPRADOR",
      at("2026-10-05T16:00:00Z"),
    );
    expect(r).toEqual({ ok: true, next: "RECEBIDO", effects: [] });

    r = transition(order("RECEBIDO"), { type: "LIBERACAO_AUTOMATICA" }, "SISTEMA", at("2026-10-19T12:00:00Z"));
    expect(r.ok).toBe(false);

    r = transition(order("RECEBIDO"), { type: "LIBERACAO_AUTOMATICA" }, "SISTEMA", at("2026-10-22T03:00:00Z"));
    expect(r).toEqual({ ok: true, next: "LIBERADO", effects: [{ type: "LIBERAR_CUSTODIA" }] });
  });
});

describe("proteções", () => {
  it("confirmar recebimento nunca libera dinheiro", () => {
    const r = transition(
      order("TRANSFERIDO"),
      { type: "COMPRADOR_CONFIRMOU_RECEBIMENTO", checklistConfirmed: true },
      "COMPRADOR",
      at("2026-10-05T16:00:00Z"),
    );
    expect(r.ok && r.effects).toEqual([]);
  });

  it("exige o checklist para confirmar", () => {
    const r = transition(
      order("TRANSFERIDO"),
      { type: "COMPRADOR_CONFIRMOU_RECEBIMENTO", checklistConfirmed: false },
      "COMPRADOR",
      at("2026-10-05T16:00:00Z"),
    );
    expect(r.ok).toBe(false);
  });

  it("vendedor que perde o prazo gera reembolso", () => {
    const early = transition(order("PAGO"), { type: "PRAZO_TRANSFERENCIA_ESGOTADO" }, "SISTEMA", at("2026-10-06T11:00:00Z"));
    expect(early.ok).toBe(false);
    const late = transition(order("PAGO"), { type: "PRAZO_TRANSFERENCIA_ESGOTADO" }, "SISTEMA", at("2026-10-06T12:00:01Z"));
    expect(late).toEqual({ ok: true, next: "REEMBOLSADO", effects: [{ type: "REEMBOLSAR_COMPRADOR" }] });
    const tooLate = transition(order("PAGO"), { type: "VENDEDOR_TRANSFERIU" }, "VENDEDOR", at("2026-10-06T12:00:01Z"));
    expect(tooLate.ok).toBe(false);
  });

  it("comprador pode abrir disputa até o fim da janela, mesmo depois de confirmar", () => {
    const within = transition(order("RECEBIDO"), { type: "ABRIR_DISPUTA", reason: "Barrado na entrada" }, "COMPRADOR", at("2026-10-19T12:00:00Z"));
    expect(within).toMatchObject({ ok: true, next: "EM_DISPUTA" });
    const after = transition(order("RECEBIDO"), { type: "ABRIR_DISPUTA", reason: "x" }, "COMPRADOR", at("2026-10-21T12:00:00Z"));
    expect(after.ok).toBe(false);
  });

  it("disputa só termina por decisão do admin", () => {
    const auto = transition(order("EM_DISPUTA"), { type: "LIBERACAO_AUTOMATICA" }, "SISTEMA", at("2026-11-01T00:00:00Z"));
    expect(auto.ok).toBe(false);
    const buyerWins = transition(order("EM_DISPUTA"), { type: "ADMIN_DECIDIU", winner: "COMPRADOR", note: "Ingresso cancelado pela ticketeira" }, "ADMIN", at("2026-10-21T00:00:00Z"));
    expect(buyerWins).toEqual({ ok: true, next: "REEMBOLSADO", effects: [{ type: "REEMBOLSAR_COMPRADOR" }] });
  });

  it("ninguém executa ação de outro papel", () => {
    expect(transition(order("PAGO"), { type: "VENDEDOR_TRANSFERIU" }, "COMPRADOR", at("2026-10-05T15:00:00Z")).ok).toBe(false);
    expect(transition(base, { type: "PAGAMENTO_CONFIRMADO" }, "COMPRADOR", at("2026-10-05T12:00:00Z")).ok).toBe(false);
    expect(
      transition(order("EM_DISPUTA"), { type: "ADMIN_DECIDIU", winner: "VENDEDOR", note: "ok" }, "VENDEDOR", at("2026-10-21T00:00:00Z")).ok,
    ).toBe(false);
  });

  it("pedido finalizado não muda mais", () => {
    for (const status of ["LIBERADO", "REEMBOLSADO", "CANCELADO"] as const) {
      expect(transition(order(status), { type: "ABRIR_DISPUTA", reason: "x" }, "COMPRADOR", at("2026-10-19T00:00:00Z")).ok).toBe(false);
      expect(transition(order(status), { type: "LIBERACAO_AUTOMATICA" }, "SISTEMA", at("2026-11-01T00:00:00Z")).ok).toBe(false);
    }
  });
});
