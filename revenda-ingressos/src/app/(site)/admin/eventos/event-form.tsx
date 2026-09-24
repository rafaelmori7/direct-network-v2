"use client";

import { useActionState } from "react";
import type { EventFormState } from "./actions";

export interface EventFormValues {
  nome: string;
  local: string;
  cidade: string;
  categoria: string;
  ticketeira: string;
  transferencia: string;
  inicio: string;
  fim: string;
  transferenciaAbre: string;
  transferenciaFecha: string;
  prazoVendedor: string;
  setores: string;
  esportivo: boolean;
  biometria: boolean;
  revendaOficial: boolean;
  cor: number;
  parceiro: string;
}

export function EventForm({
  action,
  values,
  categories,
  partners,
}: {
  action: (prev: EventFormState, form: FormData) => Promise<EventFormState>;
  values: EventFormValues;
  categories: readonly string[];
  partners: { id: string; name: string }[];
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
        <label htmlFor="nome">Nome do evento</label>
        <input id="nome" name="nome" className="input" defaultValue={values.nome} required />
      </div>
      <div className="row row-3">
        <div className="field">
          <label htmlFor="local">Local</label>
          <input id="local" name="local" className="input" defaultValue={values.local} required />
        </div>
        <div className="field">
          <label htmlFor="cidade">Cidade</label>
          <input id="cidade" name="cidade" className="input" defaultValue={values.cidade} required placeholder="São Paulo, SP" />
        </div>
        <div className="field">
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" className="select" defaultValue={values.categoria}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="inicio">Início (horário de Brasília)</label>
          <input id="inicio" name="inicio" type="datetime-local" className="input" defaultValue={values.inicio} required />
        </div>
        <div className="field">
          <label htmlFor="fim">Fim</label>
          <input id="fim" name="fim" type="datetime-local" className="input" defaultValue={values.fim} required />
        </div>
      </div>

      <h2 className="section-title" style={{ fontSize: "1.1rem", margin: "12px 0 0" }}>
        Ticketeira e transferência
      </h2>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="ticketeira">Ticketeira</label>
          <select id="ticketeira" name="ticketeira" className="select" defaultValue={values.ticketeira}>
            <option value="INGRESSE">Ingresse</option>
            <option value="SYMPLA">Sympla</option>
            <option value="TICKETMASTER">Ticketmaster (Quentro)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="transferencia">Transferência permitida?</label>
          <select id="transferencia" name="transferencia" className="select" defaultValue={values.transferencia}>
            <option value="SIM">Sim, confirmado</option>
            <option value="DESCONHECIDO">A confirmar (revenda bloqueada)</option>
            <option value="NAO">Não (revenda bloqueada)</option>
          </select>
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="transferenciaAbre">Transferência abre em (opcional)</label>
          <input id="transferenciaAbre" name="transferenciaAbre" type="datetime-local" className="input" defaultValue={values.transferenciaAbre} />
        </div>
        <div className="field">
          <label htmlFor="transferenciaFecha">Transferência fecha em (opcional)</label>
          <input id="transferenciaFecha" name="transferenciaFecha" type="datetime-local" className="input" defaultValue={values.transferenciaFecha} />
          <span className="hint">
            Preencha com a data informada pela ticketeira/produtor: ela vale sobre a regra geral (Ticketmaster fecha 7 dias
            antes, Sympla 24h antes). A venda fecha antes, deixando o prazo do vendedor de folga.
          </span>
        </div>
      </div>
      <div className="field">
        <label htmlFor="prazoVendedor">Prazo do vendedor para transferir (horas, opcional)</label>
        <input id="prazoVendedor" name="prazoVendedor" type="number" min={1} max={72} className="input" defaultValue={values.prazoVendedor} placeholder="Padrão da ticketeira (24h)" />
        <span className="hint">Encurtar o prazo permite vender até mais perto do fechamento da transferência.</span>
      </div>
      <label className="check">
        <input type="checkbox" name="esportivo" defaultChecked={values.esportivo} />
        <span>Evento esportivo (preço travado no valor de face — Lei 14.597/2023)</span>
      </label>
      <label className="check">
        <input type="checkbox" name="biometria" defaultChecked={values.biometria} />
        <span>Ingresso nominal com biometria/reconhecimento facial (revenda bloqueada)</span>
      </label>
      <label className="check">
        <input type="checkbox" name="revendaOficial" defaultChecked={values.revendaOficial} />
        <span>A ticketeira tem revenda oficial ligada para este evento (só informativo)</span>
      </label>

      {partners.length > 0 && (
      <div className="field">
        <label htmlFor="parceiro">Parceiro dono do evento (opcional)</label>
        <select id="parceiro" name="parceiro" className="select" defaultValue={values.parceiro}>
          <option value="">Nenhum (evento nosso)</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="hint">O parceiro ganha nas vendas do evento e ele aparece com selo de revenda oficial na página dele.</span>
      </div>
      )}
      <div className="field">
        <label htmlFor="setores">Setores e valores originais</label>
        <textarea id="setores" name="setores" className="input" style={{ height: 120, paddingTop: 10 }} defaultValue={values.setores} placeholder={"Pista; 420,00\nÁrea VIP; 950,00"} />
        <span className="hint">Um por linha: nome; valor.</span>
      </div>
      <div className="field">
        <label htmlFor="cor">Cor do cartaz (0–360)</label>
        <input id="cor" name="cor" type="range" min={0} max={360} defaultValue={values.cor} />
      </div>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Salvando..." : "Salvar evento"}
      </button>
    </form>
  );
}
