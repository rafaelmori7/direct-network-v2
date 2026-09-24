"use client";

import { useActionState, useState } from "react";
import { formatBRL } from "@/lib/money/fees";
import type { BuyerIdentifier } from "@/lib/rules/types";
import { startCheckout, type CheckoutState } from "./actions";

interface Props {
  listingId: string;
  unitPriceCents: number;
  maxQuantity: number;
  identifiers: { id: BuyerIdentifier; label: string; hint: string; required: boolean }[];
  requiresHalfPrice: boolean;
  platformName: string;
}

export function CheckoutForm(props: Props) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, { status: "form", errors: [] });
  const [quantity, setQuantity] = useState(1);

  if (state.status === "pix") {
    return (
      <div className="form">
        <div className="notice notice-safe">
          <div>
            <b>Pix gerado: {formatBRL(state.totalCents)}</b>
            Pague pelo app do seu banco, com uma conta no <b>seu CPF</b>. Pix de outra pessoa é devolvido.
          </div>
        </div>
        <div className="field">
          <span className="label">Pix copia e cola</span>
          <div className="pix-code">{state.pixCopyPaste}</div>
        </div>
        <button className="btn btn-outline btn-block" type="button" onClick={() => navigator.clipboard?.writeText(state.pixCopyPaste)}>
          Copiar código
        </button>
        <p className="hint" style={{ margin: 0 }}>
          Modo demonstração: nenhuma cobrança real foi criada.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="form">
      <input type="hidden" name="anuncio" value={props.listingId} />
      {state.errors.length > 0 && (
        <div className="notice notice-danger" role="alert">
          <div>
            <b>Confira os dados</b>
            <ul className="errors">
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="quantidade">Quantidade</label>
        <select id="quantidade" name="quantidade" className="select" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
          {Array.from({ length: props.maxQuantity }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="notice notice-warn">
        <div>
          <b>Dados para a transferência</b>O vendedor vai usar estes dados para transferir pelo app {props.platformName}.
          Confira se são exatamente os da sua conta.
        </div>
      </div>
      {props.identifiers.map((f) => (
        <div className="field" key={f.id}>
          <label htmlFor={f.id}>{f.label}</label>
          <input id={f.id} name={f.id} className="input" required={f.required} />
          <span className="hint">{f.hint}</span>
        </div>
      ))}

      {props.requiresHalfPrice && (
        <label className="check">
          <input type="checkbox" name="meia" />
          <span>Tenho direito à meia-entrada e vou apresentar o documento na portaria.</span>
        </label>
      )}
      <label className="check">
        <input type="checkbox" name="termos" />
        <span>
          Entendi: pago por Pix do meu CPF, o valor fica retido e só vai para o vendedor depois do evento. Se o ingresso
          não chegar no prazo, recebo o dinheiro de volta.
        </span>
      </label>

      <div className="summary">
        <div className="summary-row summary-total">
          <span>Total</span>
          <span>{formatBRL(props.unitPriceCents * quantity)}</span>
        </div>
      </div>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Gerando Pix..." : "Pagar com Pix"}
      </button>
    </form>
  );
}
