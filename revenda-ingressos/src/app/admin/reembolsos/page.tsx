import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { retryRefund } from "./actions";

export const dynamic = "force-dynamic";

const LABEL = {
  SOLICITADO: "Enviado ao Asaas",
  AGUARDANDO_APROVACAO: "Aprovar no painel do Asaas",
  FALHOU: "Falhou",
} as const;

export default async function RefundsAdminPage() {
  const user = await requireUser("/admin/reembolsos");
  if (!user.isAdmin) notFound();

  const orders = await prisma.order.findMany({
    where: { refundStatus: { in: ["SOLICITADO", "AGUARDANDO_APROVACAO", "FALHOU"] } },
    include: { buyer: { select: { name: true } }, listing: { include: { event: { select: { name: true } } } } },
    orderBy: { refundUpdatedAt: "asc" },
  });

  return (
    <main className="form-page" style={{ maxWidth: 900 }}>
      <h1 className="page-title">Reembolsos pendentes</h1>
      <div className="notice notice-warn" style={{ marginBottom: 20 }}>
        <div>
          <b>Como aprovar</b>
          No painel do Asaas, aprove cada devolução pendente (ação crítica). A taxa do Pix já descontada sai do saldo da
          plataforma, então mantenha saldo suficiente. Quando o Asaas confirma a devolução, o pedido sai desta lista sozinho.
        </div>
      </div>
      {orders.length === 0 ? (
        <p className="empty">Nenhum reembolso pendente.</p>
      ) : (
        <div className="offers">
          {orders.map((o) => (
            <article className="offer" key={o.id}>
              <div>
                <span className="type-badge">{LABEL[o.refundStatus as keyof typeof LABEL]}</span>
                <h3 style={{ marginTop: 6 }}>
                  {o.listing.event.name} · {o.buyer.name}
                </h3>
                <div className="offer-sub">
                  Cobrança {o.chargeId} · desde {o.refundUpdatedAt ? formatDateTime(o.refundUpdatedAt) : "—"}
                </div>
                {o.refundError && <div className="offer-sub">Erro: {o.refundError}</div>}
              </div>
              <div className="offer-side">
                <div className="offer-price">{formatBRL(o.totalCents)}</div>
                {o.refundStatus === "FALHOU" && (
                  <form action={retryRefund.bind(null, o.id)}>
                    <button className="btn btn-primary">Tentar de novo</button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
