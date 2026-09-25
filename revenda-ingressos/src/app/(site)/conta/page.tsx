import Link from "next/link";
import { setWhatsAppOptIn } from "@/app/auth-actions";
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

  const [contact, withdrawals] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { phone: true, whatsappOptIn: true } }),
    prisma.sellerWithdrawal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <main className="form-page">
      <h1 className="page-title">Minha conta</h1>
      <p className="page-sub">
        {user.name} · CPF {formatCpf(user.cpf)} · {user.email}
      </p>

      {user.payoutApproved ? (
        <div className="notice notice-safe">
          <div>
            <b>Conta de recebimento aprovada</b>Depois de cada evento, o dinheiro das suas vendas vai automaticamente por Pix para a chave
            CPF {formatCpf(user.cpf)}. Confira se o seu CPF está cadastrado como chave Pix no seu banco.
          </div>
        </div>
      ) : user.hasPayoutAccount ? (
        <div className="notice notice-warn">
          <div>
            <b>Conta de recebimento em análise</b>
            Você já pode anunciar. Os pagamentos ficam guardados até a aprovação. <Link href="/conta/recebimento">Ver cadastro</Link>
          </div>
        </div>
      ) : (
        <div className="notice notice-warn">
          <div>
            <b>Quer vender?</b>
            Crie sua conta de recebimento (2 minutos) e anuncie na hora. <Link href="/conta/recebimento">Criar agora</Link>
          </div>
        </div>
      )}

      <form action={setWhatsAppOptIn.bind(null, !contact.whatsappOptIn)} className="notice" style={{ alignItems: "center", marginTop: 12, background: "var(--surface)", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <b>Avisos pelo WhatsApp: {contact.whatsappOptIn ? "ligados" : "desligados"}</b>
          Venda, transferência, prazos e pagamentos no celular {formatPhone(contact.phone)}. Os e-mails continuam chegando.
        </div>
        <button className="btn btn-outline">{contact.whatsappOptIn ? "Desligar" : "Ligar"}</button>
      </form>

      {withdrawals.length > 0 && (
        <Section title="Pix recebidos" empty="">
          {withdrawals.map((w) => (
            <div key={w.id} className="offer">
              <div>
                <span className="type-badge">{WITHDRAWAL_STATUS[w.status]}</span>
                <div className="offer-sub" style={{ marginTop: 6 }}>
                  {formatDateTime(w.createdAt)} · chave CPF
                  {w.status === "FALHOU" && " · confira se o seu CPF é chave Pix no seu banco; tentamos de novo em 24h"}
                </div>
              </div>
              <div className="offer-price">{formatBRL(w.cents)}</div>
            </div>
          ))}
        </Section>
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

const WITHDRAWAL_STATUS = { SOLICITADO: "Enviando", AGUARDANDO_APROVACAO: "Enviando", CONCLUIDO: "Pix enviado", FALHOU: "Não enviado" } as const;

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

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, -4)}-${d.slice(-4)}` : phone;
}
