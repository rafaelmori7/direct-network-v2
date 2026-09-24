import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPage("/admin/pedidos");
  const { q = "" } = await searchParams;
  const term = q.trim();
  const digits = term.replace(/\D/g, "");
  const where: Prisma.OrderWhereInput = term
    ? {
        OR: [
          { id: term },
          { chargeId: term },
          { buyer: { email: { contains: term, mode: "insensitive" } } },
          { listing: { seller: { email: { contains: term, mode: "insensitive" } } } },
          { listing: { event: { name: { contains: term, mode: "insensitive" } } } },
          ...(digits.length === 11 ? [{ buyer: { cpf: digits } }, { listing: { seller: { cpf: digits } } }] : []),
        ],
      }
    : {};
  const orders = await prisma.order.findMany({
    where,
    include: {
      buyer: { select: { name: true } },
      listing: { include: { event: { select: { name: true } }, seller: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="form-page" style={{ maxWidth: 960 }}>
      <Link href="/admin" className="back">
        ← Painel
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Pedidos
      </h1>
      <form className="search" action="/admin/pedidos" role="search" style={{ marginBottom: 16 }}>
        <input name="q" defaultValue={q} placeholder="Nº do pedido, cobrança (pay_...), e-mail, CPF ou evento" aria-label="Buscar pedidos" />
      </form>
      <div className="offers">
        {orders.length === 0 && <p className="empty">Nenhum pedido encontrado.</p>}
        {orders.map((o) => (
          <Link key={o.id} href={`/pedidos/${o.id}`} className="offer">
            <div>
              <div className="tag-row">
                <span className="type-badge">{o.status}</span>
                {o.refundStatus !== "NENHUM" && <span className="type-badge">Reembolso: {o.refundStatus}</span>}
                {o.payoutStatus !== "NENHUM" && <span className="type-badge">Liberação: {o.payoutStatus}</span>}
              </div>
              <h3 style={{ marginTop: 6 }}>{o.listing.event.name}</h3>
              <div className="offer-sub">
                {o.buyer.name} comprou de {o.listing.seller.name} · {formatDateTime(o.createdAt)} · {o.chargeId ?? "sem cobrança"}
              </div>
            </div>
            <div className="offer-price">{formatBRL(o.totalCents)}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
