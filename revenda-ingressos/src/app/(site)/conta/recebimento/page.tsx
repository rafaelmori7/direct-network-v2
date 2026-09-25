import Link from "next/link";
import { ShieldIcon } from "@/components/chrome";
import { requireUser } from "@/lib/auth/session";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { NEW_SELLER_MAX_ACTIVE_TICKETS } from "@/lib/rules/engine";
import { PayoutForm } from "./payout-form";

export const dynamic = "force-dynamic";

export default async function PayoutAccountPage({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar = "/conta/recebimento" } = await searchParams;
  const current = await requireUser("/conta/recebimento");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: current.id } });
  const provider = getPaymentProvider();

  // Busca o link de envio de documentos (o gateway só gera alguns segundos depois de criar a conta).
  let onboardingUrl = user.gatewayOnboardingUrl;
  if (user.gatewayAccountStatus === "EM_ANALISE" && !onboardingUrl && user.gatewayAccountId && user.gatewayWalletId) {
    try {
      onboardingUrl = await provider.getOnboardingUrl({
        accountId: user.gatewayAccountId,
        walletId: user.gatewayWalletId,
        apiKey: user.gatewayApiKeyEnc ? decrypt(user.gatewayApiKeyEnc) : null,
      });
      if (onboardingUrl) await prisma.user.update({ where: { id: user.id }, data: { gatewayOnboardingUrl: onboardingUrl } });
    } catch {
      onboardingUrl = null;
    }
  }

  return (
    <main className="form-page">
      <Link href="/conta" className="back">
        ← Minha conta
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Conta de recebimento
      </h1>

      {user.gatewayAccountStatus === "NENHUM" && (
        <>
          <p className="page-sub">
            Para anunciar, crie sua conta de recebimento. Leva 2 minutos. Você anuncia na hora e recebe depois da aprovação
            dos seus documentos, sempre após o evento, direto por Pix na chave CPF do seu cadastro (cadastre seu CPF como chave Pix no seu
            banco, se ainda não fez).
          </p>
          <PayoutForm returnTo={voltar} />
        </>
      )}

      {user.gatewayAccountStatus === "EM_ANALISE" && (
        <div className="form">
          <div className="notice notice-warn">
            <div>
              <b>Cadastro em análise: você já pode anunciar</b>
              Enquanto a análise não termina, você pode ter até {NEW_SELLER_MAX_ACTIVE_TICKETS} ingressos anunciados, e os
              pagamentos das suas vendas ficam guardados até a aprovação.
            </div>
          </div>
          {onboardingUrl ? (
            <a href={onboardingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
              Enviar documento e selfie
            </a>
          ) : (
            <p className="hint" style={{ margin: 0 }}>
              {provider.kind === "mock"
                ? "Modo de teste: a aprovação é feita pelo admin em Painel → Usuários."
                : "O link para enviar documento e selfie fica pronto em alguns segundos. Atualize a página."}
            </p>
          )}
          {voltar !== "/conta/recebimento" && (
            <Link href={voltar} className="btn btn-outline btn-block">
              Continuar anunciando
            </Link>
          )}
        </div>
      )}

      {user.gatewayAccountStatus === "APROVADA" && (
        <div className="notice notice-safe">
          <ShieldIcon />
          <div>
            <b>Conta aprovada</b>Seus pagamentos são liberados depois de cada evento, sem limite de anúncios de novato.
          </div>
        </div>
      )}

      {user.gatewayAccountStatus === "REPROVADA" && (
        <div className="notice notice-danger">
          <div>
            <b>Cadastro não aprovado</b>Não conseguimos confirmar seus documentos. Fale com o suporte para revisar.
          </div>
        </div>
      )}
    </main>
  );
}
