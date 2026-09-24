"use client";

import { useActionState } from "react";
import { TICKET_TYPE_LABEL } from "@/lib/format";
import type { TicketType } from "@/lib/rules/types";
import { createListing, type FormState } from "./actions";

interface Props {
  eventSlug: string;
  sectors: { name: string; faceValue: string }[];
  sellerMustBeOriginalBuyer: boolean;
  priceCapNote: string | null;
  maxTickets: number;
  transferDeadlineHours: number;
  platformName: string;
}

export function ListingForm(props: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createListing, { errors: [] });

  return (
    <form action={action} className="form">
      <input type="hidden" name="evento" value={props.eventSlug} />

      {state.errors.length > 0 && (
        <div className="notice notice-danger" role="alert">
          <div>
            <b>Não foi possível publicar</b>
            <ul className="errors">
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="row row-2">
        <div className="field">
          <label htmlFor="setor">Setor</label>
          <input id="setor" name="setor" className="input" list="setores" required placeholder="Ex.: Pista" />
          <datalist id="setores">
            {props.sectors.map((s) => (
              <option key={s.name} value={s.name}>
                {s.faceValue}
              </option>
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="tipo">Tipo de ingresso</label>
          <select id="tipo" name="tipo" className="select" defaultValue="INTEIRA">
            {(Object.keys(TICKET_TYPE_LABEL) as TicketType[]).map((t) => (
              <option key={t} value={t}>
                {TICKET_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row row-3">
        <div className="field">
          <label htmlFor="quantidade">Quantidade</label>
          <select id="quantidade" name="quantidade" className="select" defaultValue="1">
            {Array.from({ length: props.maxTickets }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="valorOriginal">Valor original (R$)</label>
          <input id="valorOriginal" name="valorOriginal" className="input" inputMode="decimal" required placeholder="420,00" />
        </div>
        <div className="field">
          <label htmlFor="preco">Seu preço (R$)</label>
          <input id="preco" name="preco" className="input" inputMode="decimal" required placeholder="500,00" />
        </div>
      </div>
      {props.priceCapNote && <p className="hint" style={{ margin: "-8px 0 0" }}>{props.priceCapNote}</p>}

      <div className="row row-2">
        <div className="field">
          <label htmlFor="dataCompra">Data em que você comprou</label>
          <input id="dataCompra" name="dataCompra" type="date" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="pedido">Nº do pedido na ticketeira</label>
          <input id="pedido" name="pedido" className="input" required placeholder="Só usado em caso de disputa" />
        </div>
      </div>

      <label className="check">
        <input type="checkbox" name="compradorOriginal" />
        <span>
          Comprei este ingresso direto na {props.platformName}, na minha conta.
          {props.sellerMustBeOriginalBuyer && (
            <>
              {" "}
              <b>Obrigatório:</b> nesta ticketeira, quem recebeu o ingresso por transferência não consegue transferir de
              novo.
            </>
          )}
        </span>
      </label>
      <label className="check">
        <input type="checkbox" name="confirmaTransferencia" />
        <span>
          Vou transferir pelo app oficial em até {props.transferDeadlineHours}h após a venda. Sei que o pagamento só é
          liberado depois do evento e que, se eu não transferir, o comprador é reembolsado.
        </span>
      </label>

      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Publicando..." : "Publicar anúncio"}
      </button>
    </form>
  );
}
