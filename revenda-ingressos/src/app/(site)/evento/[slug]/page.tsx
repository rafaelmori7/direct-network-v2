import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformTag, PosterArt, ShieldIcon, posterGradient } from "@/components/chrome";
import { saleState, type SaleState } from "@/lib/data/event-status";
import { getEventBySlug, listingsForEvent, rulesFor, wantedForEvent } from "@/lib/data/repo";
import { TICKET_TYPE_LABEL, formatDateTime, formatRemaining, formatWeekdayTime } from "@/lib/format";
import { buyerFeeCents, feeConfig, formatBRL } from "@/lib/money/fees";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const rules = rulesFor(event);
  const fees = feeConfig();
  const state = saleState(event);
  const [listings, wanted] = await Promise.all([listingsForEvent(event.id), wantedForEvent(event.id)]);
  const canBuy = state.kind === "ABERTA";

  return (
    <main>
      <section className="event-hero">
        <div className="event-hero-bg" style={{ background: posterGradient(event.hue) }} />
        <div className="event-hero-shade" />
        <div className="container">
          <div>
            <h1>{event.name}</h1>
            <p className="hero-line">
              <CalendarIcon /> {formatWeekdayTime(event.startsAt)} → {formatDateTime(event.endsAt)}
            </p>
            <p className="hero-line">
              <PinIcon /> {event.venue}, {event.city}
            </p>
            <div className="tag-row" style={{ marginTop: 16 }}>
              <span className="pill pill-safe">
                <ShieldIcon size={16} /> Compra garantida
              </span>
              <span className="pill pill-light">Transferência pelo app {event.platformName}</span>
            </div>
          </div>
          <div className="hero-poster">
            <PosterArt hue={event.hue}>
              <span className="poster-date">{formatWeekdayTime(event.startsAt)}</span>
              <span className="poster-name">{event.name}</span>
              <span className="poster-date">{event.venue}</span>
            </PosterArt>
          </div>
        </div>
      </section>

      <div className="container event-body">
        <div>
          <SaleNotice state={state} />

          <h2 className="section-title" style={{ marginTop: 24 }}>
            Ingressos à venda
          </h2>
          {listings.length === 0 ? (
            <p className="empty">Ainda não há ingressos anunciados para este evento.</p>
          ) : (
            <div className="offers">
              {listings.map((listing) => (
                <article className="offer" key={listing.id}>
                  <div>
                    <div className="tag-row" style={{ marginBottom: 6 }}>
                      <span className="type-badge">{TICKET_TYPE_LABEL[listing.ticketType]}</span>
                    </div>
                    <h3>{listing.sector}</h3>
                    <div className="offer-sub">
                      Vendido por {listing.sellerName} · {listing.quantityAvailable}{" "}
                      {listing.quantityAvailable === 1 ? "disponível" : "disponíveis"}
                    </div>
                    {listing.ticketType === "MEIA" && (
                      <div className="offer-sub">Exige documento de meia-entrada na portaria.</div>
                    )}
                  </div>
                  <div className="offer-side">
                    <div>
                      <div className="offer-price">{formatBRL(listing.priceCents)}</div>
                      {fees.buyerFeeBps > 0 && (
                        <div className="offer-face">+ {formatBRL(buyerFeeCents(listing.priceCents, fees))} de taxa de serviço</div>
                      )}
                      <div className="offer-face">Valor original {formatBRL(listing.faceValueCents)}</div>
                    </div>
                    {canBuy ? (
                      <Link href={`/comprar/${listing.id}`} className="btn btn-primary">
                        Comprar
                      </Link>
                    ) : (
                      <button className="btn btn-primary" disabled>
                        Comprar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {event.sectors.length > 0 && (
            <>
              <h2 className="section-title" style={{ marginTop: 36 }}>
                Setores e valores originais
              </h2>
              <table className="sector-table">
                <thead>
                  <tr>
                    <th>Setor</th>
                    <th>Valor original</th>
                  </tr>
                </thead>
                <tbody>
                  {event.sectors.map((s) => (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td>{formatBRL(s.faceValueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <aside className="aside-sticky">
          <div className="aside-card">
            <div className="aside-head">Como sua compra é protegida</div>
            <div className="aside-body">
              <ol className="steps">
                <li>Você paga por Pix e o valor fica retido. O vendedor ainda não recebe.</li>
                <li>
                  O vendedor transfere pelo app {event.platformName} em até{" "}
                  {rules.sellerTransferDeadlineHours}h.
                </li>
                <li>Você confere o ingresso na sua carteira do app oficial.</li>
                <li>O vendedor só recebe depois do evento. Se algo der errado, você recebe o dinheiro de volta.</li>
              </ol>
            </div>
          </div>

          <div className="aside-card">
            <div className="aside-head">Procurando ingresso? ({wanted.length})</div>
            <div className="aside-body">
              {wanted.length === 0 ? (
                <p className="offer-sub" style={{ margin: 0 }}>
                  Ninguém pediu ainda.
                </p>
              ) : (
                wanted.slice(0, 5).map((w) => (
                  <div className="wanted-item" key={w.id}>
                    <span>
                      <b>COMPRO</b> {w.sector ?? "qualquer setor"}
                    </span>
                    <span className="offer-sub">{w.maxPriceCents ? `até ${formatBRL(w.maxPriceCents)}` : "a combinar"}</span>
                  </div>
                ))
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                <Link href={`/evento/${event.slug}/compro`} className="btn btn-outline btn-block">
                  Quero comprar
                </Link>
                {state.kind !== "ENCERRADA" && state.kind !== "BLOQUEADA" && (
                  <Link href={`/anunciar?evento=${event.slug}`} className="btn btn-primary btn-block">
                    Vender ingresso deste evento
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <PlatformTag platform={event.platform} />
          </div>
        </aside>
      </div>
    </main>
  );
}

function SaleNotice({ state }: { state: SaleState }) {
  switch (state.kind) {
    case "ABERTA":
      return (
        <div className="notice notice-safe">
          <ShieldIcon />
          <div>
            <b>Vendas até {formatDateTime(state.closesAt)}</b>
            Faltam {formatRemaining(state.closesAt.getTime() - Date.now())}. Depois disso não há tempo para a
            transferência pelo app oficial.
          </div>
        </div>
      );
    case "EM_BREVE":
      return (
        <div className="notice notice-warn">
          <div>
            <b>Compras abrem em {formatDateTime(state.opensAt)}</b>
            A ticketeira ainda não liberou a transferência. Você já pode anunciar ou registrar que quer comprar.
          </div>
        </div>
      );
    case "ENCERRADA":
      return (
        <div className="notice notice-danger">
          <div>
            <b>Vendas encerradas</b>O prazo de transferência da ticketeira acabou.
          </div>
        </div>
      );
    case "BLOQUEADA":
      return (
        <div className="notice notice-warn">
          <div>
            <b>Revenda indisponível</b>
            {state.reason}
          </div>
        </div>
      );
  }
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
