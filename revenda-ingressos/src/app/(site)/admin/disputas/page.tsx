import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { retryPayout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDisputes() {
  await requireAdminPage("/admin/disputas");
  const [open, payoutsFailed, payoutsAwaiting] = await Promise.all([
    prisma.dispute.findMany({
      where: { resolvedAt: null },
      include: { order: { include: { listing: { include: { event: { select: { name: true } } } }, buyer: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { payoutStatus: "FALHOU" },
      include: { listing: { include: { event: { select: { name: true } } } } },
    }),
    prisma.order.findMany({
      where: { payoutStatus: "AGUARDANDO_APROVACAO" },
      include: { listing: { include: { event: { select: { name: true } } } } },
      orderBy: { payoutUpdatedAt: "asc" },
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
          <p className="page-sub">
            Confira o erro e o saldo no Asaas antes de tentar de novo. Só são refeitas as transferências que ainda não
            saíram, então o vendedor e o parceiro não recebem duas vezes.
          </p>
          <div className="offers">
            {payoutsFailed.map((o) => (
              <article key={o.id} className="offer">
                <div>
                  <h3>
                    <Link href={`/pedidos/${o.id}`}>{o.listing.event.name}</Link>
                  </h3>
                  <div className="offer-sub">Erro: {o.payoutError}</div>
                  <div className="offer-sub">Desde {o.payoutUpdatedAt ? formatDateTime(o.payoutUpdatedAt) : "—"}</div>
                </div>
                <div className="offer-side">
                  <div className="offer-price">{formatBRL(o.sellerNetCents)}</div>
                  <form action={retryPayout.bind(null, o.id)}>
                    <button className="btn btn-primary">Tentar de novo</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {payoutsAwaiting.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 32 }}>
            Repasses para aprovar no Asaas
          </h2>
          <p className="page-sub">
            Autorize as transferências pendentes no painel do Asaas (ação crítica). O valor já saiu do saldo da plataforma;
            quando o Asaas conclui, o pedido sai desta lista sozinho.
          </p>
          <div className="offers">
            {payoutsAwaiting.map((o) => (
              <Link key={o.id} href={`/pedidos/${o.id}`} className="offer">
                <div>
                  <h3>{o.listing.event.name}</h3>
                  <div className="offer-sub">
                    Transferências {[o.sellerTransferId, o.partnerTransferId].filter(Boolean).join(", ")} · desde{" "}
                    {o.payoutUpdatedAt ? formatDateTime(o.payoutUpdatedAt) : "—"}
                  </div>
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
