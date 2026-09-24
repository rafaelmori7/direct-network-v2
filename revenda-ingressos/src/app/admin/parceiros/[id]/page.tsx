import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { savePartner } from "../actions";
import { PartnerForm } from "../partner-form";

export default async function EditPartner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/parceiros/${id}`);
  const p = await prisma.partner.findUnique({ where: { id } });
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
