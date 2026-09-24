import type { ListingStatus } from "@prisma/client";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { TICKET_TYPE_LABEL, formatDateTime } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";
import { setListingStatus } from "./actions";

export const dynamic = "force-dynamic";

const TABS: [ListingStatus, string][] = [
  ["PAUSADO", "Pausados"],
  ["ATIVO", "Ativos"],
  ["ENCERRADO", "Encerrados"],
  ["REMOVIDO", "Removidos"],
];

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminPage("/admin/anuncios");
  const { status: raw = "PAUSADO" } = await searchParams;
  const status = (TABS.find(([s]) => s === raw)?.[0] ?? "PAUSADO") as ListingStatus;
  const listings = await prisma.listing.findMany({
    where: { status },
    include: { event: { select: { name: true, slug: true } }, seller: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="form-page" style={{ maxWidth: 960 }}>
      <Link href="/admin" className="back">
        ← Painel
      </Link>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        Anúncios
      </h1>
      <p className="page-sub">Anúncios são pausados sozinhos quando o vendedor perde o prazo de transferência ou é bloqueado.</p>
      <nav className="chips">
        {TABS.map(([s, label]) => (
          <Link key={s} href={`/admin/anuncios?status=${s}`} className={`chip ${s === status ? "chip-active" : ""}`}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="offers">
        {listings.length === 0 && <p className="empty">Nenhum anúncio aqui.</p>}
        {listings.map((l) => (
          <article className="offer" key={l.id}>
            <div>
              <h3>
                <Link href={`/evento/${l.event.slug}`}>{l.event.name}</Link>
              </h3>
              <div className="offer-sub">
                {l.sector} · {TICKET_TYPE_LABEL[l.ticketType]} · {l.quantityAvailable}/{l.quantity} · pedido na ticketeira {l.platformOrderRef}
              </div>
              <div className="offer-sub">
                {l.seller.name} ({l.seller.email}) · {formatDateTime(l.createdAt)}
              </div>
            </div>
            <div className="offer-side" style={{ gap: 6 }}>
              <div className="offer-price">{formatBRL(l.priceCents)}</div>
              {status !== "ATIVO" && status !== "REMOVIDO" && (
                <form action={setListingStatus.bind(null, l.id, "ATIVO")}>
                  <button className="btn btn-primary">Reativar</button>
                </form>
              )}
              {status !== "REMOVIDO" && (
                <form action={setListingStatus.bind(null, l.id, "REMOVIDO")}>
                  <button className="btn btn-outline">Remover</button>
                </form>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
