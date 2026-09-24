import Link from "next/link";
import { PlatformTag, PosterArt } from "@/components/chrome";
import { saleState } from "@/lib/data/event-status";
import { CATEGORIES, listEvents, listingsForEvent, type EventRecord } from "@/lib/data/store";
import { formatDateLong, formatDateShort, formatRemaining } from "@/lib/format";
import { formatBRL } from "@/lib/money/fees";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q = "", cat = "" } = await searchParams;
  const events = listEvents({ q, category: cat || undefined });

  return (
    <main className="container">
      <h1 className="page-title">Compre de quem não vai mais</h1>
      <p className="page-sub">
        Ingresso transferido pelo app oficial da ticketeira. Seu pagamento fica retido e só é liberado ao vendedor
        depois do evento.
      </p>

      <form className="search" action="/" role="search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input name="q" defaultValue={q} placeholder="Busque por evento, artista ou cidade" aria-label="Buscar eventos" />
        {cat && <input type="hidden" name="cat" value={cat} />}
      </form>

      <nav className="chips" aria-label="Categorias">
        <Link href={q ? `/?q=${encodeURIComponent(q)}` : "/"} className={`chip ${!cat ? "chip-active" : ""}`}>
          Todas
        </Link>
        {CATEGORIES.map((c) => {
          const params = new URLSearchParams({ ...(q && { q }), cat: c });
          return (
            <Link key={c} href={`/?${params}`} className={`chip ${cat === c ? "chip-active" : ""}`}>
              {c}
            </Link>
          );
        })}
      </nav>

      {events.length === 0 ? (
        <p className="empty">Nenhum evento encontrado. Tente outra busca ou categoria.</p>
      ) : (
        <div className="grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}

function EventCard({ event }: { event: EventRecord }) {
  const listings = listingsForEvent(event.id);
  const available = listings.reduce((sum, l) => sum + l.quantityAvailable, 0);
  const cheapest = listings[0]?.priceCents;
  const badge = cardBadge(event, available);

  return (
    <Link href={`/evento/${event.slug}`} className="event-card">
      <div className="poster">
        <PosterArt hue={event.hue}>
          <span className="poster-date">{formatDateShort(event.startsAt)}</span>
          <span className="poster-name">{event.name}</span>
          <span />
        </PosterArt>
        <div className="poster-bar">
          <strong>{badge}</strong>
          <span>Ver ingressos de revenda →</span>
        </div>
      </div>
      <h2 className="event-name">{event.name}</h2>
      <div className="event-meta">
        {event.venue}, {event.city}
        <br />
        {formatDateLong(event.startsAt)}
      </div>
      <div className="tag-row">
        <PlatformTag platform={event.platform} />
      </div>
      {cheapest !== undefined && (
        <div className="event-price">
          {available} {available === 1 ? "ingresso" : "ingressos"} a partir de <b>{formatBRL(cheapest)}</b>
        </div>
      )}
    </Link>
  );
}

function cardBadge(event: EventRecord, available: number): string {
  const state = saleState(event);
  if (state.kind === "BLOQUEADA") return "Revenda em análise";
  if (state.kind === "ENCERRADA") return "Vendas encerradas";
  if (state.kind === "EM_BREVE") return "Revenda abre em breve";
  const remaining = state.closesAt.getTime() - Date.now();
  if (remaining < 48 * 3_600_000) return `Últimas horas · encerra em ${formatRemaining(remaining)}`;
  if (available === 0) return "Seja o primeiro a anunciar";
  if (available <= 3) return "Últimos ingressos";
  return "Ingressos disponíveis";
}
