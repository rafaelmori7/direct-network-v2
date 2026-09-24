import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";

export const dynamic = "force-dynamic";

export default async function AdminDisputes() {
  await requireAdminPage("/admin/disputas");
  const [open, payoutsFailed] = await Promise.all([
    prisma.dispute.findMany({
      where: { resolvedAt: null },
      include: { order: { include: { listing: { include: { event: { select: { name: true } } } }, buyer: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { payoutStatus: "FALHOU" },
      include: { listing: { include: { event: { select: { name: true } } } } },
    }),
  ]);

  return (
    <main className="form-page" style={{ maxWidth: 900 }}>
      <Link href="/admin" className="back">
        ← Painel
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Disputas abertas
      </h1>
      <p className="page-sub">O dinheiro fica retido até a decisão. Leia a conversa e o histórico do pedido antes de decidir.</p>
      {open.length === 0 ? (
        <p className="empty">Nenhuma disputa aberta.</p>
      ) : (
        <div className="offers">
          {open.map((d) => (
            <Link key={d.id} href={`/pedidos/${d.orderId}`} className="offer">
              <div>
                <span className="type-badge">Aberta por {d.openedBy === "COMPRADOR" ? "comprador" : "vendedor"}</span>
                <h3 style={{ marginTop: 6 }}>
                  {d.order.listing.event.name} · {d.order.buyer.name}
                </h3>
                <div className="offer-sub">“{d.reason}”</div>
                <div className="offer-sub">Desde {formatDateTime(d.createdAt)}</div>
              </div>
              <div className="offer-side">
                <div className="offer-price">{formatBRL(d.order.totalCents)}</div>
                <span className="offer-sub">Decidir →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {payoutsFailed.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 32 }}>
            Liberações com falha
          </h2>
          <div className="offers">
            {payoutsFailed.map((o) => (
              <Link key={o.id} href={`/pedidos/${o.id}`} className="offer">
                <div>
                  <h3>{o.listing.event.name}</h3>
                  <div className="offer-sub">Erro: {o.payoutError}</div>
                </div>
                <div className="offer-price">{formatBRL(o.sellerNetCents)}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
