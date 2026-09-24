import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { CATEGORIES, listEvents, listingSummary } from "@/lib/data/repo";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q = "", cat = "" } = await searchParams;
  const events = await listEvents({ q, category: cat || undefined });
  const summary = await listingSummary(events.map((e) => e.id));

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
            <EventCard key={event.id} event={event} {...(summary.get(event.id) ?? { available: 0, cheapest: null })} />
          ))}
        </div>
      )}
    </main>
  );
}
