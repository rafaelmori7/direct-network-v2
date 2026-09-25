"use client";

import { useActionState } from "react";
import type { PartnerFormState } from "./actions";

export function PartnerPayoutAccountForm({ action }: { action: (prev: PartnerFormState, form: FormData) => Promise<PartnerFormState> }) {
  const [state, formAction, pending] = useActionState(action, { errors: [] });
  return (
    <form action={formAction} className="form">
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
      <div className="row row-2">
        <div className="field">
          <label htmlFor="razao">Razão social</label>
          <input id="razao" name="razao" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="cnpj">CNPJ</label>
          <input id="cnpj" name="cnpj" className="input" inputMode="numeric" required placeholder="00.000.000/0000-00" />
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="email">E-mail financeiro</label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="celular">Celular do responsável</label>
          <input id="celular" name="celular" className="input" inputMode="tel" required placeholder="(11) 90000-0000" />
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="tipo">Tipo de empresa</label>
          <select id="tipo" name="tipo" className="input" required defaultValue="">
            <option value="" disabled>
              Escolha
            </option>
            <option value="MEI">MEI</option>
            <option value="LIMITED">Limitada (Ltda.)</option>
            <option value="INDIVIDUAL">Individual (EI / SLU)</option>
            <option value="ASSOCIATION">Associação</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="faturamento">Faturamento mensal aproximado (R$)</label>
          <input id="faturamento" name="faturamento" className="input" inputMode="decimal" required placeholder="20.000,00" />
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="cep">CEP</label>
          <input id="cep" name="cep" className="input" inputMode="numeric" required />
        </div>
        <div className="field">
          <label htmlFor="bairro">Bairro</label>
          <input id="bairro" name="bairro" className="input" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="endereco">Endereço</label>
        <input id="endereco" name="endereco" className="input" required />
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="numero">Número</label>
          <input id="numero" name="numero" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="complemento">Complemento</label>
          <input id="complemento" name="complemento" className="input" />
        </div>
      </div>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Criando..." : "Criar conta de recebimento"}
      </button>
    </form>
  );
}
