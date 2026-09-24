import { SignInForm } from "@/app/auth-forms";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar = "/" } = await searchParams;
  return (
    <main className="form-page" style={{ maxWidth: 440 }}>
      <h1 className="page-title">Entrar</h1>
      <SignInForm returnTo={voltar} />
    </main>
  );
}
