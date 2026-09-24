import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money/fees";

export const dynamic = "force-dynamic";

// Vendas que contam para o parceiro: pagas e não devolvidas.
const COUNTED = ["PAGO", "TRANSFERIDO", "RECEBIDO", "EM_DISPUTA", "LIBERADO"] as const;

export default async function AdminPartners() {
  await requireAdminPage("/admin/parceiros");
  const [partners, stats] = await Promise.all([
    prisma.partner.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { events: true } } } }),
    prisma.order.groupBy({
      by: ["partnerId"],
      where: { partnerId: { not: null }, status: { in: [...COUNTED] } },
      _count: { _all: true },
      _sum: { totalCents: true, partnerFeeCents: true },
    }),
  ]);
  const byPartner = new Map(stats.map((s) => [s.partnerId, s]));
  const site = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return (
    <main className="form-page" style={{ maxWidth: 960 }}>
      <Link href="/admin" className="back">
        ← Painel
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Parceiros
        </h1>
        <Link href="/admin/parceiros/novo" className="btn btn-primary">
          Novo parceiro
        </Link>
      </div>
      <div className="offers" style={{ marginTop: 20 }}>
        {partners.length === 0 && <p className="empty">Nenhum parceiro ainda.</p>}
        {partners.map((p) => {
          const s = byPartner.get(p.id);
          return (
            <Link key={p.id} href={`/admin/parceiros/${p.id}`} className="offer">
              <div>
                <div className="tag-row">
                  <span className="type-badge">{p.active ? "Ativo" : "Inativo"}</span>
                  <span className="type-badge">Cupom {p.couponCode}</span>
                  {!p.gatewayWalletId && <span className="type-badge">Repasse manual</span>}
                </div>
                <h3 style={{ marginTop: 6 }}>{p.name}</h3>
                <div className="offer-sub">
                  {site}/{p.slug} · {p.commissionShareBps / 100}% da comissão · desconto {p.discountBps / 100}% · {p._count.events} eventos próprios
                </div>
                <div className="offer-sub">
                  {s?._count._all ?? 0} vendas · {formatBRL(s?._sum.totalCents ?? 0)} vendidos
                </div>
              </div>
              <div className="offer-side">
                <div className="offer-price">{formatBRL(s?._sum.partnerFeeCents ?? 0)}</div>
                <span className="offer-sub">comissão do parceiro</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
