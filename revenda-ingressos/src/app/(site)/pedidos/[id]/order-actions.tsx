"use client";

import { useActionState, useState } from "react";
import type { OrderFormState } from "./actions";

type Action = (prev: OrderFormState, form: FormData) => Promise<OrderFormState>;

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="notice notice-danger" role="alert">
      <div>{error}</div>
    </div>
  );
}

export function SimpleActionButton({ action, label, variant = "primary" }: { action: Action; label: string; variant?: "primary" | "outline" }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  return (
    <form action={formAction} className="form" style={{ gap: 10 }}>
      <ErrorNote error={state.error} />
      <button className={`btn btn-${variant} btn-block`} disabled={pending}>
        {pending ? "Aguarde..." : label}
      </button>
    </form>
  );
}

export function ReceiptChecklist({ action, items }: { action: Action; items: string[] }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [checked, setChecked] = useState(0);
  return (
    <form action={formAction} className="form" style={{ gap: 12 }}>
      <input type="hidden" name="totalItens" value={items.length} />
      <ErrorNote error={state.error} />
      {items.map((item) => (
        <label className="check" key={item}>
          <input type="checkbox" name="item" value={item} onChange={(e) => setChecked((n) => n + (e.target.checked ? 1 : -1))} />
          <span>{item}</span>
        </label>
      ))}
      <button className="btn btn-primary btn-block" disabled={pending || checked < items.length}>
        Recebi o ingresso
      </button>
    </form>
  );
}

export function DisputeForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="btn btn-outline btn-block" onClick={() => setOpen(true)}>
        Tive um problema
      </button>
    );
  }
  return (
    <form action={formAction} className="form" style={{ gap: 10 }}>
      <ErrorNote error={state.error} />
      <div className="field">
        <label htmlFor="motivo">O que aconteceu?</label>
        <textarea id="motivo" name="motivo" className="input" style={{ height: 96, paddingTop: 10 }} required />
      </div>
      <button className="btn btn-primary btn-block" disabled={pending}>
        Abrir disputa
      </button>
    </form>
  );
}

export function DisputeDecisionForm({ action, reason }: { action: Action; reason: string | null }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  return (
    <form action={formAction} className="aside-card">
      <div className="aside-head">Decisão da disputa (admin)</div>
      <div className="aside-body form" style={{ gap: 12 }}>
        {reason && <p className="offer-sub" style={{ margin: 0 }}>Motivo: “{reason}”</p>}
        <ErrorNote error={state.error} />
        <label className="check">
          <input type="radio" name="vencedor" value="COMPRADOR" required />
          <span><b>Comprador tem razão</b>: devolver o valor integral (reembolso para aprovar no Asaas).</span>
        </label>
        <label className="check">
          <input type="radio" name="vencedor" value="VENDEDOR" />
          <span><b>Vendedor tem razão</b>: o pagamento é liberado na data normal (após o evento), ou na hora se ela já passou.</span>
        </label>
        <div className="field">
          <label htmlFor="motivo">Motivo da decisão (fica no histórico)</label>
          <textarea id="motivo" name="motivo" className="input" style={{ height: 80, paddingTop: 10 }} required />
        </div>
        <button className="btn btn-primary btn-block" disabled={pending}>
          Registrar decisão
        </button>
      </div>
    </form>
  );
}
