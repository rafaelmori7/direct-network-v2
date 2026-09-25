import Link from "next/link";
import { requirePartnerPage } from "@/lib/auth/admin";
import { formatCnpj } from "@/lib/auth/cpf";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { widgetSnippet } from "@/lib/partners/widget";
import { updateBranding } from "./actions";
import { CopyCode } from "./copy-code";

export const dynamic = "force-dynamic";

const COUNTED = ["PAGO", "TRANSFERIDO", "RECEBIDO", "EM_DISPUTA", "LIBERADO"] as const;
const STATUS = {
  PAGO: "Pago",
  TRANSFERIDO: "Transferido",
  RECEBIDO: "Recebido",
  EM_DISPUTA: "Em disputa",
  LIBERADO: "Concluído",
  REEMBOLSADO: "Devolvido",
  CANCELADO: "Cancelado",
  AGUARDANDO_PAGAMENTO: "Aguardando Pix",
} as const;
const ORIGIN = { LINK: "Link/página", CUPOM: "Cupom", EVENTO: "Evento seu" } as const;

export default async function PartnerDashboard() {
  const user = await requirePartnerPage("/parceiro");
  const partner = await prisma.partner.findUniqueOrThrow({ where: { id: user.partner.id } });
  const [pending, released, orders, events] = await Promise.all([
    prisma.order.aggregate({
      where: { partnerId: partner.id, status: { in: ["PAGO", "TRANSFERIDO", "RECEBIDO", "EM_DISPUTA"] } },
      _count: { _all: true },
      _sum: { partnerFeeCents: true, totalCents: true },
    }),
    prisma.order.aggregate({ where: { partnerId: partner.id, status: "LIBERADO" }, _count: { _all: true }, _sum: { partnerFeeCents: true, totalCents: true } }),
    prisma.order.findMany({
      where: { partnerId: partner.id, status: { in: [...COUNTED, "REEMBOLSADO"] } },
      include: { listing: { include: { event: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.event.findMany({ where: { partnerId: partner.id }, orderBy: { startsAt: "desc" } }),
  ]);
  const site = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const sales = (pending._count._all ?? 0) + (released._count._all ?? 0);

  return (
    <main className="container" style={{ paddingBottom: 64, maxWidth: 1000 }}>
      <h1 className="page-title">{partner.name}</h1>
      <p className="page-sub">Painel da agência: seus links, suas vendas e seus eventos.</p>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", paddingBottom: 16 }}>
        <div className="aside-card" style={{ padding: 18 }}>
          <div className="offer-sub">Vendas indicadas</div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>{sales}</div>
          <div className="offer-sub">{formatBRL((pending._sum.totalCents ?? 0) + (released._sum.totalCents ?? 0))} vendidos</div>
        </div>
        <div className="aside-card" style={{ padding: 18, marginTop: 0 }}>
          <div className="offer-sub">Comissão a liberar</div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>{formatBRL(pending._sum.partnerFeeCents ?? 0)}</div>
          <div className="offer-sub">Libera junto com o vendedor, após o evento</div>
        </div>
        <div className="aside-card" style={{ padding: 18, marginTop: 0 }}>
          <div className="offer-sub">Comissão liberada</div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>{formatBRL(released._sum.partnerFeeCents ?? 0)}</div>
          <div className="offer-sub">
            {partner.gatewayApiKeyEnc || (partner.gatewayAccountId && partner.cnpj)
              ? `Por Pix automático no CNPJ ${formatCnpj(partner.cnpj ?? "")}`
              : partner.gatewayWalletId
                ? "Na sua conta Asaas"
                : "Repasse feito pela plataforma"}
          </div>
        </div>
      </div>

      <div className="aside-card">
        <div className="aside-head">Divulgue e ganhe {partner.commissionShareBps / 100}% da receita de cada venda</div>
        <div className="aside-body summary">
          <div className="summary-row">
            <span className="offer-sub">Sua página (todos os eventos)</span>
            <Link href={`/${partner.slug}`} style={{ color: "var(--brand)", fontWeight: 700 }}>
              {site}/{partner.slug}
            </Link>
          </div>
          <div className="summary-row">
            <span className="offer-sub">Link de um evento específico</span>
            <span>
              link do evento + <b>?ref={partner.slug}</b>
            </span>
          </div>
          <div className="summary-row">
            <span className="offer-sub">Cupom</span>
            <span>
              <b>{partner.couponCode}</b>
              {partner.discountBps > 0 && ` · ${partner.discountBps / 100}% de desconto para o comprador`}
            </span>
          </div>
          <p className="hint" style={{ margin: "6px 0 0" }}>
            Vale para qualquer evento do site. Nos seus próprios eventos você ganha mesmo quando o comprador não usa seu link.
          </p>
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 32 }}>
        Widget para o seu site
      </h2>
      <p className="page-sub" style={{ marginBottom: 12 }}>
        Cole este código no site da agência, onde a revenda deve aparecer. Os ingressos abrem no nosso site, em outra aba, já com a sua
        indicação, então a comissão é sua.
      </p>
      <div className="form" style={{ maxWidth: "none" }}>
        <CopyCode code={widgetSnippet(site, partner.slug)} />
        <p className="hint" style={{ margin: 0 }}>
          Opções: <b>data-eventos=&quot;proprios&quot;</b> mostra só os seus eventos; <b>data-tema=&quot;claro&quot;</b> ou <b>&quot;escuro&quot;</b> fixa as cores;{" "}
          <b>data-limite=&quot;8&quot;</b> define quantos eventos aparecem.
        </p>
        <iframe src={`/embed/${partner.slug}?limite=4`} className="widget-preview" title="Prévia do widget" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Seus eventos
        </h2>
        <Link href="/parceiro/eventos/novo" className="btn btn-primary">
          Cadastrar evento
        </Link>
      </div>
      <div className="offers" style={{ marginTop: 12 }}>
        {events.length === 0 && <p className="empty">Cadastre seus eventos para aparecerem com o selo de revenda oficial.</p>}
        {events.map((e) => (
          <Link key={e.id} href={`/parceiro/eventos/${e.id}`} className="offer">
            <div>
              <h3>{e.name}</h3>
              <div className="offer-sub">
                {formatDateTime(e.startsAt)} · {e.venue}
                {e.transferAllowed !== "SIM" && " · transferência não confirmada (revenda bloqueada)"}
              </div>
            </div>
            <span className="offer-sub">Editar →</span>
          </Link>
        ))}
      </div>

      <h2 className="section-title" style={{ marginTop: 32 }}>
        Últimas vendas
      </h2>
      <div className="offers">
        {orders.length === 0 && <p className="empty">Nenhuma venda indicada ainda.</p>}
        {orders.map((o) => (
          <div key={o.id} className="offer">
            <div>
              <div className="tag-row">
                <span className="type-badge">{STATUS[o.status]}</span>
                <span className="type-badge">{ORIGIN[o.partnerAttribution as keyof typeof ORIGIN] ?? "—"}</span>
              </div>
              <h3 style={{ marginTop: 6 }}>{o.listing.event.name}</h3>
              <div className="offer-sub">
                {formatDateTime(o.createdAt)} · {o.quantity}× {o.listing.sector} · {formatBRL(o.totalCents)}
              </div>
            </div>
            <div className="offer-side">
              <div className="offer-price">{o.status === "REEMBOLSADO" ? formatBRL(0) : formatBRL(o.partnerFeeCents)}</div>
              <span className="offer-sub">sua comissão</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title" style={{ marginTop: 32 }}>
        Sua página
      </h2>
      <form action={updateBranding} className="form" style={{ maxWidth: 560 }}>
        <div className="row row-2">
          <div className="field">
            <label htmlFor="cor">Cor</label>
            <input id="cor" name="cor" type="color" className="input" defaultValue={partner.color} style={{ padding: 4 }} />
          </div>
          <div className="field">
            <label htmlFor="logo">Logo (link https)</label>
            <input id="logo" name="logo" className="input" defaultValue={partner.logoUrl ?? ""} />
          </div>
        </div>
        <button className="btn btn-outline">Salvar aparência</button>
      </form>
    </main>
  );
}
