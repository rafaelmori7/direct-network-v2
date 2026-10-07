"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "./auth-actions";

function Errors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="notice notice-danger" role="alert">
      <div>
        <b>Confira os dados</b>
        <ul className="errors">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SignInForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, { errors: [] });
  return (
    <form action={action} className="form">
      <input type="hidden" name="voltar" value={returnTo} />
      <Errors errors={state.errors} />
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" className="input" autoComplete="current-password" required />
      </div>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
      <p className="hint" style={{ margin: 0, textAlign: "center" }}>
        Não tem conta? <Link href={`/cadastro?voltar=${encodeURIComponent(returnTo)}`} style={{ color: "var(--brand)", fontWeight: 700 }}>Cadastre-se</Link>
      </p>
    </form>
  );
}

export function SignUpForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, { errors: [] });
  return (
    <form action={action} className="form">
      <input type="hidden" name="voltar" value={returnTo} />
      <Errors errors={state.errors} />
      <div className="field">
        <label htmlFor="nome">Nome completo</label>
        <input id="nome" name="nome" className="input" autoComplete="name" required />
        <span className="hint">Igual ao documento. É o nome usado nas transferências e no Pix.</span>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="cpf">CPF</label>
          <input id="cpf" name="cpf" className="input" inputMode="numeric" required placeholder="000.000.000-00" />
        </div>
        <div className="field">
          <label htmlFor="nascimento">Data de nascimento</label>
          <input id="nascimento" name="nascimento" type="date" className="input" required />
        </div>
      </div>
      <div className="row row-2">
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="telefone">Celular</label>
          <input id="telefone" name="telefone" className="input" inputMode="tel" autoComplete="tel" required placeholder="(11) 90000-0000" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" className="input" autoComplete="new-password" required minLength={8} />
      </div>
      <label className="check">
        <input type="checkbox" name="termos" />
        <span>
          Li e aceito os termos de uso. Pagamentos só pelo site, com Pix do meu próprio CPF; negociações por fora não têm
          garantia.
        </span>
      </label>
      <button className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Criando conta..." : "Criar conta"}
      </button>
      <p className="hint" style={{ margin: 0, textAlign: "center" }}>
        Já tem conta? <Link href={`/entrar?voltar=${encodeURIComponent(returnTo)}`} style={{ color: "var(--brand)", fontWeight: 700 }}>Entrar</Link>
      </p>
    </form>
  );
}
