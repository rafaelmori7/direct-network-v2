import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdminPage("/admin");
  const [events, unknownTransfer, disputes, refunds, payoutsFailed] = await Promise.all([
    prisma.event.count({ where: { endsAt: { gt: new Date() } } }),
    prisma.event.count({ where: { endsAt: { gt: new Date() }, transferAllowed: "DESCONHECIDO" } }),
    prisma.order.count({ where: { status: "EM_DISPUTA" } }),
    prisma.order.count({ where: { refundStatus: { in: ["SOLICITADO", "AGUARDANDO_APROVACAO", "FALHOU"] } } }),
    prisma.order.count({ where: { payoutStatus: "FALHOU" } }),
  ]);
  const cards = [
    { href: "/admin/eventos", title: "Eventos", value: events, note: unknownTransfer ? `${unknownTransfer} com transferência a confirmar` : "Todos confirmados" },
    { href: "/admin/disputas", title: "Disputas abertas", value: disputes, note: "Decida entre comprador e vendedor" },
    { href: "/admin/reembolsos", title: "Reembolsos pendentes", value: refunds, note: "Aprovar no painel do Asaas" },
    { href: "/admin/disputas", title: "Liberações com falha", value: payoutsFailed, note: "Conferir no Asaas" },
  ];
  return (
    <main className="container" style={{ paddingBottom: 64 }}>
      <h1 className="page-title">Painel</h1>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="aside-card" style={{ padding: 18, marginTop: 0 }}>
            <div className="offer-sub">{c.title}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900 }}>{c.value}</div>
            <div className="offer-sub">{c.note}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
