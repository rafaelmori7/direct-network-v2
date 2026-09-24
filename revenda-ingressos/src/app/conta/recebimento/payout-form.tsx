"use client";

import { useActionState } from "react";
import { createPayoutAccount, type PayoutFormState } from "./actions";

export function PayoutForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<PayoutFormState, FormData>(createPayoutAccount, { errors: [] });
  return (
    <form action={action} className="form">
      <input type="hidden" name="voltar" value={returnTo} />
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
          <label htmlFor="cep">CEP</label>
          <input id="cep" name="cep" className="input" inputMode="numeric" required placeholder="00000-000" />
        </div>
        <div className="field">
          <label htmlFor="bairro">Bairro</label>
          <input id="bairro" name="bairro" className="input" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="endereco">Endereço</label>
        <input id="endereco" name="endereco" className="input" required placeholder="Rua, avenida..." />
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
      <div className="field">
        <label htmlFor="renda">Renda mensal aproximada (R$)</label>
        <input id="renda" name="renda" className="input" inputMode="decimal" required placeholder="3.000,00" />
        <span className="hint">Exigida pelo Banco Central para abrir contas de pagamento. Não aparece para ninguém.</span>
      </div>
      <label className="check">
        <input type="checkbox" name="termos" />
        <span>
          Entendo que posso anunciar agora, mas só recebo depois que meus documentos forem aprovados, e sempre após o evento.
          O dinheiro cai numa conta de pagamento no meu CPF, de onde posso sacar por Pix.
        </span>
      </label>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Criando conta..." : "Criar conta de recebimento"}
      </button>
    </form>
  );
}
