import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { formatCnpj } from "@/lib/auth/cpf";
import { formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { decrypt } from "@/lib/crypto";
import { getPaymentProvider } from "@/lib/payments";
import { addPartnerMember, approvePartnerPayoutAccount, createPartnerPayoutAccount, removePartnerMember, savePartner } from "../actions";
import { PartnerForm } from "../partner-form";
import { PartnerPayoutAccountForm } from "../payout-account-form";

const ACCOUNT_STATUS = { NENHUM: "Sem conta", EM_ANALISE: "Em análise", APROVADA: "Aprovada", REPROVADA: "Reprovada" } as const;
const WITHDRAWAL_STATUS = { SOLICITADO: "Enviando", AGUARDANDO_APROVACAO: "Aguardando autorização", CONCLUIDO: "Pix enviado", FALHOU: "Não enviado" } as const;

/** Link para a agência enviar os documentos da conta (só com a chave da subconta). */
async function onboardingUrl(p: { gatewayAccountId: string | null; gatewayWalletId: string | null; gatewayApiKeyEnc: string | null }) {
  if (!p.gatewayAccountId || !p.gatewayWalletId || !p.gatewayApiKeyEnc) return null;
  try {
    return await getPaymentProvider().getOnboardingUrl({ accountId: p.gatewayAccountId, walletId: p.gatewayWalletId, apiKey: decrypt(p.gatewayApiKeyEnc) });
  } catch {
    return null;
  }
}

export default async function EditPartner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/parceiros/${id}`);
  const p = await prisma.partner.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { name: true, email: true } } } },
      withdrawals: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!p) notFound();
  const docsUrl = p.gatewayAccountStatus === "EM_ANALISE" ? await onboardingUrl(p) : null;
  const site = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return (
    <main className="form-page">
      <Link href="/admin/parceiros" className="back">
        ← Parceiros
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        {p.name}
      </h1>
      <div className="aside-card" style={{ marginBottom: 20 }}>
        <div className="aside-head">Links para divulgar</div>
        <div className="aside-body summary">
          <div className="summary-row">
            <span className="offer-sub">Página do parceiro</span>
            <Link href={`/${p.slug}`} style={{ color: "var(--brand)", fontWeight: 700 }}>
              {site}/{p.slug}
            </Link>
          </div>
          <div className="summary-row">
            <span className="offer-sub">Link de qualquer evento</span>
            <span>adicione <b>?ref={p.slug}</b> ao fim do link</span>
          </div>
          <div className="summary-row">
            <span className="offer-sub">Cupom no checkout</span>
            <b>{p.couponCode}</b>
          </div>
        </div>
      </div>
      <div className="aside-card" style={{ marginBottom: 20 }}>
        <div className="aside-head">Acesso ao painel da agência (/parceiro)</div>
        <div className="aside-body">
          {p.members.length === 0 && <p className="offer-sub" style={{ marginTop: 0 }}>Ninguém tem acesso ainda.</p>}
          {p.members.map((m) => (
            <div className="wanted-item" key={m.id}>
              <span>
                {m.user.name} · {m.user.email}
              </span>
              <form action={removePartnerMember.bind(null, p.id, m.id)}>
                <button className="header-link header-link-button">Remover</button>
              </form>
            </div>
          ))}
          <form action={addPartnerMember.bind(null, p.id)} style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input name="email" type="email" className="input" placeholder="E-mail de quem já tem conta no site" required />
            <button className="btn btn-primary">Dar acesso</button>
          </form>
        </div>
      </div>
      <div className="aside-card" style={{ marginBottom: 20 }}>
        <div className="aside-head">Conta de recebimento (Pix automático para o CNPJ)</div>
        <div className="aside-body">
          {p.gatewayAccountId ? (
            <>
              <div className="summary">
                <div className="summary-row">
                  <span className="offer-sub">Situação</span>
                  <b>{ACCOUNT_STATUS[p.gatewayAccountStatus]}</b>
                </div>
                <div className="summary-row">
                  <span className="offer-sub">Pix automático para</span>
                  <span>CNPJ {formatCnpj(p.cnpj ?? "")} · avisos em {p.payoutEmail}</span>
                </div>
              </div>
              {p.gatewayAccountStatus === "EM_ANALISE" && (
                <p className="hint" style={{ margin: "10px 0 0" }}>
                  {docsUrl ? (
                    <>
                      Envie este link para a agência mandar os documentos:{" "}
                      <a href={docsUrl} target="_blank" rel="noopener" style={{ color: "var(--brand)", fontWeight: 700 }}>
                        abrir envio de documentos
                      </a>
                      .{" "}
                    </>
                  ) : (
                    "O Asaas avisa quando a análise terminar. "
                  )}
                  Enquanto isso, a comissão fica esperando e é repassada depois da aprovação.
                </p>
              )}
              {p.gatewayAccountStatus !== "APROVADA" && (
                <form action={approvePartnerPayoutAccount.bind(null, p.id)} style={{ marginTop: 10 }}>
                  <button className="btn btn-outline">Marcar como aprovada (manual)</button>
                </form>
              )}
              {p.withdrawals.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {p.withdrawals.map((w) => (
                    <div className="wanted-item" key={w.id}>
                      <span>
                        {WITHDRAWAL_STATUS[w.status]} · {formatBRL(w.cents)}
                        {w.error && <span className="offer-sub"> · {w.error}</span>}
                      </span>
                      <span className="offer-sub">{formatDateTime(w.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="offer-sub" style={{ marginTop: 0 }}>
                Para agências sem conta no Asaas. A comissão cai nesta conta depois de cada evento e sai sozinha por Pix para a chave CNPJ
                da agência.
              </p>
              <PartnerPayoutAccountForm action={createPartnerPayoutAccount.bind(null, p.id)} />
            </>
          )}
        </div>
      </div>
      <PartnerForm
        action={savePartner.bind(null, p.id)}
        siteUrl={site}
        values={{
          nome: p.name,
          slug: p.slug,
          cupom: p.couponCode,
          cor: p.color,
          logo: p.logoUrl ?? "",
          wallet: p.gatewayWalletId ?? "",
          walletLocked: Boolean(p.gatewayAccountId),
          participacao: String(p.commissionShareBps / 100),
          desconto: String(p.discountBps / 100),
          ativo: p.active,
        }}
      />
    </main>
  );
}
