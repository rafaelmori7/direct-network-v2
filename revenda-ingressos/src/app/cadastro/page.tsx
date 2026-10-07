import { SignUpForm } from "../auth-forms";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar = "/" } = await searchParams;
  return (
    <main className="form-page" style={{ maxWidth: 560 }}>
      <h1 className="page-title">Criar conta</h1>
      <p className="page-sub">Pedimos CPF e data de nascimento para proteger compradores e vendedores contra golpes.</p>
      <SignUpForm returnTo={voltar} />
    </main>
  );
}
