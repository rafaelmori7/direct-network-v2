import Link from "next/link";
import { formatCpf } from "@/lib/auth/cpf";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { TICKET_TYPE_LABEL, formatDateLong, formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/conta");
  const [purchases, sales, listings] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: { listing: { include: { event: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { listing: { sellerId: user.id }, status: { not: "CANCELADO" } },
      include: { listing: { include: { event: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.findMany({
      where: { sellerId: user.id, status: { in: ["ATIVO", "PAUSADO"] } },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="form-page">
      <h1 className="page-title">Minha conta</h1>
      <p className="page-sub">
        {user.name} · CPF {formatCpf(user.cpf)} · {user.email}
      </p>

      {user.canSell ? (
        <div className="notice notice-safe">
          <div>
            <b>Identidade verificada</b>Você pode comprar e vender.
          </div>
        </div>
      ) : (
        <div className="notice notice-warn">
          <div>
            <b>Verificação para vender: pendente</b>
            Você já pode comprar. Para anunciar, vamos conferir sua identidade (documento e selfie) e cadastrar sua conta
            de recebimento no seu CPF.
          </div>
        </div>
      )}

      <Section title="Minhas compras" empty="Você ainda não comprou nada.">
        {purchases.map((o) => (
          <OrderRow key={o.id} id={o.id} title={o.listing.event.name} sub={`${o.quantity}× ${o.listing.sector}`} value={o.totalCents} status={o.status} />
        ))}
      </Section>

      <Section title="Minhas vendas" empty="Nenhuma venda ainda.">
        {sales.map((o) => (
          <OrderRow key={o.id} id={o.id} title={o.listing.event.name} sub={`${o.quantity}× ${o.listing.sector} · libera ${formatDateTime(o.releaseAt)}`} value={o.sellerNetCents} status={o.status} />
        ))}
      </Section>

      <Section title="Meus anúncios" empty="Nenhum anúncio ativo.">
        {listings.map((l) => (
          <Link key={l.id} href={`/evento/${l.event.slug}`} className="offer">
            <div>
              <h3>{l.event.name}</h3>
              <div className="offer-sub">
                {l.sector} · {TICKET_TYPE_LABEL[l.ticketType]} · {l.quantityAvailable} de {l.quantity} disponíveis ·{" "}
                {formatDateLong(l.event.startsAt)}
              </div>
            </div>
            <div className="offer-side">
              <div className="offer-price">{formatBRL(l.priceCents)}</div>
              {l.status === "PAUSADO" && <span className="type-badge">Pausado</span>}
            </div>
          </Link>
        ))}
      </Section>
    </main>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 className="section-title">{title}</h2>
      {children.length === 0 ? <p className="empty">{empty}</p> : <div className="offers">{children}</div>}
    </section>
  );
}

const STATUS_SHORT: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando Pix",
  PAGO: "Aguardando transferência",
  TRANSFERIDO: "Transferido",
  RECEBIDO: "Recebido",
  EM_DISPUTA: "Em disputa",
  LIBERADO: "Concluído",
  REEMBOLSADO: "Reembolsado",
  CANCELADO: "Cancelado",
};

function OrderRow({ id, title, sub, value, status }: { id: string; title: string; sub: string; value: number; status: string }) {
  return (
    <Link href={`/pedidos/${id}`} className="offer">
      <div>
        <span className="type-badge">{STATUS_SHORT[status]}</span>
        <h3 style={{ marginTop: 6 }}>{title}</h3>
        <div className="offer-sub">{sub}</div>
      </div>
      <div className="offer-price">{formatBRL(value)}</div>
    </Link>
  );
}
