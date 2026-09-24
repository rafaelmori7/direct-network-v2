"use client";

import { useActionState } from "react";
import { createWanted, type WantedState } from "./actions";

export function WantedForm({ eventSlug, sectors }: { eventSlug: string; sectors: string[] }) {
  const [state, action, pending] = useActionState<WantedState, FormData>(createWanted, { errors: [] });
  return (
    <form action={action} className="form">
      <input type="hidden" name="evento" value={eventSlug} />
      {state.errors.length > 0 && (
        <div className="notice notice-danger" role="alert">
          <div>
            <b>Confira os dados</b>
            {state.errors.join(" ")}
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="setor">Setor</label>
        <select id="setor" name="setor" className="select" defaultValue="">
          <option value="">Qualquer setor</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="quantidade">Quantidade</label>
          <select id="quantidade" name="quantidade" className="select" defaultValue="1">
            {[1, 2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="precoMaximo">Pago até (R$)</label>
          <input id="precoMaximo" name="precoMaximo" className="input" inputMode="decimal" placeholder="Opcional" />
        </div>
      </div>
      <p className="hint" style={{ margin: 0 }}>
        Avisamos você quando alguém anunciar um ingresso que combine com o seu pedido.
      </p>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Enviando..." : "Publicar COMPRO"}
      </button>
    </form>
  );
}
