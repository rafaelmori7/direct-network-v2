"use client";

import { useActionState } from "react";
import type { PartnerFormState } from "./actions";

export interface PartnerFormValues {
  nome: string;
  slug: string;
  cupom: string;
  cor: string;
  logo: string;
  wallet: string;
  /** Conta de recebimento criada por nós: a carteira não se edita à mão. */
  walletLocked?: boolean;
  participacao: string;
  desconto: string;
  ativo: boolean;
}

export function PartnerForm({
  action,
  values,
  siteUrl,
}: {
  action: (prev: PartnerFormState, form: FormData) => Promise<PartnerFormState>;
  values: PartnerFormValues;
  siteUrl: string;
}) {
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
      <div className="field">
        <label htmlFor="nome">Nome do parceiro</label>
        <input id="nome" name="nome" className="input" defaultValue={values.nome} required placeholder="Timelapse" />
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="slug">Endereço da página</label>
          <input id="slug" name="slug" className="input" defaultValue={values.slug} required placeholder="timelapse" />
          <span className="hint">{siteUrl}/<b>{values.slug || "timelapse"}</b></span>
        </div>
        <div className="field">
          <label htmlFor="cupom">Cupom</label>
          <input id="cupom" name="cupom" className="input" defaultValue={values.cupom} required placeholder="TIMELAPSE" style={{ textTransform: "uppercase" }} />
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="participacao">Participação na comissão (%)</label>
          <input id="participacao" name="participacao" className="input" inputMode="decimal" defaultValue={values.participacao} required />
          <span className="hint">50 = metade da comissão para o parceiro.</span>
        </div>
        <div className="field">
          <label htmlFor="desconto">Desconto do cupom/link para o comprador (%)</label>
          <input id="desconto" name="desconto" className="input" inputMode="decimal" defaultValue={values.desconto} required />
          <span className="hint">
            Sobre o total (ingresso + taxa). Sai da taxa do site antes da divisão, nunca do vendedor; se passar da taxa, fica
            limitado a ela. 0 = sem desconto.
          </span>
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="cor">Cor da página</label>
          <input id="cor" name="cor" type="color" className="input" defaultValue={values.cor} style={{ padding: 4 }} />
        </div>
        <div className="field">
          <label htmlFor="logo">Logo (link https, opcional)</label>
          <input id="logo" name="logo" className="input" defaultValue={values.logo} />
        </div>
      </div>
      {!values.walletLocked && (
        <div className="field">
          <label htmlFor="wallet">Conta Asaas própria da agência (walletId, opcional)</label>
          <input id="wallet" name="wallet" className="input" defaultValue={values.wallet} />
          <span className="hint">
            Só se a agência já tem conta no Asaas: a comissão cai direto nela. Se não tem, crie a conta de recebimento acima (Pix
            automático para o CNPJ). Sem nenhuma das duas, a comissão fica com vocês para repasse manual.
          </span>
        </div>
      )}
      <label className="check">
        <input type="checkbox" name="ativo" defaultChecked={values.ativo} />
        <span>Parceiro ativo (página no ar e link/cupom valendo)</span>
      </label>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Salvando..." : "Salvar parceiro"}
      </button>
    </form>
  );
}
