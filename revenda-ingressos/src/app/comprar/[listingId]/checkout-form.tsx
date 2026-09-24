"use client";

import { useActionState, useState } from "react";
import { formatBRL, orderAmounts, type FeeConfig } from "@/lib/money/fees";
import type { BuyerIdentifier } from "@/lib/rules/types";
import { startCheckout, type CheckoutState } from "./actions";

interface Props {
  defaults: Partial<Record<BuyerIdentifier, string>>;
  listingId: string;
  unitPriceCents: number;
  /** Parceiro que indicou (link/página) ou dono do evento, e o desconto que o link dá. */
  referral: { partnerName: string; discountBps: number; commissionShareBps: number } | null;
  fees: FeeConfig;
  maxQuantity: number;
  identifiers: { id: BuyerIdentifier; label: string; hint: string; required: boolean }[];
  requiresHalfPrice: boolean;
  platformName: string;
}

export function CheckoutForm(props: Props) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, { errors: [] });
  const [quantity, setQuantity] = useState(1);
  // Prévia com a mesma conta do servidor (o valor final é recalculado ao gerar o Pix).
  const amounts = orderAmounts(props.unitPriceCents * quantity, props.fees, props.referral, true);

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
          <input id={f.id} name={f.id} className="input" required={f.required} defaultValue={props.defaults[f.id]} />
          <span className="hint">{f.hint}</span>
        </div>
      ))}

      {props.requiresHalfPrice && (
        <label className="check">
          <input type="checkbox" name="meia" />
          <span>Tenho direito à meia-entrada e vou apresentar o documento na portaria.</span>
        </label>
      )}
      <div className="field">
        <label htmlFor="cupom">Cupom de parceiro (opcional)</label>
        <input id="cupom" name="cupom" className="input" autoComplete="off" style={{ textTransform: "uppercase" }} placeholder="Ex.: TIMELAPSE" />
        {props.referral && <span className="hint">Indicação de {props.referral.partnerName} já aplicada.</span>}
      </div>

      <label className="check">
        <input type="checkbox" name="termos" />
        <span>
          Entendi: pago por Pix do meu CPF, o valor fica retido e só vai para o vendedor depois do evento. Se o ingresso
          não chegar no prazo, recebo o dinheiro de volta.
        </span>
      </label>

      <div className="summary">
        <div className="summary-row">
          <span>Ingresso{quantity > 1 ? "s" : ""}</span>
          <span>{formatBRL(amounts.listCents)}</span>
        </div>
        {amounts.buyerFeeCents > 0 && (
          <div className="summary-row">
            <span>Taxa de serviço</span>
            <span>+ {formatBRL(amounts.buyerFeeCents)}</span>
          </div>
        )}
        {amounts.discountCents > 0 && (
          <div className="summary-row">
            <span>Desconto {props.referral?.partnerName}</span>
            <span>− {formatBRL(amounts.discountCents)}</span>
          </div>
        )}
        <div className="summary-row summary-total">
          <span>Total</span>
          <span>{formatBRL(amounts.totalCents)}</span>
        </div>
      </div>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Gerando Pix..." : "Pagar com Pix"}
      </button>
    </form>
  );
}
