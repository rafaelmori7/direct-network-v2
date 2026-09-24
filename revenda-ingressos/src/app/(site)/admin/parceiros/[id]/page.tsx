import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { addPartnerMember, removePartnerMember, savePartner } from "../actions";
import { PartnerForm } from "../partner-form";

export default async function EditPartner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/parceiros/${id}`);
  const p = await prisma.partner.findUnique({
    where: { id },
    include: { members: { include: { user: { select: { name: true, email: true } } } } },
  });
  if (!p) notFound();
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
          participacao: String(p.commissionShareBps / 100),
          desconto: String(p.discountBps / 100),
          ativo: p.active,
        }}
      />
    </main>
  );
}
